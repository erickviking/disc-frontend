import { useParams } from 'react-router-dom';
import { getAssessmentReportComponent } from '../features/assessments/assessmentRegistry.jsx';

export default function ToolReportEntry() {
  const { slug } = useParams();
  const ReportComponent = getAssessmentReportComponent(slug);

  if (ReportComponent) return <ReportComponent />;

  return <div className="card text-center py-16"><p className="text-on-surface-variant">Relatório não disponível para esta ferramenta.</p></div>;
}
