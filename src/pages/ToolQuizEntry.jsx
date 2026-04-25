import { useParams } from 'react-router-dom';
import QuizPage from './QuizPage.jsx';
import RodaDaVidaQuizPage from './RodaDaVidaQuizPage.jsx';

export default function ToolQuizEntry() {
  const { slug } = useParams();

  if (slug === 'disc') return <QuizPage />;
  if (slug === 'roda-da-vida') return <RodaDaVidaQuizPage />;

  return <div className="card text-center py-16"><p className="text-on-surface-variant">Questionário não disponível para esta ferramenta.</p></div>;
}
