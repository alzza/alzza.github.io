import { getCollection } from "astro:content";

export type NoteItem = {
  href: string;
  title: string;
  date: string;
  excerpt: string;
  kicker: string;
  tags: string[];
};

const extra: NoteItem[] = [
  {
    href: "/plc/r3-load-out/",
    title: "SC1 Robot3 LOAD_OUT 대기, 펜던트 수정",
    date: "2026-09-04",
    excerpt: "S/E/G는 SC#2 퍼치에서 DI[4]를 기다렸다가 내린다. R[141]=0이면 기존, 1이면 변경. 1호기만. R은 REJECT로 둔다.",
    kicker: "PLC",
    tags: ["PLC", "SC1", "Robot3"],
  },
  {
    href: "/plc/timing/",
    title: "SC1 Robot3 불완전 피치 · Unload · 등급 통합 설명",
    date: "2026-08-30",
    excerpt: "체인이 픽 자리에 선 뒤에만 Unload. Permits Unload 한 줄. 로봇 프로그램은 그대로.",
    kicker: "PLC",
    tags: ["PLC", "SC1"],
  },
  {
    href: "/plc/",
    title: "SC1 Robot3 깔딱 HMI Enable=1 1차 시험안",
    date: "2026-08-22",
    excerpt: "Sheet_Conveyor_1 Permits Rung 6만 고치는 PHASE-1 현장 시험안.",
    kicker: "PLC",
    tags: ["PLC", "SC1"],
  },
];

export async function listNotes(): Promise<NoteItem[]> {
  const md = await getCollection("notes");
  const fromFiles: NoteItem[] = md.map((n) => ({
    href: `/notes/${n.id}/`,
    title: n.data.title,
    date: n.data.date,
    excerpt: n.data.excerpt,
    kicker: n.data.kicker || n.data.tags[0] || "노트",
    tags: n.data.tags,
  }));
  return [...fromFiles, ...extra].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function allTags(notes: NoteItem[]): string[] {
  return [...new Set(notes.flatMap((n) => n.tags))].sort((a, b) => a.localeCompare(b, "ko"));
}
