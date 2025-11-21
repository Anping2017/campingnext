'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import NavBar from '@/components/NavBar';
import { Users, Plus, Compass, Filter } from 'lucide-react';
import { Post, CreatePostData } from '@/types/post';
import campsData from '@/data/camps.json';
import { Camp } from '@/types/camp';

// 模拟帖子数据
const mockPosts: Post[] = [
  {
    id: '1',
    userId: 'user1',
    username: '露营达人',
    title: 'Cathedral Cove 的日出太美了！',
    content: '早上5点起来看日出，绝对值得。设施很完善，有热水淋浴，非常推荐给大家。',
    images: [
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
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
      'https://images.unsplash.com/photo-1464822759844-d150ad6bf2c0?w=800',
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
  {
    id: '3',
    userId: 'user3',
    username: '摄影爱好者',
    title: 'Lake Tekapo 的星空太震撼了！',
    content: '晚上可以看到银河，是摄影的绝佳地点。记得带三脚架和相机。',
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800',
    ],
    campId: 'lake-tekapo',
    campName: 'Lake Tekapo Campground',
    likes: 156,
    comments: 32,
    isLiked: false,
    isFavorited: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'feed' | 'explore'>('feed');
  const [camps, setCamps] = useState<Camp[]>([]);

  // 加载帖子列表
  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        // 如果 API 失败，使用模拟数据作为后备
        setPosts(mockPosts);
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  // 加载营地列表
  const loadCamps = async () => {
    try {
      const response = await fetch('/api/camps');
      if (response.ok) {
        const data = await response.json();
        setCamps(data.camps || []);
      } else {
        // 如果 API 失败，使用 JSON 数据作为后备
        setCamps(campsData as Camp[]);
      }
    } catch (error) {
      console.error('加载营地失败:', error);
      setCamps(campsData as Camp[]);
    }
  };

  useEffect(() => {
    loadPosts();
    loadCamps();
  }, []);

  const handleCreatePost = async (data: CreatePostData) => {
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const newPost = await response.json();
        setPosts((prev) => [newPost, ...prev]);
        setIsCreateModalOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { liked } = await response.json();
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, isLiked: liked, likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1) }
              : post
          )
        );
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleFavorite = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/favorite`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { favorited } = await response.json();
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isFavorited: favorited } : post
          )
        );
      }
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  const filteredPosts =
    selectedCamp === 'all'
      ? posts
      : posts.filter((post) => post.campId === selectedCamp);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">露营家园</h1>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            发布
          </button>
        </div>

        {/* 视图切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('feed')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'feed'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            社区流
          </button>
          <button
            onClick={() => setViewMode('explore')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'explore'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Compass className="w-4 h-4" />
              探索
            </div>
          </button>
        </div>

        {/* 探索模式：按营地筛选 */}
        {viewMode === 'explore' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">按营地筛选</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCamp('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCamp === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {(camps.length > 0 ? camps : (campsData as Camp[])).map((camp) => (
                <button
                  key={camp.id}
                  onClick={() => setSelectedCamp(camp.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCamp === camp.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {camp.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 帖子列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无帖子</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onFavorite={handleFavorite}
              />
            ))
          )}
        </div>
      </div>

      {/* 发布模态框 */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      <NavBar />
    </div>
  );
}
