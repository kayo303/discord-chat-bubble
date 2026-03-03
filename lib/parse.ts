export type ParsedMessage = {
  author: string;
  datetime: string; // ISO-ish with +09:00
  date: string; // YYYY-MM-DD
  rawTime: string; // "오전 12:39"
  content: string;
};

function to24Hour(meridiem: "오전" | "오후", hh: string): number {
  let hour = Number(hh);
  if (meridiem === "오전") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }
  return hour;
}

export function parseDiscordPaste(text: string): ParsedMessage[] {
  const headerRe =
    /^(.+?)\s*—\s*(\d{4}-\d{2}-\d{2})\s*(오전|오후)\s*(\d{1,2}):(\d{2})\s*$/;

  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const messages: ParsedMessage[] = [];
  let current: ParsedMessage | null = null;

  const pushCurrent = () => {
    if (!current) return;
    current.content = current.content.replace(/\n+$/g, "");
    if (current.content.trim().length > 0) messages.push(current);
    current = null;
  };

  for (const line of lines) {
    const m = line.match(headerRe);
    if (m) {
      pushCurrent();

      const [, authorRaw, date, meridiemRaw, hh, mm] = m;
      const author = authorRaw.trim();
      const meridiem = meridiemRaw as "오전" | "오후";
      const hour24 = to24Hour(meridiem, hh);

      const datetime = `${date}T${String(hour24).padStart(2, "0")}:${mm}:00+09:00`;
      const rawTime = `${meridiem} ${Number(hh)}:${mm}`;

      current = { author, datetime, date, rawTime, content: "" };
      continue;
    }

    if (current) current.content += (current.content ? "\n" : "") + line;
  }

  pushCurrent();
  return messages;
}
