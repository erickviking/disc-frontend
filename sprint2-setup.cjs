const fs = require('fs');
const path = require('path');

function w(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK:', filePath);
}

// ============================================
// BACKEND FILES
// ============================================

// 1. DISC Questions Data - 28 groups of 4 words
w('../backend/src/data/disc-questions.js', `// 28 grupos de 4 palavras - formato classico DISC
// Cada grupo: usuario escolhe a que MAIS e a que MENOS descreve ele
// Cada palavra tem um fator associado (D, I, S, C)

export const discQuestions = [
  { group: 1, words: [
    { id: 'g1d', text: 'Decidido', factor: 'D' },
    { id: 'g1i', text: 'Entusiasmado', factor: 'I' },
    { id: 'g1s', text: 'Paciente', factor: 'S' },
    { id: 'g1c', text: 'Cuidadoso', factor: 'C' },
  ]},
  { group: 2, words: [
    { id: 'g2d', text: 'Competitivo', factor: 'D' },
    { id: 'g2i', text: 'Alegre', factor: 'I' },
    { id: 'g2s', text: 'Leal', factor: 'S' },
    { id: 'g2c', text: 'Analitico', factor: 'C' },
  ]},
  { group: 3, words: [
    { id: 'g3d', text: 'Direto', factor: 'D' },
    { id: 'g3i', text: 'Comunicativo', factor: 'I' },
    { id: 'g3s', text: 'Calmo', factor: 'S' },
    { id: 'g3c', text: 'Perfeccionista', factor: 'C' },
  ]},
  { group: 4, words: [
    { id: 'g4d', text: 'Corajoso', factor: 'D' },
    { id: 'g4i', text: 'Inspirador', factor: 'I' },
    { id: 'g4s', text: 'Compreensivo', factor: 'S' },
    { id: 'g4c', text: 'Preciso', factor: 'C' },
  ]},
  { group: 5, words: [
    { id: 'g5d', text: 'Determinado', factor: 'D' },
    { id: 'g5i', text: 'Convincente', factor: 'I' },
    { id: 'g5s', text: 'Gentil', factor: 'S' },
    { id: 'g5c', text: 'Reservado', factor: 'C' },
  ]},
  { group: 6, words: [
    { id: 'g6d', text: 'Independente', factor: 'D' },
    { id: 'g6i', text: 'Sociavel', factor: 'I' },
    { id: 'g6s', text: 'Tolerante', factor: 'S' },
    { id: 'g6c', text: 'Diplomatico', factor: 'C' },
  ]},
  { group: 7, words: [
    { id: 'g7d', text: 'Assertivo', factor: 'D' },
    { id: 'g7i', text: 'Expressivo', factor: 'I' },
    { id: 'g7s', text: 'Estavel', factor: 'S' },
    { id: 'g7c', text: 'Sistematico', factor: 'C' },
  ]},
  { group: 8, words: [
    { id: 'g8d', text: 'Ousado', factor: 'D' },
    { id: 'g8i', text: 'Otimista', factor: 'I' },
    { id: 'g8s', text: 'Cooperativo', factor: 'S' },
    { id: 'g8c', text: 'Detalhista', factor: 'C' },
  ]},
  { group: 9, words: [
    { id: 'g9d', text: 'Dominante', factor: 'D' },
    { id: 'g9i', text: 'Animado', factor: 'I' },
    { id: 'g9s', text: 'Previsivel', factor: 'S' },
    { id: 'g9c', text: 'Cauteloso', factor: 'C' },
  ]},
  { group: 10, words: [
    { id: 'g10d', text: 'Exigente', factor: 'D' },
    { id: 'g10i', text: 'Popular', factor: 'I' },
    { id: 'g10s', text: 'Agradavel', factor: 'S' },
    { id: 'g10c', text: 'Logico', factor: 'C' },
  ]},
  { group: 11, words: [
    { id: 'g11d', text: 'Firme', factor: 'D' },
    { id: 'g11i', text: 'Confiante', factor: 'I' },
    { id: 'g11s', text: 'Amavel', factor: 'S' },
    { id: 'g11c', text: 'Objetivo', factor: 'C' },
  ]},
  { group: 12, words: [
    { id: 'g12d', text: 'Resoluto', factor: 'D' },
    { id: 'g12i', text: 'Espontaneo', factor: 'I' },
    { id: 'g12s', text: 'Harmonioso', factor: 'S' },
    { id: 'g12c', text: 'Rigoroso', factor: 'C' },
  ]},
  { group: 13, words: [
    { id: 'g13d', text: 'Energico', factor: 'D' },
    { id: 'g13i', text: 'Carismatico', factor: 'I' },
    { id: 'g13s', text: 'Dedicado', factor: 'S' },
    { id: 'g13c', text: 'Meticuloso', factor: 'C' },
  ]},
  { group: 14, words: [
    { id: 'g14d', text: 'Pragmatico', factor: 'D' },
    { id: 'g14i', text: 'Persuasivo', factor: 'I' },
    { id: 'g14s', text: 'Moderado', factor: 'S' },
    { id: 'g14c', text: 'Criterioso', factor: 'C' },
  ]},
  { group: 15, words: [
    { id: 'g15d', text: 'Arrojado', factor: 'D' },
    { id: 'g15i', text: 'Empolgante', factor: 'I' },
    { id: 'g15s', text: 'Atencioso', factor: 'S' },
    { id: 'g15c', text: 'Organizado', factor: 'C' },
  ]},
  { group: 16, words: [
    { id: 'g16d', text: 'Objetivo', factor: 'D' },
    { id: 'g16i', text: 'Divertido', factor: 'I' },
    { id: 'g16s', text: 'Tranquilo', factor: 'S' },
    { id: 'g16c', text: 'Disciplinado', factor: 'C' },
  ]},
  { group: 17, words: [
    { id: 'g17d', text: 'Persistente', factor: 'D' },
    { id: 'g17i', text: 'Influente', factor: 'I' },
    { id: 'g17s', text: 'Prestativo', factor: 'S' },
    { id: 'g17c', text: 'Formal', factor: 'C' },
  ]},
  { group: 18, words: [
    { id: 'g18d', text: 'Audacioso', factor: 'D' },
    { id: 'g18i', text: 'Envolvente', factor: 'I' },
    { id: 'g18s', text: 'Receptivo', factor: 'S' },
    { id: 'g18c', text: 'Ponderado', factor: 'C' },
  ]},
  { group: 19, words: [
    { id: 'g19d', text: 'Empreendedor', factor: 'D' },
    { id: 'g19i', text: 'Motivador', factor: 'I' },
    { id: 'g19s', text: 'Conciliador', factor: 'S' },
    { id: 'g19c', text: 'Estrategico', factor: 'C' },
  ]},
  { group: 20, words: [
    { id: 'g20d', text: 'Destemido', factor: 'D' },
    { id: 'g20i', text: 'Criativo', factor: 'I' },
    { id: 'g20s', text: 'Solidario', factor: 'S' },
    { id: 'g20c', text: 'Planejador', factor: 'C' },
  ]},
  { group: 21, words: [
    { id: 'g21d', text: 'Lider', factor: 'D' },
    { id: 'g21i', text: 'Encantador', factor: 'I' },
    { id: 'g21s', text: 'Fiel', factor: 'S' },
    { id: 'g21c', text: 'Investigativo', factor: 'C' },
  ]},
  { group: 22, words: [
    { id: 'g22d', text: 'Produtivo', factor: 'D' },
    { id: 'g22i', text: 'Acolhedor', factor: 'I' },
    { id: 'g22s', text: 'Constante', factor: 'S' },
    { id: 'g22c', text: 'Tecnico', factor: 'C' },
  ]},
  { group: 23, words: [
    { id: 'g23d', text: 'Realizador', factor: 'D' },
    { id: 'g23i', text: 'Versatil', factor: 'I' },
    { id: 'g23s', text: 'Confiavel', factor: 'S' },
    { id: 'g23c', text: 'Reflexivo', factor: 'C' },
  ]},
  { group: 24, words: [
    { id: 'g24d', text: 'Ambicioso', factor: 'D' },
    { id: 'g24i', text: 'Generoso', factor: 'I' },
    { id: 'g24s', text: 'Pacificador', factor: 'S' },
    { id: 'g24c', text: 'Calculista', factor: 'C' },
  ]},
  { group: 25, words: [
    { id: 'g25d', text: 'Inovador', factor: 'D' },
    { id: 'g25i', text: 'Impactante', factor: 'I' },
    { id: 'g25s', text: 'Equilibrado', factor: 'S' },
    { id: 'g25c', text: 'Metodico', factor: 'C' },
  ]},
  { group: 26, words: [
    { id: 'g26d', text: 'Competente', factor: 'D' },
    { id: 'g26i', text: 'Empolgado', factor: 'I' },
    { id: 'g26s', text: 'Sereno', factor: 'S' },
    { id: 'g26c', text: 'Exato', factor: 'C' },
  ]},
  { group: 27, words: [
    { id: 'g27d', text: 'Visionario', factor: 'D' },
    { id: 'g27i', text: 'Cativante', factor: 'I' },
    { id: 'g27s', text: 'Colaborativo', factor: 'S' },
    { id: 'g27c', text: 'Minucioso', factor: 'C' },
  ]},
  { group: 28, words: [
    { id: 'g28d', text: 'Proativo', factor: 'D' },
    { id: 'g28i', text: 'Expansivo', factor: 'I' },
    { id: 'g28s', text: 'Complacente', factor: 'S' },
    { id: 'g28c', text: 'Prudente', factor: 'C' },
  ]},
];
`);

