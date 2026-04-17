'use client';

import { getTagById, getTagLabel } from '@/lib/camp-metadata';
import { LucideIcon } from 'lucide-react';

interface CampTagsProps {
  tags: string[];
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
  className?: string;
}

export default function CampTags({ tags, size = 'md', showIcons = true, className }: CampTagsProps) {
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5';

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {tags.map(tagId => {
        const tag = getTagById(tagId);
        const Icon = tag?.icon as LucideIcon | undefined;

        return (
          <span
            key={tagId}
            className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 font-medium ${textSize} ${padding}`}
          >
            {showIcons && Icon && <Icon className={iconSize} />}
            {getTagLabel(tagId)}
          </span>
        );
      })}
    </div>
  );
}




