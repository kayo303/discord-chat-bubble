export type ParsedMessage = {
  author: string;
  date: string; // YYYY-MM-DD
  rawTime: string; // "오전 1:02" / "오후 12:39"
  datetime: string; // ISO-like key
  content: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdFromDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayYmd() {
  return ymdFromDate(new Date());
}

function yesterdayYmd() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return ymdFromDate(d);
}

function normalizeTimeKor(raw: string) {
  const m = raw.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;

  const ap = m[1];
  let hh = Number(m[2]);
  const mm = Number(m[3]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  if (ap === "오전") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return { hh24: hh, mm, rawTime: `${ap} ${m[2]}:${m[3]}` };
}

function isImgTokenLine(line: string) {
  return /^\[\[IMG:[^\]]+\]\]$/.test(line.trim());
}

function cleanContent(raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const cleaned: string[] = [];

  for (let line of lines) {
    if (line.trim() === "이미지") continue;

    // 이미지 토큰은 유지
    if (isImgTokenLine(line)) {
      cleaned.push(line.trimEnd());
      continue;
    }

    // 이모지 토큰(:name:)은 렌더 단계에서 업로드 매핑으로 처리하므로 여기서 제거하지 않음
    line = line.replace(/[ \t]+/g, " ").trimEnd();

    if (line.trim() === "") continue;

    cleaned.push(line);
  }

  return cleaned.join("\n").trimEnd();
}

/**
 * ✅ Discord 복붙에서 "뱃지/역할" 때문에 헤더가 줄바꿈되는 케이스 처리
 * 예)
 *   동동 모펭
 *   (빈줄 가능)
 *   — 2026-03-01 오후 2:40
 * => "동동 모펭 — 2026-03-01 오후 2:40" 로 합쳐줌
 */
function normalizeHeaderLineBreaks(input: string) {
  const rawLines = input.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  const isDashHeaderLine = (s: string) =>
    /^—\s*(\d{4}-\d{2}-\d{2}\s*(오전|오후)\s*\d{1,2}:\d{2}|어제\s*(오전|오후)\s*\d{1,2}:\d{2}|(오전|오후)\s*\d{1,2}:\d{2})\s*$/.test(
      s.trim()
    );

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trimEnd();

    // 작성자 후보 라인(빈 줄은 제외)
    if (line.trim() !== "") {
      // 다음 "비어있지 않은 줄"을 찾기 (중간 공백 줄은 스킵)
      let j = i + 1;
      while (j < rawLines.length && rawLines[j].trim() === "") j++;

      if (j < rawLines.length) {
        const next = rawLines[j].trimEnd();

        // 다음 줄이 "— 날짜/어제/시간" 형태면, 현재 줄 + 다음 줄을 합쳐서 헤더로 만든다
        if (isDashHeaderLine(next)) {
          out.push(`${line.trim()} ${next.trim()}`); // "작성자 — ..."
          i = j; // 다음 줄까지 소비
          continue;
        }
      }
    }

    out.push(line);
  }

  return out.join("\n");
}

export function parseDiscordPaste(input: string): ParsedMessage[] {
  // ✅ 1) 먼저 헤더 줄바꿈(뱃지 케이스) 정규화
  const normalizedInput = normalizeHeaderLineBreaks(input);
  const lines = normalizedInput.replace(/\r\n/g, "\n").split("\n");

  // ✅ 헤더 지원
  // 1) 작성자 — 2026-02-20 오후 1:02
  const withDate =
    /^(.+?)\s*—\s*(\d{4}-\d{2}-\d{2})\s*(오전|오후)\s*(\d{1,2}:\d{2})\s*$/;

  // 2) 작성자 — 오후 1:02  (오늘)
  const timeOnly = /^(.+?)\s*—\s*(오전|오후)\s*(\d{1,2}:\d{2})\s*$/;

  // 3) 작성자 — 어제 오전 2:10 (어제)
  const yesterdayOnly = /^(.+?)\s*—\s*(어제)\s*(오전|오후)\s*(\d{1,2}:\d{2})\s*$/;

  const out: ParsedMessage[] = [];
  let current: Omit<ParsedMessage, "content"> & { contentLines: string[] } | null =
    null;

  let imgCounter = 0;

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
      const m3 = l.match(yesterdayOnly);
      if (m3) {
        author = m3[1].trim();
        date = yesterdayYmd();
        rawTime = `${m3[3]} ${m3[4]}`;
      } else {
        const m2 = l.match(timeOnly);
        if (m2) {
          author = m2[1].trim();
          date = todayYmd();
          rawTime = `${m2[2]} ${m2[3]}`;
        }
      }
    }

    const isHeader = !!(author && date && rawTime);

    if (isHeader) {
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

    if (current) {
      if (l.trim() === "이미지") {
        imgCounter += 1;
        const slotId = `img_${imgCounter}`;
        current.contentLines.push(`[[IMG:${slotId}]]`);
      } else {
        current.contentLines.push(l);
      }
    }
  }

  if (current) {
    out.push({
      author: current.author,
      date: current.date,
      rawTime: current.rawTime,
      datetime: current.datetime,
      content: cleanContent(current.contentLines.join("\n")),
    });
  }

  return out.filter((m) => m.author && m.date && m.rawTime && m.content.length > 0);
}
