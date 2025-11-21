'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar, Sparkles, Filter, X, Heart, Plus, Navigation, Search } from 'lucide-react';
import campsData from '@/data/camps.json';
import { Camp } from '@/types/camp';
import { UserPreferences, preferencesUtils } from '@/types/preferences';

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  loading?: boolean;
  initialData?: TripFormData;
}

export interface TripFormData {
  origin: string;
  destination?: string;
  days: number;
  preferences: string[];
  selectedCamps: string[];
  campCount: number; // 营地数量（默认1个）
  tripType: 'multiple' | 'single'; // 根据 campCount 自动判断：1个=single，多个=multiple
}

const preferenceOptions = [
  { id: 'beach', label: '海边' },
  { id: 'forest', label: '森林' },
  { id: 'toilet', label: '有厕所' },
  { id: 'family', label: '适合带娃' },
];

export default function TripForm({ onSubmit, loading, initialData }: TripFormProps) {
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [days, setDays] = useState(initialData?.days || 2);
  const [campCount, setCampCount] = useState(initialData?.campCount || 1);
  const [preferences, setPreferences] = useState<string[]>(initialData?.preferences || []);
  // tripType 根据 campCount 自动计算
  const tripType = campCount === 1 ? 'single' : 'multiple';
  const [showAutoLocation, setShowAutoLocation] = useState(!initialData?.origin);
  const [showDestination, setShowDestination] = useState(false);
  const [selectedCampIds, setSelectedCampIds] = useState<string[]>(initialData?.selectedCamps || []);
  const [favoriteCamps, setFavoriteCamps] = useState<Camp[]>([]);
  const [showCampSelector, setShowCampSelector] = useState(false); // 默认收起，简化UI
  const [campSearchQuery, setCampSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // 是否只显示收藏
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  // 从 localStorage 加载用户偏好
  useEffect(() => {
    const prefs = preferencesUtils.load();
    setUserPreferences(prefs);
    
    // 自动应用偏好到表单（营地类型不再映射到快捷筛选，因为类型不同）
    if (prefs.facilities.includes('厕所') && !preferences.includes('toilet')) {
      setPreferences((prev) => [...prev, 'toilet']);
    }
    if (prefs.personalInfo.hasChildren && !preferences.includes('family')) {
      setPreferences((prev) => [...prev, 'family']);
    }
  }, []);

  // 从 localStorage 加载已选择的营地和收藏的营地
  useEffect(() => {
    const saved = localStorage.getItem('selectedCampsForTrip');
    if (saved) {
      try {
        const camps = JSON.parse(saved);
        setSelectedCampIds(camps);
      } catch (error) {
        console.error('加载已选择营地失败:', error);
      }
    }

    // 加载收藏的营地
    const favorites = localStorage.getItem('favoriteCamps');
    if (favorites) {
      try {
        const favoriteIds = JSON.parse(favorites);
        const camps = favoriteIds
          .map((id: string) => (campsData as Camp[]).find((c) => c.id === id))
          .filter((c): c is Camp => c !== undefined);
        setFavoriteCamps(camps);
      } catch (error) {
        console.error('加载收藏营地失败:', error);
      }
    }
  }, []);

  // 获取已选择营地的详细信息
  const selectedCamps = selectedCampIds
    .map((id) => (campsData as Camp[]).find((c) => c.id === id))
    .filter((c): c is Camp => c !== undefined);

  const handleRemoveCamp = (campId: string) => {
    const updated = selectedCampIds.filter((id) => id !== campId);
    setSelectedCampIds(updated);
    localStorage.setItem('selectedCampsForTrip', JSON.stringify(updated));
  };

  const handleAddCamp = (campId: string) => {
    if (!selectedCampIds.includes(campId)) {
      const updated = [...selectedCampIds, campId];
      setSelectedCampIds(updated);
      localStorage.setItem('selectedCampsForTrip', JSON.stringify(updated));
    }
    setCampSearchQuery(''); // 清空搜索
  };

  // 搜索营地（包含偏好过滤）
  const availableCamps = useMemo(() => {
    const allCamps = campsData as Camp[];
    const query = campSearchQuery.toLowerCase().trim();
    
    // 基础过滤：排除已选择的营地
    const baseFilter = (camp: Camp) => !selectedCampIds.includes(camp.id);
    
    // 偏好过滤
    const preferenceFilter = (camp: Camp) => {
      if (preferences.length === 0) return true; // 没有偏好时不过滤
      
      // 检查每个偏好是否匹配
      if (preferences.includes('beach') && !camp.tags.includes('海边')) return false;
      if (preferences.includes('forest') && !camp.tags.some((t) => t.includes('徒步') || t.includes('森林'))) return false;
      if (preferences.includes('toilet') && !camp.facilities.includes('厕所')) return false;
      if (preferences.includes('family') && camp.difficulty === 'hard') return false;
      
      return true;
    };
    
    // 搜索过滤
    const searchFilter = (camp: Camp) => {
      if (!query) return true;
      return (
        camp.name.toLowerCase().includes(query) ||
        camp.region.toLowerCase().includes(query) ||
        camp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    };
    
    // 如果只显示收藏
    if (showFavoritesOnly) {
      return favoriteCamps.filter((camp) => 
        baseFilter(camp) && preferenceFilter(camp) && searchFilter(camp)
      );
    }
    
    // 从全部营地中搜索
    return allCamps.filter((camp) => 
      baseFilter(camp) && preferenceFilter(camp) && searchFilter(camp)
    );
  }, [campSearchQuery, favoriteCamps, selectedCampIds, showFavoritesOnly, preferences]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 这里可以调用逆地理编码API获取地址
          setOrigin('当前位置');
          setShowAutoLocation(false);
        },
        () => {
          alert('无法获取位置信息');
        }
      );
    }
  };

  const handleTogglePreference = (prefId: string) => {
    setPreferences((prev) =>
      prev.includes(prefId) ? prev.filter((p) => p !== prefId) : [...prev, prefId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      origin,
      destination: showDestination ? destination : undefined,
      days,
      preferences,
      selectedCamps: selectedCampIds,
      campCount,
      tripType,
    });
  };

  // 数字输入器组件
  const NumberInput = ({ 
    value, 
    onChange, 
    min = 1, 
    max = 10, 
    label,
    hint
  }: { 
    value: number; 
    onChange: (value: number) => void; 
    min?: number; 
    max?: number; 
    label: string;
    hint?: string;
  }) => {
    const handleDecrease = () => {
      if (value > min) {
        onChange(value - 1);
      }
    };

    const handleIncrease = () => {
      if (value < max) {
        onChange(value + 1);
      }
    };

    return (
      <div>
        <label className="block text-sm text-gray-600 mb-2">
          {label}
          {hint && <span className="text-gray-400 text-xs ml-1">({hint})</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={value <= min}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium"
          >
            −
          </button>
          <div className="flex-1 text-center py-2 px-4 bg-gray-50 rounded-xl font-semibold text-gray-900">
            {value}
          </div>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={value >= max}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  // 获取所有可用的地区
  const availableRegions = Array.from(
    new Set((campsData as Camp[]).map((camp) => camp.region))
  ).sort();

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8">
      <div className="space-y-8">
        {/* 基本信息区域 */}
        <div className="space-y-5">
          {/* 出发地（旅行终点，要回到的地方） */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              出发地 <span className="text-gray-400 text-xs">（旅行终点，要回到的地方）</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="例如：奥克兰"
                className="flex-1 px-4 py-3 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
              {showAutoLocation && (
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  定位
                </button>
              )}
            </div>
          </div>

          {/* 目的地（可选，旅行起点）- 简化显示 */}
          {showDestination && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                目的地（可选） <span className="text-gray-400 text-xs">（旅行起点，要去的地方）</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="flex-1 px-4 py-3 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-900"
                >
                  <option value="">不选择，系统自动推荐</option>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setShowDestination(false);
                    setDestination('');
                  }}
                  className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
          {!showDestination && (
            <button
              type="button"
              onClick={() => setShowDestination(true)}
              className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>添加目的地（可选）</span>
            </button>
          )}

          {/* 营地数量和出行天数 - 使用数字输入器 */}
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              value={campCount}
              onChange={(val) => {
                setCampCount(val);
                // 如果天数小于营地数量，自动调整天数
                if (days < val) {
                  setDays(val);
                }
              }}
              min={1}
              max={10}
              label="营地数量"
              hint={campCount === 1 ? '单个营地多天' : '多个营地'}
            />
            <NumberInput
              value={days}
              onChange={(val) => {
                // 天数不能小于营地数量
                if (val >= campCount) {
                  setDays(val);
                }
              }}
              min={campCount}
              max={30}
              label="出行天数"
              hint={campCount === 1 ? '在营地停留天数' : '总行程天数'}
            />
          </div>
          {days < campCount && (
            <p className="text-xs text-red-500 mt-1">天数不能少于营地数量</p>
          )}
        </div>

        {/* 偏好 - 简化显示，默认收起 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-600">偏好（可选）</label>
            {preferences.length > 0 && (
              <span className="text-xs text-gray-400">{preferences.length} 个已选</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleTogglePreference(option.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  preferences.includes(option.id)
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 营地选择（可选）- 默认收起，简化操作 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm text-gray-600">营地选择（可选）</label>
            <button
              type="button"
              onClick={() => setShowCampSelector(!showCampSelector)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCampSelector ? '收起' : '展开选择'}
            </button>
          </div>
          
          {showCampSelector && (
            <div className="space-y-3">
              {/* 搜索栏和收藏按钮 */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={campSearchQuery}
                    onChange={(e) => {
                      setCampSearchQuery(e.target.value);
                      setShowFavoritesOnly(false); // 搜索时取消收藏筛选
                    }}
                    placeholder="搜索营地名称、地区或标签..."
                    className="w-full pl-10 pr-4 py-3 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                {favoriteCamps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowFavoritesOnly(!showFavoritesOnly);
                      setCampSearchQuery(''); // 切换时清空搜索
                    }}
                    className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
                      showFavoritesOnly
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    <span className="text-sm">收藏中选择</span>
                  </button>
                )}
              </div>

              {/* 营地列表 */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableCamps.length > 0 ? (
                  availableCamps.map((camp) => (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => handleAddCamp(camp.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{camp.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{camp.region}</div>
                        {camp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {camp.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-500 flex-shrink-0 ml-2" />
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4">
                    {showFavoritesOnly && !campSearchQuery
                      ? '还没有收藏的营地'
                      : campSearchQuery || preferences.length > 0
                      ? '没有找到匹配的营地，请调整搜索条件或偏好'
                      : '不选择营地，系统将自动推荐'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 已选择的营地 - 标签样式 */}
        {selectedCamps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">已选择的营地</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCamps.map((camp) => (
                <div
                  key={camp.id}
                  className="group flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl"
                >
                  <span className="text-sm text-gray-900">{camp.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCamp(camp.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded"
                  >
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading || !origin}
          className="w-full bg-green-500 text-white py-4 rounded-xl font-medium hover:bg-green-600 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? '生成中...' : '开始规划'}
        </button>
      </div>
    </form>
  );
}

