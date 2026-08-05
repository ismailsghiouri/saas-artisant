import { useParams } from 'react-router-dom';
import ArtisanDetail from '../components/ArtisanDetail';

export default function ArtisanProfilePage() {
  const { id } = useParams();
  return <ArtisanDetail artisanId={id} />;
}
