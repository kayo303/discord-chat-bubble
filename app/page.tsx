"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

import PasteInput from "@/components/PasteInput";
import ChatPreview from "@/components/ChatPreview";
import IdentityPanel from "@/components/IdentityPanel";

import { parseDiscordPaste } from "@/lib/parse";
import { THEMES, type ThemeKey } from "@/lib/themes";
import type { Sticker } from "@/components/StickerLayer";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("file read failed"));
    r.readAsDataURL(file);
  });
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export default function Page() {
  const [raw, setRaw] = useState("");

  // 기존 옵션
  const [showTime, setShowTime] = useState(true);
  const [showDateDividers, setShowDateDividers] = useState(true);
  const [pixelRatio, setPixelRatio] = useState(2);

  // 아바타/이름
  const [showAvatars, setShowAvatars] = useState(true);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});

  // ✅ 사용자명 색상
  const [nameColorMap, setNameColorMap] = useState<Record<string, string>>({}); // author -> hex

  // ✅ inline 이미지 슬롯
  const [inlineImages, setInlineImages] = useState<Record<string, string>>({}); // slotId -> dataUrl
  const [captureMode, setCaptureMode] = useState(false);

  // ✅ emoji 업로드 매핑
  const [emojiImages, setEmojiImages] = useState<Record<string, string>>({}); // name -> dataUrl

  // ✅ 스티커
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // ✅ 테마
  const [themeKey, setThemeKey] = useState<ThemeKey>("dark");
  const theme = THEMES[themeKey];

  // ✅ 제목/상단
  const [title, setTitle] = useState("대화 미리보기");
  const [showHeaderBar, setShowHeaderBar] = useState(true);

  const captureRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => parseDiscordPaste(raw), [raw]);

  // 작성자 목록
  const authors = useMemo(() => {
    const set = new Set<string>();
    for (const m of messages) set.add(m.author);
    return Array.from(set);
  }, [messages]);

  // 파싱 힌트
  const parseHint = useMemo(() => {
    if (!raw.trim()) return "";
    if (messages.length > 0) return "";
    return "메시지를 인식하지 못했어요. 헤더 줄이 ‘작성자 — 2026-02-20 오전 12:39’ 형태인지 확인해주세요.";
  }, [raw, messages.length]);

  // 원문에서 이모지 이름들 추출(:name:)
  const emojiNames = useMemo(() => {
    const set = new Set<string>();
    const re = /:([^\s:]+):/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
      set.add(m[1]);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [raw]);

  // 표시 이름/아바타
  const getDisplayName = (author: string) => {
    const v = nameMap[author];
    return v && v.trim() ? v.trim() : author;
  };
  const getAvatarUrl = (author: string) => {
    return avatarMap[author] ?? null;
  };

  // ✅ 사용자명 컬러
  const getNameColor = (author: string) => {
    return nameColorMap[author] ?? null;
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

  // ✅ inline 이미지 업로드/삭제
  async function onUploadInlineImage(slotId: string, file: File) {
    const url = await fileToDataUrl(file);
    setInlineImages((prev) => ({ ...prev, [slotId]: url }));
  }

  function onRemoveInlineImage(slotId: string) {
    setInlineImages((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }

  // ✅ emoji 업로드/삭제
  async function onUploadEmoji(name: string, file: File) {
    const url = await fileToDataUrl(file);
    setEmojiImages((prev) => ({ ...prev, [name]: url }));
  }

  function onRemoveEmoji(name: string) {
    setEmojiImages((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  // ✅ 스티커 추가
  async function addSticker(file: File) {
    const url = await fileToDataUrl(file);

    // 이미지 비율 대충 반영해서 높이 계산
    const img = new Image();
    img.src = url;
    await new Promise((r) => {
      img.onload = () => r(null);
      img.onerror = () => r(null);
    });

    const ratio = img.width && img.height ? img.height / img.width : 1;
    const w = 0.22; // 캔버스 기준 22%
    const h = Math.min(0.6, w * ratio);

    const s: Sticker = {
      id: uid("sticker"),
      dataUrl: url,
      x: 0.65,
      y: 0.1,
      w,
      h,
    };
    setStickers((prev) => [...prev, s]);
  }

  function clearStickers() {
    setStickers([]);
  }

  // PNG 다운로드
  async function downloadPng() {
    if (!captureRef.current) return;

    try {
      // ✅ 캡처 모드: “빈 이미지 슬롯 숨김”, “스티커 편집 UI 숨김”
      setCaptureMode(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));

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
        "이미지 저장에 실패했어요. (브라우저가 차단했거나, 내용이 너무 길 수 있어요)\n\n" +
          String(e)
      );
    } finally {
      setCaptureMode(false);
    }
  }

  // 샘플
  function loadSample() {
    setRaw(`Saint — 2022-02-18 오전 6:30
영원히 안녕. 나의 대발명가. :emoji:
이미지`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8" style={{ background: theme.bg }}>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>
          Discord 대화 말풍선 정리기
        </h1>
        <p className="mt-2 text-sm" style={{ color: theme.subtext }}>
          디스코드 대화를 복사/붙여넣기하면 Discord 느낌으로 예쁘게 정리하고 PNG로 저장할 수 있어요.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 왼쪽: 입력/설정 */}
        <div className="space-y-4">
          <PasteInput value={raw} onChange={setRaw} />

          {/* 기존 IdentityPanel 그대로 사용 */}
          <IdentityPanel
            authors={authors}
            nameMap={nameMap}
            avatarMap={avatarMap}
            onChangeName={onChangeName}
            onUploadAvatar={onUploadAvatar}
            onRemoveAvatar={onRemoveAvatar}
          />

          {/* ✅ 새 기능 패널: 제목/테마/닉네임색/이모지/스티커 */}
          <div className="rounded-xl p-4" style={{ border: `1px solid ${theme.border}`, background: theme.panel }}>
            <div className="font-semibold mb-3" style={{ color: theme.text }}>
              추가 커스텀
            </div>

            {/* 제목/상단 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm" style={{ color: theme.subtext }}>
                이미지 제목
                <input
                  className="mt-1 w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{
                    background: theme.header,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예) 2026-03-03 대화"
                />
              </label>

              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                  <input
                    type="checkbox"
                    className="accent-[#5865F2]"
                    checked={showHeaderBar}
                    onChange={(e) => setShowHeaderBar(e.target.checked)}
                  />
                  상단바 표시
                </label>

                <label className="text-sm ml-auto" style={{ color: theme.subtext }}>
                  테마
                  <select
                    className="mt-1 w-full rounded-md px-2 py-2 text-sm outline-none"
                    style={{
                      background: theme.header,
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
                    value={themeKey}
                    onChange={(e) => setThemeKey(e.target.value as ThemeKey)}
                  >
                    {Object.values(THEMES).map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* 사용자명 색 */}
            <div className="mt-4">
              <div className="text-sm mb-2" style={{ color: theme.subtext }}>
                사용자명 색상
              </div>
              {authors.length === 0 ? (
                <div className="text-xs" style={{ color: theme.subtext }}>
                  작성자가 감지되면 여기서 색을 지정할 수 있어요.
                </div>
              ) : (
                <div className="space-y-2">
                  {authors.map((a) => (
                    <div key={a} className="flex items-center gap-3">
                      <div className="text-sm" style={{ color: theme.text, minWidth: 140 }}>
                        {getDisplayName(a)}
                      </div>
                      <input
                        type="color"
                        value={nameColorMap[a] ?? "#ffffff"}
                        onChange={(e) => setNameColorMap((p) => ({ ...p, [a]: e.target.value }))}
                        className="h-8 w-12 rounded"
                        title="이름 색상 선택"
                      />
                      <button
                        type="button"
                        className="text-xs hover:underline"
                        style={{ color: theme.subtext }}
                        onClick={() =>
                          setNameColorMap((p) => {
                            const n = { ...p };
                            delete n[a];
                            return n;
                          })
                        }
                      >
                        기본값으로
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 이모지 업로드 */}
            <div className="mt-5">
              <div className="text-sm mb-2" style={{ color: theme.subtext }}>
                이모티콘 업로드 매핑 (:이름:)
              </div>
              {emojiNames.length === 0 ? (
                <div className="text-xs" style={{ color: theme.subtext }}>
                  텍스트에 :이모지이름: 형식이 있으면 자동으로 목록이 생겨요.
                </div>
              ) : (
                <div className="space-y-2">
                  {emojiNames.map((name) => {
                    const url = emojiImages[name];
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-lg px-2 py-2"
                        style={{ background: theme.header, border: `1px solid ${theme.border}` }}
                      >
                        <div className="text-sm" style={{ color: theme.text, minWidth: 160 }}>
                          :{name}:
                        </div>

                        {url ? (
                          <img src={url} alt={name} style={{ width: 22, height: 22 }} />
                        ) : (
                          <div className="text-xs" style={{ color: theme.subtext }}>
                            업로드 없음 → 출력 시 자동 삭제
                          </div>
                        )}

                        <label className="ml-auto cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) onUploadEmoji(name, f);
                              e.currentTarget.value = "";
                            }}
                          />
                          <span
                            className="rounded-md px-3 py-2 text-xs"
                            style={{ background: theme.hover, color: theme.text }}
                          >
                            업로드
                          </span>
                        </label>

                        {url && (
                          <button
                            type="button"
                            className="text-xs hover:underline"
                            style={{ color: "#F23F43" }}
                            onClick={() => onRemoveEmoji(name)}
                          >
                            제거
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 스티커 */}
            <div className="mt-5">
              <div className="text-sm mb-2" style={{ color: theme.subtext }}>
                스티커(캡처 영역 어디든 붙이기)
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addSticker(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <span
                    className="rounded-md px-3 py-2 text-xs"
                    style={{ background: theme.hover, color: theme.text }}
                  >
                    스티커 추가
                  </span>
                </label>

                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-xs"
                  style={{ background: theme.header, color: theme.subtext, border: `1px solid ${theme.border}` }}
                  onClick={clearStickers}
                >
                  스티커 전체 삭제
                </button>

                <div className="ml-auto text-xs" style={{ color: theme.subtext }}>
                  스티커는 미리보기에서 드래그로 이동 가능
                </div>
              </div>
            </div>
          </div>

          {/* 옵션/저장 */}
          <div className="rounded-xl p-4" style={{ border: `1px solid ${theme.border}`, background: theme.panel }}>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                <input
                  type="checkbox"
                  className="accent-[#5865F2]"
                  checked={showTime}
                  onChange={(e) => setShowTime(e.target.checked)}
                />
                시간 표시
              </label>

              <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                <input
                  type="checkbox"
                  className="accent-[#5865F2]"
                  checked={showDateDividers}
                  onChange={(e) => setShowDateDividers(e.target.checked)}
                />
                날짜 구분선
              </label>

              <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                <input
                  type="checkbox"
                  className="accent-[#5865F2]"
                  checked={showAvatars}
                  onChange={(e) => setShowAvatars(e.target.checked)}
                />
                아바타 표시
              </label>

              <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                PNG 품질
                <select
                  className="rounded-md px-2 py-1 text-sm outline-none"
                  style={{
                    background: theme.header,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                  }}
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
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: theme.header, color: theme.text, border: `1px solid ${theme.border}` }}
                  onClick={loadSample}
                  type="button"
                >
                  샘플 넣기
                </button>
                <button
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#5865F2" }}
                  onClick={downloadPng}
                  disabled={messages.length === 0}
                  type="button"
                >
                  PNG로 저장
                </button>
              </div>
            </div>

            {parseHint && <div className="mt-3 text-sm" style={{ color: "#F23F43" }}>{parseHint}</div>}

            <div className="mt-3 text-xs" style={{ color: theme.subtext }}>
              팁) 너무 긴 대화는 PNG 생성에 실패할 수 있어요.
            </div>
          </div>

          {/* 디버그 */}
          <details className="rounded-xl p-4" style={{ border: `1px solid ${theme.border}`, background: theme.panel }}>
            <summary className="cursor-pointer text-sm" style={{ color: theme.text }}>
              파싱된 JSON 보기(디버그)
            </summary>
            <pre
              className="mt-3 overflow-auto rounded-lg p-3 text-xs"
              style={{ background: theme.header, border: `1px solid ${theme.border}`, color: theme.text }}
            >
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
              getNameColor={getNameColor}
              inlineImages={inlineImages}
              onUploadInlineImage={onUploadInlineImage}
              onRemoveInlineImage={onRemoveInlineImage}
              emojiImages={emojiImages}
              stickers={stickers}
              setStickers={setStickers}
              theme={theme}
              title={title}
              showHeaderBar={showHeaderBar}
              captureMode={captureMode}
            />
          </div>
        </div>
      </div>

      <footer className="mt-8 text-xs" style={{ color: theme.subtext }}>
        <div>지원 포맷: “작성자 — YYYY-MM-DD 오전/오후 H:MM”</div>
      </footer>
    </main>
  );
}
