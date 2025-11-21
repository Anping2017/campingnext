'use client';

import { useState } from 'react';
import { Sparkles, Heart, Users, X } from 'lucide-react';

export interface OnboardingData {
  campTypes: string[]; // ['DOC', 'Holiday Park', 'Freedom Camping']
  people: number;
  completed: boolean;
}

const ONBOARDING_STORAGE_KEY = 'onboardingData';

export const onboardingUtils = {
  save: (data: OnboardingData) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存引导数据失败:', error);
    }
  },

  load: (): OnboardingData | null => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('加载引导数据失败:', error);
    }
    return null;
  },

  isCompleted: (): boolean => {
    const data = onboardingUtils.load();
    return data?.completed === true;
  },
};

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [campTypes, setCampTypes] = useState<string[]>([]);
  const [people, setPeople] = useState(2);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // 完成引导
      const data: OnboardingData = {
        campTypes,
        people,
        completed: true,
      };
      onboardingUtils.save(data);
      
      // 同步到偏好系统
      import('@/types/preferences').then(({ preferencesUtils }) => {
        const currentPrefs = preferencesUtils.load();
        const updatedPrefs = {
          ...currentPrefs,
          campTypes: campTypes.length > 0 ? campTypes : currentPrefs.campTypes,
          personalInfo: {
            ...currentPrefs.personalInfo,
            people: people,
          },
        };
        preferencesUtils.save(updatedPrefs);
      }).catch(() => {
        // 如果导入失败，忽略
      });
      
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleCampType = (type: string) => {
    setCampTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* 进度指示 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= step ? 'bg-green-600 w-8' : 'bg-gray-200 w-2'
              }`}
            />
          ))}
        </div>

        {/* Step 1: 露营类型 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                你更喜欢哪种类型的营地？
              </h2>
              <p className="text-gray-600 text-sm">可以多选哦</p>
            </div>
            <div className="space-y-3">
              {['DOC', 'Holiday Park', 'Freedom Camping'].map((type) => (
                <button
                  key={type}
                  onClick={() => toggleCampType(type)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    campTypes.includes(type)
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{type}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {type === 'DOC' && '新西兰环保部管理的国家公园营地'}
                    {type === 'Holiday Park' && '设施完善的商业营地'}
                    {type === 'Freedom Camping' && '自由露营，亲近自然'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 出行人数 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                通常几个人一起出行？
              </h2>
              <p className="text-gray-600 text-sm">我们可以为你推荐合适的营地</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPeople(Math.max(1, people - 1))}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium"
              >
                −
              </button>
              <div className="text-4xl font-bold text-gray-900 w-16 text-center">
                {people}
              </div>
              <button
                onClick={() => setPeople(people + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium"
              >
                +
              </button>
            </div>
            <div className="text-center text-sm text-gray-500">
              人
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={step === 1 && campTypes.length === 0}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              step === 1 && campTypes.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {step === 2 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}