// 2. DISC Scoring Engine
w('../backend/src/services/disc-scoring.js', `import { discQuestions } from '../data/disc-questions.js';

/**
 * Calcula os scores DISC a partir das respostas do usuario.
 * 
 * responses: Array de { groupIndex: number, most: string (word id), least: string (word id) }
 * 
 * Scoring:
 * - Palavra escolhida como MAIS: +2 pontos para o fator
 * - Palavra escolhida como MENOS: -1 ponto para o fator
 * - Palavras nao escolhidas: 0 pontos
 * 
 * Retorna scores normalizados em percentual (0-100)
 */
export function calculateDiscScores(responses) {
  if (!responses || responses.length !== 28) {
    throw new Error('Sao necessarias exatamente 28 respostas');
  }

  const rawScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const response of responses) {
    const question = discQuestions[response.groupIndex];
    if (!question) {
      throw new Error('Grupo invalido: ' + response.groupIndex);
    }

    const mostWord = question.words.find(w => w.id === response.most);
    const leastWord = question.words.find(w => w.id === response.least);

    if (!mostWord || !leastWord) {
      throw new Error('Palavra invalida no grupo ' + response.groupIndex);
    }

    if (mostWord.id === leastWord.id) {
      throw new Error('MAIS e MENOS nao podem ser a mesma palavra no grupo ' + response.groupIndex);
    }

    // +2 para MAIS, -1 para MENOS
    rawScores[mostWord.factor] += 2;
    rawScores[leastWord.factor] -= 1;
  }

  // Normalizar para 0-100
  // Score maximo possivel por fator: 28 * 2 = 56 (se escolhido MAIS em todos)
  // Score minimo possivel por fator: 28 * -1 = -28 (se escolhido MENOS em todos)
  // Range total: 84
  const minPossible = -28;
  const maxPossible = 56;
  const range = maxPossible - minPossible;

  const scores = {};
  for (const factor of ['D', 'I', 'S', 'C']) {
    scores[factor] = Math.round(((rawScores[factor] - minPossible) / range) * 100);
    scores[factor] = Math.max(0, Math.min(100, scores[factor]));
  }

  // Identificar perfil primario e secundario
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const profilePrimary = sorted[0][0];
  const profileSecondary = sorted[1][0];

  return {
    scores,
    rawScores,
    profilePrimary,
    profileSecondary,
  };
}

/**
 * Valida que as respostas estao no formato correto
 */
export function validateResponses(responses) {
  if (!Array.isArray(responses)) return 'Respostas devem ser um array';
  if (responses.length !== 28) return 'Sao necessarias exatamente 28 respostas';

  const seenGroups = new Set();
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    if (typeof r.groupIndex !== 'number' || r.groupIndex < 0 || r.groupIndex > 27) {
      return 'groupIndex invalido na resposta ' + i;
    }
    if (seenGroups.has(r.groupIndex)) {
      return 'Grupo duplicado: ' + r.groupIndex;
    }
    seenGroups.add(r.groupIndex);
    if (!r.most || !r.least) return 'most e least sao obrigatorios na resposta ' + i;
    if (r.most === r.least) return 'most e least nao podem ser iguais na resposta ' + i;
  }
  return null;
}
`);

