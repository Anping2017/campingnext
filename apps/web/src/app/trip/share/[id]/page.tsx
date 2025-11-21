'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import TripCard from '@/components/TripCard';
import { Share2, Calendar, MapPin, ArrowLeft } from 'lucide-react';

interface TimelineItem {
  time: string;
  event: string;
  type: 'departure' | 'arrival' | 'activity' | 'warning';
}

interface DailyPlan {
  camp: any;
  day: number;
  drivingTime: string;
  timeline: TimelineItem[];
  weather: {
    condition: string;
    temperature: string;
    nightTemperature?: string;
    timeBasedWarnings?: Array<{ time: string; message: string }>;
  };
  notes?: Array<{ time?: string; message: string }>;
}

interface TripPlan {
  id: string;
  origin: string;
  days: number;
  dailyPlans: DailyPlan[];
  notes: Array<{ time?: string; message: string }>;
  createdAt: string;
}

export default function ShareTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: 从 API 获取分享的行程
    // 目前可以从 localStorage 或 API 获取
    const fetchTrip = async () => {
      try {
        // 示例：从 localStorage 获取（实际应该从 API）
        const savedTrips = localStorage.getItem('savedTrips');
        if (savedTrips) {
          const trips: TripPlan[] = JSON.parse(savedTrips);
          const trip = trips.find((t: TripPlan) => t.id === tripId);
          if (trip) {
            setTripPlan(trip);
          } else {
            setError('找不到该行程');
          }
        } else {
          setError('找不到该行程');
        }
      } catch (err) {
        console.error('加载行程失败:', err);
        setError('加载行程失败');
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const handleShare = async () => {
    if (!tripPlan) return;

    const shareUrl = window.location.href;
    const shareText = `我计划去 ${tripPlan.days} 天露营，来看看我的行程吧！`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的露营计划',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // 用户取消分享
      }
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(shareUrl);
      alert('行程链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !tripPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '找不到该行程'}</p>
          <a
            href="/trip"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            返回行程规划
          </a>
        </div>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/trip')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回行程规划
          </button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">分享的行程</h1>
          </div>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            分享
          </button>
        </div>

        {/* 行程概览 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">行程概览</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">出发地</div>
              <div className="font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {tripPlan.origin}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">出行天数</div>
              <div className="font-semibold">{tripPlan.days} 天</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">营地数量</div>
              <div className="font-semibold">{tripPlan.dailyPlans.length} 个</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">创建时间</div>
              <div className="font-semibold text-xs">
                {new Date(tripPlan.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>

        {/* 每日行程 */}
        <div className="space-y-6">
          {tripPlan.dailyPlans.map((dailyPlan) => (
            <TripCard
              key={dailyPlan.camp.id}
              camp={dailyPlan.camp}
              day={dailyPlan.day}
              drivingTime={dailyPlan.drivingTime}
              timeline={dailyPlan.timeline}
              weather={dailyPlan.weather}
              notes={dailyPlan.notes || []}
            />
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}

