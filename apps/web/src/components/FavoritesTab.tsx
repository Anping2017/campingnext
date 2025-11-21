'use client';

import CampCard from '@/components/CampCard';
import { Camp } from '@/types/camp';

interface FavoritesTabProps {
  camps: Camp[];
}

export default function FavoritesTab({ camps }: FavoritesTabProps) {
  if (camps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📌</span>
        </div>
        <p className="text-gray-500 mb-2">还没有收藏的营地</p>
        <p className="text-sm text-gray-400">去发现页面收藏你喜欢的营地吧</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {camps.map((camp) => (
        <CampCard key={camp.id} camp={camp} />
      ))}
    </div>
  );
}

