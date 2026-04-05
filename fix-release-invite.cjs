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

// 1. Assessment routes - add generate-report endpoint
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
    const inProgress = await prisma.assessment.findFirst({ where: { userId: req.user.id, status: 'IN_PROGRESS' } });
    if (inProgress) return res.json({ assessment: inProgress, resumed: true });
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

userAssessmentRouter.get('/evolution', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: req.user.id, status: { in: ['COMPLETED', 'REVIEWED', 'RELEASED', 'REPORT_GENERATED'] } },
      select: { id: true, scoresRaw: true, profilePrimary: true, profileSecondary: true, completedAt: true, createdAt: true },
      orderBy: { completedAt: 'asc' },
    });
    return res.json({ assessments });
  } catch (err) {
    console.error('Evolution error:', err);
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
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminAssessmentRouter.get('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { id: true, name: true, email: true, phone: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    return res.json({ assessment });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

// Release (sem gerar relatorio automaticamente)
adminAssessmentRouter.patch('/:id/release', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });
    const { adminNotes } = req.body || {};
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'RELEASED', releasedAt: new Date(), adminNotes: adminNotes || assessment.adminNotes },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    return res.json({ assessment: updated, message: 'Assessment liberado! Agora gere o relatorio.' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

// Generate report (separate action)
adminAssessmentRouter.post('/:id/generate-report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { report: true, user: { select: { name: true, email: true } } },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.report) return res.status(400).json({ error: 'Relatorio ja existe' });
    if (assessment.status === 'IN_PROGRESS') return res.status(400).json({ error: 'Assessment ainda nao foi completado' });

    const report = await generateReport(assessment.id);

    try { await sendReportReadyEmail(assessment.user.email, assessment.user.name, config.appUrl); }
    catch (emailErr) { console.error('Email failed:', emailErr.message); }

    const updated = await prisma.assessment.findUnique({ where: { id: assessment.id }, include: { report: true, user: { select: { name: true, email: true } } } });
    return res.json({ assessment: updated, message: 'Relatorio gerado e email enviado!' });
  } catch (err) {
    console.error('Generate report error:', err);
    return res.status(500).json({ error: 'Erro ao gerar relatorio: ' + err.message });
  }
});

