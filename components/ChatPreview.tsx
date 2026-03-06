"use client";

import React, { useMemo } from "react";
import type { ParsedMessage } from "@/lib/parse";
import { hashStringToHsl, initials } from "@/lib/color";
import type { ThemeVars } from "@/lib/themes";

type Props = {
  messages: ParsedMessage[];
  showTime: boolean;
  showDateDividers: boolean;

  showAvatars: boolean;
  getDisplayName: (author: string) => string;
  getAvatarUrl: (author: string) => string | null;

  // ✅ 사용자명 컬러
  getNameColor: (author: string) => string | null;

  // ✅ inline image slots (원래 “이미지” 줄 -> [[IMG:slotId]])
  inlineImages: Record<string, string | undefined>; // slotId -> dataUrl
  onUploadInlineImage: (slotId: string, file: File) => void;
  onRemoveInlineImage: (slotId: string) => void;

  // ✅ emoji images (:name: -> image)
  emojiImages: Record<string, string | undefined>; // name -> dataUrl

  // ✅ 테마
  theme: ThemeVars;

  // ✅ 제목/상단바
  title: string;
  showHeaderBar: boolean;

  // ✅ PNG 캡처 중에는 빈 슬롯/편집 UI 숨김
  captureMode: boolean;
};

function formatDateKor(yyyy_mm_dd: string) {
  const [y, m, d] = yyyy_mm_dd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return yyyy_mm_dd;
  return `${y}년 ${m}월 ${d}일`;
}

function mergeConsecutive(messages: ParsedMessage[]): ParsedMessage[] {
  const out: ParsedMessage[] = [];
  for (const cur of messages) {
    const last = out[out.length - 1];
    const canMerge = last && last.author === cur.author && last.date === cur.date;

    if (canMerge) {
      last.content = `${last.content}\n${cur.content}`.trimEnd();
      continue;
    }
    out.push({ ...cur });
  }
  return out;
}

function getImgSlotId(line: string): string | null {
  const m = line.trim().match(/^\[\[IMG:([^\]]+)\]\]$/);
  return m ? m[1] : null;
}

function InlineImageSlot({
  dataUrl,
  onUpload,
  onRemove,
  captureMode,
  theme,
}: {
  dataUrl?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  captureMode: boolean;
  theme: ThemeVars;
}) {
  if (captureMode && !dataUrl) return null;

  return (
    <div className="my-2">
      {dataUrl ? (
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
          <img src={dataUrl} alt="inline" className="max-w-full h-auto block" />
          {!captureMode && (
            <div className="p-2 flex justify-end" style={{ background: theme.header }}>
              <button
                className="text-xs hover:underline"
                style={{ color: "#F23F43" }}
                onClick={onRemove}
                type="button"
              >
                이미지 제거
              </button>
            </div>
          )}
        </div>
      ) : (
        !captureMode && (
          <div
            className="rounded-lg border border-dashed p-3"
            style={{ borderColor: theme.divider, background: theme.header }}
          >
            <div className="text-xs mb-2" style={{ color: theme.subtext }}>
              이미지 슬롯
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.currentTarget.value = "";
                }}
              />
              <span className="rounded-md px-3 py-2 text-xs" style={{ background: theme.hover, color: theme.text }}>
                이미지 업로드
              </span>
            </label>
          </div>
        )
      )}
    </div>
  );
}

function extractEmojiNodes(line: string, emojiImages: Record<string, string | undefined>) {
  // 업로드 없는 이모지는 제거(텍스트만 제거, 주변 텍스트는 유지)
  const tokens = line.match(/:[^\s:]+:/g) ?? [];
  let normalized = line;
  for (const t of tokens) {
    const name = t.slice(1, -1);
    if (!emojiImages[name]) {
      normalized = normalized.replaceAll(t, "");
    }
  }
  normalized = normalized.replace(/[ \t]{2,}/g, " ").trimEnd();

  const parts: React.ReactNode[] = [];
  const re = /:([^\s:]+):/g;

  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(normalized)) !== null) {
    const start = m.index;
    const end = re.lastIndex;

    const before = normalized.slice(lastIdx, start);
    if (before) parts.push(before);

    const name = m[1];
    const url = emojiImages[name];
    if (url) {
      parts.push(
        <img
          key={`emoji-${name}-${start}`}
          src={url}
          alt={name}
          className="inline-block align-text-bottom"
          style={{ width: 28, height: 28 }}
          draggable={false}
        />
      );
    } else {
      parts.push("");
    }

    lastIdx = end;
  }

  const tail = normalized.slice(lastIdx);
  if (tail) parts.push(tail);

  return { normalized, nodes: parts };
}

