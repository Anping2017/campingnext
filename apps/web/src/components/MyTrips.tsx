'use client';

import { useState, useEffect } from 'react';
import { Route, Calendar, MapPin, Share2, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DailyPlan {
  camp: any;
  day: number;
  drivingTime?: string;
  timeline?: any[];
  weather?: any;
  notes?: any[];
}

interface TripPlan {
  id: string;
  origin: string;
  destination?: string;
  days: number;
  dailyPlans: DailyPlan[];
  createdAt: string;
}

interface MyTripsProps {
  trips?: TripPlan[];
  onTripsChange?: (trips: TripPlan[]) => void;
}

export default function MyTrips({ trips: propTrips, onTripsChange }: MyTripsProps) {
  const router = useRouter();
  const [trips, setTrips] = useState<TripPlan[]>([]);

  // 加载行程数据
  useEffect(() => {
    if (propTrips) {
      setTrips(propTrips);
    } else {
      // 从 localStorage 加载
      const saved = localStorage.getItem('savedTrips');
      if (saved) {
        try {
          const parsedTrips: TripPlan[] = JSON.parse(saved);
          setTrips(parsedTrips);
        } catch (error) {
          console.error('加载行程失败:', error);
        }
      }
    }
  }, [propTrips]);

  // 删除行程
  const handleDelete = (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('确定要删除这个行程吗？')) {
      return;
    }

    const updatedTrips = trips.filter((t) => t.id !== tripId);
    setTrips(updatedTrips);
    localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    
    // 通知父组件
    if (onTripsChange) {
      onTripsChange(updatedTrips);
    }
  };

  // 编辑行程
  const handleEdit = (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/trip?tripId=${tripId}&edit=true`);
  };

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">还没有保存的行程</p>
        <p className="text-sm text-gray-400">去行程页面规划你的露营之旅吧</p>
        <Link
          href="/trip"
          className="mt-4 inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          开始规划行程
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {trip.days} 天露营行程
                </h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>从 {trip.origin} 出发</span>
                </div>
                {trip.destination && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>到 {trip.destination}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(trip.createdAt).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {trip.dailyPlans.map((plan) => (
                  <Link
                    key={plan.camp.id}
                    href={`/camp/${plan.camp.id}`}
                    className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {plan.camp.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => handleEdit(trip.id, e)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="编辑行程"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => handleDelete(trip.id, e)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="删除行程"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <Link
                href={`/trip?tripId=${trip.id}`}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                title="查看详情"
              >
                <Share2 className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


