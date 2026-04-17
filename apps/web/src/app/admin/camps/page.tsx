'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Trash2, Plus, Edit, CheckCircle, XCircle, Filter } from 'lucide-react';
import { authenticatedFetch } from '@/lib/admin-api';
import CampFormModal from '@/components/admin/CampFormModal';
import { Camp, CampStatus } from '@/types/camp';

type StatusFilter = 'all' | 'pending' | 'published' | 'rejected' | 'archived';
type SourceFilter = 'all' | 'doc' | 'google' | 'manual' | 'osm';

const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all',       label: '全部',     color: 'gray' },
  { key: 'pending',   label: '待审核',   color: 'amber' },
  { key: 'published', label: '已发布',   color: 'green' },
  { key: 'rejected',  label: '已拒绝',   color: 'red' },
  { key: 'archived',  label: '已归档',   color: 'gray' },
];

export default function AdminCampsPage() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const limit = 20;

  useEffect(() => {
    loadCamps();
  }, [page, search, statusFilter, sourceFilter]);

  // 切换 filter 时清空选择 + 回到第一页
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [statusFilter, sourceFilter]);

  const loadCamps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
      });
      const response = await authenticatedFetch(`/api/admin/camps?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCamps(data.camps || []);
        setTotal(data.total || 0);
      } else {
        console.error('加载营地失败');
      }
    } catch (error) {
      console.error('加载营地失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === camps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(camps.map((c) => c.id)));
    }
  };

  const bulkUpdateStatus = async (status: CampStatus) => {
    if (selectedIds.size === 0) {
      alert('请先选择营地');
      return;
    }
    if (!confirm(`确定将 ${selectedIds.size} 个营地的状态改为 "${status}" 吗?`)) return;

    try {
      const response = await authenticatedFetch('/api/admin/camps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campIds: Array.from(selectedIds), status }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`已更新 ${data.updated} 个营地为 ${status}`);
        setSelectedIds(new Set());
        loadCamps();
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error: any) {
      alert(`更新失败: ${error.message ?? error}`);
    }
  };

  const handleDelete = async (campId: string) => {
    if (!confirm('确定要删除这个营地吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await authenticatedFetch('/api/admin/camps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campId }),
      });

      if (response.ok) {
        alert('营地已删除');
        loadCamps();
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除营地失败:', error);
      alert('删除失败');
    }
  };

  const handleEdit = (camp: Camp) => {
    setEditingCamp(camp);
    setShowEditModal(true);
  };

  const handleSave = async (campData: Partial<Camp>) => {
    try {
      // 确保数据格式正确
      const payload = {
        ...campData,
        // 确保数组字段存在
        tags: campData.tags || [],
        facilities: campData.facilities || [],
        reviewPros: campData.reviewPros || [],
        reviewCons: campData.reviewCons || [],
        // 确保数字字段正确
        price: campData.price ?? 0,
        rating: campData.rating ?? 0,
        lat: campData.lat ?? 0,
        lng: campData.lng ?? 0,
        // 如果是编辑，保留 ID
        id: editingCamp?.id || campData.id,
      };

      // 添加详细的调试日志
      console.log('=== 保存营地 - 客户端调试信息 ===');
      console.log('原始数据 (campData):', campData);
      console.log('处理后的数据 (payload):', payload);
      console.log('评价字段检查:', {
        reviewPros: payload.reviewPros,
        reviewProsType: Array.isArray(payload.reviewPros) ? 'array' : typeof payload.reviewPros,
        reviewProsLength: Array.isArray(payload.reviewPros) ? payload.reviewPros.length : 'N/A',
        reviewCons: payload.reviewCons,
        reviewConsType: Array.isArray(payload.reviewCons) ? 'array' : typeof payload.reviewCons,
        reviewConsLength: Array.isArray(payload.reviewCons) ? payload.reviewCons.length : 'N/A',
      });
      console.log('发送的 JSON:', JSON.stringify({ camp: payload }, null, 2));

      const response = await authenticatedFetch('/api/admin/camps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp: payload }),
      });

      console.log('响应状态:', response.status, response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('响应内容 (原始):', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('响应数据 (解析后):', responseData);
      } catch (parseError) {
        console.error('解析响应 JSON 失败:', parseError);
        console.error('响应文本:', responseText);
        alert(`保存失败: 服务器返回了无效的 JSON 响应\n状态: ${response.status}\n响应: ${responseText.substring(0, 200)}`);
        return;
      }

      if (response.ok) {
        console.log('✅ 保存成功');
        alert(editingCamp ? '营地已更新' : '营地已添加');
        setShowEditModal(false);
        setEditingCamp(null);
        loadCamps();
      } else {
        console.error('❌ 保存失败:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          code: responseData.code,
          details: responseData.details,
          hint: responseData.hint,
        });
        const errorMsg = responseData.error || '保存失败';
        const errorDetails = [
          errorMsg,
          responseData.code ? `错误代码: ${responseData.code}` : '',
          responseData.details ? `详情: ${responseData.details}` : '',
          responseData.hint ? `提示: ${responseData.hint}` : '',
        ].filter(Boolean).join('\n');
        alert(errorDetails);
      }
    } catch (error: any) {
      console.error('❌ 保存营地异常:', error);
      console.error('错误堆栈:', error.stack);
      alert(`保存失败: ${error.message || '未知错误'}\n请查看浏览器控制台获取详细信息`);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">营地管理</h1>
          <p className="text-gray-600">添加、编辑、删除营地信息</p>
        </div>
        <button
          onClick={() => {
            setEditingCamp(null);
            setShowEditModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加营地
        </button>
      </div>

      {/* ✨ Status 标签页 */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.key
                ? `border-${tab.color}-500 text-${tab.color}-700`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ✨ 搜索 + Source 过滤 */}
      <div className="mb-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索营地..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">全部来源</option>
            <option value="doc">DOC 官方</option>
            <option value="google">Google 采集</option>
            <option value="manual">手动录入</option>
            <option value="osm">OSM</option>
          </select>
        </div>
      </div>

      {/* ✨ 批量操作工具条(选中时显示) */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-900 font-medium">
            已选 {selectedIds.size} 个营地
          </span>
          <button
            onClick={() => bulkUpdateStatus('published')}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" /> 批量发布
          </button>
          <button
            onClick={() => bulkUpdateStatus('rejected')}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            <XCircle className="w-4 h-4" /> 批量拒绝
          </button>
          <button
            onClick={() => bulkUpdateStatus('archived')}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            归档
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-600 hover:text-gray-900 ml-auto"
          >
            清除选择
          </button>
        </div>
      )}

      {/* 营地列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      ) : camps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">暂无营地</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === camps.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地区</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">质量</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {camps.map((camp) => {
                  const c = camp as any;
                  const status = c.status || 'published';
                  const source = c.source || 'manual';
                  const quality = typeof c.dataQualityScore === 'number' ? c.dataQualityScore : (c.data_quality_score ?? null);
                  return (
                    <tr key={camp.id} className={`hover:bg-gray-50 ${selectedIds.has(camp.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(camp.id)}
                          onChange={() => toggleSelect(camp.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{camp.name}</div>
                        {(c.campType || c.camp_type) && (
                          <div className="text-xs text-gray-500">{c.campType || c.camp_type}</div>
                        )}
                        {c.shortDescription && (
                          <div className="text-xs text-gray-400 mt-1 max-w-md truncate">{c.shortDescription}</div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <SourceBadge source={source} />
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">{camp.region}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 capitalize">{camp.price}</td>
                      <td className="px-3 py-4 text-sm">
                        <QualityBar score={quality} />
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        ⭐ {camp.rating?.toFixed(1) || 0}
                        {c.ratingCount ? <span className="text-xs text-gray-400 ml-1">({c.ratingCount})</span> : null}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(camp)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(camp.id)}
                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {total > limit && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                共 {total} 个营地，第 {page} 页
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 编辑模态框 */}
      {showEditModal && (
        <CampFormModal
          camp={editingCamp}
          onSave={handleSave}
          onClose={() => {
            setShowEditModal(false);
            setEditingCamp(null);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// 辅助 UI 组件
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-800',
    published: 'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
    archived:  'bg-gray-200 text-gray-700',
  };
  const labels: Record<string, string> = {
    pending: '待审核', published: '已发布', rejected: '已拒绝', archived: '已归档',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    doc:    'bg-blue-100 text-blue-800',
    google: 'bg-purple-100 text-purple-800',
    manual: 'bg-gray-100 text-gray-700',
    osm:    'bg-teal-100 text-teal-800',
  };
  const labels: Record<string, string> = {
    doc: 'DOC', google: 'Google', manual: '手动', osm: 'OSM',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[source] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[source] ?? source}
    </span>
  );
}

function QualityBar({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-200 rounded">
        <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8">{pct}%</span>
    </div>
  );
}









