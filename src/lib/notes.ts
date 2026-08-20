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
    href: "/chuncheon/",
    title: "춘천 일정",
    date: "2026-08-27",
    excerpt: "울산-강촌 기본 동선. 30곳은 그 위에.",
    kicker: "일정",
    tags: ["일정", "지도"],
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
