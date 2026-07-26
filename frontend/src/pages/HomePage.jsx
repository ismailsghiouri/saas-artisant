import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ArtisanCard from '../components/ArtisanCard';
import { fetchTopRatedArtisans } from '../utils/api';
import { PROFESSIONS } from '../utils/helpers';

export default function HomePage() {
  const [topArtisans, setTopArtisans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopRatedArtisans(6)
      .then((res) => setTopArtisans(res.data))
      .catch(() => setTopArtisans([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <section className="hero-gradient text-white">
        <div className="page-container py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold sm:text-5xl">
              Un artisan de confiance,{' '}
              <span className="text-accent-300">disponible maintenant</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              Plombiers, électriciens, serruriers... FixNow trouve l'artisan vérifié le plus proche
              de chez vous, sans attendre.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      <section className="page-container py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PROFESSIONS.slice(0, 8).map((p) => (
            <Link
              key={p.value}
              to={`/recherche?profession=${p.value}`}
              className="card-hover flex flex-col items-center gap-2 p-4 text-center"
            >
              <span className="text-2xl">🛠️</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{p.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-container py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="section-title">Nos artisans les mieux notés</h2>
            <p className="section-subtitle">Des professionnels vérifiés, notés par la communauté.</p>
          </div>
          <Link to="/recherche" className="btn-outline hidden sm:inline-flex">
            Voir tous les artisans
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        ) : topArtisans.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Aucun artisan noté pour le moment. Revenez bientôt !
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topArtisans.map((artisan) => (
              <ArtisanCard key={artisan._id} artisan={artisan} />
            ))}
          </div>
        )}
      </section>

      <section className="page-container pb-16">
        <div className="grid gap-6 rounded-2xl bg-primary-50 dark:bg-gray-900 p-8 sm:grid-cols-3">
          {[
            { title: '1. Décrivez votre besoin', text: 'Expliquez votre problème et votre adresse en 2 minutes.' },
            { title: '2. Un artisan accepte', text: 'Les artisans disponibles à proximité sont notifiés instantanément.' },
            { title: '3. Intervention rapide', text: 'Suivez votre demande et payez en toute sécurité une fois le travail terminé.' },
          ].map((step) => (
            <div key={step.title}>
              <h3 className="font-bold text-primary-800 dark:text-primary-300">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
