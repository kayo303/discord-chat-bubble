"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

import PasteInput from "@/components/PasteInput";
import ChatPreview from "@/components/ChatPreview";
import IdentityPanel from "@/components/IdentityPanel";

import { parseDiscordPaste } from "@/lib/parse";

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("file read failed"));
        r.readAsDataURL(file);
    });
}

export default function Page() {
    const [raw, setRaw] = useState("");

    // 기존 옵션
    const [showTime, setShowTime] = useState(true);
    const [showDateDividers, setShowDateDividers] = useState(true);
    const [pixelRatio, setPixelRatio] = useState(2);

    // ✅ 추가 옵션
    const [showAvatars, setShowAvatars] = useState(true); // 아바타 원형 자체 표시/숨김
    const [nameMap, setNameMap] = useState<Record<string, string>>({}); // author -> displayName
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>({}); // author -> dataUrl

    const captureRef = useRef<HTMLDivElement>(null);

    const messages = useMemo(() => parseDiscordPaste(raw), [raw]);

    // 작성자 목록 자동 추출
    const authors = useMemo(() => {
        const set = new Set<string>();
        for (const m of messages) set.add(m.author);
        return Array.from(set);
    }, [messages]);

    // 파싱 힌트
    const parseHint = useMemo(() => {
        if (!raw.trim()) return "";
        if (messages.length > 0) return "";
        return "메시지를 인식하지 못했어요. 헤더 줄이 ‘작성자 — 2026-02-20 오전 12:39’ 형태인지 확인해줘!";
    }, [raw, messages.length]);

    // 표시 이름/아바타 조회 함수
    const getDisplayName = (author: string) => {
        const v = nameMap[author];
        return v && v.trim() ? v.trim() : author;
    };

    const getAvatarUrl = (author: string) => {
        return avatarMap[author] ?? null;
    };

    // 이름 변경
    function onChangeName(author: string, value: string) {
        setNameMap((prev) => ({ ...prev, [author]: value }));
    }

    // 아바타 업로드/삭제
    async function onUploadAvatar(author: string, file: File) {
        const url = await fileToDataUrl(file);
        setAvatarMap((prev) => ({ ...prev, [author]: url }));
    }

    function onRemoveAvatar(author: string) {
        setAvatarMap((prev) => {
            const next = { ...prev };
            delete next[author];
            return next;
        });
    }

    // PNG 다운로드
    async function downloadPng() {
        if (!captureRef.current) return;

        try {
            const dataUrl = await toPng(captureRef.current, {
                pixelRatio: Math.max(1, Math.min(4, pixelRatio)),
                cacheBust: true,
            });

            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = "discord-chat.png";
            a.click();
        } catch (e) {
            alert(
                "이미지 저장에 실패했어. (브라우저가 차단했거나, 내용이 너무 길 수 있어)\n\n" +
                String(e)
            );
        }
    }

    // 샘플(개인정보 없는 더미)
    function loadSample() {
        setRaw(
            `Saint — 2022-02-18 오전 6:30
영원히 안녕. 나의 대발명가.`
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Discord 대화 말풍선 정리기
                </h1>
                <p className="mt-2 text-sm text-[#949BA4]">
                    디스코드 대화를 복사/붙여넣기하면 Discord 느낌으로 예쁘게 정리하고 PNG로 저장할 수 있어요.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 왼쪽: 입력/설정 */}
                <div className="space-y-4">
                    <PasteInput value={raw} onChange={setRaw} />

                    {/* ✅ 이름/프로필 설정 */}
                    <IdentityPanel
                        authors={authors}
                        nameMap={nameMap}
                        avatarMap={avatarMap}
                        onChangeName={onChangeName}
                        onUploadAvatar={onUploadAvatar}
                        onRemoveAvatar={onRemoveAvatar}
                    />

                    {/* 옵션/저장 */}
                    <div className="rounded-xl border border-[#2B2D31] bg-[#313338] p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="accent-[#5865F2]"
                                    checked={showTime}
                                    onChange={(e) => setShowTime(e.target.checked)}
                                />
                                시간 표시
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="accent-[#5865F2]"
                                    checked={showDateDividers}
                                    onChange={(e) => setShowDateDividers(e.target.checked)}
                                />
                                날짜 구분선
                            </label>

                            {/* ✅ 아바타 원형 자체 숨김 */}
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="accent-[#5865F2]"
                                    checked={showAvatars}
                                    onChange={(e) => setShowAvatars(e.target.checked)}
                                />
                                아바타 표시
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                                PNG 품질
                                <select
                                    className="rounded-md bg-[#1E1F22] border border-[#2B2D31] px-2 py-1 text-sm"
                                    value={pixelRatio}
                                    onChange={(e) => setPixelRatio(Number(e.target.value))}
                                >
                                    <option value={1}>낮음(1x)</option>
                                    <option value={2}>보통(2x)</option>
                                    <option value={3}>높음(3x)</option>
                                    <option value={4}>최고(4x)</option>
                                </select>
                            </label>

                            <div className="ml-auto flex gap-2">
                                <button
                                    className="rounded-lg bg-[#2B2D31] hover:bg-[#3A3C42] px-3 py-2 text-sm"
                                    onClick={loadSample}
                                >
                                    샘플 넣기
                                </button>
                                <button
                                    className="rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    onClick={downloadPng}
                                    disabled={messages.length === 0}
                                >
                                    PNG로 저장
                                </button>
                            </div>
                        </div>

                        {parseHint && <div className="mt-3 text-sm text-[#F23F43]">{parseHint}</div>}

                        <div className="mt-3 text-xs text-[#949BA4]">
                            팁) 너무 긴 대화는 PNG 생성이 실패할 수 있어요. 그럴 땐 대화를 나눠서 저장해줘!
                        </div>
                    </div>

                    {/* 디버그 */}
                    <details className="rounded-xl border border-[#2B2D31] bg-[#313338] p-4">
                        <summary className="cursor-pointer text-sm text-[#DBDEE1]">
                            파싱된 JSON 보기(디버그)
                        </summary>
                        <pre className="mt-3 overflow-auto rounded-lg bg-[#1E1F22] border border-[#2B2D31] p-3 text-xs text-[#DBDEE1]">
                            {JSON.stringify(messages, null, 2)}
                        </pre>
                    </details>
                </div>

                {/* 오른쪽: 미리보기(캡처 대상) */}
                <div>
                    <div ref={captureRef}>
                        <ChatPreview
                            messages={messages}
                            showTime={showTime}
                            showDateDividers={showDateDividers}
                            showAvatars={showAvatars}
                            getDisplayName={getDisplayName}
                            getAvatarUrl={getAvatarUrl}
                        />
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-xs text-[#949BA4]">
                <div>지원 포맷: “작성자 — YYYY-MM-DD 오전/오후 H:MM”</div>
            </footer>
        </main>
    );
}