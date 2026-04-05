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

// 1. Install new dependencies instruction
console.log('\n>> IMPORTANTE: Rode primeiro no backend:');
console.log('>> cd C:\\disc-system\\backend');
console.log('>> npm install puppeteer resend\n');

// 2. Update .env with Resend key placeholder
// (user will add manually)

// 3. Update config
w('../backend/src/config/index.js', `import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Vanessa Rocha <onboarding@resend.dev>',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
};
`);

// 4. PDF Generator Service
w('../backend/src/services/pdf-generator.js', `import puppeteer from 'puppeteer';
import { profileLabels } from '../data/disc-profiles.js';

const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };
const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };

function buildHTML(report, scores, profilePrimary, profileSecondary, userName) {
  const n = report.narrative;
  const date = new Date(report.generatedAt).toLocaleDateString('pt-BR');

  const radarSVG = buildRadarSVG(scores);

  const pontosFortes = (n.pontosFortes || []).map(p => {
    const titulo = p.titulo || p;
    const desc = p.descricao ? '<p style="color:#4b5563;font-size:12px;margin:4px 0 0 0;">' + p.descricao + '</p>' : '';
    return '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:8px;"><p style="font-weight:600;color:#111827;font-size:13px;margin:0;">' + titulo + '</p>' + desc + '</div>';
  }).join('');

  const areasAtencao = (n.areasAtencao || []).map(a => {
    const titulo = a.titulo || a;
    const desc = a.descricao ? '<p style="color:#4b5563;font-size:12px;margin:4px 0 0 0;">' + a.descricao + '</p>' : '';
    return '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:8px;"><p style="font-weight:600;color:#111827;font-size:13px;margin:0;">' + titulo + '</p>' + desc + '</div>';
  }).join('');

  const recomendacoes = (n.desenvolvimento?.recomendacoes || []).map(r =>
    '<li style="margin-bottom:6px;color:#374151;font-size:13px;">' + r + '</li>'
  ).join('');

  const acoesPraticas = (n.desenvolvimento?.acoesPraticas || []).map((a, i) =>
    '<li style="margin-bottom:6px;color:#374151;font-size:13px;"><strong style="color:#059669;">' + (i+1) + '.</strong> ' + a + '</li>'
  ).join('');

  const scoreBars = ['D','I','S','C'].map(f =>
    '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12px;color:#4b5563;">' + profileNames[f] + '</span><span style="font-size:12px;font-weight:600;">' + scores[f] + '%</span></div><div style="height:8px;background:#e5e7eb;border-radius:4px;"><div style="height:100%;width:' + scores[f] + '%;background:' + profileColors[f] + ';border-radius:4px;"></div></div></div>'
  ).join('');

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111827;line-height:1.6;padding:40px;max-width:800px;margin:0 auto;}h1{font-size:24px;margin-bottom:4px;}h2{font-size:18px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;}h3{font-size:15px;margin-bottom:8px;}.section{margin-bottom:32px;}.label{font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;color:#6b7280;margin-bottom:4px;}.text{font-size:13px;color:#374151;line-height:1.7;}.tag{display:inline-block;background:#eff6ff;color:#3b82f6;font-size:11px;padding:4px 12px;border-radius:999px;margin:2px 4px 2px 0;font-weight:500;}</style></head><body>'
  + '<div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e5e7eb;">'
  + '<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;margin-bottom:8px;">Analise Comportamental</p>'
  + '<h1>' + userName + '</h1>'
  + '<p style="font-size:14px;color:#6b7280;">Perfil: <span style="color:' + profileColors[profilePrimary] + ';font-weight:700;">' + profileNames[profilePrimary] + '</span> / <span style="color:' + profileColors[profileSecondary] + ';font-weight:700;">' + profileNames[profileSecondary] + '</span></p>'
  + '<div style="margin:24px auto;max-width:300px;">' + radarSVG + '</div>'
  + '</div>'

  + '<div class="section"><h2>Resumo do Perfil</h2><p class="text">' + (n.resumoExecutivo || '') + '</p></div>'

  + '<div class="section"><h2>Perfil Detalhado</h2><p class="text" style="white-space:pre-line;">' + (n.perfilDetalhado?.descricao || '') + '</p>'
  + (n.perfilDetalhado?.palavrasChave ? '<div style="margin-top:12px;">' + n.perfilDetalhado.palavrasChave.map(p => '<span class="tag">' + p + '</span>').join('') + '</div>' : '')
  + '</div>'

  + '<div class="section"><h2>Scores</h2>' + scoreBars + '</div>'

  + '<div class="section"><h2>Pontos Fortes</h2>' + pontosFortes + '</div>'
  + '<div class="section"><h2>Areas de Atencao</h2>' + areasAtencao + '</div>'

  + (n.estiloComunicacao ? '<div class="section"><h2>Estilo de Comunicacao</h2>'
    + '<div style="margin-bottom:12px;"><p class="label">Como se expressa</p><p class="text">' + (n.estiloComunicacao.comoSeExprime || '') + '</p></div>'
    + '<div style="margin-bottom:12px;"><p class="label">Como prefere receber informacoes</p><p class="text">' + (n.estiloComunicacao.comoPrefereceber || '') + '</p></div>'
    + (n.estiloComunicacao.dicasParaOutros ? '<div><p class="label">Dicas para quem convive</p><p class="text">' + n.estiloComunicacao.dicasParaOutros + '</p></div>' : '')
    + '</div>' : '')

  + (n.ambiente ? '<div class="section"><h2>Ambiente e Trabalho</h2>'
    + '<div style="margin-bottom:12px;"><p class="label">Ambiente ideal</p><p class="text">' + (n.ambiente.idealDeTrabalho || '') + '</p></div>'
    + '<div style="margin-bottom:12px;"><p class="label">Fatores de estresse</p><p class="text">' + (n.ambiente.fatoresEstresse || '') + '</p></div>'
    + (n.ambiente.comoLidaComMudancas ? '<div><p class="label">Relacao com mudancas</p><p class="text">' + n.ambiente.comoLidaComMudancas + '</p></div>' : '')
    + '</div>' : '')

  + (n.lideranca ? '<div class="section"><h2>Lideranca</h2>'
    + '<div style="margin-bottom:12px;"><p class="label">Estilo</p><p class="text">' + (n.lideranca.estilo || '') + '</p></div>'
    + (n.lideranca.comoMotiva ? '<div><p class="label">Como motiva outros</p><p class="text">' + n.lideranca.comoMotiva + '</p></div>' : '')
    + '</div>' : '')

  + (n.desenvolvimento ? '<div class="section"><h2>Desenvolvimento</h2>'
    + (recomendacoes ? '<p class="label">Recomendacoes</p><ul style="margin:8px 0 16px 16px;">' + recomendacoes + '</ul>' : '')
    + (acoesPraticas ? '<p class="label">Acoes praticas</p><ul style="margin:8px 0 0 16px;list-style:none;">' + acoesPraticas + '</ul>' : '')
    + '</div>' : '')

  + '<div style="text-align:center;padding-top:24px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;"><p>Vanessa Rocha - Analise Comportamental</p><p>Gerado em ' + date + '</p></div>'
  + '</body></html>';
}

function buildRadarSVG(scores) {
  const size = 300;
  const center = size / 2;
  const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({
    x: center + Math.cos(angle) * (radius * value / 100),
    y: center + Math.sin(angle) * (radius * value / 100),
  });

  let svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" width="300" height="300">';

  // Grid
  [25, 50, 75, 100].forEach(v => {
    const pts = factors.map((_, i) => { const p = getPoint(angles[i], v); return p.x+','+p.y; }).join(' ');
    svg += '<polygon points="' + pts + '" fill="none" stroke="#e5e7eb" stroke-width="1"/>';
  });

  // Axes
  factors.forEach((_, i) => {
    const p = getPoint(angles[i], 100);
    svg += '<line x1="' + center + '" y1="' + center + '" x2="' + p.x + '" y2="' + p.y + '" stroke="#e5e7eb" stroke-width="1"/>';
  });

  // Data
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x+','+p.y).join(' ');
  svg += '<polygon points="' + polygon + '" fill="rgba(76,110,245,0.15)" stroke="#4c6ef5" stroke-width="2.5"/>';

  // Points + labels
  factors.forEach((f, i) => {
    const p = dataPoints[i];
    const lp = getPoint(angles[i], 125);
    svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" fill="' + profileColors[f] + '"/>';
    svg += '<text x="' + lp.x + '" y="' + lp.y + '" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="' + profileColors[f] + '">' + profileNames[f] + '</text>';
    svg += '<text x="' + lp.x + '" y="' + (lp.y + 14) + '" text-anchor="middle" font-size="10" fill="#6b7280">' + scores[f] + '%</text>';
  });

  svg += '</svg>';
  return svg;
}

export async function generatePDF(report, scores, profilePrimary, profileSecondary, userName) {
  const html = buildHTML(report, scores, profilePrimary, profileSecondary, userName);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}
`);