// 3. Assessment Routes
w('../backend/src/routes/assessments.js', `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';
import { discQuestions } from '../data/disc-questions.js';

const prisma = new PrismaClient();

// ---- Rotas do Usuario ----
const userAssessmentRouter = Router();
userAssessmentRouter.use(authenticate);

// GET /api/assessments/questions - Retorna as questoes DISC
userAssessmentRouter.get('/questions', (req, res) => {
  return res.json({ questions: discQuestions, totalGroups: discQuestions.length });
});

// POST /api/assessments - Cria um novo assessment (inicio do teste)
userAssessmentRouter.post('/', async (req, res) => {
  try {
    // Verificar se ja tem um assessment em andamento
    const existing = await prisma.assessment.findFirst({
      where: { userId: req.user.id, status: 'IN_PROGRESS' },
    });
    if (existing) {
      return res.json({ assessment: existing, resumed: true });
    }

    const assessment = await prisma.assessment.create({
      data: { userId: req.user.id, status: 'IN_PROGRESS' },
    });
    return res.status(201).json({ assessment, resumed: false });
  } catch (err) {
    console.error('Create assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/assessments/:id/submit - Submete as respostas
userAssessmentRouter.post('/:id/submit', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissao' });
    if (assessment.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Assessment ja foi submetido' });
    }

    const { responses } = req.body;
    const validationError = validateResponses(responses);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { scores, rawScores, profilePrimary, profileSecondary } = calculateDiscScores(responses);

    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        responses,
        scoresRaw: { normalized: scores, raw: rawScores },
        profilePrimary,
        profileSecondary,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return res.json({
      assessment: updated,
      message: 'Assessment concluido! Aguarde a liberacao do seu coach para ver o relatorio completo.',
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// GET /api/assessments/mine - Lista assessments do usuario logado
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

// ---- Rotas do Admin ----
const adminAssessmentRouter = Router();
adminAssessmentRouter.use(authenticate, requireAdmin);

// GET /api/admin/assessments - Lista todos os assessments
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
        orderBy: { createdAt: 'desc' },
        skip, take: limitNum,
      }),
      prisma.assessment.count({ where }),
    ]);

    return res.json({
      assessments,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('List assessments error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/admin/assessments/:id - Detalhe do assessment
adminAssessmentRouter.get('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        report: true,
      },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    return res.json({ assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/admin/assessments/:id/release - Libera o assessment
adminAssessmentRouter.patch('/:id/release', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.status === 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Assessment ainda nao foi completado' });
    }

    const { adminNotes } = req.body || {};

    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        adminNotes: adminNotes || assessment.adminNotes,
      },
    });

    return res.json({ assessment: updated, message: 'Assessment liberado' });
  } catch (err) {
    console.error('Release assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export { userAssessmentRouter, adminAssessmentRouter };
`);

