export type Spot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "water" | "sc" | "stay" | "poi" | "food";
  stayMin: number;
  tag: string;
  note: string;
  src: string;
  days: string[];
};

export const ULSAN = { name: "울산", lat: 35.5384, lng: 129.3114 };
export const ELY = { name: "엘리시안강촌", lat: 37.822123, lng: 127.589843 };

export const spots: Spot[] = [
  { id: "food-seonsan", name: "선산휴게소 양평", lat: 36.2732, lng: 128.2478, kind: "food", stayMin: 25, tag: "음식", note: "한우국밥·갈릭등심돈가스. 워터 200kW NACS 옆.", src: "2025 워터 휴게소 오픈", days: ["pick", "water", "d27"] },
  { id: "food-mungyeong", name: "문경휴게소 양평", lat: 36.62128, lng: 128.15198, kind: "food", stayMin: 35, tag: "음식", note: "오미자돈가스·국밥. 밑반찬 오미자김. 워터 350kW.", src: "2026.3 방문기", days: ["pick", "water", "d27"] },
  { id: "poi-saejae", name: "문경새재 제1관문", lat: 36.7625, lng: 128.0772, kind: "poi", stayMin: 25, tag: "경치", note: "주차하고 관문만. SNS 단골.", src: "2025 문경시", days: ["pick", "d27"] },
  { id: "poi-omija", name: "문경 오미자 테마터널", lat: 36.7198, lng: 128.1014, kind: "poi", stayMin: 30, tag: "경치", note: "폐선 터널. 여름에도 시원. 짧게 걷기.", src: "2025 문경 안내", days: ["pick"] },
  { id: "poi-tangeum", name: "충주 탄금대", lat: 36.9874, lng: 127.8981, kind: "poi", stayMin: 20, tag: "경치", note: "남한강 전망. 차에서 내려 한 바퀴.", src: "충주 관광", days: ["pick", "d27"] },
  { id: "food-chungju", name: "충주휴게소 양평", lat: 37.02356, lng: 127.83906, kind: "food", stayMin: 25, tag: "음식", note: "새뱅이순두부. 워터 예비 충전.", src: "휴게소 대표메뉴", days: ["pick", "water", "d27"] },
  { id: "poi-uirimji", name: "제천 의림지", lat: 37.1754, lng: 128.214, kind: "poi", stayMin: 30, tag: "경치", note: "호수 둘레. 혼자 걷기 좋음.", src: "2025 제천 코스", days: ["pick", "d27"] },
  { id: "poi-cheongpung", name: "청풍문화재단지", lat: 37.0043, lng: 128.1752, kind: "poi", stayMin: 50, tag: "경치", note: "청풍호+한옥. 시간 있을 때.", src: "2025 제천시", days: ["pick"] },
  { id: "poi-dodam", name: "단양 도담삼봉", lat: 36.9858, lng: 128.3652, kind: "poi", stayMin: 25, tag: "경치", note: "전망 주차장에서 바로. 살짝 빠짐.", src: "2026 단양 가이드", days: ["pick"] },
  { id: "poi-mancheonha", name: "단양 만천하스카이워크", lat: 36.9839, lng: 128.3708, kind: "poi", stayMin: 40, tag: "경치", note: "남한강 절벽. 인스타 많음. 체력 되면.", src: "2025 단양 SNS", days: ["pick"] },
  { id: "poi-sogeum", name: "소금산 그랜드밸리", lat: 37.3648, lng: 127.8322, kind: "poi", stayMin: 120, tag: "경치", note: "27일 메인. 월 휴장, 목 가능. 주차 무료.", src: "2025-26 원주 후기", days: ["pick", "water", "sc", "d27"] },
  { id: "poi-ganhyeon", name: "간현관광지 강변", lat: 37.3612, lng: 127.8285, kind: "poi", stayMin: 15, tag: "경치", note: "소금산 바로 옆. 다리 사진만.", src: "원주 관광", days: ["pick", "d27"] },
  { id: "food-gapyeong", name: "가평휴게소 춘천", lat: 37.7011875, lng: 127.5459242, kind: "food", stayMin: 20, tag: "음식", note: "맛남샌드·잣도나쓰. 옆이 V4 슈퍼차저.", src: "2025.12 휴게소 특산", days: ["pick", "water", "sc", "d27", "d28"] },
  { id: "poi-nami", name: "남이섬 선착장", lat: 37.7915, lng: 127.5253, kind: "poi", stayMin: 180, tag: "경치", note: "28일 필수. 배 왕복.", src: "2025-26 가평 후기", days: ["pick", "d28"] },
  { id: "poi-jade", name: "제이드가든", lat: 37.8315, lng: 127.5458, kind: "poi", stayMin: 90, tag: "경치", note: "숙소 옆 수목원. 꼭대기 카페.", src: "2025.8 인스타", days: ["pick", "d28"] },
  { id: "poi-jara", name: "자라섬 잔디밭", lat: 37.7522, lng: 127.5584, kind: "poi", stayMin: 40, tag: "경치", note: "빠지 말고 산책만. 호수 바람.", src: "2026.7 가평 코스", days: ["pick", "d28"] },
  { id: "poi-soyang", name: "소양강 스카이워크", lat: 37.8932, lng: 127.7234, kind: "poi", stayMin: 30, tag: "경치", note: "유리 바닥. 2026년 입장 무료 안내 있음.", src: "2026.7 춘천 가이드", days: ["pick", "d28"] },
  { id: "poi-gangchon", name: "강촌 의암호", lat: 37.8142, lng: 127.6341, kind: "poi", stayMin: 30, tag: "경치", note: "레일바이크 없음. 강변 카페.", src: "2026 강촌", days: ["pick", "d28"] },
  { id: "food-dakgalbi", name: "춘천 닭갈비골목", lat: 37.8813, lng: 127.7281, kind: "food", stayMin: 50, tag: "음식", note: "명동. 1인 가능한지 전화.", src: "2026.3 춘천 후기", days: ["pick", "d28"] },
  { id: "poi-gubong", name: "구봉산 카페거리", lat: 37.8364, lng: 127.6988, kind: "poi", stayMin: 40, tag: "경치", note: "호수 내려다보는 카페. 노을.", src: "2026 당일치기", days: ["pick", "d28"] },
  { id: "poi-gongji", name: "공지천 호수공원", lat: 37.8731, lng: 127.7186, kind: "poi", stayMin: 25, tag: "경치", note: "시내 산책. 차 대기 쉬움.", src: "2026 춘천 한 바퀴", days: ["pick", "d28"] },
  { id: "food-ethiopia", name: "소양강 카페 (에티오피아)", lat: 37.8894, lng: 127.7258, kind: "food", stayMin: 30, tag: "음식", note: "스카이워크 옆. 창밖 강.", src: "2026.3 블로그", days: ["pick", "d28"] },
  { id: "poi-sejong", name: "여주 세종대왕릉", lat: 37.3048, lng: 127.6056, kind: "poi", stayMin: 40, tag: "경치", note: "내려오는 날 여주 빠질 때.", src: "여주 관광", days: ["pick"] },
  { id: "water-seonsan", name: "워터 선산휴게소 양평", lat: 36.2732, lng: 128.2478, kind: "water", stayMin: 20, tag: "충전", note: "올라가는 길. 200kW NACS.", src: "2025.4 워터", days: ["water", "d27"] },
  { id: "water-mungyeong-n", name: "워터 문경휴게소 양평", lat: 36.62128, lng: 128.15198, kind: "water", stayMin: 35, tag: "충전", note: "350kW 5기 + NACS. 주충전.", src: "2025.4 워터", days: ["water", "d27"] },
  { id: "water-chungju-n", name: "워터 충주휴게소 양평", lat: 37.02356, lng: 127.83906, kind: "water", stayMin: 20, tag: "충전", note: "문경 통과 시 예비.", src: "워터", days: ["water", "d27"] },
  { id: "water-mungyeong-s", name: "워터 문경휴게소 창원", lat: 36.61974, lng: 128.15056, kind: "water", stayMin: 25, tag: "충전", note: "내려올 때만.", src: "워터", days: ["d29"] },
  { id: "water-goesan-s", name: "워터 괴산휴게소 창원", lat: 36.8155, lng: 127.8630, kind: "water", stayMin: 20, tag: "충전", note: "내려올 때만.", src: "워터", days: ["d29"] },
  { id: "water-seoyeoju-s", name: "워터 서여주휴게소 창원", lat: 37.27881, lng: 127.57846, kind: "water", stayMin: 20, tag: "충전", note: "내려올 때만.", src: "워터", days: ["d29"] },
  { id: "sc-gimcheon", name: "SC 김천 모다아울렛", lat: 36.1556, lng: 128.3512, kind: "sc", stayMin: 25, tag: "충전", note: "경부 IC 옆 V3.", src: "Tesla", days: ["sc", "d27"] },
  { id: "sc-jecheon", name: "SC 제천 남제천IC", lat: 37.0825, lng: 128.1912, kind: "sc", stayMin: 25, tag: "충전", note: "중앙 나와서 V3.", src: "Tesla", days: ["sc", "d27"] },
  { id: "sc-wonju", name: "SC 원주 AK플라자", lat: 37.3482, lng: 127.9295, kind: "sc", stayMin: 30, tag: "충전", note: "시내 V3.", src: "Tesla", days: ["sc", "d27"] },
  { id: "sc-gap-n", name: "SC 가평휴게소 춘천", lat: 37.7011875, lng: 127.5459242, kind: "sc", stayMin: 20, tag: "충전", note: "V4. 입실 전.", src: "Tesla", days: ["water", "sc", "d27", "d28"] },
  { id: "sc-gap-s", name: "SC 가평휴게소 서울", lat: 37.6989, lng: 127.5431, kind: "sc", stayMin: 25, tag: "충전", note: "V4. 오는 날.", src: "Tesla", days: ["d29"] },
  { id: "stay-ely", name: "엘리시안 강촌", lat: 37.822123, lng: 127.589843, kind: "stay", stayMin: 0, tag: "숙소", note: "인 15:00 / 아웃 11:00. 급속 없음. 차지비 7kW.", src: "리조트", days: ["water", "sc", "d27", "d28", "d29"] },
];

