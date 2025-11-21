import { Camp } from '@/types/camp';
import { formatPrice, formatDifficulty, formatRating } from '@/utils/format';
import { Star, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CampCardProps {
  camp: Camp;
  onClick?: () => void;
}

export default function CampCard({ camp, onClick }: CampCardProps) {
  const content = (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{camp.name}</h3>
        <div className="flex items-center gap-1 text-yellow-500">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-medium">{formatRating(camp.rating)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-gray-600 mb-3">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{camp.region}</span>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{camp.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">{formatPrice(camp.price)}</span>
          </div>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
            {formatDifficulty(camp.difficulty)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {camp.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return (
    <Link href={`/camp/${camp.id}`} legacyBehavior>
      <a>{content}</a>
    </Link>
  );
}

