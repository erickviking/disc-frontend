const fs = require('fs');
const path = require('path');
function w(f, c) {
  const d = path.dirname(f);
  if (!fs.existsSync(d)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, c, 'utf8');
  console.log('OK:', f);
}

// ============================================
// 1. PRISMA SCHEMA - Add Tool, UserToolAccess
// ============================================

w('../backend/prisma/schema.prisma', `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

enum AssessmentStatus {
  IN_PROGRESS
  COMPLETED
  REVIEWED
  RELEASED
  REPORT_GENERATED
}

model User {
  id            String           @id @default(cuid())
  email         String           @unique
  name          String
  passwordHash  String
  role          Role             @default(USER)
  phone         String?
  notes         String?
  inviteCode    String?          @unique
  invitedBy     String?
  isActive      Boolean          @default(true)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  assessments   Assessment[]
  inviter       User?            @relation("InvitedUsers", fields: [invitedBy], references: [id])
  invitedUsers  User[]           @relation("InvitedUsers")
  toolAccess    UserToolAccess[]

  @@map("users")
}

model Tool {
  id            String           @id @default(cuid())
  slug          String           @unique
  name          String
  description   String?
  icon          String?          // lucide icon name
  color         String?          // hex color
  category      String?          // ex: "comportamental", "desenvolvimento", "planejamento"
  isActive      Boolean          @default(true)
  isDefault     Boolean          @default(false) // auto-grant to new users
  sortOrder     Int              @default(0)
  config        Json?            // tool-specific config (question count, scoring method, etc)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  assessments   Assessment[]
  userAccess    UserToolAccess[]
  promptTemplates PromptTemplate[]

  @@map("tools")
}

model UserToolAccess {
  id        String   @id @default(cuid())
  userId    String
  toolId    String
  grantedAt DateTime @default(now())
  grantedBy String?  // admin who granted access

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool      Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@unique([userId, toolId])
  @@map("user_tool_access")
}

model Assessment {
  id               String           @id @default(cuid())
  userId           String
  toolId           String?          // which tool this assessment belongs to
  status           AssessmentStatus @default(IN_PROGRESS)
  responses        Json?
  scoresRaw        Json?
  profilePrimary   String?
  profileSecondary String?
  adminNotes       String?
  releasedAt       DateTime?
  completedAt      DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool             Tool?            @relation(fields: [toolId], references: [id])
  report           Report?

  @@map("assessments")
}

model Report {
  id            String     @id @default(cuid())
  assessmentId  String     @unique
  narrative     Json
  promptUsed    String?    @db.Text
  modelUsed     String?
  generatedAt   DateTime   @default(now())
  createdAt     DateTime   @default(now())

  assessment    Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@map("reports")
}

model InviteLink {
  id          String    @id @default(cuid())
  code        String    @unique
  createdById String
  maxUses     Int       @default(1)
  usedCount   Int       @default(0)
  expiresAt   DateTime?
  isActive    Boolean   @default(true)
  toolIds     String[]  // tools to grant on registration
  createdAt   DateTime  @default(now())

  @@map("invite_links")
}

model PromptTemplate {
  id        String   @id @default(cuid())
  name      String   @unique
  toolId    String?
  template  String   @db.Text
  isActive  Boolean  @default(true)
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tool      Tool?    @relation(fields: [toolId], references: [id])

  @@map("prompt_templates")
}
`);

// ============================================
// 2. SEED - Create tools + migrate DISC
// ============================================

