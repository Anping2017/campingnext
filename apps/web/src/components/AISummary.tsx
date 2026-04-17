import { Sparkles, Users, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AISummaryProps {
  campId: string;
  campName: string;
}

export default function AISummary({ campId, campName }: AISummaryProps) {
  const [summary, setSummary] = useState<{
    suitableFor: string[];
    notes: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟 AI 摘要生成
    const generateSummary = async () => {
      try {
        const response = await fetch(`/api/camp/summary?campId=${campId}`);
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        } else {
          // 使用默认摘要
          setSummary({
            suitableFor: ['家庭出游', '新手露营者', '摄影爱好者'],
            notes: ['建议提前预订', '注意天气变化', '带好防蚊用品'],
          });
        }
      } catch (error) {
        // 使用默认摘要
        setSummary({
          suitableFor: ['家庭出游', '新手露营者', '摄影爱好者'],
          notes: ['建议提前预订', '注意天气变化', '带好防蚊用品'],
        });
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [campId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-600 animate-pulse" />
          <h3 className="font-semibold text-gray-900">AI 摘要</h3>
        </div>
        <div className="text-gray-500 text-sm">正在生成摘要...</div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">AI 摘要</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">适合谁去</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.suitableFor.map((item, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-gray-700">注意事项</span>
        </div>
        <ul className="space-y-1">
          {summary.notes.map((note, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}





