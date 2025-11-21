export interface Camp {
  id: string;
  name: string;
  region: string;
  price: number;
  tags: string[];
  lat: number;
  lng: number;
  description: string;
  facilities: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  campType?: 'DOC' | 'Holiday Park' | 'Freedom Camping'; // 营地类型
}

export interface RecommendParams {
  location: string;
  days: number;
  budget: 'low' | 'medium' | 'high';
  people: number;
}

export interface TripRoute {
  type: 'optimal' | 'scenic' | 'budget';
  description: string;
  timeline: string[];
  equipment: string[];
  notes: string[];
}


