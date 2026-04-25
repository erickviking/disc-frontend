import QuizPage from '../../pages/QuizPage.jsx';
import ReportPage from '../../pages/ReportPage.jsx';
import RodaDaVidaQuizPage from '../../pages/RodaDaVidaQuizPage.jsx';
import RodaDaVidaReportPage from '../../pages/RodaDaVidaReportPage.jsx';

const assessmentComponents = {
  disc: {
    Quiz: QuizPage,
    Report: ReportPage,
  },
  'roda-da-vida': {
    Quiz: RodaDaVidaQuizPage,
    Report: RodaDaVidaReportPage,
  },
};

export function getAssessmentComponents(slug) {
  return assessmentComponents[slug] || null;
}

export function getAssessmentQuizComponent(slug) {
  return getAssessmentComponents(slug)?.Quiz || null;
}

export function getAssessmentReportComponent(slug) {
  return getAssessmentComponents(slug)?.Report || null;
}
