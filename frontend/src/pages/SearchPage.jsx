import ArtisanList from '../components/ArtisanList';

export default function SearchPage() {
  return (
    <div className="page-container py-10">
      <h1 className="section-title">Trouver un artisan</h1>
      <p className="section-subtitle mb-6">
        Filtrez par métier, ville ou note pour trouver le professionnel qu'il vous faut.
      </p>
      <ArtisanList />
    </div>
  );
}
