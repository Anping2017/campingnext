'use client';

import { useState } from 'react';
import { User, Mail, Calendar, Save } from 'lucide-react';

interface ProfileInfoProps {
  initialData?: {
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    joinDate: string;
  };
}

export default function ProfileInfo({
  initialData = {
    username: '露营爱好者',
    email: 'user@example.com',
    bio: '',
    joinDate: new Date().toISOString(),
  },
}: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: initialData.username,
    email: initialData.email,
    bio: initialData.bio || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // TODO: 调用 API 保存资料
    try {
      const response = await fetch('/api/profile/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 头像和基本信息 */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <User className="w-12 h-12 text-green-600" />
        </div>
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              className="text-2xl font-bold text-gray-900 mb-2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {formData.username}
            </h2>
          )}
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              加入于{' '}
              {new Date(initialData.joinDate).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 邮箱 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Mail className="w-4 h-4" />
          邮箱
        </label>
        {isEditing ? (
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        ) : (
          <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
            {formData.email}
          </div>
        )}
      </div>

      {/* 个人简介 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          个人简介
        </label>
        {isEditing ? (
          <textarea
            value={formData.bio}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder="介绍一下自己..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        ) : (
          <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 min-h-[100px]">
            {formData.bio || '还没有个人简介'}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  username: initialData.username,
                  email: initialData.email,
                  bio: initialData.bio || '',
                });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Save className="w-5 h-5" />
              {saved ? '已保存' : '保存'}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            编辑资料
          </button>
        )}
      </div>
    </div>
  );
}





