import { TrendingUp, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  image?: string;
}

interface CommunityBannerProps {
  posts: Post[];
}

export default function CommunityBanner({ posts }: CommunityBannerProps) {
  if (posts.length === 0) {
    return null;
  }

  const hotPost = posts[0];

  return (
    <Link href={`/community/${hotPost.id}`}>
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white mb-6 cursor-pointer hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">社区热门</span>
        </div>
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{hotPost.title}</h3>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <span>@{hotPost.author}</span>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{hotPost.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{hotPost.comments}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}





