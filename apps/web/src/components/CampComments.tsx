import { Heart, MessageCircle, User } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  likes: number;
  replies: number;
  createdAt: string;
}

interface CampCommentsProps {
  comments: Comment[];
}

export default function CampComments({ comments }: CampCommentsProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>暂无评论，成为第一个评论的人吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{comment.author}</span>
                <span className="text-xs text-gray-500">{comment.createdAt}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-4 mt-3">
                <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">{comment.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{comment.replies}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


