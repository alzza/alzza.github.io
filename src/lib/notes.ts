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
