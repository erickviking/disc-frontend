import { useParams } from 'react-router-dom';
import { getAssessmentQuizComponent } from '../features/assessments/assessmentRegistry.jsx';

export default function ToolQuizEntry() {
  const { slug } = useParams();
  const QuizComponent = getAssessmentQuizComponent(slug);

  if (QuizComponent) return <QuizComponent />;

  return <div className="card text-center py-16"><p className="text-on-surface-variant">Questionário não disponível para esta ferramenta.</p></div>;
}
