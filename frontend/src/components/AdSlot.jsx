/**
 * Emplacement publicitaire Google AdSense. En développement (ou tant que
 * VITE_ADSENSE_CLIENT_ID n'est pas configuré), un bloc de remplacement neutre
 * est affiché à la place pour ne jamais casser la mise en page.
 */
export function AdSlot({ slotId, className = '' }) {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;

  if (!clientId) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 text-xs text-gray-400 ${className}`}
      >
        Emplacement publicitaire (AdSense)
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

export default AdSlot;
