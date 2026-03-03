export type ParsedMessage = {
  author: string;
  date: string;      // YYYY-MM-DD
  rawTime: string;   // "오전 1:02" / "오후 12:39"
  datetime: string;  // ISO-like key
  content: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function normalizeTimeKor(raw: string) {
  // "오전 1:02" / "오후 12:39" -> { hh24, mm, rawTime }
  const m = raw.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const ap = m[1];
  let hh = Number(m[2]);
  const mm = Number(m[3]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  // 12시간 -> 24시간
  if (ap === "오전") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return { hh24: hh, mm, rawTime: `${ap} ${m[2]}:${m[3]}` };
}

function cleanContent(raw: string) {
  // 줄 단위로 처리
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  const cleanedLines: string[] = [];

  for (let line of lines) {
    // 1) 줄 전체가 '이미지' (앞뒤 공백 포함 가능)면 삭제
    if (line.trim() === "이미지") continue;

    // 2) :emoji_name: 토큰 제거 (여러 개 가능)
    // - 콜론 안에는 공백 없는 문자들(영문/숫자/_ 등)이 보통이라 이렇게 잡음
    // - 예: ":saeu_kirat:" ":oeishiguelmae:"
    line = line.replace(/:[^\s:]+:/g, "");

    // 토큰 지운 뒤에 남은 공백 정리
    line = line.replace(/[ \t]+/g, " ").trimEnd();

    // 토큰만 있던 줄이면 빈 줄이 되니까 삭제
    if (line.trim() === "") continue;

    cleanedLines.push(line);
  }

  // 줄 사이 빈 줄 과다 방지: 연속 빈 줄 제거(이미 위에서 빈 줄은 제거했지만 안전장치)
  return cleanedLines.join("\n").trimEnd();
}

export function parseDiscordPaste(input: string): ParsedMessage[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");

  // ✅ 헤더 2종 지원
  // 1) 작성자 — 2026-02-20 오후 1:02
  const withDate = /^(.+?)\s*—\s*(\d{4}-\d{2}-\d{2})\s*(오전|오후)\s*(\d{1,2}:\d{2})\s*$/;
  // 2) 작성자 — 오후 1:02  (당일/날짜 생략)
  const timeOnly = /^(.+?)\s*—\s*(오전|오후)\s*(\d{1,2}:\d{2})\s*$/;

  const out: ParsedMessage[] = [];
  let current: Omit<ParsedMessage, "content"> & { contentLines: string[] } | null = null;

  for (const line of lines) {
    const l = line.trimEnd();

    let author: string | null = null;
    let date: string | null = null;
    let rawTime: string | null = null;

    const m1 = l.match(withDate);
    if (m1) {
      author = m1[1].trim();
      date = m1[2];
      rawTime = `${m1[3]} ${m1[4]}`;
    } else {
      const m2 = l.match(timeOnly);
      if (m2) {
        author = m2[1].trim();
        date = todayYmd(); // ✅ 날짜 없으면 "오늘"로 채움
        rawTime = `${m2[2]} ${m2[3]}`;
      }
    }

    const isHeader = !!(author && date && rawTime);

    if (isHeader) {
      // 이전 메시지 저장
      if (current) {
        out.push({
          author: current.author,
          date: current.date,
          rawTime: current.rawTime,
          datetime: current.datetime,
          content: cleanContent(current.contentLines.join("\n")),
        });
      }

      const t = normalizeTimeKor(rawTime!);
      if (!t) continue;

      const dtKey = `${date}T${pad2(t.hh24)}:${pad2(t.mm)}:00`;

      current = {
        author: author!,
        date: date!,
        rawTime: rawTime!,
        datetime: dtKey,
        contentLines: [],
      };
      continue;
    }

    // 헤더가 아닌 줄: 현재 메시지 본문으로 붙이기
    if (current) {
      current.contentLines.push(l);
    }
  }

  // 마지막 메시지 저장
  if (current) {
    out.push({
      author: current.author,
      date: current.date,
      rawTime: current.rawTime,
      datetime: current.datetime,
      content: cleanContent(current.contentLines.join("\n")),
    });
  }

  // 빈 내용 제거(원하면 유지해도 됨)
  return out.filter((m) => m.author && m.date && m.rawTime && m.content.length > 0);
}
