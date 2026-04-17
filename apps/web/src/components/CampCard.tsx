import { Camp } from '@/types/camp';
import { formatPrice, formatDifficulty, formatRating } from '@/utils/format';
import { Star, MapPin, DollarSign, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CampTags from './CampTags';

interface CampCardProps {
  camp: Camp;
  onClick?: () => void;
}

export default function CampCard({ camp, onClick }: CampCardProps) {
  // ✨ 优先用 shortDescription(50字左右),否则截取 description
  const cardText = camp.shortDescription || camp.description;
  // ✨ 优先用 highlights 里前 3 条作为亮点
  const highlights = camp.highlights?.slice(0, 3);

  const content = (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer border border-gray-100">
      {/* ✨ 封面图(若有 photos) */}
      {camp.photos && camp.photos.length > 0 && (
        <div
          className="h-40 bg-gray-200 bg-cover bg-center"
          style={{ backgroundImage: `url('${camp.photos[0]}')` }}
        />
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 flex-1">{camp.name}</h3>
          <div className="flex items-center gap-1 text-yellow-500 ml-2 shrink-0">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{formatRating(camp.rating)}</span>
            {camp.ratingCount ? (
              <span className="text-xs text-gray-400">({camp.ratingCount})</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {camp.region}
            {camp.nearestTown ? <span className="text-gray-400"> · 近 {camp.nearestTown}</span> : null}
          </span>
        </div>

        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{cardText}</p>

        {/* ✨ Highlights 亮点 chips */}
        {highlights && highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-800 rounded"
              >
                <Sparkles className="w-3 h-3" />
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">{formatPrice(camp.price)}</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
              {formatDifficulty(camp.difficulty)}
            </span>
            {camp.campType && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {formatCampType(camp.campType)}
              </span>
            )}
          </div>
        </div>

        {camp.tags && camp.tags.length > 0 && (
          <div className="mt-3">
            <CampTags tags={camp.tags.slice(0, 3)} size="sm" showIcons={true} />
          </div>
        )}
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

/** ✨ camp_type 友好显示 */
function formatCampType(t: string): string {
  const labels: Record<string, string> = {
    doc_serviced: 'DOC 服务型',
    doc_basic: 'DOC 基础型',
    doc_standard: 'DOC 标准型',
    holiday_park: 'Holiday Park',
    freedom_camping: 'Freedom Camping',
    local_camp: '地方营地',
    private_campground: '私人营地',
    glamping: 'Glamping',
    farm_stay: 'Farm Stay',
    // 旧值兼容
    DOC: 'DOC',
    'Holiday Park': 'Holiday Park',
    'Freedom Camping': 'Freedom Camping',
    'Local Camp': '地方营地',
    'Private Campground': '私人营地',
  };
  return labels[t] ?? t;
}

