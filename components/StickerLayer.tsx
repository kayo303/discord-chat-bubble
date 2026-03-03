"use client";

import React, { useMemo, useRef, useState } from "react";

export type Sticker = {
  id: string;
  dataUrl: string;
  // 0~1 비율 좌표(캔버스 기준)
  x: number;
  y: number;
  w: number;
  h: number;
};

type Props = {
  stickers: Sticker[];
  setStickers: (next: Sticker[]) => void;

  // 캡처 중이면 편집 UI 숨김/드래그 비활성화
  captureMode: boolean;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function StickerLayer({ stickers, setStickers, captureMode }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () => stickers.find((s) => s.id === activeId) ?? null,
    [stickers, activeId]
  );

  function updateSticker(id: string, patch: Partial<Sticker>) {
    setStickers(
      stickers.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function removeSticker(id: string) {
    setActiveId((cur) => (cur === id ? null : cur));
    setStickers(stickers.filter((s) => s.id !== id));
  }

  function onPointerDownSticker(
    e: React.PointerEvent,
    id: string
  ) {
    if (captureMode) return;

    e.preventDefault();
    e.stopPropagation();

    setActiveId(id);

    const wrap = wrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const target = stickers.find((s) => s.id === id);
    if (!target) return;

    const startStickerX = target.x;
    const startStickerY = target.y;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      updateSticker(id, { x: clamp01(startStickerX + dx), y: clamp01(startStickerY + dy) });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onClickBackground() {
    if (captureMode) return;
    setActiveId(null);
  }

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0"
      onPointerDown={onClickBackground}
    >
      {stickers.map((s) => {
        const isActive = s.id === activeId;
        const left = `${s.x * 100}%`;
        const top = `${s.y * 100}%`;
        const width = `${s.w * 100}%`;
        const height = `${s.h * 100}%`;

        return (
          <div
            key={s.id}
            className="absolute"
            style={{ left, top, width, height }}
            onPointerDown={(e) => onPointerDownSticker(e, s.id)}
          >
            <img
              src={s.dataUrl}
              alt="sticker"
              className="w-full h-full object-contain select-none pointer-events-none"
              draggable={false}
            />

            {/* 편집 테두리/삭제 버튼 (캡처중엔 숨김) */}
            {!captureMode && isActive && (
              <>
                <div className="absolute inset-0 border border-[#5865F2] rounded-md pointer-events-none" />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 rounded-full bg-[#F23F43] text-white text-xs w-6 h-6 grid place-items-center shadow"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSticker(s.id);
                  }}
                  title="스티커 삭제"
                >
                  ×
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* 활성 스티커 간단 리사이즈 (슬라이더) */}
      {!captureMode && active && (
        <div
          className="absolute left-2 bottom-2 rounded-lg px-3 py-2 text-xs"
          style={{
            background: "rgba(0,0,0,0.55)",
            color: "white",
            backdropFilter: "blur(6px)",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="mb-2">스티커 크기</div>
          <input
            type="range"
            min={5}
            max={60}
            value={Math.round(active.w * 100)}
            onChange={(e) => {
              const w = clamp01(Number(e.target.value) / 100);
              // 비율 유지(대충)
              const ratio = active.h / active.w || 1;
              updateSticker(active.id, { w, h: clamp01(w * ratio) });
            }}
          />
        </div>
      )}
    </div>
  );
}