w('../backend/prisma/seed.js', `import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Iniciando seed...');

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@disc.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@disc.com', passwordHash, role: 'ADMIN' },
  });
  console.log('Admin:', admin.email);

  // Tools
  const tools = [
    {
      slug: 'disc',
      name: 'Analise Comportamental DISC',
      description: 'Descubra seu perfil comportamental atraves dos 4 fatores: Executor, Comunicador, Planejador e Analista.',
      icon: 'Users',
      color: '#4c6ef5',
      category: 'comportamental',
      isActive: true,
      isDefault: true,
      sortOrder: 1,
      config: { questionCount: 28, scoringMethod: 'disc_classic' },
    },
    {
      slug: 'roda-da-vida',
      name: 'Roda da Vida',
      description: 'Avalie sua satisfacao em 8 areas fundamentais da vida e identifique onde focar sua energia.',
      icon: 'Target',
      color: '#2A9D8F',
      category: 'desenvolvimento',
      isActive: false,
      isDefault: false,
      sortOrder: 2,
      config: { areas: 8 },
    },
    {
      slug: 'inteligencia-emocional',
      name: 'Inteligencia Emocional',
      description: 'Avalie seus 5 pilares de inteligencia emocional e receba um plano de desenvolvimento personalizado.',
      icon: 'Heart',
      color: '#E63946',
      category: 'comportamental',
      isActive: false,
      isDefault: false,
      sortOrder: 3,
      config: { pillars: 5 },
    },
    {
      slug: 'valores-pessoais',
      name: 'Valores Pessoais',
      description: 'Identifique e priorize seus valores fundamentais para tomar decisoes mais alinhadas.',
      icon: 'Compass',
      color: '#F4A261',
      category: 'desenvolvimento',
      isActive: false,
      isDefault: false,
      sortOrder: 4,
      config: {},
    },
    {
      slug: 'metas-smart',
      name: 'Metas SMART',
      description: 'Defina metas claras com apoio de IA e acompanhe seu progresso com plano de acao personalizado.',
      icon: 'Rocket',
      color: '#7c3aed',
      category: 'planejamento',
      isActive: false,
      isDefault: false,
      sortOrder: 5,
      config: {},
    },
    {
      slug: 'sabotadores',
      name: 'Sabotadores Internos',
      description: 'Identifique seus sabotadores internos e aprenda estrategias para neutraliza-los.',
      icon: 'Shield',
      color: '#264653',
      category: 'comportamental',
      isActive: false,
      isDefault: false,
      sortOrder: 6,
      config: {},
    },
    {
      slug: 'diario',
      name: 'Diario de Autoconhecimento',
      description: 'Journaling guiado com analise de padroes por IA para acelerar seu autoconhecimento.',
      icon: 'BookOpen',
      color: '#059669',
      category: 'desenvolvimento',
      isActive: false,
      isDefault: false,
      sortOrder: 7,
      config: {},
    },
  ];

  for (const tool of tools) {
    await prisma.tool.upsert({
      where: { slug: tool.slug },
      update: { name: tool.name, description: tool.description, icon: tool.icon, color: tool.color, category: tool.category, sortOrder: tool.sortOrder, config: tool.config },
      create: tool,
    });
    console.log('Tool:', tool.slug, tool.isActive ? '(ativo)' : '(inativo)');
  }

  // Link existing assessments to DISC tool
  const discTool = await prisma.tool.findUnique({ where: { slug: 'disc' } });
  if (discTool) {
    const updated = await prisma.assessment.updateMany({
      where: { toolId: null },
      data: { toolId: discTool.id },
    });
    console.log('Assessments migrados para DISC:', updated.count);

    // Grant DISC access to all existing users
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await prisma.userToolAccess.upsert({
        where: { userId_toolId: { userId: user.id, toolId: discTool.id } },
        update: {},
        create: { userId: user.id, toolId: discTool.id, grantedBy: admin.id },
      });
    }
    console.log('Acesso DISC concedido a', users.length, 'usuarios');
  }

  // Prompt template for DISC
  await prisma.promptTemplate.upsert({
    where: { name: 'disc_analysis_default' },
    update: { toolId: discTool?.id },
    create: {
      name: 'disc_analysis_default',
      toolId: discTool?.id,
      template: 'Especialista DISC. Gere analise personalizada baseada nos scores fornecidos. Retorne em JSON.',
    },
  });

  console.log('Seed completo!');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
`);

// ============================================
// 3. TOOLS ROUTES - CRUD + access management
// ============================================

w('../backend/src/routes/tools.js', `import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

// ---- User routes ----
const userToolRouter = Router();
userToolRouter.use(authenticate);

// GET /api/tools - List tools accessible to user
userToolRouter.get('/', async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      // Admin sees all active tools
      const tools = await prisma.tool.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return res.json({ tools });
    }

    // User sees only tools they have access to
    const access = await prisma.userToolAccess.findMany({
      where: { userId: req.user.id },
      include: {
        tool: true,
      },
    });

    const tools = access
      .map(a => a.tool)
      .filter(t => t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return res.json({ tools });
  } catch (err) {
    console.error('List tools error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ---- Admin routes ----
const adminToolRouter = Router();
adminToolRouter.use(authenticate, requireAdmin);

// GET /api/admin/tools - List all tools (including inactive)
adminToolRouter.get('/', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { assessments: true, userAccess: true } },
      },
    });
    return res.json({
      tools: tools.map(t => ({
        ...t,
        assessmentCount: t._count.assessments,
        userCount: t._count.userAccess,
        _count: undefined,
      })),
    });
  } catch (err) {
    console.error('Admin list tools error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/admin/tools/:id - Toggle active, update details
adminToolRouter.patch('/:id', async (req, res) => {
  try {
    const schema = z.object({
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const tool = await prisma.tool.update({
      where: { id: req.params.id },
      data,
    });
    return res.json({ tool });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Update tool error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/admin/tools/:toolId/grant/:userId - Grant access
adminToolRouter.post('/:toolId/grant/:userId', async (req, res) => {
  try {
    const access = await prisma.userToolAccess.upsert({
      where: { userId_toolId: { userId: req.params.userId, toolId: req.params.toolId } },
      update: {},
      create: { userId: req.params.userId, toolId: req.params.toolId, grantedBy: req.user.id },
    });
    return res.json({ access, message: 'Acesso concedido' });
  } catch (err) {
    console.error('Grant access error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/admin/tools/:toolId/revoke/:userId - Revoke access
adminToolRouter.delete('/:toolId/revoke/:userId', async (req, res) => {
  try {
    await prisma.userToolAccess.delete({
      where: { userId_toolId: { userId: req.params.userId, toolId: req.params.toolId } },
    });
    return res.json({ message: 'Acesso revogado' });
  } catch (err) {
    console.error('Revoke access error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/admin/tools/:toolId/users - List users with access
adminToolRouter.get('/:toolId/users', async (req, res) => {
  try {
    const access = await prisma.userToolAccess.findMany({
      where: { toolId: req.params.toolId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { grantedAt: 'desc' },
    });
    return res.json({ users: access.map(a => ({ ...a.user, grantedAt: a.grantedAt })) });
  } catch (err) {
    console.error('List tool users error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/admin/tools/:toolId/grant-all - Grant to all users
adminToolRouter.post('/:toolId/grant-all', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    let count = 0;
    for (const user of users) {
      try {
        await prisma.userToolAccess.upsert({
          where: { userId_toolId: { userId: user.id, toolId: req.params.toolId } },
          update: {},
          create: { userId: user.id, toolId: req.params.toolId, grantedBy: req.user.id },
        });
        count++;
      } catch (e) { /* skip duplicates */ }
    }
    return res.json({ message: 'Acesso concedido a ' + count + ' usuarios' });
  } catch (err) {
    console.error('Grant all error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export { userToolRouter, adminToolRouter };
`);

