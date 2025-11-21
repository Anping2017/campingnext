// 用户偏好类型定义
export interface UserPreferences {
  // 营地类型偏好
  campTypes: string[]; // ['DOC', 'Holiday Park', 'Freedom Camping']
  
  // 难度偏好
  difficulty: ('easy' | 'medium' | 'hard')[]; // 可多选
  
  // 地区偏好
  favoriteRegions: string[];
  
  // 设施偏好
  facilities: string[]; // ['厕所', '饮用水', '停车场', '淋浴', '电源']
  
  // 价格偏好
  priceRange: {
    min: number;
    max: number;
  } | null;
  
  // 标签偏好（用于发现营地）
  tags: string[]; // ['适合新手', '适合带娃', '景色好', '免费']
  
  // 个人信息（用于行程规划）
  personalInfo: {
    people: number; // 出行人数
    hasChildren: boolean; // 是否有小孩
    hasPets?: boolean; // 是否带宠物（从引导数据同步）
    experience: 'beginner' | 'intermediate' | 'expert'; // 露营经验
  };
  
  // 通知设置
  notifications: boolean;
}

// 默认偏好
export const defaultPreferences: UserPreferences = {
  campTypes: [],
  difficulty: [],
  favoriteRegions: [],
  facilities: [],
  priceRange: null,
  tags: [],
  personalInfo: {
    people: 2,
    hasChildren: false,
    experience: 'beginner',
  },
  notifications: true,
};

// 偏好存储键
export const PREFERENCES_STORAGE_KEY = 'userPreferences';

// 偏好工具函数
export const preferencesUtils = {
  // 保存偏好到 localStorage
  save: (preferences: UserPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('保存偏好失败:', error);
    }
  },

  // 从 localStorage 加载偏好
  load: (): UserPreferences => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 合并默认值，确保新字段存在
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('加载偏好失败:', error);
    }
    return defaultPreferences;
  },

  // 重置为默认偏好
  reset: () => {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    return defaultPreferences;
  },
};