// 5. Email Service
w('../backend/src/services/email.js', `import { Resend } from 'resend';
import { config } from '../config/index.js';

let resend = null;

function getResend() {
  if (!resend && config.resendApiKey) {
    resend = new Resend(config.resendApiKey);
  }
  return resend;
}

export async function sendReportReadyEmail(to, userName, appUrl) {
  const r = getResend();
  if (!r) {
    console.log('Resend nao configurado, pulando email para:', to);
    return null;
  }

  try {
    const result = await r.emails.send({
      from: config.emailFrom,
      to: [to],
      subject: 'Seu relatorio comportamental esta pronto!',
      html: \`
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:700;padding:8px 12px;border-radius:8px;margin-bottom:12px;">VR</div>
            <h2 style="color:#111827;font-size:20px;margin:0;">Vanessa Rocha</h2>
            <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Analise Comportamental</p>
          </div>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">
            <h1 style="color:#111827;font-size:22px;margin:0 0 12px 0;">Ola, \${userName.split(' ')[0]}!</h1>
            <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
              Seu relatorio de analise comportamental foi gerado e esta pronto para visualizacao.
            </p>
            <a href="\${appUrl}/dashboard" style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
              Ver Meu Relatorio
            </a>
          </div>

          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
            Vanessa Rocha - Analise Comportamental
          </p>
        </div>
      \`,
    });

    console.log('Email enviado para:', to, result);
    return result;
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
    return null;
  }
}
`);

