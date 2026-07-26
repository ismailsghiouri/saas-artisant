import { useEffect, useState, useCallback } from 'react';
import { fetchArtisans } from '../utils/api';

/**
 * Charge la liste des artisans correspondant aux filtres fournis (profession,
 * ville, page...). Se recharge automatiquement à chaque changement de filtre.
 */
export function useArtisans(filters = {}) {
  const [artisans, setArtisans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchArtisans(JSON.parse(filtersKey));
      setArtisans(res.data);
      setPagination({ page: res.page, totalPages: res.totalPages, total: res.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { artisans, pagination, isLoading, error, reload: load };
}
