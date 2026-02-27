"use client";

import { formatRelativeTime } from "@/lib/utils";
import type { CommentResponse, UserResponse } from "@/types";

interface CommentSectionProps {
  comments: CommentResponse[];
  isLoading: boolean;
  currentUser: UserResponse | null;
  onDelete: (commentId: number) => void;
}

export default function CommentSection({
  comments,
  isLoading,
  currentUser,
  onDelete,
}: CommentSectionProps) {
  return (
    <div className="space-y-3 px-4 pt-3 pb-2">
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2 group">
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">
              <span className="font-semibold text-gray-900 mr-2">{c.nickname}</span>
              <span className="text-gray-700 break-words">{c.content}</span>
            </p>
            <span className="text-[10px] text-gray-300">
              {formatRelativeTime(c.createdAt)}
            </span>
          </div>
          {currentUser?.id === c.authorId && (
            <button
              onClick={() => onDelete(c.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 p-2 text-gray-300
                         hover:text-red-400 transition-all"
              aria-label="댓글 삭제"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}
        </div>
      ))}

      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="flex justify-center py-3">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
