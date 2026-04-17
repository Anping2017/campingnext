import { X } from 'lucide-react';

interface FilterChipsProps {
  filters: string[];
  selectedFilters: string[];
  onToggle: (filter: string) => void;
}

const filterLabels: Record<string, string> = {
  'beach': '海边',
  'forest': '森林',
  'toilet': '有厕所',
  'beginner': '适合新手',
  'free': '免费',
};

export default function FilterChips({ filters, selectedFilters, onToggle }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isSelected = selectedFilters.includes(filter);
        return (
          <button
            key={filter}
            onClick={() => onToggle(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterLabels[filter] || filter}
          </button>
        );
      })}
    </div>
  );
}





