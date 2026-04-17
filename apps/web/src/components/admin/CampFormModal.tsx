'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Camp } from '@/types/camp';
import { FACILITIES, TAGS, getFacilityById, getTagById, findFacilityByLabel, findTagByLabel } from '@/lib/camp-metadata';

interface CampFormModalProps {
  camp: Camp | null;
  onSave: (campData: Partial<Camp>) => Promise<void>;
  onClose: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

const CAMP_TYPE_OPTIONS = [
  { value: 'DOC', label: 'DOC (Department of Conservation)' },
  { value: 'Holiday Park', label: 'Holiday Park' },
  { value: 'Freedom Camping', label: 'Freedom Camping' },
  { value: 'Local Camp', label: 'Local Camp (地方营地)' },
  { value: 'Private Campground', label: 'Private Campground (私人露营地)' },
];

// 使用新的元数据系统，但保留中文标签用于显示
const getFacilityLabel = (id: string): string => {
  const facility = getFacilityById(id) || findFacilityByLabel(id);
  return facility ? facility.label : id;
};

const getTagLabel = (id: string): string => {
  const tag = getTagById(id) || findTagByLabel(id);
  return tag ? tag.label : id;
};

export default function CampFormModal({ camp, onSave, onClose }: CampFormModalProps) {
  const [formData, setFormData] = useState<Partial<Camp>>({
    id: '',
    name: '',
    region: '',
    price: 'medium',
    tags: [],
    lat: 0,
    lng: 0,
    description: '',
    facilities: [],
    difficulty: 'easy',
    rating: 0,
    campType: undefined,
    address: '',
    phone: '',
    email: '',
    website: '',
    petPolicy: undefined,
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [googleInput, setGoogleInput] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (camp) {
      setFormData({
        id: camp.id,
        name: camp.name,
        region: camp.region,
        price: camp.price,
        tags: camp.tags || [],
        lat: camp.lat,
        lng: camp.lng,
        description: camp.description,
        facilities: camp.facilities || [],
        difficulty: camp.difficulty,
        rating: camp.rating,
        campType: camp.campType,
        address: camp.address || '',
        phone: camp.phone || '',
        email: camp.email || '',
        website: camp.website || '',
        reviewPros: camp.reviewPros || [],
        reviewCons: camp.reviewCons || [],
        petPolicy: camp.petPolicy,
      });
    } else {
      // 重置表单
      setFormData({
        id: '',
        name: '',
        region: '',
        price: 'medium',
        tags: [],
        lat: 0,
        lng: 0,
        description: '',
        facilities: [],
        difficulty: 'easy',
        rating: 0,
        campType: undefined,
        address: '',
        phone: '',
        email: '',
        website: '',
        reviewPros: [],
        reviewCons: [],
      });
    }
    setErrors({});
  }, [camp]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '营地名称必填';
    }

    if (!formData.region?.trim()) {
      newErrors.region = '地区必填';
    }

    if (!formData.price || !['free', 'cheap', 'medium', 'expensive'].includes(formData.price)) {
      newErrors.price = '请选择价格分类';
    }

    if (!formData.lat || formData.lat < -90 || formData.lat > 90) {
      newErrors.lat = '纬度必须在 -90 到 90 之间';
    }

    if (!formData.lng || formData.lng < -180 || formData.lng > 180) {
      newErrors.lng = '经度必须在 -180 到 180 之间';
    }

    if (!formData.description?.trim()) {
      newErrors.description = '描述必填';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = '难度必选';
    }

    if (formData.rating === undefined || formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = '评分必须在 0 到 5 之间';
    }

    if (!camp && !formData.id?.trim()) {
      newErrors.id = '营地 ID 必填（用于新增）';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags?.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag.trim()],
      });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  const toggleFacility = (facilityId: string) => {
    const facilities = formData.facilities || [];
    if (facilities.includes(facilityId)) {
      setFormData({
        ...formData,
        facilities: facilities.filter(f => f !== facilityId),
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...facilities, facilityId],
      });
    }
  };

  const handleFetchFromGoogle = async () => {
    if (!googleInput.trim()) {
      setGoogleError('请输入营地名称');
      return;
    }

    setLoadingGoogle(true);
    setGoogleError(null);

    try {
      // 判断是 URL 还是地点名称
      const isUrl = googleInput.trim().startsWith('http://') || googleInput.trim().startsWith('https://');
      
      // 如果是 URL，尝试提取地点名称
      let placeName = googleInput.trim();
      if (isUrl) {
        // 尝试从 Google Maps URL 中提取名称
        const urlMatch = googleInput.match(/\/place\/([^/@]+)/);
        if (urlMatch) {
          placeName = decodeURIComponent(urlMatch[1].replace(/\+/g, ' '));
        } else {
          // 如果无法提取，提示用户输入名称
          setGoogleError('无法从链接中提取地点名称，请直接输入营地名称');
          setLoadingGoogle(false);
          return;
        }
      }

      // 优先使用免费方案（OpenStreetMap + AI）
      let response = await fetch('/api/camps/fetch-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: placeName,
        }),
      });

      let data = await response.json();

      // 如果免费方案失败，且用户有 Google API Key，尝试 Google 方案
      if (!response.ok && !data.error?.includes('未找到')) {
        // 尝试 Google Maps API（如果配置了）
        try {
          response = await fetch('/api/camps/fetch-from-google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: isUrl ? googleInput.trim() : undefined,
              placeName: !isUrl ? placeName : undefined,
            }),
          });
          data = await response.json();
        } catch (googleError) {
          // Google API 失败，使用免费方案的错误信息
        }
      }

      if (!response.ok) {
        throw new Error(data.error || '获取信息失败');
      }

      if (data.success && data.camp) {
        // 自动填充表单
        setFormData({
          ...formData,
          id: formData.id || data.camp.id, // 如果已有 ID，保留原有 ID
          name: data.camp.name || formData.name,
          region: data.camp.region || formData.region,
          price: data.camp.price ?? formData.price,
          tags: [...new Set([...(formData.tags || []), ...(data.camp.tags || [])])], // 合并标签
          lat: data.camp.lat || formData.lat,
          lng: data.camp.lng || formData.lng,
          description: data.camp.description || formData.description,
          facilities: [...new Set([...(formData.facilities || []), ...(data.camp.facilities || [])])], // 合并设施
          difficulty: data.camp.difficulty || formData.difficulty,
          rating: data.camp.rating || formData.rating,
          campType: data.camp.campType || formData.campType,
          // 联系方式（如果自动填充提供了）
          address: data.camp.address || formData.address,
          phone: data.camp.phone || formData.phone,
          email: data.camp.email || formData.email,
          website: data.camp.website || formData.website,
          // 评价总结（从 Google Maps 评价中提取）
          reviewPros: data.camp.reviewPros || formData.reviewPros || [],
          reviewCons: data.camp.reviewCons || formData.reviewCons || [],
          petPolicy: data.camp.petPolicy || formData.petPolicy,
        });

        // 清空输入框
        setGoogleInput('');
        alert('信息已自动填充！请检查并完善表单。');
      }
    } catch (error: any) {
      console.error('获取地点信息失败:', error);
      setGoogleError(error.message || '获取信息失败，请检查名称是否正确');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {camp ? '编辑营地' : '添加营地'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 智能自动填充（免费方案） */}
          {!camp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-900">智能自动填充（免费）</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={googleInput}
                  onChange={(e) => {
                    setGoogleInput(e.target.value);
                    setGoogleError(null);
                  }}
                  placeholder="输入营地名称（如：Cathedral Cove Campsite）..."
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={loadingGoogle}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loadingGoogle && googleInput.trim()) {
                      handleFetchFromGoogle();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleFetchFromGoogle}
                  disabled={loadingGoogle || !googleInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loadingGoogle ? '获取中...' : '自动填充'}
                </button>
              </div>
              {googleError && (
                <p className="text-sm text-red-600">{googleError}</p>
              )}
              <p className="text-xs text-blue-700">
                💡 提示：输入营地名称即可自动获取位置信息，AI 会智能生成描述、设施、标签等信息。完全免费，无需 API Key！
              </p>
            </div>
          )}

          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">基本信息</h3>

            {/* 营地 ID（仅新增时显示） */}
            {!camp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  营地 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id || ''}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例如: cathedral-cove"
                />
                {errors.id && <p className="mt-1 text-sm text-red-500">{errors.id}</p>}
              </div>
            )}

            {/* 营地名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                营地名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: Cathedral Cove Campsite"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* 地区 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地区 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: Coromandel"
              />
              {errors.region && <p className="mt-1 text-sm text-red-500">{errors.region}</p>}
            </div>

            {/* 价格和评分 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.price || 'medium'}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value as 'free' | 'cheap' | 'medium' | 'expensive' })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="free">免费</option>
                  <option value="cheap">便宜</option>
                  <option value="medium">中等</option>
                  <option value="expensive">较贵</option>
                </select>
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  评分 (0-5) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating || 0}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.rating ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.rating && <p className="mt-1 text-sm text-red-500">{errors.rating}</p>}
              </div>
            </div>

            {/* 难度和类型 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  难度 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.difficulty || 'easy'}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.difficulty ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.difficulty && <p className="mt-1 text-sm text-red-500">{errors.difficulty}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  营地类型
                </label>
                <select
                  value={formData.campType || ''}
                  onChange={(e) => setFormData({ ...formData, campType: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">请选择</option>
                  {CAMP_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 位置信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">位置信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  纬度 (Lat) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.lat || 0}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.lat ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例如: -36.5"
                />
                {errors.lat && <p className="mt-1 text-sm text-red-500">{errors.lat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  经度 (Lng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.lng || 0}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.lng ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例如: 175.8"
                />
                {errors.lng && <p className="mt-1 text-sm text-red-500">{errors.lng}</p>}
              </div>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">联系方式</h3>

            {/* 详细地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                详细地址
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例如: 123 Main Street, Coromandel, New Zealand"
              />
            </div>

            {/* 电话和邮箱 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如: +64 7 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如: info@campsite.co.nz"
                />
              </div>
            </div>

            {/* 网址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网址
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例如: https://www.campsite.co.nz"
              />
            </div>

            {/* 宠物政策 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                宠物政策
              </label>
              <select
                value={formData.petPolicy || ''}
                onChange={(e) => setFormData({ ...formData, petPolicy: e.target.value as 'allowed' | 'not-allowed' | 'seasonal' | 'conditional' | undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">未设置</option>
                <option value="allowed">可宠</option>
                <option value="not-allowed">不可宠</option>
                <option value="seasonal">淡季可宠</option>
                <option value="conditional">条件限制可宠</option>
              </select>
            </div>
          </div>

          {/* 评价总结（从 Google Maps 自动提取，只读） */}
          {(formData.reviewPros && formData.reviewPros.length > 0) || (formData.reviewCons && formData.reviewCons.length > 0) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">用户评价总结</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
                <p className="text-sm text-green-700">
                  💡 这些信息是从 Google Maps 评价中自动提取的，用于帮助用户快速了解营地的优缺点。
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 优点 */}
                {formData.reviewPros && formData.reviewPros.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-green-700 mb-3 flex items-center gap-2">
                      <span className="text-xl">👍</span>
                      <span>优点 ({formData.reviewPros.length})</span>
                    </h4>
                    <ul className="space-y-2 bg-green-50 rounded-lg p-4">
                      {formData.reviewPros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* 缺点 */}
                {formData.reviewCons && formData.reviewCons.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-orange-700 mb-3 flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <span>需要注意 ({formData.reviewCons.length})</span>
                    </h4>
                    <ul className="space-y-2 bg-orange-50 rounded-lg p-4">
                      {formData.reviewCons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* 描述 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">描述</h3>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入营地描述..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* 设施 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">设施</h3>
            
            {/* 按分类显示设施 */}
            {(['basic', 'comfort', 'recreation'] as const).map(category => {
              const categoryFacilities = FACILITIES.filter(f => f.category === category);
              if (categoryFacilities.length === 0) return null;
              
              const categoryLabels: Record<string, string> = {
                basic: '基础设施',
                comfort: '舒适设施',
                recreation: '娱乐设施',
              };

              // 检查该分类的所有设施是否都已选中
              const allSelected = categoryFacilities.every(facility => {
                return formData.facilities?.some(f => {
                  return f === facility.id || f === facility.label || 
                         getFacilityLabel(f) === facility.label;
                }) || false;
              });

              // 全选/取消全选该分类的设施
              const handleSelectAll = () => {
                const currentFacilities = formData.facilities || [];
                const facilityIds = categoryFacilities.map(f => f.id);
                
                if (allSelected) {
                  // 取消全选：移除该分类的所有设施
                  const updatedFacilities = currentFacilities.filter(f => {
                    const facilityId = typeof f === 'string' ? f : f;
                    return !facilityIds.includes(facilityId) && 
                           !categoryFacilities.some(cf => getFacilityLabel(facilityId) === cf.label);
                  });
                  setFormData({ ...formData, facilities: updatedFacilities });
                } else {
                  // 全选：添加该分类的所有设施（去重）
                  const existingIds = currentFacilities.map(f => {
                    const facilityId = typeof f === 'string' ? f : f;
                    return facilityId;
                  });
                  const newFacilities = facilityIds.filter(id => !existingIds.includes(id));
                  setFormData({ 
                    ...formData, 
                    facilities: [...currentFacilities, ...newFacilities] 
                  });
                }
              };

              return (
                <div key={category} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">{categoryLabels[category]}</p>
                    {category === 'basic' && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        {allSelected ? '取消全选' : '全选'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryFacilities.map(facility => {
                      const Icon = facility.icon;
                      const isChecked = formData.facilities?.some(f => {
                        // 支持 ID 和中文标签
                        return f === facility.id || f === facility.label || 
                               getFacilityLabel(f) === facility.label;
                      }) || false;
                      
                      // 确保 Icon 存在
                      if (!Icon) {
                        console.warn(`Icon not found for facility: ${facility.id}`);
                        return null;
                      }
                      
                      return (
                        <label
                          key={facility.id}
                          className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg border transition-colors ${
                            isChecked
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              // 统一使用 ID 格式存储
                              const currentFacilities = formData.facilities || [];
                              const facilityId = facility.id;
                              
                              if (isChecked) {
                                // 移除（可能以 ID 或中文形式存在）
                                setFormData({
                                  ...formData,
                                  facilities: currentFacilities.filter(f => 
                                    f !== facilityId && f !== facility.label && getFacilityLabel(f) !== facility.label
                                  ),
                                });
                              } else {
                                // 添加（使用 ID）
                                setFormData({
                                  ...formData,
                                  facilities: [...currentFacilities, facilityId],
                                });
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{facility.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 标签 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">标签</h3>
            
            {/* 按分类显示标签 */}
            {(['location', 'activity', 'suitability', 'feature'] as const).map(category => {
              const categoryTags = TAGS.filter(t => t.category === category);
              if (categoryTags.length === 0) return null;
              
              const categoryLabels: Record<string, string> = {
                location: '地理位置',
                activity: '活动类型',
                suitability: '适合人群',
                feature: '特色',
              };

              return (
                <div key={category} className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{categoryLabels[category]}</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map(tag => {
                      const Icon = tag.icon;
                      const isSelected = formData.tags?.some(t => {
                        // 支持 ID 和中文标签
                        return t === tag.id || t === tag.label || getTagLabel(t) === tag.label;
                      }) || false;
                      
                      // 确保 Icon 存在
                      if (!Icon) {
                        console.warn(`Icon not found for tag: ${tag.id}`);
                        return null;
                      }
                      
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const currentTags = formData.tags || [];
                            const tagId = tag.id;
                            
                            if (isSelected) {
                              // 移除
                              setFormData({
                                ...formData,
                                tags: currentTags.filter(t => 
                                  t !== tagId && t !== tag.label && getTagLabel(t) !== tag.label
                                ),
                              });
                            } else {
                              // 添加（使用 ID）
                              setFormData({
                                ...formData,
                                tags: [...currentTags, tagId],
                              });
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 自定义标签输入 */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="输入标签后按回车添加"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 已选标签 */}
            {formData.tags && formData.tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">已选标签：</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-green-700 hover:text-green-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}











