import {
  Droplet,
  Car,
  Bath,
  ChefHat,
  Zap,
  Wifi,
  Store,
  Shirt,
  Flame,
  Trash2,
  Tent,
  Mountain,
  Waves,
  TreePine,
  Baby,
  Users,
  User,
  Footprints,
  Fish,
  Ship,
  Star,
  UserCircle,
  Camera,
  Volume2,
  Trophy,
  Award,
  MapPin,
  Sun,
  Moon,
  Cloud,
  Wind,
  Umbrella,
  Shield,
  Lock,
  Heart,
  Sparkles,
  Building2,
  Coffee,
  Film,
  Gamepad2,
  CircleDot,
  Activity,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// 设施定义（带图标和描述）
export interface FacilityOption {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  category: 'basic' | 'comfort' | 'recreation';
}

export const FACILITIES: FacilityOption[] = [
  // 基础设施
  { id: 'toilet', label: '厕所', icon: Building2, category: 'basic', description: '公共厕所' },
  { id: 'water', label: '饮用水', icon: Droplet, category: 'basic', description: '可饮用的水源' },
  { id: 'parking', label: '停车场', icon: Car, category: 'basic', description: '车辆停放区域' },
  { id: 'trash', label: '垃圾处理', icon: Trash2, category: 'basic', description: '垃圾回收设施' },
  { id: 'shower', label: '淋浴', icon: Bath, category: 'basic', description: '淋浴设施' },
  { id: 'kitchen', label: '厨房', icon: ChefHat, category: 'basic', description: '烹饪设施' },
  { id: 'power', label: '电源', icon: Zap, category: 'basic', description: '电力供应' },
  
  // 舒适设施
  { id: 'wifi', label: 'WiFi', icon: Wifi, category: 'comfort', description: '无线网络' },
  { id: 'laundry', label: '洗衣房', icon: Shirt, category: 'comfort', description: '洗衣设施' },
  { id: 'hot-spring', label: '温泉', icon: Droplet, category: 'comfort', description: '温泉设施' },
  { id: 'spa', label: '桑拿', icon: Heart, category: 'comfort', description: '桑拿设施' },
  { id: 'cafe', label: '咖啡厅', icon: Coffee, category: 'comfort', description: '咖啡厅' },
  { id: 'pizza-oven', label: '披萨炉', icon: Flame, category: 'comfort', description: '披萨烤炉' },
  { id: 'bbq', label: '烧烤架', icon: Flame, category: 'comfort', description: '烧烤设备' },
  { id: 'fire-pit', label: '篝火区', icon: Flame, category: 'comfort', description: '篝火场地' },
  
  // 娱乐设施
  { id: 'playground', label: '游乐场', icon: Sparkles, category: 'recreation', description: '儿童游乐设施' },
  { id: 'pool', label: '泳池', icon: Waves, category: 'recreation', description: '游泳池' },
  { id: 'trampoline', label: '蹦床', icon: CircleDot, category: 'recreation', description: '蹦床设施' },
  { id: 'media-room', label: '影音室', icon: Film, category: 'recreation', description: '影音娱乐室' },
  { id: 'game-room', label: '游戏室', icon: Gamepad2, category: 'recreation', description: '游戏娱乐室' },
  { id: 'tennis-court', label: '网球场', icon: Activity, category: 'recreation', description: '网球场' },
  { id: 'basketball-court', label: '篮球场', icon: Activity, category: 'recreation', description: '篮球场' },
  { id: 'table-tennis', label: '乒乓球台', icon: Activity, category: 'recreation', description: '乒乓球台' },
  { id: 'volleyball-court', label: '排球场', icon: Activity, category: 'recreation', description: '排球场' },
  
  // 其他
  { id: 'shop', label: '商店', icon: Store, category: 'comfort', description: '便利店或商店' },
  { id: 'reception', label: '接待处', icon: MapPin, category: 'basic', description: '信息咨询处' },
];

// 标签定义（带图标和描述）
export interface TagOption {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  category: 'location' | 'activity' | 'suitability' | 'feature';
}

export const TAGS: TagOption[] = [
  // 地理位置
  { id: 'beach', label: '海边', icon: Waves, category: 'location', description: '靠近海岸' },
  { id: 'mountain', label: '山区', icon: Mountain, category: 'location', description: '山地环境' },
  { id: 'lake', label: '湖边', icon: Waves, category: 'location', description: '靠近湖泊' },
  { id: 'forest', label: '森林', icon: TreePine, category: 'location', description: '森林环境' },
  { id: 'river', label: '河边', icon: Waves, category: 'location', description: '靠近河流' },
  
  // 活动类型
  { id: 'hiking', label: '适合徒步', icon: Footprints, category: 'activity', description: '有徒步路线' },
  { id: 'fishing', label: '适合钓鱼', icon: Fish, category: 'activity', description: '可进行钓鱼' },
  { id: 'kayaking', label: '适合皮划艇', icon: Ship, category: 'activity', description: '可进行水上运动' },
  { id: 'stargazing', label: '适合观星', icon: Star, category: 'activity', description: '观星条件好' },
  { id: 'photography', label: '适合摄影', icon: Camera, category: 'activity', description: '风景优美' },
  
  // 适合人群
  { id: 'beginner', label: '适合新手', icon: Baby, category: 'suitability', description: '初学者友好' },
  { id: 'family', label: '适合家庭', icon: Users, category: 'suitability', description: '家庭友好' },
  { id: 'solo', label: '适合独行', icon: UserCircle, category: 'suitability', description: '独自旅行友好' },
  { id: 'group', label: '适合团体', icon: Users, category: 'suitability', description: '团体活动' },
  
  // 特色
  { id: 'scenic', label: '景色好', icon: Camera, category: 'feature', description: '风景优美' },
  { id: 'quiet', label: '安静', icon: Volume2, category: 'feature', description: '环境安静' },
  { id: 'challenging', label: '挑战', icon: Trophy, category: 'feature', description: '具有挑战性' },
  { id: 'heritage', label: '历史遗迹', icon: Award, category: 'feature', description: '历史遗迹' },
  { id: 'sunny', label: '阳光充足', icon: Sun, category: 'feature', description: '日照充足' },
  { id: 'shady', label: '有树荫', icon: TreePine, category: 'feature', description: '有遮阴' },
  { id: 'windy', label: '多风', icon: Wind, category: 'feature', description: '风力较大' },
  { id: 'sheltered', label: '有遮挡', icon: Umbrella, category: 'feature', description: '有避风处' },
];

// 从标签 ID 获取标签选项
export function getTagById(id: string): TagOption | undefined {
  return TAGS.find(tag => tag.id === id);
}

// 从设施 ID 获取设施选项
export function getFacilityById(id: string): FacilityOption | undefined {
  return FACILITIES.find(facility => facility.id === id);
}

// 根据中文标签名查找标签（用于兼容旧数据）
export function findTagByLabel(label: string): TagOption | undefined {
  return TAGS.find(tag => tag.label === label);
}

// 根据中文设施名查找设施（用于兼容旧数据）
export function findFacilityByLabel(label: string): FacilityOption | undefined {
  return FACILITIES.find(facility => facility.label === label);
}

// 获取标签标签（支持 ID 或标签文本）
export function getTagLabel(idOrLabel: string): string {
  const tag = getTagById(idOrLabel) || findTagByLabel(idOrLabel);
  return tag ? tag.label : idOrLabel;
}

// 获取设施标签（支持 ID 或标签文本）
export function getFacilityLabel(idOrLabel: string): string {
  const facility = getFacilityById(idOrLabel) || findFacilityByLabel(idOrLabel);
  return facility ? facility.label : idOrLabel;
}

// 自动推断标签（根据描述、地址、类型等）
export function inferTags(
  name: string,
  description: string,
  address: string,
  facilities: string[],
  type?: string
): string[] {
  const inferredTags: string[] = [];
  const searchText = `${name} ${description} ${address}`.toLowerCase();
  const facilityText = facilities.join(' ').toLowerCase();

  // 地理位置标签
  if (searchText.includes('beach') || searchText.includes('coast') || searchText.includes('海边') || searchText.includes('海岸')) {
    inferredTags.push('beach');
  }
  if (searchText.includes('mountain') || searchText.includes('alpine') || searchText.includes('山') || searchText.includes('峰')) {
    inferredTags.push('mountain');
  }
  if (searchText.includes('lake') || searchText.includes('湖')) {
    inferredTags.push('lake');
  }
  if (searchText.includes('forest') || searchText.includes('wood') || searchText.includes('森林') || searchText.includes('树林')) {
    inferredTags.push('forest');
  }
  if (searchText.includes('river') || searchText.includes('河')) {
    inferredTags.push('river');
  }

  // 活动标签
  if (searchText.includes('hiking') || searchText.includes('walking') || searchText.includes('trail') || searchText.includes('徒步') || searchText.includes('步道')) {
    inferredTags.push('hiking');
  }
  if (searchText.includes('fishing') || searchText.includes('fish') || searchText.includes('钓鱼')) {
    inferredTags.push('fishing');
  }
  if (searchText.includes('kayak') || searchText.includes('canoe') || searchText.includes('paddle') || searchText.includes('皮划艇')) {
    inferredTags.push('kayaking');
  }
  if (searchText.includes('star') || searchText.includes('night sky') || searchText.includes('观星') || searchText.includes('星空')) {
    inferredTags.push('stargazing');
  }
  if (searchText.includes('photo') || searchText.includes('scenic') || searchText.includes('beautiful') || searchText.includes('摄影') || searchText.includes('景色')) {
    inferredTags.push('photography');
    inferredTags.push('scenic');
  }

  // 适合人群标签
  if (searchText.includes('beginner') || searchText.includes('easy') || searchText.includes('simple') || searchText.includes('新手') || searchText.includes('简单')) {
    inferredTags.push('beginner');
  }
  if (searchText.includes('family') || searchText.includes('family-friendly') || searchText.includes('children') || searchText.includes('家庭') || searchText.includes('儿童')) {
    inferredTags.push('family');
  }
  if (facilityText.includes('playground') || facilityText.includes('游乐场')) {
    inferredTags.push('family');
  }
  if (searchText.includes('solo') || searchText.includes('alone') || searchText.includes('独行')) {
    inferredTags.push('solo');
  }
  if (searchText.includes('group') || searchText.includes('team') || searchText.includes('团体')) {
    inferredTags.push('group');
  }

  // 特色标签
  if (searchText.includes('quiet') || searchText.includes('peaceful') || searchText.includes('tranquil') || searchText.includes('安静') || searchText.includes('宁静')) {
    inferredTags.push('quiet');
  }
  if (searchText.includes('challenging') || searchText.includes('difficult') || searchText.includes('hard') || searchText.includes('挑战') || searchText.includes('困难')) {
    inferredTags.push('challenging');
  }
  if (searchText.includes('heritage') || searchText.includes('unesco') || searchText.includes('世界遗产') || searchText.includes('历史遗迹') || searchText.includes('古迹') || searchText.includes('遗址')) {
    inferredTags.push('heritage');
  }
  if (searchText.includes('sunny') || searchText.includes('sun') || searchText.includes('阳光')) {
    inferredTags.push('sunny');
  }
  if (searchText.includes('shade') || searchText.includes('tree') || searchText.includes('树荫')) {
    inferredTags.push('shady');
  }
  if (searchText.includes('wind') || searchText.includes('风')) {
    inferredTags.push('windy');
  }
  if (searchText.includes('shelter') || searchText.includes('protected') || searchText.includes('遮挡') || searchText.includes('避风')) {
    inferredTags.push('sheltered');
  }

  return [...new Set(inferredTags)]; // 去重
}

// 自动推断设施（根据描述、类型等）
export function inferFacilities(
  description: string,
  type?: string,
  tags: string[] = []
): string[] {
  const inferredFacilities: string[] = [];
  const searchText = description.toLowerCase();
  const tagText = tags.join(' ').toLowerCase();

  // 基础设施（通常都有）
  if (type === 'DOC' || type === 'Holiday Park' || type === 'Freedom Camping') {
    inferredFacilities.push('toilet');
    inferredFacilities.push('parking');
  }

  // 根据描述推断
  if (searchText.includes('toilet') || searchText.includes('restroom') || searchText.includes('厕所') || searchText.includes('洗手间')) {
    inferredFacilities.push('toilet');
  }
  if (searchText.includes('water') || searchText.includes('drinking') || searchText.includes('饮用水') || searchText.includes('水源')) {
    inferredFacilities.push('water');
  }
  if (searchText.includes('shower') || searchText.includes('淋浴')) {
    inferredFacilities.push('shower');
  }
  if (searchText.includes('kitchen') || searchText.includes('cooking') || searchText.includes('厨房') || searchText.includes('烹饪')) {
    inferredFacilities.push('kitchen');
  }
  if (searchText.includes('power') || searchText.includes('electricity') || searchText.includes('电源') || searchText.includes('电力')) {
    inferredFacilities.push('power');
  }
  if (searchText.includes('wifi') || searchText.includes('wi-fi') || searchText.includes('internet') || searchText.includes('网络')) {
    inferredFacilities.push('wifi');
  }
  if (searchText.includes('shop') || searchText.includes('store') || searchText.includes('商店')) {
    inferredFacilities.push('shop');
  }
  if (searchText.includes('laundry') || searchText.includes('washing') || searchText.includes('洗衣')) {
    inferredFacilities.push('laundry');
  }
  if (searchText.includes('bbq') || searchText.includes('barbecue') || searchText.includes('grill') || searchText.includes('烧烤')) {
    inferredFacilities.push('bbq');
  }
  if (searchText.includes('fire') || searchText.includes('campfire') || searchText.includes('篝火')) {
    inferredFacilities.push('fire-pit');
  }
  if (searchText.includes('playground') || searchText.includes('play') || searchText.includes('游乐场')) {
    inferredFacilities.push('playground');
  }
  if (searchText.includes('reception') || searchText.includes('office') || searchText.includes('接待')) {
    inferredFacilities.push('reception');
  }
  if (searchText.includes('pool') || searchText.includes('swimming') || searchText.includes('泳池') || searchText.includes('游泳池')) {
    inferredFacilities.push('pool');
  }
  if (searchText.includes('hot spring') || searchText.includes('hot-spring') || searchText.includes('onsen') || searchText.includes('温泉')) {
    inferredFacilities.push('hot-spring');
  }
  if (searchText.includes('spa') || searchText.includes('sauna') || searchText.includes('桑拿') || searchText.includes('水疗') || searchText.includes('按摩')) {
    inferredFacilities.push('spa');
  }
  if (searchText.includes('cafe') || searchText.includes('coffee') || searchText.includes('咖啡') || searchText.includes('咖啡厅')) {
    inferredFacilities.push('cafe');
  }
  if (searchText.includes('trampoline') || searchText.includes('蹦床')) {
    inferredFacilities.push('trampoline');
  }
  if (searchText.includes('media room') || searchText.includes('cinema') || searchText.includes('movie') || searchText.includes('影音') || searchText.includes('影院') || searchText.includes('电影')) {
    inferredFacilities.push('media-room');
  }
  if (searchText.includes('game room') || searchText.includes('games') || searchText.includes('arcade') || searchText.includes('游戏室') || searchText.includes('游戏厅')) {
    inferredFacilities.push('game-room');
  }
  if (searchText.includes('pizza oven') || searchText.includes('pizza-oven') || searchText.includes('披萨炉') || searchText.includes('披萨烤炉')) {
    inferredFacilities.push('pizza-oven');
  }
  if (searchText.includes('tennis') || searchText.includes('网球') || searchText.includes('网球场')) {
    inferredFacilities.push('tennis-court');
  }
  if (searchText.includes('basketball') || searchText.includes('篮球') || searchText.includes('篮球场')) {
    inferredFacilities.push('basketball-court');
  }
  if (searchText.includes('table tennis') || searchText.includes('ping pong') || searchText.includes('ping-pong') || searchText.includes('乒乓球') || searchText.includes('乒乓球台') || searchText.includes('桌球')) {
    inferredFacilities.push('table-tennis');
  }
  if (searchText.includes('volleyball') || searchText.includes('排球') || searchText.includes('排球场')) {
    inferredFacilities.push('volleyball-court');
  }

  // Holiday Park 通常有更多设施
  if (type === 'Holiday Park') {
    inferredFacilities.push('shower');
    inferredFacilities.push('kitchen');
    inferredFacilities.push('power');
    inferredFacilities.push('wifi');
    inferredFacilities.push('shop');
  }

  return [...new Set(inferredFacilities)]; // 去重
}

// 将旧的中文标签/设施转换为新的 ID 格式
export function convertLegacyTags(tags: string[]): string[] {
  return tags.map(tag => {
    const found = findTagByLabel(tag);
    return found ? found.id : tag; // 如果找不到，保留原值
  });
}

export function convertLegacyFacilities(facilities: string[]): string[] {
  return facilities.map(facility => {
    const found = findFacilityByLabel(facility);
    return found ? found.id : facility; // 如果找不到，保留原值
  });
}
