export const courses = {
  water: {
    id: "water",
    title: "워터 먼저",
    summary: "중부내륙으로 올라가서 문경 양평에서 밥과 충전. 소금산 보고 가평 V4.",
    lineIds: ["food-seonsan", "food-mungyeong", "poi-sogeum", "food-gapyeong", "stay-ely"],
  },
  sc: {
    id: "sc",
    title: "슈퍼차저 먼저",
    summary: "김천 모다, 제천이나 원주 AK, 소금산, 가평 V4.",
    lineIds: ["sc-gimcheon", "sc-jecheon", "sc-wonju", "poi-sogeum", "sc-gap-n", "stay-ely"],
  },
};

export function kakaoByCar(points: { name: string; lat: number; lng: number }[]): string {
  const parts = points.map((p) => `${encodeURIComponent(p.name)},${p.lat},${p.lng}`);
  return `https://map.kakao.com/link/by/car/${parts.join("/")}`;
}

export function kakaoPlace(p: { name: string; lat: number; lng: number }): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
}

export function byId(id: string): Spot | undefined {
  return spots.find((s) => s.id === id);
}

export function coursePoints(id: "water" | "sc") {
  return [ULSAN, ...courses[id].lineIds.map((x) => byId(x)!).filter(Boolean)].filter(
    (p, i, arr) => i === 0 || p.name !== arr[i - 1].name,
  );
}
