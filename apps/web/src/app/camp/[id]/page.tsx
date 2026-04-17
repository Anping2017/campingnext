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
  Route,
  Heart,
  Share2,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  ChevronUp,
  Calendar,
  Dog,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import CampImageGallery from '@/components/CampImageGallery';
import CampMap from '@/components/CampMap';
import CampComments from '@/components/CampComments';
import CampTags from '@/components/CampTags';
import CampFacilities from '@/components/CampFacilities';
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

// 可折叠信息块组件
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default function CampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

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
          
          // 检查是否已收藏
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
      <div className="min-h-screen bg-white pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">加载中...</div>
        </div>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen bg-white pb-20">
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

  // 限制显示数量
  const displayedFacilities = showAllFacilities ? camp.facilities : camp.facilities.slice(0, 10);
  const displayedTags = showAllTags ? camp.tags : camp.tags.slice(0, 10);
  const hasMoreFacilities = camp.facilities.length > 10;
  const hasMoreTags = camp.tags.length > 10;

  return (    <div className="min-h-screen bg-white pb-20">
      {/* 返回按钮 - 固定在顶部 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">返回</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧主要内容区 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 图片轮播 */}
            <div className="rounded-2xl overflow-hidden">
              <CampImageGallery
                images={mockCommunityImages}
                coverImage={`https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&h=600&fit=crop`}
              />
            </div>

            {/* 标题和基本信息 */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{camp.name}</h1>
                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{camp.region}</span>
                    </div>
                    {camp.address && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{camp.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-semibold">{formatRating(camp.rating)}</span>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {formatDifficulty(camp.difficulty)}
                    </span>
                    {camp.campType && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {camp.campType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 评价总结（优点和缺点） */}
            {(camp.reviewPros && camp.reviewPros.length > 0) || (camp.reviewCons && camp.reviewCons.length > 0) ? (
              <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                <h2 className="text-xl font-semibold mb-4">用户评价总结</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 优点 */}
                  {camp.reviewPros && camp.reviewPros.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium text-green-700 mb-3 flex items-center gap-2">
                        <span className="text-xl">👍</span>
                        <span>优点</span>
                      </h3>
                      <ul className="space-y-2">
                        {camp.reviewPros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* 缺点 */}
                  {camp.reviewCons && camp.reviewCons.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium text-orange-700 mb-3 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span>需要注意</span>
                      </h3>
                      <ul className="space-y-2">
                        {camp.reviewCons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* 描述 */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold mb-4">关于这个营地</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{camp.description}</p>
            </div>

            {/* 设施 - 可折叠，只显示前10个 */}
            {camp.facilities && camp.facilities.length > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold mb-4">设施</h2>
                <CampFacilities facilities={displayedFacilities} size="md" showIcons={true} layout="grid" />
                {hasMoreFacilities && (
                  <button
                    onClick={() => setShowAllFacilities(!showAllFacilities)}
                    className="mt-4 text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                  >
                    {showAllFacilities ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        收起设施
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        显示全部 {camp.facilities.length} 个设施
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* 标签 - 可折叠，只显示前10个 */}
            {camp.tags && camp.tags.length > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold mb-4">特色标签</h2>
                <CampTags tags={displayedTags} size="md" showIcons={true} />
                {hasMoreTags && (
                  <button
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="mt-4 text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                  >
                    {showAllTags ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        收起标签
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        显示全部 {camp.tags.length} 个标签
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* 联系方式 - 可折叠 */}
            {(camp.phone || camp.email || camp.website) && (
              <CollapsibleSection title="联系方式" defaultOpen={false}>
                <div className="space-y-4">
                  {camp.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">电话</div>
                        <a href={`tel:${camp.phone}`} className="text-sm text-green-600 hover:text-green-700">
                          {camp.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {camp.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">邮箱</div>
                        <a href={`mailto:${camp.email}`} className="text-sm text-green-600 hover:text-green-700">
                          {camp.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {camp.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">网站</div>
                        <a
                          href={camp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-700"
                        >
                          访问网站
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* 宠物政策 - 可折叠 */}
            {camp.petPolicy && (
              <CollapsibleSection title="宠物政策" defaultOpen={false}>
                <div className="flex items-start gap-3">
                  <Dog className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">宠物政策</div>
                    <div className="text-sm text-gray-600">
                      {camp.petPolicy === 'allowed' && '可宠'}
                      {camp.petPolicy === 'not-allowed' && '不可宠'}
                      {camp.petPolicy === 'seasonal' && '淡季可宠'}
                      {camp.petPolicy === 'conditional' && '条件限制可宠'}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* 位置信息 - 可折叠 */}
            <CollapsibleSection title="位置" defaultOpen={false}>
              <div className="space-y-4">
                {camp.address ? (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">详细地址</div>
                      <div className="text-sm text-gray-600">{camp.address}</div>
                    </div>
                  </div>
                ) : null}
                <div className="h-64 rounded-xl overflow-hidden">
                  <CampMap lat={camp.lat} lng={camp.lng} name={camp.name} />
                </div>
              </div>
            </CollapsibleSection>

            {/* 社区照片 - 可折叠 */}
            <CollapsibleSection title="社区照片" defaultOpen={false}>
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
            </CollapsibleSection>

            {/* 热门评论 - 可折叠 */}
            <CollapsibleSection title="热门评论" defaultOpen={false}>
              <CampComments comments={mockComments} />
            </CollapsibleSection>
          </div>

          {/* 右侧固定卡片（类似 Airbnb 的预订卡片） */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                {/* 价格和评分 */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(camp.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{formatRating(camp.rating)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{camp.region}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleAddToTrip}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Route className="w-5 h-5" />
                    加入行程
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleFavorite}
                      className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
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
                      className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 快速信息 */}
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">营地类型</span>
                    <span className="font-medium text-gray-900">{camp.campType || '未指定'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">难度</span>
                    <span className="font-medium text-gray-900">{formatDifficulty(camp.difficulty)}</span>
                  </div>
                  {camp.address && (
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-gray-600">位置</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%] line-clamp-2">
                        {camp.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}
