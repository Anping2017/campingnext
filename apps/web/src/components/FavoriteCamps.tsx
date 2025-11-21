'use client';

import CampCard from '@/components/CampCard';
import { Camp } from '@/types/camp';
import { Heart } from 'lucide-react';

interface FavoriteCampsProps {
  camps: Camp[];
}

export default function FavoriteCamps({ camps }: FavoriteCampsProps) {
  if (camps.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">还没有收藏的营地</p>
        <p className="text-sm text-gray-400">去发现页面找找喜欢的营地吧</p>
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


