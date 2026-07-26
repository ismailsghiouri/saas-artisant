import { useCallback, useEffect, useState } from 'react';
import { fetchMyReservationsAsArtisan, fetchMyReservationsAsClient } from '../utils/api';
import { useAuth } from './useAuth';

/**
 * Charge les réservations de l'utilisateur connecté, en tenant compte de son
 * rôle (client ou artisan), chacun ayant un endpoint dédié côté API.
 */
export function useReservations() {
  const { role, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setReservations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res =
        role === 'artisan'
          ? await fetchMyReservationsAsArtisan()
          : await fetchMyReservationsAsClient();
      setReservations(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [role, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { reservations, isLoading, error, reload: load };
}
