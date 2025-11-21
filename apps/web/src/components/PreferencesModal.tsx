'use client';

import { useState, useEffect } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { UserPreferences, preferencesUtils, defaultPreferences } from '@/types/preferences';
import campsData from '@/data/camps.json';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: UserPreferences) => void;
}

// 获取所有可用的地区
const getAllRegions = (): string[] => {
  const regions = new Set<string>();
  (campsData as any[]).forEach((camp) => {
    if (camp.region) regions.add(camp.region);
  });
  return Array.from(regions).sort();
};

// 获取所有可用的设施
const getAllFacilities = (): string[] => {
  const facilities = new Set<string>();
  (campsData as any[]).forEach((camp) => {
    if (camp.facilities) {
      camp.facilities.forEach((f: string) => facilities.add(f));
    }
  });
  return Array.from(facilities).sort();
};

export default function PreferencesModal({ isOpen, onClose, onSave }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 加载已保存的偏好
      const savedPrefs = preferencesUtils.load();
      setPreferences(savedPrefs);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    preferencesUtils.save(preferences);
    setSaved(true);
    if (onSave) {
      onSave(preferences);
    }
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  const regions = getAllRegions();
  const facilities = getAllFacilities();

  const campTypes = ['DOC', 'Holiday Park', 'Freedom Camping'];
  const tags = ['适合新手', '适合带娃', '景色好', '免费', '热门'];
  const difficultyOptions = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">偏好设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 营地类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              营地类型偏好
            </label>
            <div className="flex flex-wrap gap-2">
              {campTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      campTypes: prev.campTypes.includes(type)
                        ? prev.campTypes.filter((t) => t !== type)
                        : [...prev.campTypes, type],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    preferences.campTypes.includes(type)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 难度偏好 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              难度偏好
            </label>
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      difficulty: prev.difficulty.includes(option.value as any)
                        ? prev.difficulty.filter((d) => d !== option.value)
                        : [...prev.difficulty, option.value as any],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    preferences.difficulty.includes(option.value as any)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 地区偏好 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              偏好地区
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      favoriteRegions: prev.favoriteRegions.includes(region)
                        ? prev.favoriteRegions.filter((r) => r !== region)
                        : [...prev.favoriteRegions, region],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    preferences.favoriteRegions.includes(region)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* 设施偏好 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              必需设施
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {facilities.map((facility) => (
                <button
                  key={facility}
                  onClick={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      facilities: prev.facilities.includes(facility)
                        ? prev.facilities.filter((f) => f !== facility)
                        : [...prev.facilities, facility],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    preferences.facilities.includes(facility)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {facility}
                </button>
              ))}
            </div>
          </div>

          {/* 价格范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              价格范围（每晚）
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                placeholder="最低"
                value={preferences.priceRange?.min || ''}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    priceRange: {
                      min: Number(e.target.value) || 0,
                      max: prev.priceRange?.max || 100,
                    },
                  }));
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                placeholder="最高"
                value={preferences.priceRange?.max || ''}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    priceRange: {
                      min: prev.priceRange?.min || 0,
                      max: Number(e.target.value) || 100,
                    },
                  }));
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  setPreferences((prev) => ({ ...prev, priceRange: null }));
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                不限
              </button>
            </div>
          </div>

          {/* 标签偏好 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              标签偏好
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter((t) => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    preferences.tags.includes(tag)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 个人信息（用于行程规划） */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              个人信息（用于行程规划）
            </label>
            <div className="space-y-4">
              {/* 出行人数 */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">出行人数</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreferences((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          people: Math.max(1, prev.personalInfo.people - 1),
                        },
                      }));
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold">
                    {preferences.personalInfo.people}
                  </span>
                  <button
                    onClick={() => {
                      setPreferences((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          people: prev.personalInfo.people + 1,
                        },
                      }));
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 是否有小孩 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">是否有小孩</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.personalInfo.hasChildren}
                    onChange={(e) => {
                      setPreferences((prev) => ({
                        ...prev,
                        personalInfo: {
                          ...prev.personalInfo,
                          hasChildren: e.target.checked,
                        },
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* 露营经验 */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">露营经验</label>
                <div className="flex gap-2">
                  {[
                    { value: 'beginner', label: '新手' },
                    { value: 'intermediate', label: '有经验' },
                    { value: 'expert', label: '专家' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPreferences((prev) => ({
                          ...prev,
                          personalInfo: {
                            ...prev.personalInfo,
                            experience: option.value as any,
                          },
                        }));
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preferences.personalInfo.experience === option.value
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Save className="w-5 h-5" />
            {saved ? '已保存' : '保存偏好'}
          </button>
        </div>
      </div>
    </div>
  );
}