// 6. PDF download route
w('../backend/src/routes/pdf.js', `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generatePDF } from '../services/pdf-generator.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/reports/:assessmentId/pdf
router.get('/:assessmentId/pdf', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.assessmentId },
      include: {
        user: { select: { id: true, name: true } },
        report: true,
      },
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });

    // Allow user to see own report or admin to see any
    if (assessment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    const scores = assessment.scoresRaw?.normalized;
    const pdfBuffer = await generatePDF(
      assessment.report,
      scores,
      assessment.profilePrimary,
      assessment.profileSecondary,
      assessment.user.name
    );

    const filename = 'relatorio-disc-' + assessment.user.name.toLowerCase().replace(/\\s+/g, '-') + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'Erro ao gerar PDF: ' + err.message });
  }
});

export default router;
`);

// 7. Update main index.js to include PDF route + email on release
w('../backend/src/index.js', `import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { adminInviteRouter, publicInviteRouter } from './routes/invites.js';
import { userAssessmentRouter, adminAssessmentRouter } from './routes/assessments.js';
import pdfRoutes from './routes/pdf.js';

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
app.use('/api/reports', pdfRoutes);

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

// 8. Update assessment release to send email
w('../backend/src/routes/assessments.js', `import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { calculateDiscScores, validateResponses } from '../services/disc-scoring.js';
import { discQuestions } from '../data/disc-questions.js';
import { generateReport } from '../services/report-generator.js';
import { sendReportReadyEmail } from '../services/email.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

const userAssessmentRouter = Router();
userAssessmentRouter.use(authenticate);

userAssessmentRouter.get('/questions', (req, res) => {
  return res.json({ questions: discQuestions, totalGroups: discQuestions.length });
});

userAssessmentRouter.post('/', async (req, res) => {
  try {
    const existing = await prisma.assessment.findFirst({ where: { userId: req.user.id, status: 'IN_PROGRESS' } });
    if (existing) return res.json({ assessment: existing, resumed: true });
    const assessment = await prisma.assessment.create({ data: { userId: req.user.id, status: 'IN_PROGRESS' } });
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
      data: { responses, scoresRaw: { normalized: scores, raw: rawScores }, profilePrimary, profileSecondary, status: 'COMPLETED', completedAt: new Date() },
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
      select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, completedAt: true, releasedAt: true, createdAt: true, report: { select: { id: true, generatedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ assessments });
  } catch (err) {
    console.error('List my assessments error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

userAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true } }, report: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.userId !== req.user.id) return res.status(403).json({ error: 'Sem permissao' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio ainda nao foi gerado' });
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---- Admin ----
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
        where, select: { id: true, status: true, profilePrimary: true, profileSecondary: true, scoresRaw: true, adminNotes: true, completedAt: true, releasedAt: true, createdAt: true, user: { select: { id: true, name: true, email: true } }, report: { select: { id: true, generatedAt: true } } },
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
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { id: true, name: true, email: true, phone: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    return res.json({ assessment });
  } catch (err) {
    console.error('Get assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Release + generate report + send email
adminAssessmentRouter.patch('/:id/release', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });

    const { adminNotes } = req.body || {};
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'RELEASED', releasedAt: new Date(), adminNotes: adminNotes || assessment.adminNotes },
    });

    let report = assessment.report;
    if (!report) {
      try {
        report = await generateReport(assessment.id);
      } catch (genErr) {
        console.error('Report generation failed:', genErr.message);
        return res.json({ assessment: { ...assessment, status: 'RELEASED' }, message: 'Liberado, mas falha ao gerar relatorio: ' + genErr.message, reportError: genErr.message });
      }
    }

    // Send email notification
    try {
      await sendReportReadyEmail(assessment.user.email, assessment.user.name, config.appUrl);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    const updated = await prisma.assessment.findUnique({ where: { id: assessment.id }, include: { report: true, user: { select: { name: true, email: true } } } });
    return res.json({ assessment: updated, message: 'Assessment liberado, relatorio gerado e email enviado!' });
  } catch (err) {
    console.error('Release assessment error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { name: true, email: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) {
    console.error('Get admin report error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export { userAssessmentRouter, adminAssessmentRouter };
`);

// ============================================
// FRONTEND - Add PDF download button to report page
// ============================================

// 9. Update ReportPage with download button
w('../frontend/src/pages/ReportPage.jsx', `import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, Download, Star, AlertTriangle, MessageCircle, Briefcase, TrendingUp, Users, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const profileColors = { D: '#E63946', I: '#F4A261', S: '#2A9D8F', C: '#264653' };

function RadarChart({ scores }) {
  const size = 280; const center = size / 2; const radius = 110;
  const factors = ['D', 'I', 'S', 'C'];
  const angles = factors.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const getPoint = (angle, value) => ({ x: center + Math.cos(angle) * (radius * value / 100), y: center + Math.sin(angle) * (radius * value / 100) });
  const dataPoints = factors.map((f, i) => getPoint(angles[i], scores[f]));
  const polygon = dataPoints.map(p => p.x + ',' + p.y).join(' ');
  return (
    <svg viewBox={"0 0 " + size + " " + size} className="w-full max-w-[280px] mx-auto">
      {[25,50,75,100].map(v => <polygon key={v} points={factors.map((_,i)=>{const p=getPoint(angles[i],v);return p.x+','+p.y;}).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1"/>)}
      {factors.map((_,i)=>{const p=getPoint(angles[i],100);return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1"/>;})}
      <polygon points={polygon} fill="rgba(76,110,245,0.15)" stroke="#4c6ef5" strokeWidth="2.5"/>
      {factors.map((f,i)=>{const p=dataPoints[i];const lp=getPoint(angles[i],120);return(<g key={f}><circle cx={p.x} cy={p.y} r="5" fill={profileColors[f]}/><text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={profileColors[f]}>{profileNames[f]}</text><text x={lp.x} y={lp.y+14} textAnchor="middle" fontSize="10" fill="#6b7280">{scores[f]}%</text></g>);})}
    </svg>
  );
}

function Section({ icon: Icon, title, children, color = 'text-brand-600 bg-brand-50' }) {
  return (<div className="mb-6"><div className="flex items-center gap-2 mb-3"><div className={"rounded-lg p-1.5 "+color}><Icon size={16}/></div><h3 className="font-display text-lg text-gray-900">{title}</h3></div>{children}</div>);
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isAdmin ? '/admin/assessments/' + id + '/report' : '/assessments/' + id + '/report';
        setData(await api.get(endpoint));
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, isAdmin]);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const token = api.getToken();
      const res = await fetch('/api/reports/' + id + '/pdf', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao gerar PDF'); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio-disc.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao baixar PDF: ' + e.message); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;
  if (error) return <div className="p-8"><div className="card text-center py-12"><p className="text-red-600">{error}</p><button onClick={() => navigate(-1)} className="btn-secondary mt-4 gap-2"><ArrowLeft size={16}/>Voltar</button></div></div>;

  const { report, scores, profilePrimary, profileSecondary, userName } = data;
  const n = report.narrative;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-1"><ArrowLeft size={16}/>Voltar</button>
          <button onClick={downloadPDF} disabled={downloading} className="btn-primary gap-2">
            {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
            Baixar PDF
          </button>
        </div>

        <div className="card mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Analise Comportamental</p>
          <h1 className="font-display text-2xl text-gray-900 mb-1">{userName}</h1>
          <p className="text-sm text-gray-500">Perfil: <span className="font-semibold" style={{color:profileColors[profilePrimary]}}>{profileNames[profilePrimary]}</span> / <span className="font-semibold" style={{color:profileColors[profileSecondary]}}>{profileNames[profileSecondary]}</span></p>
          <div className="mt-6"><RadarChart scores={scores}/></div>
        </div>

        <div className="card mb-6"><h2 className="font-display text-xl text-gray-900 mb-3">Resumo do Perfil</h2><p className="text-sm leading-relaxed text-gray-700">{n.resumoExecutivo}</p></div>

        <div className="card mb-6"><h2 className="font-display text-xl text-gray-900 mb-3">Perfil Detalhado</h2><p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{n.perfilDetalhado?.descricao}</p>
          {n.perfilDetalhado?.palavrasChave && <div className="flex flex-wrap gap-2 mt-4">{n.perfilDetalhado.palavrasChave.map((p,i)=><span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{p}</span>)}</div>}
        </div>

        <div className="card mb-6"><Section icon={Star} title="Pontos Fortes" color="text-green-600 bg-green-50"><div className="space-y-3">{(n.pontosFortes||[]).map((p,i)=><div key={i} className="rounded-lg bg-green-50/50 border border-green-100 px-4 py-3"><p className="text-sm font-semibold text-gray-900">{p.titulo||p}</p>{p.descricao&&<p className="text-xs text-gray-600 mt-1">{p.descricao}</p>}</div>)}</div></Section></div>

        <div className="card mb-6"><Section icon={AlertTriangle} title="Areas de Atencao" color="text-amber-600 bg-amber-50"><div className="space-y-3">{(n.areasAtencao||[]).map((a,i)=><div key={i} className="rounded-lg bg-amber-50/50 border border-amber-100 px-4 py-3"><p className="text-sm font-semibold text-gray-900">{a.titulo||a}</p>{a.descricao&&<p className="text-xs text-gray-600 mt-1">{a.descricao}</p>}</div>)}</div></Section></div>

        {n.estiloComunicacao && <div className="card mb-6"><Section icon={MessageCircle} title="Estilo de Comunicacao" color="text-disc-i bg-orange-50"><div className="space-y-4 text-sm text-gray-700"><div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como se expressa</p><p className="leading-relaxed">{n.estiloComunicacao.comoSeExprime}</p></div><div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como prefere receber informacoes</p><p className="leading-relaxed">{n.estiloComunicacao.comoPrefereceber}</p></div>{n.estiloComunicacao.dicasParaOutros&&<div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Dicas para quem convive</p><p className="leading-relaxed">{n.estiloComunicacao.dicasParaOutros}</p></div>}</div></Section></div>}

        {n.ambiente && <div className="card mb-6"><Section icon={Briefcase} title="Ambiente e Trabalho" color="text-disc-s bg-teal-50"><div className="space-y-4 text-sm text-gray-700"><div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Ambiente ideal</p><p className="leading-relaxed">{n.ambiente.idealDeTrabalho}</p></div><div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Fatores de estresse</p><p className="leading-relaxed">{n.ambiente.fatoresEstresse}</p></div>{n.ambiente.comoLidaComMudancas&&<div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Relacao com mudancas</p><p className="leading-relaxed">{n.ambiente.comoLidaComMudancas}</p></div>}</div></Section></div>}

        {n.lideranca && <div className="card mb-6"><Section icon={Users} title="Lideranca" color="text-disc-d bg-red-50"><div className="space-y-4 text-sm text-gray-700"><div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Estilo de lideranca</p><p className="leading-relaxed">{n.lideranca.estilo}</p></div>{n.lideranca.comoMotiva&&<div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-1">Como motiva outros</p><p className="leading-relaxed">{n.lideranca.comoMotiva}</p></div>}</div></Section></div>}

        {n.desenvolvimento && <div className="card mb-6"><Section icon={TrendingUp} title="Desenvolvimento" color="text-purple-600 bg-purple-50">{n.desenvolvimento.recomendacoes&&<div className="mb-4"><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Recomendacoes</p><ul className="space-y-2">{n.desenvolvimento.recomendacoes.map((r,i)=><li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-brand-600 font-bold mt-0.5">•</span><span>{r}</span></li>)}</ul></div>}{n.desenvolvimento.acoesPraticas&&<div><p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Acoes praticas</p><ul className="space-y-2">{n.desenvolvimento.acoesPraticas.map((a,i)=><li key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-green-600 font-bold mt-0.5">{i+1}.</span><span>{a}</span></li>)}</ul></div>}</Section></div>}

        <div className="text-center text-xs text-gray-400 py-4"><p>Vanessa Rocha - Analise Comportamental</p><p className="mt-1">Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p></div>
      </div>
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Sprint 4 Parte 1 - PDF + Email criados!');
console.log('============================================');
console.log('\\nProximos passos:');
console.log('1. cd C:\\disc-system\\backend');
console.log('2. npm install puppeteer resend');
console.log('3. Adicionar no .env:');
console.log('   RESEND_API_KEY="re_xxxx"');
console.log('   EMAIL_FROM="Vanessa Rocha <onboarding@resend.dev>"');
console.log('   APP_URL="http://localhost:5173"');
console.log('4. npm run dev');
console.log('\\nPara obter a chave Resend:');
console.log('  - Acesse resend.com e crie uma conta gratuita');
console.log('  - Gere uma API key em Settings > API Keys');
