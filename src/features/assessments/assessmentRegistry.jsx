import QuizPage from '../../pages/QuizPage.jsx';
import ReportPage from '../../pages/ReportPage.jsx';
import RodaDaVidaQuizPage from '../../pages/RodaDaVidaQuizPage.jsx';
import RodaDaVidaReportPage from '../../pages/RodaDaVidaReportPage.jsx';
import InteligenciaEmocionalQuizPage from '../../pages/InteligenciaEmocionalQuizPage.jsx';
import InteligenciaEmocionalReportPage from '../../pages/InteligenciaEmocionalReportPage.jsx';
import ValoresPessoaisQuizPage from '../../pages/ValoresPessoaisQuizPage.jsx';
import ValoresPessoaisReportPage from '../../pages/ValoresPessoaisReportPage.jsx';

const assessmentComponents = {
  disc: { Quiz: QuizPage, Report: ReportPage },
  'roda-da-vida': { Quiz: RodaDaVidaQuizPage, Report: RodaDaVidaReportPage },
  'inteligencia-emocional': { Quiz: InteligenciaEmocionalQuizPage, Report: InteligenciaEmocionalReportPage },
  'valores-pessoais': { Quiz: ValoresPessoaisQuizPage, Report: ValoresPessoaisReportPage },
};

export function getAssessmentComponents(slug) { return assessmentComponents[slug] || null; }
export function getAssessmentQuizComponent(slug) { return getAssessmentComponents(slug)?.Quiz || null; }
export function getAssessmentReportComponent(slug) { return getAssessmentComponents(slug)?.Report || null; }
