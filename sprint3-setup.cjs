const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// ============================================
// BACKEND
// ============================================

// 1. AI Report Generation Service
w('../backend/src/services/report-generator.js', `import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { profileLabels } from '../data/disc-profiles.js';

const prisma = new PrismaClient();

export async function generateReport(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { user: { select: { name: true } } },
  });

  if (!assessment) throw new Error('Assessment nao encontrado');
  if (!assessment.scoresRaw?.normalized) throw new Error('Assessment sem scores');

  const scores = assessment.scoresRaw.normalized;
  const raw = assessment.scoresRaw.raw;

  // Buscar template do prompt
  const template = await prisma.promptTemplate.findUnique({
    where: { name: 'disc_analysis_default' },
  });

  const profilePLabel = profileLabels[assessment.profilePrimary]?.name || assessment.profilePrimary;
  const profileSLabel = profileLabels[assessment.profileSecondary]?.name || assessment.profileSecondary;

  const prompt = \`Voce e um especialista em analise comportamental DISC com ampla experiencia em coaching, desenvolvimento humano e mentoria profissional. Voce trabalha com a mentora Vanessa Rocha.

Os perfis DISC sao nomeados assim:
- D = Executor (focado em resultados, decisivo, direto)
- I = Comunicador (sociavel, entusiasmado, persuasivo)
- S = Planejador (estavel, paciente, colaborativo)
- C = Analista (preciso, analitico, criterioso)

## Dados do Avaliado
- Nome: \${assessment.user.name}
- Perfil Primario: \${profilePLabel} (\${assessment.profilePrimary})
- Perfil Secundario: \${profileSLabel} (\${assessment.profileSecondary})
- Scores normalizados: Executor=\${scores.D}%, Comunicador=\${scores.I}%, Planejador=\${scores.S}%, Analista=\${scores.C}%
- Scores brutos: D=\${raw.D}, I=\${raw.I}, S=\${raw.S}, C=\${raw.C}

\${assessment.adminNotes ? '## Contexto adicional do coach\\n' + assessment.adminNotes : ''}

## Instrucoes
Gere uma analise comportamental completa e personalizada. Retorne SOMENTE um JSON valido (sem markdown, sem backticks) com esta estrutura:

{
  "resumoExecutivo": "Paragrafo de 3-4 frases resumindo o perfil geral de forma acolhedora e precisa",
  "perfilDetalhado": {
    "descricao": "Descricao detalhada de 2-3 paragrafos do perfil comportamental, considerando a combinacao dos fatores",
    "palavrasChave": ["5-8 palavras que definem este perfil"]
  },
  "pontosFortes": [
    {"titulo": "Nome do ponto forte", "descricao": "Explicacao pratica de 1-2 frases"}
  ],
  "areasAtencao": [
    {"titulo": "Nome da area", "descricao": "Explicacao construtiva de 1-2 frases"}
  ],
  "estiloComunicacao": {
    "comoSeExprime": "Como essa pessoa tende a se comunicar (2-3 frases)",
    "comoPrefereceber": "Como prefere receber informacoes (2-3 frases)",
    "dicasParaOutros": "Dicas para quem se comunica com esse perfil (2-3 frases)"
  },
  "ambiente": {
    "idealDeTrabalho": "Descricao do ambiente ideal (2-3 frases)",
    "fatoresEstresse": "O que causa estresse nesse perfil (2-3 frases)",
    "comoLidaComMudancas": "Como reage a mudancas (1-2 frases)"
  },
  "lideranca": {
    "estilo": "Estilo de lideranca natural (2-3 frases)",
    "comoMotiva": "Como motiva outras pessoas (1-2 frases)"
  },
  "desenvolvimento": {
    "recomendacoes": ["3-5 recomendacoes especificas de desenvolvimento"],
    "acoesPraticas": ["3 acoes praticas que pode implementar imediatamente"]
  }
}

REGRAS IMPORTANTES:
- Use linguagem acolhedora, construtiva e profissional
- DISC e ferramenta comportamental, NAO faca diagnosticos psicologicos
- Seja especifico e pratico, evite generalidades
- Considere a COMBINACAO dos fatores, nao cada score isoladamente
- Fale diretamente com a pessoa usando "voce"
- Gere exatamente 5 pontos fortes e 3-4 areas de atencao
- Retorne SOMENTE o JSON, sem nenhum texto antes ou depois\`;

  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY nao configurada no .env');
  }

  console.log('Gerando relatorio para assessment:', assessmentId);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Anthropic API error:', err);
    throw new Error('Erro na API Anthropic: ' + response.status);
  }

  const data = await response.json();
  const rawText = data.content[0]?.text || '';

  // Parse JSON (remove possíveis backticks)
  let narrative;
  try {
    const cleaned = rawText.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
    narrative = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response:', rawText.substring(0, 500));
    throw new Error('Erro ao processar resposta da IA');
  }

  // Salvar relatório
  const report = await prisma.report.create({
    data: {
      assessmentId,
      narrative,
      promptUsed: prompt,
      modelUsed: 'claude-sonnet-4-20250514',
    },
  });

  // Atualizar status do assessment
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: 'REPORT_GENERATED' },
  });

  console.log('Relatorio gerado:', report.id);
  return report;
}
`);

