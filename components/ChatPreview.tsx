"use client";

import React, { useMemo } from "react";
import type { ParsedMessage } from "@/lib/parse";
import { hashStringToHsl, initials } from "@/lib/color";

type Props = {
  messages: ParsedMessage[];
  showTime: boolean;
  showDateDividers: boolean;

  showAvatars: boolean;
  getDisplayName: (author: string) => string;
  getAvatarUrl: (author: string) => string | null;

  // ✅ inline image slots
  inlineImages: Record<string, string | undefined>; // slotId -> dataUrl
  onUploadInlineImage: (slotId: string, file: File) => void;
  onRemoveInlineImage: (slotId: string) => void;

  // ✅ PNG 캡처 중에는 빈 슬롯 숨김
  captureMode: boolean;
};

function formatDateKor(yyyy_mm_dd: string) {
  const [y, m, d] = yyyy_mm_dd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return yyyy_mm_dd;
  return `${y}년 ${m}월 ${d}일`;
}

/**
 * ✅ 연속 메시지(같은 author + 같은 date)를 하나의 블록으로 합침
 * - content는 "\n"로 이어붙임
 * - rawTime/datetime는 "첫 메시지" 기준 유지
 */
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
  slotId,
  dataUrl,
  onUpload,
  onRemove,
  captureMode,
}: {
  slotId: string;
  dataUrl?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  captureMode: boolean;
}) {
  // ✅ 캡처 모드에서는 “빈 슬롯”은 아예 렌더링 안 함
  if (captureMode && !dataUrl) return null;

  return (
    <div className="my-2">
      {dataUrl ? (
        <div className="rounded-lg overflow-hidden border border-[#2B2D31]">
          <img src={dataUrl} alt="inline" className="max-w-full h-auto block" />
          {!captureMode && (
            <div className="p-2 bg-[#1E1F22] flex justify-end">
              <button
                className="text-xs text-[#F23F43] hover:underline"
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
          <div className="rounded-lg border border-dashed border-[#3F4147] bg-[#1E1F22] p-3">
            <div className="text-xs text-[#949BA4] mb-2">이미지 슬롯</div>
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
              <span className="rounded-md bg-[#2B2D31] hover:bg-[#3A3C42] px-3 py-2 text-xs">
                이미지 업로드
              </span>
            </label>
          </div>
        )
      )}
    </div>
  );
}

export default function ChatPreview({
  messages,
  showTime,
  showDateDividers,
  showAvatars,
  getDisplayName,
  getAvatarUrl,

  inlineImages,
  onUploadInlineImage,
  onRemoveInlineImage,
  captureMode,
}: Props) {
  const merged = useMemo(() => mergeConsecutive(messages), [messages]);

  return (
    <div className="rounded-xl border border-[#2B2D31] bg-[#313338] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2B2D31] bg-[#2B2D31]">
        <div className="text-sm text-[#949BA4]">미리보기</div>
      </div>

      <div className="p-2 sm:p-4">
        {merged.length === 0 ? (
          <div className="p-8 text-center text-[#949BA4]">
            왼쪽에 디스코드 대화를 붙여넣으면 여기에 Discord 스타일로 표시돼요.
          </div>
        ) : (
          <div className="space-y-1">
            {merged.map((m, i) => {
              const prev = merged[i - 1];
              const isNewDate = !prev || prev.date !== m.date;

              const displayName = getDisplayName(m.author);
              const avatarUrl = getAvatarUrl(m.author);

              const lines = m.content.split("\n");

              return (
                <React.Fragment key={`${m.datetime}-${i}`}>
                  {showDateDividers && isNewDate && (
                    <div className="my-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#3F4147]" />
                      <div className="text-xs text-[#949BA4]">
                        {formatDateKor(m.date)}
                      </div>
                      <div className="h-px flex-1 bg-[#3F4147]" />
                    </div>
                  )}

                  <div className="group rounded-md px-2 py-1 hover:bg-[#2B2D31] transition-colors mt-2">
                    <div className="flex gap-3">
                      {/* Avatar */}
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
                              className="h-10 w-10 rounded-full grid place-items-center font-semibold text-sm text-white"
                              style={{ background: hashStringToHsl(displayName) }}
                              aria-label={`${displayName} avatar`}
                              title={displayName}
                            >
                              {initials(displayName)}
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <div className="font-semibold text-white">
                            {displayName}
                          </div>
                          {showTime && (
                            <div className="text-xs text-[#949BA4]">{m.rawTime}</div>
                          )}
                        </div>

                        <div className="text-[15px] leading-relaxed break-words mt-0.5">
                          {lines.map((line, idx) => {
                            const slotId = getImgSlotId(line);
                            if (slotId) {
                              return (
                                <InlineImageSlot
                                  key={`img-${slotId}-${idx}`}
                                  slotId={slotId}
                                  dataUrl={inlineImages[slotId]}
                                  onUpload={(file) => onUploadInlineImage(slotId, file)}
                                  onRemove={() => onRemoveInlineImage(slotId)}
                                  captureMode={captureMode}
                                />
                              );
                            }

                            // 일반 텍스트 줄 (빈 줄도 유지)
                            const isLast = idx === lines.length - 1;
                            return (
                              <React.Fragment key={`t-${idx}`}>
                                <span className="whitespace-pre-wrap">{line}</span>
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
