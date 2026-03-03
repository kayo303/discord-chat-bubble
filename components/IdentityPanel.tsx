"use client";

import React from "react";

type Props = {
  authors: string[];
  nameMap: Record<string, string>;
  avatarMap: Record<string, string>;
  onChangeName: (author: string, value: string) => void;
  onUploadAvatar: (author: string, file: File) => void;
  onRemoveAvatar: (author: string) => void;
};

export default function IdentityPanel({
  authors,
  nameMap,
  avatarMap,
  onChangeName,
  onUploadAvatar,
  onRemoveAvatar,
}: Props) {
  return (
    <div className="rounded-xl border border-[#2B2D31] bg-[#313338] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2B2D31] bg-[#2B2D31]">
        <div className="text-sm text-[#949BA4]">이름/프로필 설정</div>
      </div>

      <div className="p-3 space-y-3">
        {authors.length === 0 ? (
          <div className="text-sm text-[#949BA4]">먼저 대화를 붙여넣어 주세요.</div>
        ) : (
          authors.map((author) => {
            const display = nameMap[author] ?? author;
            const avatarUrl = avatarMap[author];

            return (
              <div
                key={author}
                className="rounded-lg border border-[#2B2D31] bg-[#1E1F22] p-3"
              >
                <div className="text-xs text-[#949BA4]">원본 이름</div>
                <div className="text-sm text-white mt-0.5 break-all">{author}</div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-xs text-[#949BA4] mb-1">표시 이름(치환)</div>
                    <input
                      className="w-full rounded-md bg-[#0F1012] border border-[#2B2D31] px-2 py-1.5 text-sm text-[#DBDEE1] outline-none focus:ring-2 focus:ring-[#5865F2]/60"
                      value={display}
                      onChange={(e) => onChangeName(author, e.target.value)}
                      placeholder="예: A / B / 나 / 너"
                    />
                  </label>

                  <div>
                    <div className="text-xs text-[#949BA4] mb-1">프로필 사진</div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs text-[#949BA4]"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onUploadAvatar(author, f);
                          e.currentTarget.value = "";
                        }}
                      />

                      <button
                        type="button"
                        className="rounded-md bg-[#2B2D31] hover:bg-[#3A3C42] px-2 py-1 text-xs disabled:opacity-50"
                        onClick={() => onRemoveAvatar(author)}
                        disabled={!avatarUrl}
                        title="이 작성자의 프로필 사진 삭제"
                      >
                        삭제
                      </button>
                    </div>

                    {avatarUrl && (
                      <img
                        src={avatarUrl}
                        alt={`${display} avatar`}
                        className="mt-2 h-12 w-12 rounded-full object-cover border border-[#2B2D31]"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}