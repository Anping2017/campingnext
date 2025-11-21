'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
            <p className="text-xl text-gray-600 mb-4">服务器错误</p>
            <p className="text-sm text-gray-500 mb-8">{error.message}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                重试
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

