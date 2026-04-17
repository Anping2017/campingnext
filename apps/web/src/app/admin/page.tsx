'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Users, FileText, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">管理概览</h1>
        <p className="text-gray-600">欢迎，{user?.email}</p>
      </div>

      {/* 管理功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">用户管理</h3>
              <p className="text-sm text-gray-600">查看、编辑、删除用户</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/posts"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">帖子管理</h3>
              <p className="text-sm text-gray-600">审核、编辑、删除帖子</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/camps"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">营地管理</h3>
              <p className="text-sm text-gray-600">添加、编辑、删除营地</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}









