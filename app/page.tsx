"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

import PasteInput from "@/components/PasteInput";
import ChatPreview from "@/components/ChatPreview";
import IdentityPanel from "@/components/IdentityPanel";

import { parseDiscordPaste } from "@/lib/parse";
import { THEMES, type ThemeKey } from "@/lib/themes";

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

  // 옵션
  const [showTime, setShowTime] = useState(true);
  const [showDateDividers, setShowDateDividers] = useState(true);
  const [pixelRatio, setPixelRatio] = useState(2);

  // 아바타/이름
  const [showAvatars, setShowAvatars] = useState(true);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});

  // ✅ 사용자명 색상 (IdentityPanel로 이동)
  const [nameColorMap, setNameColorMap] = useState<Record<string, string>>({}); // author -> hex

  // inline 이미지 슬롯
  const [inlineImages, setInlineImages] = useState<Record<string, string>>({}); // slotId -> dataUrl
  const [captureMode, setCaptureMode] = useState(false);

  // emoji 업로드 매핑
  const [emojiImages, setEmojiImages] = useState<Record<string, string>>({}); // name -> dataUrl

  // 테마
  const [themeKey, setThemeKey] = useState<ThemeKey>("dark");
  const theme = THEMES[themeKey];

  // 제목/상단
  const [title, setTitle] = useState("대화 이미지");
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

  // 원문에서 이모지 이름 추출(:name:)
  const emojiNames = useMemo(() => {
    const set = new Set<string>();
    const re = /:([^\s:]+):/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) set.add(m[1]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [raw]);

  // 표시 이름/아바타
  const getDisplayName = (author: string) => {
    const v = nameMap[author];
    return v && v.trim() ? v.trim() : author;
  };
  const getAvatarUrl = (author: string) => avatarMap[author] ?? null;

  // 사용자명 컬러
  const getNameColor = (author: string) => nameColorMap[author] ?? null;

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

  // ✅ 이름 색상 변경/리셋
  function onChangeNameColor(author: string, hex: string) {
    setNameColorMap((prev) => ({ ...prev, [author]: hex }));
  }
  function onResetNameColor(author: string) {
    setNameColorMap((prev) => {
      const next = { ...prev };
      delete next[author];
      return next;
    });
  }

  // inline 이미지 업로드/삭제
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

  // emoji 업로드/삭제
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

  // PNG 다운로드
  async function downloadPng() {
    if (!captureRef.current) return;

    try {
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
        {/* 왼쪽 */}
        <div className="space-y-4">
          {/* 1) 입력 */}
          <PasteInput value={raw} onChange={setRaw} />

          {/* 2) 이름/프로필 + 이름색상 (테마 적용된 IdentityPanel) */}
          <IdentityPanel
            authors={authors}
            nameMap={nameMap}
            avatarMap={avatarMap}
            nameColorMap={nameColorMap}
            onChangeName={onChangeName}
            onUploadAvatar={onUploadAvatar}
            onRemoveAvatar={onRemoveAvatar}
            onChangeNameColor={onChangeNameColor}
            onResetNameColor={onResetNameColor}
            theme={theme}
            getDisplayName={getDisplayName}
          />

          {/* 3) 화면/테마/제목 */}
          <div
            className="rounded-xl p-4"
            style={{ border: `1px solid ${theme.border}`, background: theme.panel }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
              화면 설정
            </div>

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

              <label className="text-sm" style={{ color: theme.subtext }}>
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

            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                <input
                  type="checkbox"
                  className="accent-[#5865F2]"
                  checked={showHeaderBar}
                  onChange={(e) => setShowHeaderBar(e.target.checked)}
                />
                상단바 표시
              </label>

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
            </div>
          </div>

          {/* 4) 이모지 업로드 매핑 */}
          <div
            className="rounded-xl p-4"
            style={{ border: `1px solid ${theme.border}`, background: theme.panel }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
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

          {/* 5) 저장 */}
          <div
            className="rounded-xl p-4"
            style={{ border: `1px solid ${theme.border}`, background: theme.panel }}
          >
            <div className="flex flex-wrap items-center gap-3">
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

            {parseHint && (
              <div className="mt-3 text-sm" style={{ color: "#F23F43" }}>
                {parseHint}
              </div>
            )}

            <div className="mt-3 text-xs" style={{ color: theme.subtext }}>
              팁) 너무 긴 대화는 PNG 생성에 실패할 수 있어요.
            </div>
          </div>
        </div>

        {/* 오른쪽 */}
        <div>
          <div ref={captureRef}>
            <ChatPreview
              messages={messages}
              showTime={showTime}
              showDateDividers={showDateDividers}
              showAvatars={showAvatars}
              getDisplayName={getDisplayName}
              getAvatarUrl={getAvatarUrl}
              getNameColor={(a) => nameColorMap[a] ?? null}
              inlineImages={inlineImages}
              onUploadInlineImage={async (slotId, file) => {
                const url = await fileToDataUrl(file);
                setInlineImages((prev) => ({ ...prev, [slotId]: url }));
              }}
              onRemoveInlineImage={(slotId) => {
                setInlineImages((prev) => {
                  const next = { ...prev };
                  delete next[slotId];
                  return next;
                });
              }}
              emojiImages={emojiImages}
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
