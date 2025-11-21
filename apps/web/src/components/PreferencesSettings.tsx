'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import PreferencesModal from './PreferencesModal';
import { UserPreferences, preferencesUtils } from '@/types/preferences';

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 加载已保存的偏好
    const savedPrefs = preferencesUtils.load();
    setPreferences(savedPrefs);
  }, []);

  const handleSave = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!preferences) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 偏好摘要 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">营地类型偏好</h3>
          <div className="flex flex-wrap gap-2">
            {preferences.campTypes.length > 0 ? (
              preferences.campTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {type}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">未设置</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">难度偏好</h3>
          <div className="flex flex-wrap gap-2">
            {preferences.difficulty.length > 0 ? (
              preferences.difficulty.map((diff) => (
                <span
                  key={diff}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">未设置</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">偏好地区</h3>
          <div className="flex flex-wrap gap-2">
            {preferences.favoriteRegions.length > 0 ? (
              preferences.favoriteRegions.map((region) => (
                <span
                  key={region}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {region}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">未设置</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">个人信息</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>出行人数: {preferences.personalInfo.people} 人</div>
            <div>是否有小孩: {preferences.personalInfo.hasChildren ? '是' : '否'}</div>
            <div>
              露营经验:{' '}
              {preferences.personalInfo.experience === 'beginner'
                ? '新手'
                : preferences.personalInfo.experience === 'intermediate'
                ? '有经验'
                : '专家'}
            </div>
          </div>
        </div>
      </div>

      {/* 编辑按钮 */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        编辑偏好设置
      </button>

      {/* 偏好设置弹窗 */}
      <PreferencesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
}


