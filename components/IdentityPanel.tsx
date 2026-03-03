"use client";

import React from "react";
import type { ThemeVars } from "@/lib/themes";

type Props = {
  authors: string[];

  nameMap: Record<string, string>;
  avatarMap: Record<string, string>;

  // ✅ 추가: 사용자명 색상
  nameColorMap: Record<string, string>;

  onChangeName: (author: string, value: string) => void;
  onUploadAvatar: (author: string, file: File) => void;
  onRemoveAvatar: (author: string) => void;

  // ✅ 추가
  onChangeNameColor: (author: string, hex: string) => void;
  onResetNameColor: (author: string) => void;

  // ✅ 테마
  theme: ThemeVars;

  // displayName resolver(선택)
  getDisplayName?: (author: string) => string;
};

export default function IdentityPanel({
  authors,
  nameMap,
  avatarMap,
  nameColorMap,
  onChangeName,
  onUploadAvatar,
  onRemoveAvatar,
  onChangeNameColor,
  onResetNameColor,
  theme,
  getDisplayName,
}: Props) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ border: `1px solid ${theme.border}`, background: theme.panel }}
    >
      <div className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
        이름/프로필 설정
      </div>

      {authors.length === 0 ? (
        <div className="text-xs" style={{ color: theme.subtext }}>
          대화를 붙여넣으면 작성자 목록이 여기에 표시돼요.
        </div>
      ) : (
        <div className="space-y-3">
          {authors.map((author) => {
            const display = getDisplayName
              ? getDisplayName(author)
              : (nameMap[author]?.trim() ? nameMap[author].trim() : author);

            const avatarUrl = avatarMap[author];
            const color = nameColorMap[author] ?? "#111111";

            return (
              <div
                key={author}
                className="rounded-lg p-3"
                style={{ background: theme.header, border: `1px solid ${theme.border}` }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* 원본 이름 */}
                  <div className="sm:col-span-3">
                    <div className="text-[11px]" style={{ color: theme.subtext }}>
                      원본 이름
                    </div>
                    <div className="text-sm font-semibold" style={{ color: theme.text }}>
                      {author}
                    </div>
                  </div>

                  {/* 표시 이름 */}
                  <div className="sm:col-span-4">
                    <div className="text-[11px]" style={{ color: theme.subtext }}>
                      표시 이름(치환)
                    </div>
                    <input
                      className="mt-1 w-full rounded-md px-3 py-2 text-sm outline-none"
                      style={{
                        background: theme.panel,
                        border: `1px solid ${theme.border}`,
                        color: theme.text,
                      }}
                      value={nameMap[author] ?? ""}
                      onChange={(e) => onChangeName(author, e.target.value)}
                      placeholder={author}
                    />
                  </div>

                  {/* 사용자명 색상 */}
                  <div className="sm:col-span-2">
                    <div className="text-[11px]" style={{ color: theme.subtext }}>
                      이름 색상
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={nameColorMap[author] ?? "#111111"}
                        onChange={(e) => onChangeNameColor(author, e.target.value)}
                        className="h-9 w-12 rounded"
                        title="이름 색상"
                      />
                      <button
                        type="button"
                        className="text-xs hover:underline"
                        style={{ color: theme.subtext }}
                        onClick={() => onResetNameColor(author)}
                      >
                        기본
                      </button>
                    </div>
                  </div>

                  {/* 프로필 사진 */}
                  <div className="sm:col-span-3">
                    <div className="text-[11px]" style={{ color: theme.subtext }}>
                      프로필 사진
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={`${display} avatar`}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-9 w-9 rounded-full"
                          style={{ background: theme.hover, border: `1px solid ${theme.border}` }}
                          title="없음"
                        />
                      )}

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onUploadAvatar(author, f);
                            e.currentTarget.value = "";
                          }}
                        />
                        <span
                          className="inline-flex items-center rounded-md px-3 py-2 text-xs"
                          style={{ background: theme.hover, color: theme.text }}
                        >
                          업로드
                        </span>
                      </label>

                      <button
                        type="button"
                        className="inline-flex items-center rounded-md px-3 py-2 text-xs"
                        style={{
                          background: theme.panel,
                          color: theme.subtext,
                          border: `1px solid ${theme.border}`,
                        }}
                        onClick={() => onRemoveAvatar(author)}
                      >
                        삭제
                      </button>
                    </div>

                    {/* 미리보기 컬러 느낌 표시 */}
                    <div className="mt-2 text-xs" style={{ color: theme.subtext }}>
                      미리보기:{" "}
                      <span style={{ color, fontWeight: 700 }}>{display}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