// 4. Update backend index.js to include assessment routes
w('../backend/src/index.js', `import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { adminInviteRouter, publicInviteRouter } from './routes/invites.js';
import { userAssessmentRouter, adminAssessmentRouter } from './routes/assessments.js';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public
app.use('/api/auth', authRoutes);
app.use('/api/invites', publicInviteRouter);

// User
app.use('/api/assessments', userAssessmentRouter);

// Admin
app.use('/api/admin', adminRoutes);
app.use('/api/admin/invites', adminInviteRouter);
app.use('/api/admin/assessments', adminAssessmentRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(config.port, () => {
  console.log('DISC Backend rodando na porta ' + config.port);
});
`);

// ============================================
// FRONTEND FILES
// ============================================

// 5. Quiz Page - Questionario DISC
w('../frontend/src/pages/QuizPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [qData, aData] = await Promise.all([
          api.get('/assessments/questions'),
          api.post('/assessments', {}),
        ]);
        setQuestions(qData.questions);
        setAssessmentId(aData.assessment.id);
        if (aData.resumed && aData.assessment.responses) {
          const saved = {};
          for (const r of aData.assessment.responses) {
            saved[r.groupIndex] = { most: r.most, least: r.least };
          }
          setResponses(saved);
        }
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const current = questions[currentGroup];
  const resp = responses[currentGroup] || { most: null, least: null };
  const isGroupComplete = resp.most && resp.least;
  const answeredCount = Object.keys(responses).filter(k => responses[k].most && responses[k].least).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const selectWord = (wordId, type) => {
    const cur = responses[currentGroup] || { most: null, least: null };
    const other = type === 'most' ? 'least' : 'most';
    if (cur[other] === wordId) return; // cant select same for both
    setResponses({ ...responses, [currentGroup]: { ...cur, [type]: wordId } });
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const formatted = Object.entries(responses).map(([gi, r]) => ({
        groupIndex: parseInt(gi), most: r.most, least: r.least,
      }));
      await api.post('/assessments/' + assessmentId + '/submit', { responses: formatted });
      navigate('/dashboard/assessments?completed=true');
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl text-gray-900">Questionario DISC</h1>
          <p className="mt-1 text-sm text-gray-500">Escolha a palavra que MAIS e a que MENOS descreve voce em cada grupo</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Progresso</span>
            <span>{answeredCount} de {questions.length}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{width: progress + '%'}} />
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}

        {/* Question Card */}
        {current && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">Grupo {currentGroup + 1} de {questions.length}</span>
              {isGroupComplete && <span className="flex items-center gap-1 text-xs font-medium text-green-600"><Check size={14}/>Completo</span>}
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div></div>
                <div className="text-center text-xs font-semibold text-brand-700 uppercase tracking-wider">Mais</div>
                <div className="text-center text-xs font-semibold text-red-600 uppercase tracking-wider">Menos</div>
              </div>

              {current.words.map(word => {
                const isMost = resp.most === word.id;
                const isLeast = resp.least === word.id;
                return (
                  <div key={word.id} className={"flex items-center gap-2 rounded-lg border px-4 py-3 mb-2 transition-all " + (isMost ? "border-brand-300 bg-brand-50" : isLeast ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300")}>
                    <div className="flex-1 text-sm font-medium text-gray-900">{word.text}</div>
                    <div className="flex gap-6">
                      <button onClick={() => selectWord(word.id, 'most')}
                        className={"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all " + (isMost ? "border-brand-600 bg-brand-600" : "border-gray-300 hover:border-brand-400")}>
                        {isMost && <Check size={14} className="text-white"/>}
                      </button>
                      <button onClick={() => selectWord(word.id, 'least')}
                        className={"flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all " + (isLeast ? "border-red-500 bg-red-500" : "border-gray-300 hover:border-red-400")}>
                        {isLeast && <Check size={14} className="text-white"/>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentGroup(Math.max(0, currentGroup - 1))} disabled={currentGroup === 0}
            className="btn-secondary gap-1 disabled:opacity-40"><ChevronLeft size={16}/>Anterior</button>

          {currentGroup < questions.length - 1 ? (
            <button onClick={() => setCurrentGroup(currentGroup + 1)}
              className="btn-primary gap-1">Proximo <ChevronRight size={16}/></button>
          ) : (
            <button onClick={submit} disabled={submitting || answeredCount < questions.length}
              className="btn-primary gap-2 disabled:opacity-40">
              {submitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
              Finalizar
            </button>
          )}
        </div>

        {/* Quick nav dots */}
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {questions.map((_, i) => {
            const done = responses[i]?.most && responses[i]?.least;
            return (
              <button key={i} onClick={() => setCurrentGroup(i)}
                className={"h-3 w-3 rounded-full transition-all " + (i === currentGroup ? "bg-brand-600 scale-125" : done ? "bg-green-400" : "bg-gray-300 hover:bg-gray-400")}
                title={"Grupo " + (i + 1)} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
`);

// 6. User Assessments Page
w('../frontend/src/pages/UserAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, Clock, CheckCircle2, Eye, Plus } from 'lucide-react';

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

  const startNew = () => navigate('/quiz');
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div><h1 className="font-display text-2xl text-gray-900">Meus Testes</h1><p className="mt-1 text-sm text-gray-500">Acompanhe seus assessments DISC</p></div>
        <button onClick={startNew} className="btn-primary gap-2"><Plus size={16}/>Novo Teste</button>
      </div>

      {justCompleted && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={16}/> Teste concluido com sucesso! Aguarde a liberacao do seu coach para ver o relatorio completo.
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-brand-50 p-4 text-brand-600"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-900">Nenhum teste realizado</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Clique em "Novo Teste" para iniciar seu questionario DISC.</p>
          <button onClick={startNew} className="btn-primary mt-6 gap-2"><Plus size={16}/>Iniciar Teste</button>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            return (
              <div key={a.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    <span className="text-xs text-gray-400">{fmtDate(a.createdAt)}</span>
                  </div>
                  {scores && (
                    <div className="flex gap-3 mt-2">
                      {['D','I','S','C'].map(f => (
                        <div key={f} className="text-center">
                          <div className={"text-xs font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{f}</div>
                          <div className="text-sm font-semibold text-gray-900">{scores[f]}%</div>
                        </div>
                      ))}
                      {a.profilePrimary && <div className="ml-2 text-xs text-gray-500 self-center">Perfil: <span className="font-semibold">{a.profilePrimary}/{a.profileSecondary}</span></div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'IN_PROGRESS' && <button onClick={startNew} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1"><Clock size={12}/>Continuar</button>}
                  {a.report && <button className="btn-primary !py-1.5 !px-3 !text-xs gap-1"><Eye size={12}/>Ver Relatorio</button>}
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

// 7. Updated Admin Assessments Page
w('../frontend/src/pages/AdminAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ClipboardList, Eye, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio gerado', color: 'bg-brand-50 text-brand-700' },
};

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => {
    try { const d = await api.get('/admin/assessments'); setAssessments(d.assessments); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const release = async (id) => {
    setReleasing(id);
    try {
      await api.patch('/admin/assessments/' + id + '/release', { adminNotes: adminNotes || undefined });
      setAdminNotes('');
      setExpanded(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setReleasing(null); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Assessments</h1><p className="mt-1 text-sm text-gray-500">Gerencie os testes DISC de todos os usuarios</p></div>

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-500">Nenhum assessment</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-400">Quando usuarios completarem testes, eles apareceram aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isExpanded = expanded === a.id;
            const canRelease = a.status === 'COMPLETED' || a.status === 'REVIEWED';

            return (
              <div key={a.id} className="card !p-0 overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded(isExpanded ? null : a.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">{a.user?.name}</span>
                      <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " + st.color}>{st.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-400">
                      <span>{a.user?.email}</span>
                      <span>Criado: {fmtDate(a.createdAt)}</span>
                      {a.completedAt && <span>Completado: {fmtDate(a.completedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scores && (
                      <div className="flex gap-2">
                        {['D','I','S','C'].map(f => (
                          <div key={f} className="text-center">
                            <div className={"text-[10px] font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{f}</div>
                            <div className="text-xs font-semibold text-gray-700">{scores[f]}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                    {scores && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Scores DISC</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {['D','I','S','C'].map(f => {
                            const colors = { D:'bg-disc-d', I:'bg-disc-i', S:'bg-disc-s', C:'bg-disc-c' };
                            const labels = { D:'Dominancia', I:'Influencia', S:'Estabilidade', C:'Conformidade' };
                            return (
                              <div key={f}>
                                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{labels[f]}</span><span className="font-semibold">{scores[f]}%</span></div>
                                <div className="h-2 rounded-full bg-gray-200"><div className={"h-full rounded-full " + colors[f]} style={{width: scores[f] + '%'}}/></div>
                              </div>
                            );
                          })}
                        </div>
                        {a.profilePrimary && <p className="mt-3 text-sm text-gray-600">Perfil: <span className="font-semibold">{a.profilePrimary}/{a.profileSecondary}</span></p>}
                      </div>
                    )}

                    {canRelease && (
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Liberar Assessment</h4>
                        <textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional) - ex: foco em lideranca, contexto de transicao de carreira..."
                          value={adminNotes} onChange={e => setAdminNotes(e.target.value)}/>
                        <button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">
                          {releasing === a.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/> : <Unlock size={14}/>}
                          Liberar
                        </button>
                      </div>
                    )}

                    {a.releasedAt && <p className="text-xs text-green-600 mt-2">Liberado em {fmtDate(a.releasedAt)}</p>}
                    {a.adminNotes && <p className="text-xs text-gray-500 mt-1">Nota: {a.adminNotes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

// 8. Updated UserDashboard with quiz link
w('../frontend/src/pages/UserDashboard.jsx', `import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ClipboardList, ArrowRight } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = () => { const h = new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; };

  return (
    <div>
      <div className="mb-8"><h1 className="font-display text-2xl text-gray-900">{greeting()}, {(user?.name||'').split(' ')[0]}</h1><p className="mt-1 text-sm text-gray-500">Bem-vindo a plataforma de analise comportamental DISC</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card flex flex-col items-center py-10 text-center">
          <div className="mb-4 rounded-xl bg-brand-50 p-4 text-brand-600"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-900">Questionario DISC</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Responda o questionario para descobrir seu perfil comportamental. Leva cerca de 10 minutos.</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary mt-6 gap-2">Iniciar Teste <ArrowRight size={16}/></button>
        </div>
        <div className="card flex flex-col items-center py-10 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1"/></svg>
          </div>
          <h3 className="font-display text-lg text-gray-900">Meus Relatorios</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500">Apos completar o questionario e a liberacao do seu coach, seu relatorio personalizado ficara disponivel aqui.</p>
          <button onClick={() => navigate('/dashboard/assessments')} className="btn-secondary mt-6 gap-2">Ver Meus Testes <ArrowRight size={16}/></button>
        </div>
      </div>
    </div>
  );
}
`);

// 9. Updated App.jsx with quiz route
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

console.log('\\n============================================');
console.log('  Sprint 2 - Todos os arquivos criados!');
console.log('============================================');
console.log('\\nReinicie o backend (Ctrl+C e npm run dev)');
console.log('O frontend atualiza automaticamente via HMR');
