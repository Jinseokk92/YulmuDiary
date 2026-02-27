"use client";

export default function DiaryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8 text-red-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        일기를 불러올 수 없습니다
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{error.message}</p>
      <button
        onClick={reset}
        className="px-5 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg
                   hover:bg-primary-600 active:bg-primary-700 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
