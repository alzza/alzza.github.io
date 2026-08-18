import { getCollection } from "astro:content";

export type NoteItem = {
  href: string;
  title: string;
  date: string;
  excerpt: string;
};

const extra: NoteItem[] = [
  {
    href: "/chuncheon/",
    title: "춘천 일정",
    date: "2026-08-27",
    excerpt: "워터/SC 코스 · 카카오맵",
  },
];

export async function listNotes(): Promise<NoteItem[]> {
  const md = await getCollection("notes");
  const fromFiles: NoteItem[] = md.map((n) => ({
    href: `/notes/${n.slug}/`,
    title: n.data.title,
    date: n.data.date,
    excerpt: n.data.excerpt,
  }));
  return [...fromFiles, ...extra].sort((a, b) => (a.date < b.date ? 1 : -1));
}
