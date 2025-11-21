'use client';

import { Heart, FileText, Route, Settings, User } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'camps', label: '收藏营地', icon: Heart },
  { id: 'posts', label: '我的贴文', icon: FileText },
  { id: 'trips', label: '我的行程', icon: Route },
  { id: 'preferences', label: '偏好设定', icon: Settings },
  { id: 'profile', label: '基本资料', icon: User },
];

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
