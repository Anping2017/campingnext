export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <html lang="zh-CN">
      <head>
        <title>404 - Nomad NZ</title>
      </head>
      <body className="antialiased">
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
      </body>
    </html>
  );
}