// 2. Update assessment routes - add report generation on release + report fetch
w('../backend/src/routes/assessments.js', `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';
import { discQuestions } from '../data/disc-questions.js';
import { generateReport } from '../services/report-generator.js';

const prisma = new PrismaClient();

// ---- User Routes ----
const userAssessmentRouter = Router();
userAssessmentRouter.use(authenticate);

userAssessmentRouter.get('/questions', (req, res) => {
  return res.json({ questions: discQuestions, totalGroups: discQuestions.length });
});

userAssessmentRouter.post('/', async (req, res) => {
  try {
    const existing = await prisma.assessment.findFirst({
      where: { userId: req.user.id, status: 'IN_PROGRESS' },
    });
    if (existing) return res.json({ assessment: existing, resumed: true });
    const assessment = await prisma.assessment.create({
      data: { userId: req.user.id, status: 'IN_PROGRESS' },
    });
    return res.status(201).json({ assessment, resumed: false });
  } catch (err) {
    console.error('Create assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

userAssessmentRouter.post('/:id/submit', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissao' });
    if (assessment.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ja foi submetido' });

    const { responses } = req.body;
    const validationError = validateResponses(responses);
    if (validationError) return res.status(400).json({ error: validationError });

    const { scores, rawScores, profilePrimary, profileSecondary } = calculateDiscScores(responses);
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        responses, scoresRaw: { normalized: scores, raw: rawScores },
        profilePrimary, profileSecondary, status: 'COMPLETED', completedAt: new Date(),
      },
    });
    return res.json({ assessment: updated, message: 'Assessment concluido!' });
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

userAssessmentRouter.get('/mine', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: req.user.id },
      select: {
        id: true, status: true, profilePrimary: true, profileSecondary: true,
        scoresRaw: true, completedAt: true, releasedAt: true, createdAt: true,
        report: { select: { id: true, generatedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ assessments });
  } catch (err) {
    console.error('List my assessments error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/assessments/:id/report - User views their report
userAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
        report: true,
      },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissao' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio ainda nao foi gerado' });

    return res.json({
      report: assessment.report,
      scores: assessment.scoresRaw?.normalized,
      profilePrimary: assessment.profilePrimary,
      profileSecondary: assessment.profileSecondary,
      userName: assessment.user.name,
    });
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---- Admin Routes ----
const adminAssessmentRouter = Router();
adminAssessmentRouter.use(authenticate, requireAdmin);

adminAssessmentRouter.get('/', async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (status) where.status = status;
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        select: {
          id: true, status: true, profilePrimary: true, profileSecondary: true,
          scoresRaw: true, adminNotes: true, completedAt: true, releasedAt: true, createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          report: { select: { id: true, generatedAt: true } },
        },
        orderBy: { createdAt: 'desc' }, skip, take: limitNum,
      }),
      prisma.assessment.count({ where }),
    ]);
    return res.json({ assessments, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error('List assessments error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminAssessmentRouter.get('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true } }, report: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    return res.json({ assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Release + auto-generate report
adminAssessmentRouter.patch('/:id/release', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });

    const { adminNotes } = req.body || {};

    // Update status first
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'RELEASED', releasedAt: new Date(), adminNotes: adminNotes || assessment.adminNotes },
    });

    // Generate report if not exists
    let report = assessment.report;
    if (!report) {
      try {
        report = await generateReport(assessment.id);
      } catch (genErr) {
        console.error('Report generation failed:', genErr.message);
        return res.json({
          assessment: { ...assessment, status: 'RELEASED', releasedAt: new Date() },
          message: 'Assessment liberado, mas falha ao gerar relatorio: ' + genErr.message,
          reportError: genErr.message,
        });
      }
    }

    const updated = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });

    return res.json({ assessment: updated, message: 'Assessment liberado e relatorio gerado!' });
  } catch (err) {
    console.error('Release assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Admin view report
adminAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true } }, report: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });
    return res.json({
      report: assessment.report,
      scores: assessment.scoresRaw?.normalized,
      profilePrimary: assessment.profilePrimary,
      profileSecondary: assessment.profileSecondary,
      userName: assessment.user.name,
    });
  } catch (err) {
    console.error('Get admin report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export { userAssessmentRouter, adminAssessmentRouter };
`);

