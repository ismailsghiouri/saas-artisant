import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PROFESSIONS } from '../utils/helpers';

export default function SearchBar({ variant = 'hero' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profession, setProfession] = useState(searchParams.get('profession') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (profession) params.set('profession', profession);
    if (city) params.set('city', city);
    navigate(`/recherche?${params.toString()}`);
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-3 sm:flex-row ${
        isHero ? 'rounded-2xl bg-white/95 dark:bg-gray-900/95 p-3 shadow-xl' : ''
      }`}
    >
      <select
        value={profession}
        onChange={(e) => setProfession(e.target.value)}
        className="select-field sm:w-52"
      >
        <option value="">Tous les métiers</option>
        {PROFESSIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Votre ville (ex. Casablanca)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="input-field flex-1"
      />

      <button type="submit" className="btn-accent sm:w-40">
        Rechercher
      </button>
    </form>
  );
}
