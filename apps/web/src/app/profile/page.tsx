'use client';

import { useState, useEffect } from 'react';
import ProfileTabs from '@/components/ProfileTabs';
import FavoriteCamps from '@/components/FavoriteCamps';
import MyPosts from '@/components/MyPosts';
import MyTrips from '@/components/MyTrips';
import PreferencesSettings from '@/components/PreferencesSettings';
import ProfileInfo from '@/components/ProfileInfo';
import NavBar from '@/components/NavBar';
import { User } from 'lucide-react';
import { Camp } from '@/types/camp';
import { Post } from '@/types/post';
import campsData from '@/data/camps.json';

// 模拟数据
const mockFavoriteCamps: Camp[] = [
  (campsData as Camp[]).find((c: Camp) => c.id === 'cathedral-cove') as Camp,
  (campsData as Camp[]).find((c: Camp) => c.id === 'lake-tekapo') as Camp,
].filter(Boolean);

const mockMyPosts: Post[] = [
  {
    id: 'my-post-1',
    userId: 'current-user',
    username: '我',
    title: '我的第一次露营体验',
    content: '第一次露营就选择了 Cathedral Cove，体验太棒了！',
    images: ['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800'],
    campId: 'cathedral-cove',
    campName: 'Cathedral Cove Campsite',
    likes: 45,
    comments: 8,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMyTrips = [
  {
    id: 'trip-1',
    origin: 'Auckland',
    days: 2,
    camps: [
      { id: 'cathedral-cove', name: 'Cathedral Cove Campsite' },
      { id: 'lake-tekapo', name: 'Lake Tekapo Campground' },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface TripPlan {
  id: string;
  origin: string;
  destination?: string;
  days: number;
  dailyPlans: any[];
  createdAt: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('camps');
  const [favoriteCamps, setFavoriteCamps] = useState<Camp[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myTrips, setMyTrips] = useState<TripPlan[]>([]);

  // 加载行程数据
  const loadTrips = () => {
    const saved = localStorage.getItem('savedTrips');
    if (saved) {
      try {
        const trips: TripPlan[] = JSON.parse(saved);
        setMyTrips(trips);
      } catch (error) {
        console.error('加载行程失败:', error);
        setMyTrips([]);
      }
    } else {
      setMyTrips([]);
    }
  };

  useEffect(() => {
    // 从 localStorage 加载收藏的营地
    const favorites = localStorage.getItem('favoriteCamps');
    if (favorites) {
      try {
        const favoriteIds = JSON.parse(favorites);
        const camps = favoriteIds
          .map((id: string) => (campsData as Camp[]).find((c: Camp) => c.id === id))

          .filter((c: Camp | undefined): c is Camp => c !== undefined);
        setFavoriteCamps(camps);
      } catch (error) {
        console.error('加载收藏营地失败:', error);
        setFavoriteCamps(mockFavoriteCamps);
      }
    } else {
      setFavoriteCamps(mockFavoriteCamps);
    }
    
    // 加载行程数据
    loadTrips();
    
    // TODO: 从 API 获取帖子数据
    setMyPosts(mockMyPosts);
  }, []);

  // 监听 localStorage 变化（用于跨页面同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedTrips') {
        loadTrips();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'camps':
        return <FavoriteCamps camps={favoriteCamps} />;
      case 'posts':
        return <MyPosts posts={myPosts} />;
      case 'trips':
        return <MyTrips trips={myTrips} onTripsChange={setMyTrips} />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'profile':
        return <ProfileInfo />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">我的露营档案</h1>
          </div>
        </div>

        {/* 标签页 */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 内容区域 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderTabContent()}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