// ============================================
// FRONTEND
// ============================================

// 3. Report View Page
w('../frontend/src/pages/ReportPage.jsx', `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, Star, AlertTriangle, MessageCircle, Briefcase, TrendingUp, Users } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

function RadarChart({ scores }) {
  const size = 280;
  const center = size / 2;
  const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);

  const getPoint = (angle, value) => ({
    x: center + Math.cos(angle) * (radius * value / 100),
    y: center + Math.sin(angle) * (radius * value / 100),
  });

  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x + ',' + p.y).join(' ');

  return (
    <svg viewBox={"0 0 " + size + " " + size} className="w-full max-w-[280px] mx-auto">
      {/* Grid circles */}
      {[25, 50, 75, 100].map(v => (
        <polygon key={v} points={factors.map((_, i) => {
          const p = getPoint(angles[i], v);
          return p.x + ',' + p.y;
        }).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* Axes */}
      {factors.map((_, i) => {
        const p = getPoint(angles[i], 100);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(76, 110, 245, 0.15)" stroke="#4c6ef5" strokeWidth="2.5" />
      {/* Data points + labels */}
      {factors.map((f, i) => {
        const p = dataPoints[i];
        const lp = getPoint(angles[i], 120);
        return (
          <g key={f}>
            <circle cx={p.x} cy={p.y} r="5" fill={profileColors[f]} />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={profileColors[f]}>
              {profileNames[f]}
            </text>
            <text x={lp.x} y={lp.y + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
              {scores[f]}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Section({ icon: Icon, title, children, color = 'text-brand-600 bg-brand-50' }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={"rounded-lg p-1.5 " + color}><Icon size={16} /></div>
        <h3 className="font-display text-lg text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isAdmin ? '/admin/assessments/' + id + '/report' : '/assessments/' + id + '/report';
        const d = await api.get(endpoint);
        setData(d);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, isAdmin]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-600">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16}/>Voltar</button></div></div>;

  const { report, scores, profilePrimary, profileSecondary, userName } = data;
  const n = report.narrative;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16}/>Voltar</button>
        </div>

        {/* Title Card */}
        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Analise Comportamental</p>
          <h1 className="font-display text-2xl text-gray-900 mb-1">{userName}</h1>
          <p className="text-sm text-gray-500">Perfil: <span className="font-semibold" style={{color: profileColors[profilePrimary]}}>{profileNames[profilePrimary]}</span> / <span className="font-semibold" style={{color: profileColors[profileSecondary]}}>{profileNames[profileSecondary]}</span></p>

          <div className="mt-6">
            <RadarChart scores={scores} />
          </div>
        </div>

        {/* Resumo */}
        <div className="card mb-6">
          <h2 className="font-display text-xl text-gray-900 mb-3">Resumo do Perfil</h2>
          <p className="text-sm leading-relaxed text-gray-700">{n.resumoExecutivo}</p>
        </div>

        {/* Perfil Detalhado */}
        <div className="card mb-6">
          <h2 className="font-display text-xl text-gray-900 mb-3">Perfil Detalhado</h2>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{n.perfilDetalhado?.descricao}</p>
          {n.perfilDetalhado?.palavrasChave && (
            <div className="flex flex-wrap gap-2 mt-4">
              {n.perfilDetalhado.palavrasChave.map((p, i) => (
                <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{p}</span>
              ))}
            </div>
          )}
        </div>

        {/* Pontos Fortes */}
        <div className="card mb-6">
          <Section icon={Star} title="Pontos Fortes" color="text-green-600 bg-green-50">
            <div className="space-y-3">
              {(n.pontosFortes || []).map((p, i) => (
                <div key={i} className="rounded-lg bg-green-50/50 border border-green-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{p.titulo || p}</p>
                  {p.descricao && <p className="text-xs text-gray-600 mt-1">{p.descricao}</p>}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Areas de Atencao */}
        <div className="card mb-6">
          <Section icon={AlertTriangle} title="Areas de Atencao" color="text-amber-600 bg-amber-50">
            <div className="space-y-3">
              {(n.areasAtencao || []).map((a, i) => (
                <div key={i} className="rounded-lg bg-amber-50/50 border border-amber-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{a.titulo || a}</p>
                  {a.descricao && <p className="text-xs text-gray-600 mt-1">{a.descricao}</p>}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Estilo de Comunicacao */}
        {n.estiloComunicacao && (
          <div className="card mb-6">
            <Section icon={MessageCircle} title="Estilo de Comunicacao" color="text-disc-i bg-orange-50">
              <div className="space-y-4 text-sm text-gray-700">
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como se expressa</p><p className="leading-relaxed">{n.estiloComunicacao.comoSeExprime}</p></div>
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como prefere receber informacoes</p><p className="leading-relaxed">{n.estiloComunicacao.comoPrefereceber}</p></div>
                {n.estiloComunicacao.dicasParaOutros && <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Dicas para quem convive</p><p className="leading-relaxed">{n.estiloComunicacao.dicasParaOutros}</p></div>}
              </div>
            </Section>
          </div>
        )}

        {/* Ambiente */}
        {n.ambiente && (
          <div className="card mb-6">
            <Section icon={Briefcase} title="Ambiente e Trabalho" color="text-disc-s bg-teal-50">
              <div className="space-y-4 text-sm text-gray-700">
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Ambiente ideal</p><p className="leading-relaxed">{n.ambiente.idealDeTrabalho}</p></div>
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Fatores de estresse</p><p className="leading-relaxed">{n.ambiente.fatoresEstresse}</p></div>
                {n.ambiente.comoLidaComMudancas && <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Relacao com mudancas</p><p className="leading-relaxed">{n.ambiente.comoLidaComMudancas}</p></div>}
              </div>
            </Section>
          </div>
        )}

        {/* Lideranca */}
        {n.lideranca && (
          <div className="card mb-6">
            <Section icon={Users} title="Lideranca" color="text-disc-d bg-red-50">
              <div className="space-y-4 text-sm text-gray-700">
                <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Estilo de lideranca</p><p className="leading-relaxed">{n.lideranca.estilo}</p></div>
                {n.lideranca.comoMotiva && <div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como motiva outros</p><p className="leading-relaxed">{n.lideranca.comoMotiva}</p></div>}
              </div>
            </Section>
          </div>
        )}

        {/* Desenvolvimento */}
        {n.desenvolvimento && (
          <div className="card mb-6">
            <Section icon={TrendingUp} title="Desenvolvimento" color="text-purple-600 bg-purple-50">
              {n.desenvolvimento.recomendacoes && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Recomendacoes</p>
                  <ul className="space-y-2">
                    {n.desenvolvimento.recomendacoes.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-brand-600 font-bold mt-0.5">•</span><span>{r}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {n.desenvolvimento.acoesPraticas && (
                <div>
                  <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Acoes praticas</p>
                  <ul className="space-y-2">
                    {n.desenvolvimento.acoesPraticas.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-green-600 font-bold mt-0.5">{i + 1}.</span><span>{a}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>Analise gerada por IA • Vanessa Rocha - Analise Comportamental DISC</p>
          <p className="mt-1">Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
`);

