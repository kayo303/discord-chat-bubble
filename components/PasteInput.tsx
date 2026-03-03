"use client";

import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function PasteInput({ value, onChange }: Props) {
  return (
    <div className="rounded-xl border border-[#2B2D31] bg-[#313338] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2B2D31] bg-[#2B2D31]">
        <div className="text-sm text-[#949BA4]">대화 붙여넣기</div>
      </div>

      <div className="p-3">
        <textarea
          className="w-full h-[340px] resize-y rounded-lg bg-[#1E1F22] border border-[#2B2D31] px-3 py-2 text-[14px] leading-relaxed outline-none focus:ring-2 focus:ring-[#5865F2]/60"
          placeholder={`예시:
사용자A — 2026-02-20 오전 12:39
안녕하세요!
...
사용자B — 2026-02-20 오전 1:00
반가워요!
...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mt-2 text-xs text-[#949BA4]">
          * 현재는 “작성자 — YYYY-MM-DD 오전/오후 H:MM” 형식을 지원해요.
        </div>
      </div>
    </div>
  );
}
