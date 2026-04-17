'use client';

import { useState, useMemo, useEffect } from 'react';
import CampCard from '@/components/CampCard';
import SearchBar from '@/components/SearchBar';
import FilterChips from '@/components/FilterChips';
import CommunityBanner from '@/components/CommunityBanner';
import PreferencesModal from '@/components/PreferencesModal';
import NavBar from '@/components/NavBar';
import campsData from '@/data/camps.json';
import { Camp } from '@/types/camp';
import { UserPreferences, preferencesUtils } from '@/types/preferences';
import { Compass, Sparkles, Settings, Filter } from 'lucide-react';

const availableFilters = ['beach', 'forest', 'toilet', 'beginner', 'free'];

// 模拟社区热门贴文数据
const mockHotPosts = [
  {
    id: '1',
    title: 'Cathedral Cove 的日出太美了！推荐大家一定要去',
    author: '露营达人',
    likes: 128,
    comments: 23,
  },
  {
    id: '2',
    title: 'Tongariro 徒步攻略分享',
    author: '户外爱好者',
    likes: 95,
    comments: 15,
  },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // 高级筛选
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCampTypes, setSelectedCampTypes] = useState<string[]>([]);
  const [selectedPriceCategories, setSelectedPriceCategories] = useState<('free' | 'cheap' | 'medium' | 'expensive')[]>([]);

  // 加载用户偏好
  useEffect(() => {
    const prefs = preferencesUtils.load();
    setUserPreferences(prefs);
    // 应用偏好到筛选
    if (prefs.difficulty.length > 0) {
      setSelectedDifficulty(prefs.difficulty);
    }
    if (prefs.favoriteRegions.length > 0) {
      setSelectedRegions(prefs.favoriteRegions);
    }
    if (prefs.campTypes.length > 0) {
      setSelectedCampTypes(prefs.campTypes);
    }
    if (prefs.priceCategories && prefs.priceCategories.length > 0) {
      setSelectedPriceCategories(prefs.priceCategories);
    }
  }, []);

  const [allCamps, setAllCamps] = useState<Camp[]>([]);
  const [campsLoading, setCampsLoading] = useState(true);

  // 加载营地列表
  useEffect(() => {
    const loadCamps = async () => {
      try {
        setCampsLoading(true);
        const response = await fetch('/api/camps');
        if (response.ok) {
          const data = await response.json();
          setAllCamps(data.camps || []);
        } else {
          // API 失败时，使用 JSON 数据作为后备
          setAllCamps(campsData as Camp[]);
        }
      } catch (error) {
        console.error('加载营地失败:', error);
        setAllCamps(campsData as Camp[]);
      } finally {
        setCampsLoading(false);
      }
    };

    loadCamps();
  }, []);

  // 推荐营地（根据流行度和标签）
  const recommendedCamps = useMemo(() => {
    return [...allCamps]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }, [allCamps]);

  // 获取所有可用地区
  const availableRegions = useMemo(() => {
    const regions = new Set<string>();
    allCamps.forEach((camp) => {
      if (camp.region) regions.add(camp.region);
    });
    return Array.from(regions).sort();
  }, [allCamps]);

  // 筛选和搜索逻辑
  const filteredCamps = useMemo(() => {
    let result = [...allCamps];

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (camp) =>
          camp.name.toLowerCase().includes(query) ||
          camp.region.toLowerCase().includes(query) ||
          camp.description.toLowerCase().includes(query) ||
          camp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 快捷标签筛选
    if (selectedFilters.length > 0) {
      result = result.filter((camp) => {
        // 海边
        if (selectedFilters.includes('beach') && camp.tags.includes('海边')) {
          return true;
        }
        // 森林
        if (selectedFilters.includes('forest') && camp.tags.some((tag) => tag.includes('徒步') || tag.includes('森林'))) {
          return true;
        }
        // 有厕所
        if (selectedFilters.includes('toilet') && camp.facilities.includes('厕所')) {
          return true;
        }
        // 适合新手
        if (selectedFilters.includes('beginner') && camp.tags.includes('适合新手')) {
          return true;
        }
        // 免费
        if (selectedFilters.includes('free') && camp.price === 0) {
          return true;
        }
        return false;
      });
    }

    // 难度筛选
    if (selectedDifficulty.length > 0) {
      result = result.filter((camp) => selectedDifficulty.includes(camp.difficulty));
    }

    // 地区筛选
    if (selectedRegions.length > 0) {
      result = result.filter((camp) => selectedRegions.includes(camp.region));
    }

    // 营地类型筛选
    if (selectedCampTypes.length > 0) {
      result = result.filter((camp) => {
        const campType = (camp as any).campType;
        return campType && selectedCampTypes.includes(campType);
      });
    }

    // 价格分类筛选
    if (selectedPriceCategories.length > 0) {
      result = result.filter(
        (camp) => selectedPriceCategories.includes(camp.price)
      );
    }

    // 应用用户偏好（如果设置了）
    if (userPreferences) {
      // 营地类型偏好（如果用户设置了偏好但当前筛选中没有选择，则应用偏好）
      if (userPreferences.campTypes.length > 0 && selectedCampTypes.length === 0) {
        result = result.filter((camp) => {
          const campType = (camp as any).campType;
          return campType && userPreferences.campTypes.includes(campType);
        });
      }

      // 设施偏好
      if (userPreferences.facilities.length > 0) {
        result = result.filter((camp) => {
          return userPreferences.facilities.every((facility) =>
            camp.facilities.includes(facility)
          );
        });
      }

      // 标签偏好
      if (userPreferences.tags.length > 0) {
        result = result.filter((camp) => {
          return userPreferences.tags.some((tag) => camp.tags.includes(tag));
        });
      }
    }

    return result;
  }, [searchQuery, selectedFilters, selectedDifficulty, selectedRegions, selectedCampTypes, selectedPriceCategories, userPreferences, allCamps]);

  const handleToggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
    setSearchQuery('');
    setSelectedDifficulty([]);
    setSelectedRegions([]);
    setSelectedCampTypes([]);
    setSelectedPriceCategories([]);
  };

  const hasActiveFilters = 
    selectedFilters.length > 0 ||
    selectedDifficulty.length > 0 ||
    selectedRegions.length > 0 ||
    selectedCampTypes.length > 0 ||
      selectedPriceCategories.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Compass className="w-6 h-6 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">发现营地</h1>
        </div>

        {/* 社区热门 Banner */}
        <CommunityBanner posts={mockHotPosts} />

        {/* 搜索框 */}
        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* 筛选区域 */}
        <div className="mb-6 space-y-4">
        {/* 快捷筛选 */}
          <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">快捷筛选</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-green-600 hover:text-green-700"
              >
                清除筛选
              </button>
            )}
                <button
                  onClick={() => setShowPreferencesModal(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="偏好设置"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {showAdvancedFilters ? '收起' : '高级筛选'}
                </button>
              </div>
          </div>
          <FilterChips
            filters={availableFilters}
            selectedFilters={selectedFilters}
            onToggle={handleToggleFilter}
          />
        </div>

          {/* 高级筛选（折叠） */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              {/* 营地类型筛选 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">营地类型</label>
                <div className="flex flex-wrap gap-2">
                  {['DOC', 'Holiday Park', 'Freedom Camping', 'Local Camp', 'Private Campground'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedCampTypes((prev) =>
                          prev.includes(type)
                            ? prev.filter((t) => t !== type)
                            : [...prev, type]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCampTypes.includes(type)
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 难度筛选 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">难度</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'easy', label: '简单' },
                    { value: 'medium', label: '中等' },
                    { value: 'hard', label: '困难' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedDifficulty((prev) =>
                          prev.includes(option.value)
                            ? prev.filter((d) => d !== option.value)
                            : [...prev, option.value]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedDifficulty.includes(option.value)
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 地区筛选 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">地区</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {availableRegions.map((region) => (
                    <button
                      key={region}
                      onClick={() => {
                        setSelectedRegions((prev) =>
                          prev.includes(region)
                            ? prev.filter((r) => r !== region)
                            : [...prev, region]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedRegions.includes(region)
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* 价格分类 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">价格分类</label>
                <div className="flex flex-wrap gap-2">
                  {(['free', 'cheap', 'medium', 'expensive'] as const).map((category) => {
                    const labels = { free: '免费', cheap: '便宜', medium: '中等', expensive: '较贵' };
                    const isSelected = selectedPriceCategories.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPriceCategories(selectedPriceCategories.filter(c => c !== category));
                          } else {
                            setSelectedPriceCategories([...selectedPriceCategories, category]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {labels[category]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 偏好设置弹窗 */}
        <PreferencesModal
          isOpen={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
          onSave={(prefs) => {
            setUserPreferences(prefs);
            // 应用偏好到筛选
            if (prefs.difficulty.length > 0) {
              setSelectedDifficulty(prefs.difficulty);
            }
            if (prefs.favoriteRegions.length > 0) {
              setSelectedRegions(prefs.favoriteRegions);
            }
            if (prefs.campTypes.length > 0) {
              setSelectedCampTypes(prefs.campTypes);
            }
            if (prefs.priceCategories && prefs.priceCategories.length > 0) {
              setSelectedPriceCategories(prefs.priceCategories);
            }
          }}
        />

        {/* 推荐营地 */}
        {selectedFilters.length === 0 && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">为你推荐</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedCamps.map((camp) => (
                <CampCard key={camp.id} camp={camp} />
              ))}
            </div>
          </div>
        )}

        {/* 筛选结果 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {searchQuery || selectedFilters.length > 0 ? '搜索结果' : '所有营地'}
            </h2>
            <span className="text-sm text-gray-600">
              {filteredCamps.length} 个营地
            </span>
          </div>

          {filteredCamps.length === 0 ? (
            <div className="text-center py-12">
              <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">没有找到匹配的营地</p>
              <button
                onClick={handleClearFilters}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                清除筛选条件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCamps.map((camp) => (
                <CampCard key={camp.id} camp={camp} />
              ))}
            </div>
          )}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
