import PhotoDiagnostic from '../components/PhotoDiagnostic';
import { useTranslation } from 'react-i18next';

export default function DiagnosticPage() {
  const { t } = useTranslation();
  return (
    <div className="page-container py-10">
      <div className="mx-auto mb-8 max-w-xl text-center">
        <h1 className="section-title">{t('diagnosticPage.title')}</h1>
        <p className="section-subtitle mx-auto">
          {t('diagnosticPage.subtitle')}
        </p>
      </div>
      <PhotoDiagnostic />
    </div>
  );
}
