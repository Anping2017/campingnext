export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  title: string;
  content: string;
  images: string[];
  campId?: string;
  campName?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  images: string[];
  campId?: string;
}





