import { useParams } from 'react-router-dom';
import ReportPage from './ReportPage.jsx';
import RodaDaVidaReportPage from './RodaDaVidaReportPage.jsx';

export default function ToolReportEntry() {
  const { slug } = useParams();

  if (slug === 'disc') return <ReportPage />;
  if (slug === 'roda-da-vida') return <RodaDaVidaReportPage />;

  return <div className="card text-center py-16"><p className="text-on-surface-variant">Relatório não disponível para esta ferramenta.</p></div>;
}
