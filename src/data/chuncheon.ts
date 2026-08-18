export type Spot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "water" | "sc" | "stay" | "poi" | "food";
  stayMin: number;
  note: string;
  days: string[];
};

export const ULSAN = { name: "울산", lat: 35.5384, lng: 129.3114 };
export const ELY = { name: "엘리시안강촌", lat: 37.822123, lng: 127.589843 };

export const spots: Spot[] = [
  { id: "water-seonsan", name: "워터 선산휴게소 양평", lat: 36.2732, lng: 128.2478, kind: "water", stayMin: 20, note: "중부내륙 북상. 200kW NACS. 아침 국밥.", days: ["water", "d27"] },
  { id: "water-mungyeong-n", name: "워터 문경휴게소 양평", lat: 36.62128, lng: 128.15198, kind: "water", stayMin: 35, note: "350kW 5기 + NACS. 북상 주충전.", days: ["water", "d27"] },
  { id: "water-chungju-n", name: "워터 충주휴게소 양평", lat: 37.02356, lng: 127.83906, kind: "water", stayMin: 20, note: "문경을 통과했다면 예비.", days: ["water", "d27"] },
  { id: "water-mungyeong-s", name: "워터 문경휴게소 창원", lat: 36.61974, lng: 128.15056, kind: "water", stayMin: 25, note: "남하 전용.", days: ["d29"] },
  { id: "water-goesan-s", name: "워터 괴산휴게소 창원", lat: 36.8155, lng: 127.8630, kind: "water", stayMin: 20, note: "남하 전용.", days: ["d29"] },
  { id: "water-seoyeoju-s", name: "워터 서여주휴게소 창원", lat: 37.27881, lng: 127.57846, kind: "water", stayMin: 20, note: "남하 전용.", days: ["d29"] },
  { id: "sc-gimcheon", name: "SC 김천 모다아울렛", lat: 36.1556, lng: 128.3512, kind: "sc", stayMin: 25, note: "경부 IC 옆 V3.", days: ["sc", "d27"] },
  { id: "sc-jecheon", name: "SC 제천 남제천IC", lat: 37.0825, lng: 128.1912, kind: "sc", stayMin: 25, note: "중앙 이탈 V3 8기.", days: ["sc", "d27"] },
  { id: "sc-wonju", name: "SC 원주 AK플라자", lat: 37.3482, lng: 127.9295, kind: "sc", stayMin: 30, note: "시내 V3 9기.", days: ["sc", "d27"] },
  { id: "sc-gap-n", name: "SC 가평휴게소 춘천", lat: 37.7011875, lng: 127.5459242, kind: "sc", stayMin: 20, note: "V4. 입실 전.", days: ["water", "sc", "d27", "d28"] },
  { id: "sc-gap-s", name: "SC 가평휴게소 서울", lat: 37.6989, lng: 127.5431, kind: "sc", stayMin: 25, note: "V4. 복귀.", days: ["d29"] },
  { id: "poi-saejae", name: "문경새재 제1관문", lat: 36.7625, lng: 128.0772, kind: "poi", stayMin: 25, note: "주차 후 관문만. 차로 5분.", days: ["pick", "d27"] },
  { id: "poi-tangeum", name: "충주 탄금대", lat: 36.9874, lng: 127.8981, kind: "poi", stayMin: 20, note: "남한강 전망. 짧게.", days: ["pick", "d27"] },
  { id: "poi-uirimji", name: "제천 의림지", lat: 37.1754, lng: 128.214, kind: "poi", stayMin: 30, note: "산책. 혼자 걷기 좋음.", days: ["pick", "d27"] },
  { id: "poi-cheongpung", name: "청풍문화재단지", lat: 37.0043, lng: 128.1752, kind: "poi", stayMin: 50, note: "호수+한옥. 시간 있을 때.", days: ["pick"] },
  { id: "poi-dodam", name: "단양 도담삼봉", lat: 36.9858, lng: 128.3652, kind: "poi", stayMin: 25, note: "전망 주차. 살짝 이탈.", days: ["pick"] },
  { id: "poi-sogeum", name: "소금산 그랜드밸리", lat: 37.3648, lng: 127.8322, kind: "poi", stayMin: 120, note: "27일 메인. 월 휴장, 목 가능. 주차 무료.", days: ["water", "sc", "pick", "d27"] },
  { id: "poi-ganhyeon", name: "간현관광지 뷰", lat: 37.3612, lng: 127.8285, kind: "poi", stayMin: 15, note: "소금산 바로 옆 강변.", days: ["pick", "d27"] },
  { id: "poi-nami", name: "남이섬 선착장", lat: 37.7915, lng: 127.5253, kind: "poi", stayMin: 180, note: "28일 필수. 배 왕복.", days: ["d28", "pick"] },
  { id: "poi-jade", name: "제이드가든", lat: 37.8315, lng: 127.5458, kind: "poi", stayMin: 90, note: "숙소 근처 수목원.", days: ["d28", "pick"] },
  { id: "poi-soyang", name: "소양강 스카이워크", lat: 37.8932, lng: 127.7234, kind: "poi", stayMin: 30, note: "춘천 시내. 28일 여유 시.", days: ["pick", "d28"] },
  { id: "poi-gangchon", name: "강촌 의암호 카페거리", lat: 37.8142, lng: 127.6341, kind: "poi", stayMin: 40, note: "레일바이크 없음. 강변만.", days: ["pick", "d28"] },
  { id: "poi-sejong", name: "여주 세종대왕릉", lat: 37.3048, lng: 127.6056, kind: "poi", stayMin: 40, note: "중부내륙-여주 이탈. 복귀 때.", days: ["pick"] },
  { id: "stay-ely", name: "엘리시안 강촌", lat: 37.822123, lng: 127.589843, kind: "stay", stayMin: 0, note: "인 15:00 / 아웃 11:00. 급속 없음. 차지비 7kW.", days: ["water", "sc", "d27", "d28", "d29"] },
];

export const courses = {
  water: {
    id: "water",
    title: "워터 우선 (추천)",
    summary: "중부내륙 북상. 문경 양평 350kW에서 밥+충전. 소금산 후 가평 V4.",
    lineIds: ["water-seonsan", "water-mungyeong-n", "poi-sogeum", "sc-gap-n", "stay-ely"],
  },
  sc: {
    id: "sc",
    title: "슈퍼차저 우선",
    summary: "김천 모다 또는 통과. 제천·원주 AK·가평 V4.",
    lineIds: ["sc-gimcheon", "sc-jecheon", "sc-wonju", "poi-sogeum", "sc-gap-n", "stay-ely"],
  },
};

export function kakaoByCar(
  points: { name: string; lat: number; lng: number }[],
): string {
  const parts = points.map(
    (p) => `${encodeURIComponent(p.name)},${p.lat},${p.lng}`,
  );
  return `https://map.kakao.com/link/by/car/${parts.join("/")}`;
}

export function kakaoPlace(p: { name: string; lat: number; lng: number }): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
}

export function byId(id: string): Spot | undefined {
  return spots.find((s) => s.id === id);
}

export function coursePoints(id: "water" | "sc") {
  return [ULSAN, ...courses[id].lineIds.map((x) => byId(x)!).filter(Boolean), ELY].filter(
    (p, i, arr) => i === 0 || p.name !== arr[i - 1].name,
  );
}
