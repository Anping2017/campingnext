'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import TripForm, { TripFormData } from '@/components/TripForm';
import TripCard from '@/components/TripCard';
import NavBar from '@/components/NavBar';
import { Sparkles, Calendar, MapPin, Route } from 'lucide-react';

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
  destination?: string;
  days: number;
  dailyPlans: DailyPlan[];
  createdAt: string;
}

export default function TripPage() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');
  const isEdit = searchParams.get('edit') === 'true';
  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // 加载已保存的行程
  const loadTrips = useCallback(() => {
    const saved = localStorage.getItem('savedTrips');
    if (saved) {
      try {
        const trips: TripPlan[] = JSON.parse(saved);
        setSavedTrips(trips);
        
        // 如果有 tripId，加载对应的行程
        if (tripId) {
          const trip = trips.find((t) => t.id === tripId);
          if (trip) {
            setCurrentTrip(trip);
            setIsEditing(isEdit);
          }
        }
      } catch (error) {
        console.error('加载已保存行程失败:', error);
      }
    }
  }, [tripId, isEdit]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // 监听 localStorage 变化（用于跨页面同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedTrips') {
        loadTrips();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadTrips]);

  const handleGenerateTrip = async (formData: TripFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/trip/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: formData.origin,
          destination: formData.destination,
          days: formData.days,
          campCount: formData.campCount,
          preferences: formData.preferences,
          selectedCamps: formData.selectedCamps,
        }),
      });
      
      if (!response.ok) {
        throw new Error('生成行程失败');
      }
      
      const tripData = await response.json();
      
      // 创建行程对象
      const newTrip: TripPlan = {
        id: `trip-${Date.now()}`,
        origin: formData.origin,
        destination: formData.destination,
        days: formData.days,
        dailyPlans: tripData.dailyPlans || [],
        createdAt: new Date().toISOString(),
      };
      
      setCurrentTrip(newTrip);

      // 保存到 localStorage
      const updatedTrips = [newTrip, ...savedTrips];
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    } catch (error) {
      console.error('生成行程失败:', error);
      alert('生成行程失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = () => {
    if (!currentTrip) return;
      
    const updatedTrips = savedTrips.some((t) => t.id === currentTrip.id)
      ? savedTrips.map((t) => (t.id === currentTrip.id ? currentTrip : t))
      : [currentTrip, ...savedTrips];
      
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
      
    // 触发 storage 事件，通知其他页面
    window.dispatchEvent(new Event('storage'));
      
      alert('行程已保存');
    setIsEditing(false);
  };

  const handleDeleteTrip = () => {
    if (!currentTrip) return;
      
    if (!confirm('确定要删除这个行程吗？')) {
      return;
    }

    const updatedTrips = savedTrips.filter((t) => t.id !== currentTrip.id);
    setSavedTrips(updatedTrips);
    localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    
    // 触发 storage 事件，通知其他页面
    window.dispatchEvent(new Event('storage'));
    
    setCurrentTrip(null);
    alert('行程已删除');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Route className="w-8 h-8 text-green-600" />
            行程规划
          </h1>
          <p className="text-gray-600">让 AI 为你规划完美的露营之旅</p>
        </div>

        {/* 如果已有行程，显示行程；否则显示表单 */}
        {currentTrip ? (
          <div className="space-y-6">
            {/* 行程概览 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold">行程概览</h2>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                  <button
                    onClick={() => {
                          setIsEditing(false);
                          loadTrips(); // 重新加载，取消编辑
                    }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        取消编辑
                      </button>
                      <button
                        onClick={handleSaveTrip}
                        className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        保存修改
                      </button>
                      <button
                        onClick={handleDeleteTrip}
                        className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        删除行程
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setCurrentTrip(null)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        新建行程
                  </button>
                  <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                        编辑行程
                  </button>
                  <button
                        onClick={handleSaveTrip}
                        className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                        保存行程
                  </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">出发地</div>
                  <div className="font-semibold flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {currentTrip.origin}
                  </div>
                </div>
                {currentTrip.destination && (
                  <div>
                    <div className="text-gray-500 mb-1">目的地</div>
                    <div className="font-semibold flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {currentTrip.destination}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500 mb-1">出行天数</div>
                  <div className="font-semibold">{currentTrip.days} 天</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">营地数量</div>
                  <div className="font-semibold">{currentTrip.dailyPlans.length} 个</div>
                </div>
              </div>
              </div>

              {/* 每日行程 */}
                <div className="space-y-6">
              {currentTrip.dailyPlans.map((dailyPlan, index) => (
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

            {/* 编辑模式提示 */}
            {isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  💡 编辑模式：修改行程后点击&ldquo;保存修改&rdquo;按钮保存更改
                </p>
                </div>
              )}
          </div>
        ) : (
          <TripForm onSubmit={handleGenerateTrip} loading={loading} />
        )}

        {/* 已保存的行程列表 */}
        {savedTrips.length > 0 && !currentTrip && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              已保存的行程
            </h2>
            <div className="space-y-4">
              {savedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setCurrentTrip(trip)}
                >
                  <div className="flex items-start justify-between">
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
                          <span
                            key={plan.camp.id}
                            className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full"
                          >
                            {plan.camp.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}