export default function ChatPreview({
  messages,
  showTime,
  showDateDividers,
  showAvatars,
  getDisplayName,
  getAvatarUrl,
  getNameColor,
  inlineImages,
  onUploadInlineImage,
  onRemoveInlineImage,
  emojiImages,
  theme,
  title,
  showHeaderBar,
  captureMode,
}: Props) {
  const merged = useMemo(() => mergeConsecutive(messages), [messages]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${theme.border}`,
        background: theme.panel,
        color: theme.text,
      }}
    >
      {showHeaderBar && (
        <div className="px-4 py-3 border-b" style={{ borderColor: theme.border, background: theme.header }}>
          <div className="text-sm" style={{ color: theme.subtext }}>
            {title?.trim() ? title.trim() : "미리보기"}
          </div>
        </div>
      )}

      <div className="p-2 sm:p-4">
        {merged.length === 0 ? (
          <div className="p-8 text-center" style={{ color: theme.subtext }}>
            왼쪽에 디스코드 대화를 붙여넣으면 여기에 Discord 스타일로 표시돼요.
          </div>
        ) : (
          <div className="space-y-1">
            {merged.map((m, i) => {
              const prev = merged[i - 1];
              const isNewDate = !prev || prev.date !== m.date;

              const displayName = getDisplayName(m.author);
              const avatarUrl = getAvatarUrl(m.author);
              const nameColor = getNameColor(m.author);

              const lines = m.content.split("\n");

              return (
                <React.Fragment key={`${m.datetime}-${i}`}>
                  {showDateDividers && isNewDate && (
                    <div className="my-3 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: theme.divider }} />
                      <div className="text-xs" style={{ color: theme.subtext }}>
                        {formatDateKor(m.date)}
                      </div>
                      <div className="h-px flex-1" style={{ background: theme.divider }} />
                    </div>
                  )}

                  <div
                    className="group rounded-md px-2 py-1 transition-colors mt-2"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = theme.hover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
                    <div className="flex gap-3">
                      {showAvatars ? (
                        <div className="w-10 shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${displayName} avatar`}
                              className="h-10 w-10 rounded-full object-cover"
                              title={displayName}
                            />
                          ) : (
                            <div
                              className="h-10 w-10 rounded-full grid place-items-center font-semibold text-sm"
                              style={{ background: hashStringToHsl(displayName), color: "white" }}
                              aria-label={`${displayName} avatar`}
                              title={displayName}
                            >
                              {initials(displayName)}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <div className="font-semibold" style={{ color: nameColor ?? theme.text }}>
                            {displayName}
                          </div>
                          {showTime && (
                            <div className="text-xs" style={{ color: theme.subtext }}>
                              {m.rawTime}
                            </div>
                          )}
                        </div>

                        <div className="text-[15px] leading-relaxed break-words mt-0.5">
                          {lines.map((line, idx) => {
                            const slotId = getImgSlotId(line);
                            if (slotId) {
                              return (
                                <InlineImageSlot
                                  key={`img-${slotId}-${idx}`}
                                  dataUrl={inlineImages[slotId]}
                                  onUpload={(file) => onUploadInlineImage(slotId, file)}
                                  onRemove={() => onRemoveInlineImage(slotId)}
                                  captureMode={captureMode}
                                  theme={theme}
                                />
                              );
                            }

                            const { normalized, nodes } = extractEmojiNodes(line, emojiImages);
                            if (normalized.trim() === "") return null;

                            const isLast = idx === lines.length - 1;
                            return (
                              <React.Fragment key={`t-${idx}`}>
                                <span className="whitespace-pre-wrap">{nodes}</span>
                                {!isLast ? <br /> : null}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
