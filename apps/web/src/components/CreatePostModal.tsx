'use client';

import { useState } from 'react';
import { X, Plus, MapPin, Sparkles } from 'lucide-react';
import { CreatePostData } from '@/types/post';
import campsData from '@/data/camps.json';
import { Camp } from '@/types/camp';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [showCampSelector, setShowCampSelector] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const maxImages = 12;
    const remainingSlots = maxImages - images.length;

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newImages.push(result);
          if (newImages.length === Math.min(files.length, remainingSlots)) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length < 3) {
      alert('请至少上传 3 张图片');
      return;
    }
    onSubmit({
      title,
      content,
      images,
      campId: selectedCampId || undefined,
    });
    // 重置表单
    setTitle('');
    setContent('');
    setImages([]);
    setSelectedCampId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">发布帖子</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的帖子起个标题..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的露营体验..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* 营地标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关联营地（可选）
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCampSelector(!showCampSelector)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-green-500 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {selectedCampId
                    ? (campsData as Camp[]).find((c) => c.id === selectedCampId)?.name
                    : '选择营地'}
                </span>
              </button>
              {showCampSelector && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {(campsData as Camp[]).map((camp) => (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => {
                        setSelectedCampId(camp.id);
                        setShowCampSelector(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      {camp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片（3-12 张）
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image}
                    alt={`上传图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 12 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                  <Plus className="w-8 h-8 text-gray-400" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              已上传 {images.length}/12 张图片（至少需要 3 张）
            </p>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={images.length < 3 || !title || !content}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              发布
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


