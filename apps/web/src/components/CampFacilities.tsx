'use client';

import { getFacilityById, getFacilityLabel } from '@/lib/camp-metadata';
import { LucideIcon } from 'lucide-react';

interface CampFacilitiesProps {
  facilities: string[];
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
  className?: string;
  layout?: 'grid' | 'list';
}

export default function CampFacilities({ 
  facilities, 
  size = 'md', 
  showIcons = true, 
  className, 
  layout = 'grid' 
}: CampFacilitiesProps) {
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5';

  if (!facilities || facilities.length === 0) {
    return null;
  }

  const wrapperClassName = layout === 'grid' 
    ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' 
    : 'flex flex-wrap gap-2';

  return (
    <div className={wrapperClassName}>
      {facilities.map(facilityId => {
        const facility = getFacilityById(facilityId);
        const Icon = facility?.icon as LucideIcon | undefined;

        return (
          <div
            key={facilityId}
            className={`inline-flex items-center gap-2 rounded-lg bg-gray-50 text-gray-700 font-medium ${textSize} ${padding} ${className || ''}`}
          >
            {showIcons && Icon && <Icon className={iconSize} />}
            <span>{getFacilityLabel(facilityId)}</span>
          </div>
        );
      })}
    </div>
  );
}




