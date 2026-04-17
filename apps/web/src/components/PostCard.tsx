'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, MapPin, MoreHorizontal } from 'lucide-react';
import { Post } from '@/types/post';
import Link from 'next/link';
import Image from 'next/image';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onFavorite?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onFavorite }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isFavorited, setIsFavorited] = useState(post.isFavorited);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.(post.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <Link href={`/community/${post.id}`} legacyBehavior>
      <a>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100">
        {/* 用户信息 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-semibold">
                {post.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{post.username}</div>
              <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* 营地标签 */}
        {post.campName && (
          <div className="mb-3">
            <Link
              href={`/camp/${post.campId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              <MapPin className="w-4 h-4" />
              {post.campName}
            </Link>
          </div>
        )}

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>

        {/* 内容 */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">{post.content}</p>

        {/* 图片网格 */}
        {post.images.length > 0 && (
          <div
            className={`grid gap-2 mb-4 ${
              post.images.length === 1
                ? 'grid-cols-1'
                : post.images.length === 2
                ? 'grid-cols-2'
                : post.images.length >= 3
                ? 'grid-cols-3'
                : ''
            }`}
          >
            {post.images.slice(0, 9).map((image, index) => (
              <div
                key={index}
                className={`relative ${
                  post.images.length === 1 ? 'h-64' : 'aspect-square'
                } rounded-lg overflow-hidden bg-gray-100`}
              >
                <img
                  src={image}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm';
                    placeholder.innerHTML = '<span>图片加载失败</span>';
                    target.parentElement?.appendChild(placeholder);
                  }}
                />
                {index === 8 && post.images.length > 9 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                    +{post.images.length - 9}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLike();
            }}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFavorite();
            }}
            className={`ml-auto flex items-center gap-2 transition-colors ${
              isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      </a>
    </Link>
  );
}


