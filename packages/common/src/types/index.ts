// 营地相关类型
export interface Camp {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  };
  facilities: string[];
  rating: number;
  price: number;
  images: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 装备相关类型
export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand?: string;
  price: number;
  rating: number;
  images: string[];
  description: string;
  tags: string[];
}

export type EquipmentCategory = 
  | '帐篷'
  | '睡袋'
  | '炊具'
  | '照明'
  | '工具'
  | '其他';

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

// 社区帖子类型
export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

// 行程类型
export interface Trip {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  camps: Camp[];
  equipment: Equipment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}



