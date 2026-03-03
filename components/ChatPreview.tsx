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
};

function formatDateKor(yyyy_mm_dd: string) {
  const [y, m, d] = yyyy_mm_dd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return yyyy_mm_dd;
  return `${y}년 ${m}월 ${d}일`;
}

/**
 * ✅ 연속 메시지(같은 author + 같은 date)를 하나의 블록으로 합침
 * - content는 "\n\n"로 이어붙임 (원하면 "\n"로 바꿔도 됨)
 * - rawTime/datetime는 "첫 메시지" 기준으로 유지
 */
function mergeConsecutive(messages: ParsedMessage[]): ParsedMessage[] {
  const out: ParsedMessage[] = [];
  for (const cur of messages) {
    const last = out[out.length - 1];

    const canMerge =
      last &&
      last.author === cur.author &&
      last.date === cur.date; // 같은 날짜 내 연속

    if (canMerge) {
      // 본문 합치기: 줄바꿈 1번/2번 취향대로 조절 가능
      last.content = `${last.content}\n${cur.content}`.trimEnd();
      // time은 첫 메시지 기준 유지 (원하면 마지막 시간으로 바꿀 수도 있음)
      continue;
    }

    // 새 블록 시작
    out.push({ ...cur });
  }
  return out;
}

export default function ChatPreview({
  messages,
  showTime,
  showDateDividers,
  showAvatars,
  getDisplayName,
  getAvatarUrl,
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

                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mt-0.5">
                          {m.content}
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
