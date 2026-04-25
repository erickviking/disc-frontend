import {
  Users,
  Target,
  Heart,
  Compass,
  Rocket,
  Shield,
  BookOpen,
  Star,
} from 'lucide-react';

export const iconMap = {
  Users,
  Target,
  Heart,
  Compass,
  Rocket,
  Shield,
  BookOpen,
  Star,
};

export const toolUiConfig = {
  disc: {
    image: '/card-disc.jpg',
    focusPoint: 'center 15%',
    quizPath: '/quiz',
    reportPath: (assessmentId) => '/report/' + assessmentId,
  },
  'roda-da-vida': {
    image: '/card-roda.jpg',
    focusPoint: 'center 0%',
    quizPath: '/roda-da-vida/quiz',
    reportPath: (assessmentId) => '/roda-da-vida/report/' + assessmentId,
  },
  'inteligencia-emocional': {
    image: '/card-ie.jpg',
    focusPoint: 'center 40%',
  },
  'inteligência-emocional': {
    image: '/card-ie.jpg',
    focusPoint: 'center 40%',
  },
  'valores-pessoais': {
    image: '/card-valores.jpg',
    focusPoint: 'center 45%',
  },
  'metas-smart': {
    image: '/card-metas.jpg',
    focusPoint: 'center 15%',
  },
  sabotadores: {
    image: '/card-sabotadores.jpg',
    focusPoint: 'center 20%',
  },
  diario: {
    image: '/card-diario.jpg',
    focusPoint: 'center 42%',
  },
  diário: {
    image: '/card-diario.jpg',
    focusPoint: 'center 42%',
  },
};

export function getToolUiConfig(slug) {
  return toolUiConfig[slug] || {};
}

export function getToolIcon(iconName, fallback = Target) {
  return iconMap[iconName] || fallback;
}

export function getToolImage(tool) {
  return getToolUiConfig(tool?.slug).image;
}

export function getToolFocusPoint(tool) {
  return tool?.config?.imagePosition || getToolUiConfig(tool?.slug).focusPoint || 'center 20%';
}

export function getToolQuizPath(slug) {
  return getToolUiConfig(slug).quizPath || null;
}

export function getToolReportPath(slug, assessmentId) {
  const reportPath = getToolUiConfig(slug).reportPath;
  return reportPath && assessmentId ? reportPath(assessmentId) : null;
}
