"use client";

import React from "react";
import type { ParsedMessage } from "@/lib/parse";
import { hashStringToHsl, initials } from "@/lib/color";

type Props = {
    messages: ParsedMessage[];
    showTime: boolean;
    showDateDividers: boolean;

    // 추가 기능
    showAvatars: boolean; // 아바타 원형 자체 표시/숨김
    getDisplayName: (author: string) => string; // 원본 author -> 표시 이름
    getAvatarUrl: (author: string) => string | null; // 원본 author -> avatar dataUrl(or http url)
};

function formatDateKor(yyyy_mm_dd: string) {
    // "2026-02-20" -> "2026년 2월 20일"
    const [y, m, d] = yyyy_mm_dd.split("-").map((x) => Number(x));
    if (!y || !m || !d) return yyyy_mm_dd;
    return `${y}년 ${m}월 ${d}일`;
}

export default function ChatPreview({
    messages,
    showTime,
    showDateDividers,
    showAvatars,
    getDisplayName,
    getAvatarUrl,
}: Props) {
    return (
        <div className="rounded-xl border border-[#2B2D31] bg-[#313338] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2B2D31] bg-[#2B2D31]">
                <div className="text-sm text-[#949BA4]">미리보기</div>
            </div>

            <div className="p-2 sm:p-4">
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-[#949BA4]">
                        왼쪽에 디스코드 대화를 붙여넣으면 여기에 Discord 스타일로 표시돼요.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {messages.map((m, i) => {
                            const prev = messages[i - 1];
                            // ✅ 연속 메시지 묶기 기준은 "원본 author"로 유지 (표시이름이 같아져도 안정적)
                            const isNewAuthor = !prev || prev.author !== m.author;
                            const isNewDate = !prev || prev.date !== m.date;

                            const displayName = getDisplayName(m.author);
                            const avatarUrl = getAvatarUrl(m.author);

                            return (
                                <React.Fragment key={`${m.datetime}-${i}`}>
                                    {showDateDividers && isNewDate && (
                                        <div className="my-3 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-[#3F4147]" />
                                            <div className="text-xs text-[#949BA4]">{formatDateKor(m.date)}</div>
                                            <div className="h-px flex-1 bg-[#3F4147]" />
                                        </div>
                                    )}

                                    <div
                                        className={[
                                            "group rounded-md px-2 py-1 hover:bg-[#2B2D31] transition-colors",
                                            isNewAuthor ? "mt-2" : "mt-0",
                                        ].join(" ")}
                                    >
                                        <div className="flex gap-3">
                                            {/* Avatar (showAvatars=false면 칸 자체를 제거해서 왼쪽 빈 공간도 없어짐) */}
                                            {showAvatars && (
                                                <div className="w-10 shrink-0">
                                                    {isNewAuthor ? (
                                                        avatarUrl ? (
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
                                                        )
                                                    ) : (
                                                        // 연속 메시지면 아바타 자리만 유지해서 정렬감
                                                        <div className="h-10 w-10" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                {isNewAuthor && (
                                                    <div className="flex items-baseline gap-2">
                                                        <div className="font-semibold text-white">{displayName}</div>
                                                        {showTime && (
                                                            <div className="text-xs text-[#949BA4]">{m.rawTime}</div>
                                                        )}
                                                    </div>
                                                )}

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