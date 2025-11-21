import { get, post, put, del } from './client';
import type { Camp, ApiResponse } from '../types';

// 获取营地列表
export async function getCamps(params?: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
}): Promise<ApiResponse<Camp[]>> {
  const queryParams = new URLSearchParams();
  if (params?.location) queryParams.append('location', params.location);
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params?.facilities) {
    params.facilities.forEach(f => queryParams.append('facilities', f));
  }
  
  const query = queryParams.toString();
  return get<Camp[]>(`/camps${query ? `?${query}` : ''}`);
}

// 获取单个营地详情
export async function getCampById(id: string): Promise<ApiResponse<Camp>> {
  return get<Camp>(`/camps/${id}`);
}

// 创建营地（管理员）
export async function createCamp(camp: Omit<Camp, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Camp>> {
  return post<Camp>('/camps', camp);
}

// 更新营地
export async function updateCamp(id: string, camp: Partial<Camp>): Promise<ApiResponse<Camp>> {
  return put<Camp>(`/camps/${id}`, camp);
}

// 删除营地
export async function deleteCamp(id: string): Promise<ApiResponse<void>> {
  return del<void>(`/camps/${id}`);
}



