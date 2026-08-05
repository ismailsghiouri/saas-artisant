import { useTranslation } from 'react-i18next';
import ArtisanList from '../components/ArtisanList';

export default function SearchPage() {
  const { t } = useTranslation();
  return (
    <div className="page-container py-10">
      <h1 className="section-title">{t('search.title')}</h1>
      <p className="section-subtitle mb-6">
        {t('search.subtitle')}
      </p>
      <ArtisanList />
    </div>
  );
}
