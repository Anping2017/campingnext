'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import campsData from '@/data/camps.json';
import { Camp } from '@/types/camp';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Star,
  Users,
  Route,
  Heart,
  Share2,
  Calendar,
  Car,
  WashingMachine,
  Tent,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import CampImageGallery from '@/components/CampImageGallery';
import CampMap from '@/components/CampMap';
import CampComments from '@/components/CampComments';
import AISummary from '@/components/AISummary';
import { formatPrice, formatDifficulty, formatRating } from '@/utils/format';
import Link from 'next/link';

// 模拟社区照片
const mockCommunityImages = [
  'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
];

// 模拟热门评论
const mockComments = [
  {
    id: '1',
    author: '露营达人',
    content: '这里的日出太美了！早上5点起来看日出，绝对值得。设施很完善，有热水淋浴，非常推荐。',
    likes: 45,
    replies: 8,
    createdAt: '2天前',
  },
  {
    id: '2',
    author: '户外爱好者',
    content: '适合新手，路很好走。建议带好防蚊用品，晚上蚊子比较多。',
    likes: 32,
    replies: 5,
    createdAt: '5天前',
  },
  {
    id: '3',
    author: '摄影爱好者',
    content: '星空太震撼了！晚上可以看到银河，是摄影的绝佳地点。',
    likes: 28,
    replies: 3,
    createdAt: '1周前',
  },
];

export default function CampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const loadCamp = async () => {
      const campId = params.id as string;
      setLoading(true);
      
      try {
        // 从 API 加载营地数据
        const response = await fetch(`/api/camps/${campId}`);
        if (response.ok) {
          const campData = await response.json();
          setCamp(campData);
          
          // 检查是否已收藏（仍使用 localStorage，因为收藏功能在 user_favorites 表中）
          const favorites = localStorage.getItem('favoriteCamps');
          if (favorites) {
            const favoriteIds = JSON.parse(favorites);
            setIsFavorited(favoriteIds.includes(campId));
          }
        } else {
          // API 失败时，使用 JSON 数据作为后备
          const foundCamp = (campsData as Camp[]).find((c: Camp) => c.id === campId);
          setCamp(foundCamp || null);
          
          const favorites = localStorage.getItem('favoriteCamps');
          if (favorites && foundCamp) {
            const favoriteIds = JSON.parse(favorites);
            setIsFavorited(favoriteIds.includes(campId));
          }
        }
      } catch (error) {
        console.error('加载营地失败:', error);
        // 使用 JSON 数据作为后备
        const foundCamp = (campsData as Camp[]).find((c: Camp) => c.id === campId);
        setCamp(foundCamp || null);
      } finally {
        setLoading(false);
      }
    };

    loadCamp();
  }, [params.id]);

  const handleFavorite = () => {
    if (!camp) return;
    
    const favorites = localStorage.getItem('favoriteCamps');
    const favoriteIds = favorites ? JSON.parse(favorites) : [];
    
    if (isFavorited) {
      // 取消收藏
      const updated = favoriteIds.filter((id: string) => id !== camp.id);
      localStorage.setItem('favoriteCamps', JSON.stringify(updated));
      setIsFavorited(false);
    } else {
      // 添加收藏
      if (!favoriteIds.includes(camp.id)) {
        favoriteIds.push(camp.id);
        localStorage.setItem('favoriteCamps', JSON.stringify(favoriteIds));
      }
      setIsFavorited(true);
    }
  };

  const handleAddToTrip = () => {
    if (camp) {
      // 保存到 localStorage，作为智能推荐的重要参数
      const selectedCamps = localStorage.getItem('selectedCampsForTrip');
      const camps = selectedCamps ? JSON.parse(selectedCamps) : [];
      
      // 如果还没有添加过，则添加
      if (!camps.includes(camp.id)) {
        camps.push(camp.id);
        localStorage.setItem('selectedCampsForTrip', JSON.stringify(camps));
      }
      
      // 跳转到行程规划页面
      router.push(`/trip?campId=${camp.id}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${camp?.name} - Nomad NZ`,
          text: `推荐这个超棒的露营地：${camp?.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消');
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">加载中...</div>
        </div>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">找不到该营地</p>
            <Link href="/explore" className="text-green-600 hover:text-green-700">
              返回发现页面
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const campingTypes = camp.tags.includes('海边') ? ['帐篷', '房车'] : ['帐篷', '徒步'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {/* 营地封面图和基本信息 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <CampImageGallery
            images={mockCommunityImages}
            coverImage={`https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&h=600&fit=crop`}
          />

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{camp.name}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-5 h-5" />
                  <span>{camp.region}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-medium">{formatRating(camp.rating)}</span>
                  </div>
                  <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    {formatDifficulty(camp.difficulty)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">{camp.description}</p>

            {/* 基础信息卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">费用</div>
                  <div className="font-semibold text-sm">{formatPrice(camp.price)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <WashingMachine className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">厕所</div>
                  <div className="font-semibold text-sm">
                    {camp.facilities.includes('厕所') ? '有' : '无'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">车位</div>
                  <div className="font-semibold text-sm">
                    {camp.facilities.includes('停车场') ? '有' : '无'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tent className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">露营方式</div>
                  <div className="font-semibold text-sm">{campingTypes.join('、')}</div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToTrip}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Route className="w-5 h-5" />
                加入行程
              </button>
              <button
                onClick={handleFavorite}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isFavorited
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={handleShare}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI 摘要 */}
        <div className="mb-6">
          <AISummary campId={camp.id} campName={camp.name} />
        </div>

        {/* 真实照片 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">真实照片</h2>
          <div className="grid grid-cols-3 gap-2">
            {mockCommunityImages.map((image, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={image}
                  alt={`社区照片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">来自社区用户分享</p>
        </div>

        {/* 路线导航 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">路线导航</h2>
          <CampMap lat={camp.lat} lng={camp.lng} name={camp.name} />
        </div>

        {/* 热门评论 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">热门评论</h2>
          <CampComments comments={mockComments} />
        </div>

        {/* 标签和设施 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {camp.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">设施</h3>
            <div className="flex flex-wrap gap-2">
              {camp.facilities.map((facility) => (
                <span
                  key={facility}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}
