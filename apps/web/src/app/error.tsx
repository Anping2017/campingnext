'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <h1 className="text-6xl font-bold mb-4">500</h1>
      <p className="text-xl text-gray-600 mb-8">出错了</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        重试
      </button>
    </div>
  );
}

