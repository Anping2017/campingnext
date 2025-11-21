'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Bookmark, MapPin, Share2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Post } from '@/types/post';
import Link from 'next/link';

// 模拟帖子数据
const mockPost: Post = {
  id: '1',
  userId: 'user1',
  username: '露营达人',
  title: 'Cathedral Cove 的日出太美了！',
  content: `早上5点起来看日出，绝对值得。设施很完善，有热水淋浴，非常推荐给大家。

这次露营体验真的很棒，营地位置绝佳，就在海边。晚上听着海浪声入睡，早上被日出唤醒，感觉整个人都被治愈了。

建议：
1. 提前预订，旺季很抢手
2. 带好防蚊用品
3. 早上看日出记得多穿点，海边风大

总之，强烈推荐！`,
  images: [
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
  ],
  campId: 'cathedral-cove',
  campName: 'Cathedral Cove Campsite',
  likes: 128,
  comments: 23,
  isLiked: false,
  isFavorited: false,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    // TODO: 从 API 获取帖子详情
    setPost(mockPost);
    setIsLiked(mockPost.isLiked);
    setIsFavorited(mockPost.isFavorited);
    setLikes(mockPost.likes);
  }, [params.id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    // TODO: 调用 API
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: 调用 API
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        {/* 帖子内容 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* 用户信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold text-lg">
                  {post.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{post.username}</div>
                <div className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="text-gray-400 hover:text-gray-600"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* 营地标签 */}
          {post.campName && (
            <div className="mb-4">
              <Link
                href={`/camp/${post.campId}`}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <MapPin className="w-5 h-5" />
                {post.campName}
              </Link>
            </div>
          )}

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* 内容 */}
          <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
            {post.content}
          </div>

          {/* 图片 */}
          {post.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {post.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={image}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white';
                      placeholder.innerHTML = '<span>图片加载失败</span>';
                      target.parentElement?.appendChild(placeholder);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likes}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium">{post.comments}</span>
            </button>
            <button
              onClick={handleFavorite}
              className={`ml-auto flex items-center gap-2 transition-colors ${
                isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
              }`}
            >
              <Bookmark className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* 评论区域（占位） */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">评论 ({post.comments})</h2>
          <div className="text-center py-8 text-gray-500">
            评论功能开发中...
          </div>
        </div>
      </div>

      <NavBar />
    </div>
  );
}


