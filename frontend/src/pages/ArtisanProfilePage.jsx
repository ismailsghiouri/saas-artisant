import { useParams } from 'react-router-dom';
import ArtisanDetail from '../components/ArtisanDetail';

export default function ArtisanProfilePage() {
  const { id } = useParams();
  return (
    <div className="page-container py-10">
      <ArtisanDetail artisanId={id} />
    </div>
  );
}