// ============================================
// 4. UPDATE AUTH - auto-grant default tools on register
// ============================================

w('../backend/src/routes/auth.js', `import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  phone: z.string().optional(),
  inviteCode: z.string().optional(),
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Credenciais invalidas' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciais invalidas' });
    const token = generateToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: 'Email ja cadastrado' });

    let invitedBy = null;
    let inviteToolIds = [];

    if (data.inviteCode) {
      const invite = await prisma.inviteLink.findUnique({ where: { code: data.inviteCode } });
      if (!invite || !invite.isActive) return res.status(400).json({ error: 'Codigo de convite invalido' });
      if (invite.expiresAt && invite.expiresAt < new Date()) return res.status(400).json({ error: 'Codigo de convite expirado' });
      if (invite.usedCount >= invite.maxUses) return res.status(400).json({ error: 'Codigo de convite esgotado' });
      await prisma.inviteLink.update({ where: { id: invite.id }, data: { usedCount: { increment: 1 } } });
      invitedBy = invite.createdById;
      inviteToolIds = invite.toolIds || [];
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, phone: data.phone || null, invitedBy, role: 'USER' },
    });

    // Grant default tools
    const defaultTools = await prisma.tool.findMany({ where: { isDefault: true, isActive: true } });
    const toolIdsToGrant = new Set([
      ...defaultTools.map(t => t.id),
      ...inviteToolIds,
    ]);

    for (const toolId of toolIdsToGrant) {
      try {
        await prisma.userToolAccess.create({
          data: { userId: user.id, toolId, grantedBy: invitedBy },
        });
      } catch (e) { /* skip if exists */ }
    }

    const token = generateToken(user);
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });
    return res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
`);

// ============================================
// 5. UPDATE INDEX.JS - Add tool routes
// ============================================

w('../backend/src/index.js', `import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { adminInviteRouter, publicInviteRouter } from './routes/invites.js';
import { userAssessmentRouter, adminAssessmentRouter } from './routes/assessments.js';
import { userToolRouter, adminToolRouter } from './routes/tools.js';
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
app.use('/api/tools', userToolRouter);
app.use('/api/reports', pdfRoutes);

// Admin
app.use('/api/admin', adminRoutes);
app.use('/api/admin/invites', adminInviteRouter);
app.use('/api/admin/assessments', adminAssessmentRouter);
app.use('/api/admin/tools', adminToolRouter);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(config.port, () => {
  console.log('DISC Backend rodando na porta ' + config.port);
});
`);

console.log('\\n============================================');
console.log('  Etapa 1 - Backend reestruturado!');
console.log('============================================');
console.log('\\nProximos passos:');
console.log('  cd C:\\disc-system\\backend');
console.log('  npx prisma db push');
console.log('  npm run db:seed');
console.log('  npm run dev');
console.log('\\nIsso vai:');
console.log('  - Criar tabelas Tool, UserToolAccess');
console.log('  - Adicionar toolId ao Assessment');
console.log('  - Criar 7 ferramentas (so DISC ativo)');
console.log('  - Migrar assessments existentes para DISC');
console.log('  - Conceder acesso DISC a todos usuarios existentes');