// Delete
adminAssessmentRouter.delete('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (assessment.report) await prisma.report.delete({ where: { id: assessment.report.id } });
    await prisma.assessment.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Assessment deletado' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminAssessmentRouter.get('/:id/report', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { user: { select: { name: true, email: true } }, report: true } });
    if (!assessment) return res.status(404).json({ error: 'Assessment nao encontrado' });
    if (!assessment.report) return res.status(404).json({ error: 'Relatorio nao gerado' });
    return res.json({ report: assessment.report, scores: assessment.scoresRaw?.normalized, profilePrimary: assessment.profilePrimary, profileSecondary: assessment.profileSecondary, userName: assessment.user.name });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

export { userAssessmentRouter, adminAssessmentRouter };
`);

// 2. Invite email service
w('../backend/src/routes/invites.js', `import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

const adminInviteRouter = Router();
adminInviteRouter.use(authenticate, requireAdmin);

adminInviteRouter.post('/', async (req, res) => {
  try {
    const schema = z.object({
      maxUses: z.number().int().min(1).max(100).default(1),
      expiresInDays: z.number().int().min(1).max(90).optional(),
      sendEmail: z.boolean().optional(),
      emailTo: z.string().email().optional(),
      emailName: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const code = nanoid(12);
    const invite = await prisma.inviteLink.create({
      data: {
        code, createdById: req.user.id, maxUses: data.maxUses,
        expiresAt: data.expiresInDays ? new Date(Date.now() + data.expiresInDays * 86400000) : null,
      },
    });
    const origin = config.appUrl || req.headers.origin || 'http://localhost:5173';
    const inviteUrl = origin + '/register?invite=' + code;

    // Send email if requested
    let emailSent = false;
    if (data.sendEmail && data.emailTo && config.resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(config.resendApiKey);
        const name = data.emailName || 'Voce';
        await resend.emails.send({
          from: config.emailFrom,
          to: [data.emailTo],
          subject: 'Convite para Analise Comportamental - Vanessa Rocha',
          html: '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">'
            + '<div style="text-align:center;margin-bottom:32px;">'
            + '<div style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:700;padding:8px 12px;border-radius:8px;margin-bottom:12px;">VR</div>'
            + '<h2 style="color:#111827;font-size:20px;margin:0;">Vanessa Rocha</h2>'
            + '<p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Analise Comportamental</p>'
            + '</div>'
            + '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">'
            + '<h1 style="color:#111827;font-size:22px;margin:0 0 12px 0;">Ola, ' + name.split(' ')[0] + '!</h1>'
            + '<p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px 0;">'
            + 'Voce foi convidado(a) para realizar sua analise de perfil comportamental. Clique no botao abaixo para criar sua conta e iniciar o questionario.</p>'
            + '<a href="' + inviteUrl + '" style="display:inline-block;background:#4c6ef5;color:white;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Criar Minha Conta</a>'
            + '</div>'
            + '<p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">Vanessa Rocha - Analise Comportamental</p>'
            + '</div>',
        });
        emailSent = true;
        console.log('Invite email sent to:', data.emailTo);
      } catch (emailErr) {
        console.error('Invite email failed:', emailErr.message);
      }
    }

    return res.status(201).json({
      invite: { id: invite.id, code: invite.code, maxUses: invite.maxUses, expiresAt: invite.expiresAt, url: inviteUrl },
      emailSent,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Create invite error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

adminInviteRouter.get('/', async (req, res) => {
  try {
    const invites = await prisma.inviteLink.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    const now = new Date();
    return res.json({
      invites: invites.map(inv => ({ ...inv, isExpired: inv.expiresAt ? inv.expiresAt < now : false, isExhausted: inv.usedCount >= inv.maxUses })),
    });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

adminInviteRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.inviteLink.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Convite desativado' });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

const publicInviteRouter = Router();
publicInviteRouter.get('/:code/validate', async (req, res) => {
  try {
    const invite = await prisma.inviteLink.findUnique({ where: { code: req.params.code } });
    if (!invite || !invite.isActive) return res.json({ valid: false, reason: 'Convite nao encontrado' });
    if (invite.expiresAt && invite.expiresAt < new Date()) return res.json({ valid: false, reason: 'Convite expirado' });
    if (invite.usedCount >= invite.maxUses) return res.json({ valid: false, reason: 'Convite esgotado' });
    return res.json({ valid: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Erro interno' }); }
});

export { adminInviteRouter, publicInviteRouter };
`);

// ============================================
// FRONTEND
// ============================================

// 3. AdminAssessmentsPage - separate Liberar and Gerar Relatorio buttons
w('../frontend/src/pages/AdminAssessmentsPage.jsx', `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ClipboardList, Eye, Unlock, FileText, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';

const profileNames = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
const statusLabels = {
  IN_PROGRESS: { text: 'Em andamento', color: 'bg-amber-50 text-amber-700' },
  COMPLETED: { text: 'Completado', color: 'bg-blue-50 text-blue-700' },
  REVIEWED: { text: 'Revisado', color: 'bg-purple-50 text-purple-700' },
  RELEASED: { text: 'Liberado', color: 'bg-green-50 text-green-700' },
  REPORT_GENERATED: { text: 'Relatorio gerado', color: 'bg-brand-50 text-brand-700' },
};

export default function AdminAssessmentsPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
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
      setAdminNotes(''); await load();
    } catch (e) { alert(e.message); }
    finally { setReleasing(null); }
  };

  const generateReport = async (id) => {
    setGenerating(id);
    try {
      const result = await api.post('/admin/assessments/' + id + '/generate-report', {});
      alert(result.message || 'Relatorio gerado!');
      await load();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setGenerating(null); }
  };

  const deleteAssessment = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este assessment? Esta acao nao pode ser desfeita.')) return;
    setDeleting(id);
    try { await api.delete('/admin/assessments/' + id); setExpanded(null); await load(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Assessments</h1><p className="mt-1 text-sm text-gray-500">Gerencie os testes comportamentais de todos os usuarios</p></div>

      {loading ? (
        <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
      ) : assessments.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-xl bg-gray-100 p-4 text-gray-400"><ClipboardList size={32}/></div>
          <h3 className="font-display text-lg text-gray-500">Nenhum assessment</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const st = statusLabels[a.status] || statusLabels.IN_PROGRESS;
            const scores = a.scoresRaw?.normalized;
            const isExpanded = expanded === a.id;
            const canRelease = a.status === 'COMPLETED' || a.status === 'REVIEWED';
            const canGenerateReport = (a.status === 'RELEASED' || a.status === 'COMPLETED' || a.status === 'REVIEWED') && !a.report;
            const hasReport = !!a.report;

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
                            <div className={"text-[10px] font-bold " + (f==='D'?'text-disc-d':f==='I'?'text-disc-i':f==='S'?'text-disc-s':'text-disc-c')}>{profileNames[f][0]}</div>
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
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Perfil Comportamental</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {['D','I','S','C'].map(f => {
                            const colors = { D:'bg-disc-d', I:'bg-disc-i', S:'bg-disc-s', C:'bg-disc-c' };
                            return (
                              <div key={f}>
                                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{profileNames[f]}</span><span className="font-semibold">{scores[f]}%</span></div>
                                <div className="h-2 rounded-full bg-gray-200"><div className={"h-full rounded-full " + colors[f]} style={{width: scores[f] + '%'}}/></div>
                              </div>
                            );
                          })}
                        </div>
                        {a.profilePrimary && <p className="mt-3 text-sm text-gray-600">Perfil: <span className="font-semibold">{profileNames[a.profilePrimary]} / {profileNames[a.profileSecondary]}</span></p>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      {hasReport && (
                        <button onClick={(e) => { e.stopPropagation(); navigate('/report/' + a.id); }} className="btn-primary gap-2">
                          <Eye size={14}/>Ver Relatorio
                        </button>
                      )}

                      {canGenerateReport && (
                        <button onClick={(e) => { e.stopPropagation(); generateReport(a.id); }} disabled={generating === a.id} className="btn-primary gap-2">
                          {generating === a.id ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>}
                          Gerar Relatorio
                        </button>
                      )}
                    </div>

                    {canRelease && (
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Liberar Assessment</h4>
                        <textarea className="input-field mb-3" rows={2} placeholder="Nota para a IA (opcional) - ex: foco em lideranca..."
                          value={adminNotes} onChange={e => setAdminNotes(e.target.value)}/>
                        <button onClick={() => release(a.id)} disabled={releasing === a.id} className="btn-primary gap-2">
                          {releasing === a.id ? <Loader2 size={14} className="animate-spin"/> : <Unlock size={14}/>}
                          Liberar
                        </button>
                      </div>
                    )}

                    {a.releasedAt && <p className="text-xs text-green-600 mt-2">Liberado em {fmtDate(a.releasedAt)}</p>}
                    {a.adminNotes && <p className="text-xs text-gray-500 mt-1">Nota: {a.adminNotes}</p>}

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <button onClick={(e) => { e.stopPropagation(); deleteAssessment(a.id); }} disabled={deleting === a.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                        {deleting === a.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                        Deletar Assessment
                      </button>
                    </div>
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

// 4. AdminInvitesPage - add email fields
w('../frontend/src/pages/AdminInvitesPage.jsx', `import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Plus, Copy, Check, Trash2, Link2, Clock, AlertCircle, Mail, Send } from 'lucide-react';

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expDays, setExpDays] = useState(7);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailName, setEmailName] = useState('');
  const [copied, setCopied] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const load = async () => { try { const d = await api.get('/admin/invites'); setInvites(d.invites); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true); setLastResult(null);
    try {
      const payload = { maxUses, expiresInDays: expDays || undefined };
      if (sendEmail && emailTo) {
        payload.sendEmail = true;
        payload.emailTo = emailTo;
        payload.emailName = emailName || undefined;
      }
      const d = await api.post('/admin/invites', payload);
      await load();
      try { await navigator.clipboard.writeText(d.invite.url); setCopied(d.invite.id); setTimeout(()=>setCopied(null),2000); } catch(e){}

      if (d.emailSent) {
        setLastResult('Convite criado e email enviado para ' + emailTo + '!');
      } else if (sendEmail && emailTo) {
        setLastResult('Convite criado, mas falha ao enviar email. Link copiado.');
      } else {
        setLastResult('Convite criado! Link copiado.');
      }
      setEmailTo(''); setEmailName(''); setSendEmail(false);
    } catch(e){alert(e.message);}
    finally{setCreating(false);}
  };

  const copyLink = async (code) => { try { await navigator.clipboard.writeText(window.location.origin+'/register?invite='+code); setCopied(code); setTimeout(()=>setCopied(null),2000); } catch(e){} };
  const deactivate = async (id) => { try { await api.delete('/admin/invites/'+id); load(); } catch(e){alert(e.message);} };
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-gray-900">Convites</h1><p className="mt-1 text-sm text-gray-500">Gere links de convite para novos usuarios</p></div>

      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Gerar novo convite</h3>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-500">Max. de usos</label><input type="number" min={1} max={100} className="input-field w-24" value={maxUses} onChange={e=>setMaxUses(Number(e.target.value))}/></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-500">Expira em (dias)</label><input type="number" min={1} max={90} className="input-field w-24" value={expDays} onChange={e=>setExpDays(Number(e.target.value))}/></div>
        </div>

        {/* Email toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
            <span className="text-sm text-gray-700 flex items-center gap-1"><Mail size={14}/> Enviar convite por email</span>
          </label>
        </div>

        {sendEmail && (
          <div className="flex flex-wrap gap-4 mb-4 pl-6">
            <div className="flex-1 min-w-[200px]"><label className="mb-1.5 block text-xs font-medium text-gray-500">Email do convidado</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={emailTo} onChange={e=>setEmailTo(e.target.value)}/></div>
            <div className="flex-1 min-w-[200px]"><label className="mb-1.5 block text-xs font-medium text-gray-500">Nome (opcional)</label><input className="input-field" placeholder="Nome da pessoa" value={emailName} onChange={e=>setEmailName(e.target.value)}/></div>
          </div>
        )}

        <button onClick={create} disabled={creating || (sendEmail && !emailTo)} className="btn-primary gap-2">
          {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/> : sendEmail ? <Send size={16}/> : <Plus size={16}/>}
          {sendEmail ? 'Gerar e Enviar' : 'Gerar Convite'}
        </button>

        {lastResult && (
          <div className="mt-3 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-100">
            {lastResult}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? <div className="card flex items-center justify-center py-12 text-gray-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mr-2"/>Carregando...</div>
        : invites.length === 0 ? <div className="card flex flex-col items-center py-12 text-gray-400"><Link2 size={32} className="mb-2 opacity-40"/><p>Nenhum convite criado</p></div>
        : invites.map(inv => {
          const ok = inv.isActive && !inv.isExpired && !inv.isExhausted;
          return (
            <div key={inv.id} className={"card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between " + (!ok ? 'opacity-60' : '')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-brand-700">{inv.code}</code>
                  {!inv.isActive && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12}/>Desativado</span>}
                  {inv.isExpired && <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Clock size={12}/>Expirado</span>}
                  {inv.isExhausted && <span className="text-xs text-gray-500 font-medium">Esgotado</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400"><span>Usos: {inv.usedCount}/{inv.maxUses}</span><span>Criado: {fmtDate(inv.createdAt)}</span>{inv.expiresAt && <span>Expira: {fmtDate(inv.expiresAt)}</span>}</div>
              </div>
              <div className="flex items-center gap-2">
                {ok && <button onClick={()=>copyLink(inv.code)} className="btn-secondary !py-1.5 !px-3 !text-xs gap-1.5">{copied===inv.code?<><Check size={12} className="text-green-500"/>Copiado!</>:<><Copy size={12}/>Copiar Link</>}</button>}
                {inv.isActive && <button onClick={()=>deactivate(inv.id)} title="Desativar" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`);

console.log('\\n============================================');
console.log('  Correcoes aplicadas!');
console.log('============================================');
console.log('- Liberar e Gerar Relatorio sao acoes separadas');
console.log('- Botao "Gerar Relatorio" aparece quando liberado sem relatorio');
console.log('- Convites podem ser enviados por email');
console.log('\\nReinicie o backend e faca git push.');
