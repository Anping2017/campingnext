'use client';

// 强制动态渲染，避免静态生成时的 Hook 错误
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import CampCard from '@/components/CampCard';
import PostCard from '@/components/PostCard';
import NavBar from '@/components/NavBar';
import OnboardingModal, { onboardingUtils, OnboardingData } from '@/components/OnboardingModal';
import { Camp } from '@/types/camp';
import { Post } from '@/types/post';
import campsData from '@/data/camps.json';
import Link from 'next/link';
import { 
  Backpack, 
  Map, 
  Compass, 
  TrendingUp, 
  MapPin, 
  Star,
  ArrowRight,
  Heart
} from 'lucide-react';

// 模拟热门帖子数据
const mockHotPosts: Post[] = [
  {
    id: '1',
    userId: 'user1',
    username: '露营达人',
    title: 'Cathedral Cove 的日出太美了！',
    content: '早上5点起来看日出，绝对值得。设施很完善，有热水淋浴，非常推荐给大家。',
    images: [
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    ],
    campId: 'cathedral-cove',
    campName: 'Cathedral Cove Campsite',
    likes: 128,
    comments: 23,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user2',
    username: '户外爱好者',
    title: 'Tongariro 徒步攻略分享',
    content: '新西兰最著名的单日徒步路线，穿越活火山景观。难度中等，建议带足水和食物。',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    ],
    campId: 'tongariro-alpine',
    campName: 'Tongariro Alpine Crossing',
    likes: 95,
    comments: 15,
    isLiked: true,
    isFavorited: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function Home() {
  const [nearbyCamps, setNearbyCamps] = useState<Camp[]>([]);
  const [hotCamps, setHotCamps] = useState<Camp[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>(mockHotPosts);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    // 检查是否已完成引导
    const completed = onboardingUtils.isCompleted();
    const data = onboardingUtils.load();
    
    if (!completed) {
      // 首次使用，显示引导
      setShowOnboarding(true);
    } else if (data) {
      setOnboardingData(data);
    }

    // 加载推荐营地（使用个性化数据）
    loadPersonalizedCamps(data);
  }, []);

  const loadPersonalizedCamps = async (onboarding: OnboardingData | null) => {
    try {
      // 从 API 加载营地数据
      const response = await fetch('/api/camps');
      let allCamps: Camp[] = [];
      
      if (response.ok) {
        const data = await response.json();
        allCamps = data.camps || [];
      } else {
        // API 失败时，使用 JSON 数据作为后备
        allCamps = campsData as Camp[];
      }
      
      let filtered = [...allCamps];

    // 根据引导数据进行个性化筛选
    if (onboarding) {
      // 营地类型筛选
      if (onboarding.campTypes.length > 0) {
        filtered = filtered.filter((camp) => {
          const campType = (camp as any).campType;
          return campType && onboarding.campTypes.includes(campType);
        });
      }

      // 如果带宠物，优先推荐允许宠物的营地（可以根据tags判断）
      // 这里简化处理，如果有相关标签则优先
    }

      // 附近推荐：选择评分高的前3个
      const nearby = [...filtered]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      setNearbyCamps(nearby.length > 0 ? nearby : allCamps.slice(0, 3));

      // 本周最热门：按评分和价格综合
      const hot = [...filtered]
        .sort((a, b) => {
          const scoreA = a.rating * 10 - a.price;
          const scoreB = b.rating * 10 - b.price;
          return scoreB - scoreA;
        })
        .slice(0, 3);
      setHotCamps(hot.length > 0 ? hot : allCamps.slice(0, 3));
    } catch (error) {
      console.error('加载营地失败:', error);
      // 使用 JSON 数据作为后备
      const allCamps = campsData as Camp[];
      setNearbyCamps(allCamps.slice(0, 3));
      setHotCamps(allCamps.slice(0, 3));
    }
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    setOnboardingData(data);
    setShowOnboarding(false);
    // 重新加载个性化推荐
    loadPersonalizedCamps(data);
  };

  return (
    <>
      {/* 首次使用引导 */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 大标题 */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            今天想去哪儿浪？
          </h1>
          <p className="text-gray-600 text-lg">新西兰露营，说走就走</p>
        </div>

        {/* 3个大入口卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link href="/explore">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <Backpack className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">我要找营地</h3>
                  <p className="text-sm text-gray-600">发现最适合你的露营地</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </div>
          </Link>

          <Link href="/community">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Map className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">我要看别人去哪儿</h3>
                  <p className="text-sm text-gray-600">看看大家都在哪里露营</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </Link>

          <Link href="/trip">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Compass className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">帮我规划一下</h3>
                  <p className="text-sm text-gray-600">AI 智能生成你的行程</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* 立即价值感内容 */}
        <div className="space-y-8">
          {/* 本周热门帖子 */}
          {hotPosts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900">本周热门</h2>
                </div>
                <Link 
                  href="/community"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  查看更多
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotPosts.slice(0, 2).map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/community/${post.id}`} legacyBehavior>
                      <a>
                        {post.images && post.images.length > 0 && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={post.images[0]}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-gray-700">
                              <Heart className="w-3 h-3 text-red-500" />
                              {post.likes}
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>@{post.username}</span>
                            <span>{post.campName}</span>
                          </div>
                        </div>
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 我附近推荐的营地 */}
          {nearbyCamps.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">附近推荐</h2>
                </div>
                <Link 
                  href="/explore"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  查看更多
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nearbyCamps.map((camp) => (
                  <CampCard key={camp.id} camp={camp} />
                ))}
              </div>
            </section>
          )}

          {/* 本周最热门的营地 */}
          {hotCamps.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <h2 className="text-2xl font-bold text-gray-900">本周最热门</h2>
                </div>
                <Link 
                  href="/explore"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  查看更多
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hotCamps.map((camp) => (
                  <CampCard key={camp.id} camp={camp} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <NavBar />
    </div>
    </>
  );
}