// 4. Update App.jsx with report route
w('../frontend/src/App.jsx', `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminInvitesPage from './pages/AdminInvitesPage.jsx';
import AdminAssessmentsPage from './pages/AdminAssessmentsPage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import UserAssessmentsPage from './pages/UserAssessmentsPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReportPage from './pages/ReportPage.jsx';

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="invites" element={<AdminInvitesPage />} />
            <Route path="assessments" element={<AdminAssessmentsPage />} />
          </Route>
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="assessments" element={<UserAssessmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
`);

// 5. Update UserAssessmentsPage - link to report
w('../frontend/src/pages/UserAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, CheckCircle2, Eye, ArrowRight } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Aguardando liberacao', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Em revisao', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio pronto', color: 'bg-brand-50 text-brand-700' },
};

export default function UserAssessmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justCompleted = searchParams.get('completed') === 'true';
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await api.get('/assessments/mine'); setAssessments(d.assessments); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
  const hasCompletedOrPending = assessments.some(a => a.status !== 'IN_PROGRESS');

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Meus Testes</h1><p className="mt-1 text-sm text-gray-500">Acompanhe seus assessments comportamentais</p></div>

      {justCompleted && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={16}/> Teste concluido com sucesso! Aguarde a liberacao para ver seu relatorio completo.
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-brand-50 p-4 text-brand-600"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-900">Nenhum teste realizado</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Clique abaixo para iniciar seu questionario comportamental.</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary mt-6 gap-2">Iniciar Teste <ArrowRight size={16}/></button>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isInProgress = a.status === 'IN_PROGRESS';
            if (isInProgress && hasCompletedOrPending) return null;

            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    <span className="text-xs text-gray-400">{fmtDate(a.createdAt)}</span>
                  </div>
                  {isInProgress && <p className="text-sm text-gray-500 mt-1">Voce tem um teste em andamento.</p>}
                  {scores && (
                    <div className="flex gap-3 mt-2">
                      {['D','I','S','C'].map(f => (
                        <div key={f} className="text-center">
                          <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f]}</div>
                          <div className="text-sm font-semibold text-gray-900">{scores[f]}%</div>
                        </div>
                      ))}
                      {a.profilePrimary && <div className="ml-2 text-xs text-gray-500 self-center">Perfil: <span className="font-semibold">{profileNames[a.profilePrimary]}/{profileNames[a.profileSecondary]}</span></div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isInProgress && <button onClick={() => navigate('/quiz')} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><ArrowRight size={12}/>Continuar Teste</button>}
                  {a.report && <button onClick={() => navigate('/report/' + a.id)} className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><Eye size={12}/>Ver Relatorio</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Sprint 3 - Todos os arquivos criados!');
console.log('============================================');
console.log('\\nLembre de:');
console.log('1. Adicionar ANTHROPIC_API_KEY no .env do backend');
console.log('2. Reiniciar o backend (Ctrl+C e npm run dev)');
console.log('\\nFluxo: Admin libera assessment -> IA gera relatorio -> Usuario ve relatorio');
