'use client';

import PostCard from '@/components/PostCard';
import { Post } from '@/types/post';
import { FileText } from 'lucide-react';

interface MyPostsProps {
  posts: Post[];
}

export default function MyPosts({ posts }: MyPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">还没有发布过帖子</p>
        <p className="text-sm text-gray-400">去社区页面分享你的露营体验吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}





