// 禁用静态生成，强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NotFound() {
  // 不返回完整的 HTML，让 layout 处理
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">页面未找到</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}

