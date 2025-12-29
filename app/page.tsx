"use client";

import React, { useMemo, useRef, useState } from "react";

/* =========================
   타입
========================= */
type Group = "apparel" | "shoes";
type Shot = "thumbnail" | "detail" | "lookbook";

type ApparelItem = "outer" | "tshirt" | "pants" | "skirt" | "dress" | "knit";
type ShoeItem =
  | "sneakers"
  | "loafers"
  | "flats"
  | "pumps"
  | "sandals"
  | "mules"
  | "slippers"
  | "boots"
  | "dress_shoes";

type ItemKey = `apparel:${ApparelItem}` | `shoes:${ShoeItem}`;

type BgCategory = "studio" | "cafe" | "city";
type BgOption =
  | "studio_white"
  | "studio_gray"
  | "studio_beige"
  | "studio_gradient_paper"
  | "cafe_minimal"
  | "cafe_wood"
  | "cafe_modern"
  | "city_minimal"
  | "city_newyork"
  | "city_lookbook_set"
  | "city_winter_mood";

/* =========================
   라벨
========================= */
const GROUP_LABEL: Record<Group, string> = { apparel: "의류", shoes: "신발" };

const SHOT_LABEL: Record<Shot, string> = {
  thumbnail: "썸네일",
  detail: "세부 사항",
  lookbook: "룩북",
};

const APPAREL_LABEL: Record<ApparelItem, string> = {
  outer: "아우터(코트/자켓/패딩)",
  tshirt: "티셔츠",
  pants: "팬츠(슬랙스/데님)",
  skirt: "스커트",
  dress: "원피스",
  knit: "니트",
};

const SHOE_LABEL: Record<ShoeItem, string> = {
  sneakers: "스니커즈",
  loafers: "로퍼",
  flats: "플랫슈즈",
  pumps: "펌프스",
  sandals: "샌들",
  mules: "뮬",
  slippers: "슬리퍼",
  boots: "부츠",
  dress_shoes: "구두",
};

const BG_CATEGORY_LABEL: Record<BgCategory, string> = {
  studio: "스튜디오",
  cafe: "카페",
  city: "도시",
};

const BG_OPTION_LABEL: Record<BgOption, string> = {
  // studio
  studio_white: "화이트",
  studio_gray: "그레이",
  studio_beige: "베이지",
  studio_gradient_paper: "그라데이션 페이퍼",
  // cafe
  cafe_minimal: "미니멀카페",
  cafe_wood: "우드카페",
  cafe_modern: "모던카페",
  // city
  city_minimal: "미니멀도시",
  city_newyork: "뉴욕도시",
  city_lookbook_set: "룩북세트(감성배경)",
  city_winter_mood: "겨울무드(차분한배경)",
};

/* =========================
   전신 컷 고정 (★ 얼굴/신발 크롭 방지 핵심)
   - detail(클로즈업)에서는 자동 제외
========================= */
const FULL_BODY_LOCK =
  "full body fashion photography, head to toe visible, entire body fully in frame, face fully visible, shoes fully visible, centered composition, symmetrical framing, no cropping, no cut off head, no cut off face, no cut off feet, no cut off shoes";

/* =========================
   품질/네거티브(공통)
========================= */
const COMMON_QUALITY =
  "photorealistic, ultra high resolution, commercial fashion photography, natural lighting, realistic texture, accurate proportions, e-commerce ready, sharp focus, premium mood";

const COMMON_NEGATIVE =
  "cartoon, illustration, anime, blurry, lowres, overexposed, oversaturated, deformed, distorted, extra limbs, extra fingers, wrong anatomy, warped product, melted product, duplicated product, watermark, text, logo, brand name, letters, numbers, jpeg artifacts, bad perspective, wrong scale";

const BLUR_CONTROL_NEGATIVE =
  "busy background, cluttered background, sharp background, background in focus, distracting background, messy scene, overcrowded";

const CROP_BLOCK_NEGATIVE =
  "cropped, out of frame, partial body, half body, close-up, cut off head, cut off face, cut off feet, cut off shoes, missing head, missing feet";

/* =========================
   ✅ 컴팩트(핵심) 모드용 최소 프롬프트
   - “광범위하게 길어지는” 원인을 강하게 줄임
========================= */
const BODYLOCK_SHORT = "full body, head to toe, no cropping";
const QUALITY_SHORT = "photorealistic, natural lighting, sharp focus";
const NEGATIVE_SHORT =
  "cropped, out of frame, cut off head, cut off feet, blurry, lowres, deformed, text, logo, watermark";

/* =========================
   배경 프롬프트 (모두 블러 유지)
========================= */
const BG_OPTION_PROMPT: Record<BgOption, string> = {
  // studio
  studio_white: "clean white background, shallow depth of field",
  studio_gray: "neutral studio background, light gray backdrop, shallow depth of field",
  studio_beige: "warm beige studio background, shallow depth of field",
  studio_gradient_paper: "soft gradient paper backdrop, studio lighting, shallow depth of field",

  // cafe
  cafe_minimal:
    "minimal cafe background, clean interior, soft daylight, shallow depth of field, bokeh",
  cafe_wood:
    "cozy cafe background, warm ambient lighting, wooden interior, shallow depth of field, bokeh",
  cafe_modern:
    "modern cafe background, dark tones, glossy surfaces, warm accent lights, shallow depth of field, bokeh",

  // city
  city_minimal:
    "minimal city street background, neutral tones, shallow depth of field, bokeh",
  city_newyork:
    "New York city street background, urban vibe, shallow depth of field, bokeh, cinematic mood",
  city_lookbook_set:
    "editorial lookbook set background, minimal props, shallow depth of field, bokeh",
  city_winter_mood:
    "winter mood background, dark neutral tones, soft light, shallow depth of field, bokeh",
};

const BG_OPTIONS_BY_CATEGORY: Record<BgCategory, BgOption[]> = {
  studio: ["studio_white", "studio_gray", "studio_beige", "studio_gradient_paper"],
  cafe: ["cafe_minimal", "cafe_wood", "cafe_modern"],
  city: ["city_minimal", "city_newyork", "city_lookbook_set", "city_winter_mood"],
};

function recommendedBgByShot(shot: Shot): { cat: BgCategory; opt: BgOption } {
  if (shot === "detail") return { cat: "studio", opt: "studio_white" };
  if (shot === "thumbnail") return { cat: "studio", opt: "studio_gray" };
  return { cat: "city", opt: "city_lookbook_set" };
}

/* =========================
   아이템 프리셋
========================= */
type Preset = { base: string; shot: Record<Shot, string> };

const PRESETS: Record<ItemKey, Preset> = {
  "apparel:outer": {
    base:
      "women outerwear, premium coat or jacket, structured silhouette, accurate fit and drape",
    shot: {
      thumbnail: "full body model, straight standing pose, outfit centered, soft shadow",
      detail: "close-up, focus on fabric weave, stitching, buttons or zipper, collar detail",
      lookbook: "editorial lookbook, cinematic lighting, minimal set, elegant styling, luxury brand atmosphere",
    },
  },
  "apparel:tshirt": {
    base:
      "women t-shirt, casual daily wear, clean neckline, natural fit, realistic cotton fabric texture",
    shot: {
      thumbnail: "full body model, straight standing pose, clean framing, soft shadow",
      detail: "close-up, focus on neckline rib, sleeve hem, stitching, fabric texture",
      lookbook: "casual lookbook, natural daylight, minimal styling, lifestyle mood, premium casual",
    },
  },
  "apparel:pants": {
    base:
      "women pants, slacks or denim, correct proportions, realistic fabric folds, accurate waistband and hem",
    shot: {
      thumbnail: "full body model, legs visible, natural standing pose, silhouette clear",
      detail: "close-up, focus on waistband, zipper, pockets, stitching, hem, fabric texture",
      lookbook: "editorial lookbook, walking pose, natural motion, luxury mood, cinematic light",
    },
  },
  "apparel:skirt": {
    base:
      "women skirt, midi or long length, elegant drape, accurate waistline, premium fashion mood",
    shot: {
      thumbnail: "full body model, skirt length visible, centered composition, soft shadow",
      detail: "close-up, focus on pleats, waistband, zipper, lining detail, fabric texture",
      lookbook: "editorial lookbook, gentle motion, airy mood, premium styling, cinematic lighting",
    },
  },
  "apparel:dress": {
    base:
      "women dress, elegant silhouette, realistic fabric texture, high-end fashion photography, accurate proportions",
    shot: {
      thumbnail: "full body model, dress fully visible, centered composition, soft shadow",
      detail: "close-up, focus on neckline, waist seam, zipper or buttons, fabric texture",
      lookbook: "luxury lookbook, cinematic lighting, refined pose, minimal props, editorial mood",
    },
  },
  "apparel:knit": {
    base:
      "women knitwear, soft texture, realistic knit pattern, premium cozy mood, accurate fit",
    shot: {
      thumbnail: "full body model, knit texture visible, soft studio light",
      detail: "macro close-up, focus on knit weave, rib cuffs, button detail if cardigan",
      lookbook: "editorial cozy lookbook, soft cinematic light, minimal set, premium styling",
    },
  },
  "shoes:sneakers": {
    base:
      "women sneakers, realistic materials, accurate shoe proportions, premium product photography",
    shot: {
      thumbnail: "female model wearing sneakers, full body or 3/4 body, natural standing pose, focus on shoes",
      detail: "close-up, focus on toe box, laces, stitching, outsole texture, sharp details",
      lookbook: "editorial lookbook, walking motion, modern minimal styling, cinematic lighting, focus on footwear",
    },
  },
  "shoes:loafers": {
    base:
      "women loafers, premium leather look, clean silhouette, accurate shoe shape, luxury mood",
    shot: {
      thumbnail: "female model wearing loafers, full body framing, ankle visible, focus on shoes",
      detail: "close-up, focus on leather grain, stitching, vamp detail, outsole edge",
      lookbook: "high-end lookbook, refined styling, minimal set, cinematic lighting, focus on loafers",
    },
  },
  "shoes:flats": {
    base:
      "women flats, elegant minimal design, accurate toe shape, realistic materials, premium product photo",
    shot: {
      thumbnail: "female model wearing flats, full body framing, natural standing pose, focus on shoes",
      detail: "close-up, focus on toe shape, piping, insole texture, outsole",
      lookbook: "editorial lookbook, graceful pose, minimal styling, cinematic light, focus on flats",
    },
  },
  "shoes:pumps": {
    base:
      "women pumps, classic silhouette, accurate heel shape and height, premium leather texture, luxury mood",
    shot: {
      thumbnail: "female model wearing pumps, full body framing, elegant stance, focus on heel and toe",
      detail: "close-up, focus on heel construction, insole, stitching, toe box",
      lookbook: "luxury editorial lookbook, refined pose, minimal set, cinematic lighting, focus on pumps",
    },
  },
  "shoes:sandals": {
    base:
      "women sandals, clean straps, accurate foot fit, realistic materials, summer premium mood",
    shot: {
      thumbnail: "female model wearing sandals, full body framing, relaxed pose, focus on straps and sole",
      detail: "close-up, focus on strap texture, buckle, stitching, outsole",
      lookbook: "summer lookbook, airy mood, natural lighting, minimal styling, focus on sandals",
    },
  },
  "shoes:mules": {
    base:
      "women mules, slip-on design, accurate toe shape, realistic materials, premium product photography",
    shot: {
      thumbnail: "female model wearing mules, full body framing, casual standing pose, focus on shoes",
      detail: "close-up, focus on upper shape, insole, stitching, outsole",
      lookbook: "editorial lookbook, minimal set, relaxed luxury mood, cinematic lighting, focus on mules",
    },
  },
  "shoes:slippers": {
    base:
      "women slippers, daily comfort, soft materials, accurate shape, e-commerce product photo",
    shot: {
      thumbnail: "female model wearing slippers, full body framing, indoor cozy mood, focus on shoes",
      detail: "close-up, focus on upper material, stitching, footbed, outsole",
      lookbook: "cozy lifestyle lookbook, soft daylight, minimal set, premium comfort mood, focus on slippers",
    },
  },
  "shoes:boots": {
    base:
      "women boots, ankle or knee-high, accurate shaft line and calf fit, realistic leather texture, premium winter mood",
    shot: {
      thumbnail: "female model wearing boots, full body framing, focus on boots silhouette",
      detail: "close-up, focus on zipper, stitching, leather grain, outsole",
      lookbook: "winter lookbook, cinematic lighting, luxury styling, minimal set, focus on boots",
    },
  },
  "shoes:dress_shoes": {
    base:
      "women dress shoes, formal classic design, accurate proportions, premium leather texture, luxury mood",
    shot: {
      thumbnail: "female model wearing dress shoes, full body framing, clean formal styling, focus on silhouette",
      detail: "close-up, focus on toe shape, stitching, leather grain, heel/outsole construction",
      lookbook: "formal editorial lookbook, refined pose, minimal set, cinematic lighting, focus on dress shoes",
    },
  },
};

/* =========================
   배경/샷별 Negative 보강
========================= */
function negativeBoostByBg(opt: BgOption): string[] {
  const antiText = [
    "sign",
    "signage",
    "billboard",
    "poster",
    "menu",
    "menu board",
    "readable text",
    "typography",
  ];

  if (opt.startsWith("cafe_")) {
    return [
      ...antiText,
      "coffee cup text",
      "logo on cup",
      "cafe logo",
      "price tag",
      "neon sign",
      "table clutter",
      "crowd",
      "people in background",
    ];
  }

  if (opt.startsWith("city_")) {
    return [
      ...antiText,
      "street sign",
      "shop sign",
      "license plate",
      "traffic light text",
      "graffiti text",
      "newspaper text",
      "crowd",
      "bystanders",
      "cars close-up",
      "storefront text",
    ];
  }

  return [
    "studio equipment",
    "light stand",
    "softbox",
    "reflector",
    "c-stand",
    "backdrop wrinkles",
    "paper roll seam",
  ];
}

function negativeBoostByShot(shot: Shot): string[] {
  if (shot === "detail") return ["full body", "wide shot", "too much background"];
  if (shot === "thumbnail") return ["awkward framing", "cut off feet", "cut off head"];
  return ["harsh flash", "overly dramatic shadows"];
}

/* =========================
   번역(교육용 콤마 1:1)
========================= */
function splitByComma(prompt: string) {
  return prompt
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const FIXED_KO_MAP: Record<string, string> = {
  photorealistic: "실사(포토리얼)",
  "ultra high resolution": "초고해상도",
  "commercial fashion photography": "상업용 패션 촬영",
  "natural lighting": "자연스러운 조명",
  "realistic texture": "실제 같은 질감",
  "accurate proportions": "정확한 비율(왜곡 방지)",
  "e-commerce ready": "판매용 이미지 최적화",
  "sharp focus": "선명한 초점",
  "premium mood": "고급 무드",

  "full body fashion photography": "전신 패션 촬영",
  "head to toe visible": "머리부터 발끝까지 보이게",
  "entire body fully in frame": "전신이 프레임 안에 완전 포함",
  "face fully visible": "얼굴이 완전 보이게",
  "shoes fully visible": "신발이 완전 보이게",
  "centered composition": "중앙 구도",
  "symmetrical framing": "대칭 프레이밍",
  "no cropping": "크롭 금지",
  "no cut off head": "머리 잘림 금지",
  "no cut off face": "얼굴 잘림 금지",
  "no cut off feet": "발 잘림 금지",
  "no cut off shoes": "신발 잘림 금지",

  "shallow depth of field": "얕은 심도(배경 흐림)",
  bokeh: "보케(빛망울)",

  "clean white background": "깨끗한 흰 배경",
  "neutral studio background": "중립 스튜디오 배경",
  "light gray backdrop": "연한 회색 배경지",
  "warm beige studio background": "따뜻한 베이지 스튜디오 배경",
  "soft gradient paper backdrop": "부드러운 그라데이션 종이 배경",
  "studio lighting": "스튜디오 조명",

  "minimal cafe background": "미니멀 카페 배경",
  "cozy cafe background": "아늑한 카페 배경",
  "wooden interior": "우드 인테리어",
  "warm ambient lighting": "따뜻한 실내 조명",
  "modern cafe background": "모던 카페 배경",
  "dark tones": "어두운 톤",
  "warm accent lights": "따뜻한 포인트 조명",

  "minimal city street background": "미니멀 도시 거리 배경",
  "New York city street background": "뉴욕 도시 거리 배경",
  "urban vibe": "도시적인 분위기",
  "cinematic mood": "시네마틱 무드",
  "editorial lookbook set background": "룩북 세트 배경(화보용)",
  "winter mood background": "겨울 무드 배경",
  "dark neutral tones": "어두운 뉴트럴 톤",
  "soft light": "부드러운 조명",

  "close-up": "클로즈업(근접 촬영)",
  "macro close-up": "매크로(질감 강조)",
  "full body model": "전신 모델",
  "editorial lookbook": "룩북(화보) 스타일",
  "cinematic lighting": "시네마틱 조명",
  "minimal set": "미니멀 세트",
  "minimal props": "소품 최소화",
  "soft shadow": "부드러운 그림자",
  "focus on shoes": "신발에 초점",
};

function translatePhraseToKorean(phrase: string) {
  const p = phrase.trim();
  const lower = p.toLowerCase();

  const direct = FIXED_KO_MAP[lower] ?? FIXED_KO_MAP[p];
  if (direct) return direct;

  if (lower.endsWith(" color")) return `색상: ${p.slice(0, -6).trim()}`;
  if (lower.endsWith(" material")) return `소재: ${p.slice(0, -9).trim()}`;
  if (lower.endsWith(" heel")) return `굽: ${p.slice(0, -5).trim()}`;

  if (lower.includes("background")) return "배경 관련 지시";
  if (lower.includes("lighting")) return "조명 관련 지시";
  if (lower.includes("texture")) return "질감/소재 디테일";
  if (lower.includes("pose")) return "포즈/자세";

  return "의미(촬영/스타일 지시)";
}

function buildCommaTranslationTable(prompt: string) {
  return splitByComma(prompt).map((en) => ({ en, ko: translatePhraseToKorean(en) }));
}

/* =========================
   한글 설명(우측 패널)
========================= */
function shotKor(shot: Shot) {
  if (shot === "thumbnail") return "썸네일(대표 판매컷, 전신 고정)";
  if (shot === "detail") return "상세(디테일 클로즈업)";
  return "룩북(감성/화보 컷, 전신 고정)";
}

function buildPromptGuideKorean(params: {
  group: Group;
  shot: Shot;
  itemLabel: string;
  bgText: string;
  color: string;
  material: string;
  heel: string;
  extra: string;
  compact: boolean;
}) {
  const { group, shot, itemLabel, bgText, color, material, heel, extra, compact } = params;

  const opt: string[] = [];
  if (color.trim()) opt.push(`색상: ${color.trim()}`);
  if (material.trim()) opt.push(`소재: ${material.trim()}`);
  if (group === "shoes" && heel.trim()) opt.push(`굽: ${heel.trim()}`);
  if (extra.trim()) opt.push(`추가 키워드: ${extra.trim()}`);

  return [
    `선택 아이템: ${itemLabel}`,
    `촬영 목적: ${shotKor(shot)}`,
    `프롬프트 길이: ${compact ? "핵심(짧게)" : "상세(길게)"}`,
    `배경: ${bgText}`,
    opt.length ? `입력 옵션: ${opt.join(" / ")}` : "입력 옵션: 없음(기본값)",
    compact
      ? "핵심 모드는 불필요한 수식어/보강 문장을 줄여 결과를 빠르게 안정화합니다."
      : "상세 모드는 디테일/분위기 키워드를 풍부하게 넣어 화보 느낌을 강화합니다.",
    shot === "detail"
      ? "상세컷은 전신 고정을 제외하고 클로즈업을 우선합니다."
      : "썸네일/룩북은 전신 고정(얼굴+신발 잘림 방지)을 강제합니다.",
    "배경은 shallow depth of field/bokeh로 흐림 유지 → 상품 주목도 상승",
  ];
}

function buildNegativeGuideKorean(params: { bgCategory: BgCategory; shot: Shot; compact: boolean }) {
  const { bgCategory, shot, compact } = params;
  const lines: string[] = [];
  lines.push(compact ? "핵심 모드: 잘림/텍스트/왜곡 중심으로 최소 억제" : "상세 모드: 배경/샷/텍스트까지 자동 보강");
  lines.push("텍스트/로고/워터마크 생성 방지");
  lines.push("크롭/잘림(얼굴·신발) 방지 키워드 포함");
  lines.push("저품질/왜곡(추가 팔다리, 워프) 제거");

  if (!compact) {
    lines.push("배경 과선명/난잡함 방지(상품 묻힘 방지)");
    if (bgCategory === "cafe") lines.push("카페: 메뉴판/컵 로고/네온사인 텍스트 억제 강화");
    if (bgCategory === "city") lines.push("도시: 간판/번호판/표지판 텍스트·군중 억제 강화");
    if (bgCategory === "studio") lines.push("스튜디오: 조명 스탠드/장비 등장 억제");
    if (shot === "detail") lines.push("상세컷: 전신/와이드샷 방지(디테일 집중)");
  }

  return lines;
}

/* =========================
   UI
========================= */
function joinClean(parts: string[]) {
  return parts.map((p) => p.trim()).filter(Boolean).join(", ");
}

function Button({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`option-btn ${active ? "active" : ""}`}>
      {children}
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 18,
        padding: "12px 12px 14px",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Table({ rows }: { rows: Array<{ en: string; ko: string }> }) {
  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          padding: "10px 12px",
          fontWeight: 900,
          background: "#f3f3f3",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <div>영문 구문</div>
        <div>한글 의미</div>
      </div>

      <div style={{ maxHeight: 280, overflow: "auto" }}>
        {rows.map((r, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: "10px 12px",
              borderBottom: idx === rows.length - 1 ? "none" : "1px solid #f0f0f0",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            <div style={{ wordBreak: "break-word" }}>{r.en}</div>
            <div style={{ wordBreak: "break-word" }}>{r.ko}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   공통 input 스타일
========================= */
const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 13,
  outline: "none",
};

/* =========================
   페이지
========================= */
export default function Page() {
  const [group, setGroup] = useState<Group>("apparel");
  const [shot, setShot] = useState<Shot>("thumbnail");

  const [apparel, setApparel] = useState<ApparelItem>("tshirt");
  const [shoe, setShoe] = useState<ShoeItem>("sneakers");

  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [heel, setHeel] = useState("");
  const [extra, setExtra] = useState("");

  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ 기본은 핵심(짧게)
  const [compact, setCompact] = useState(true);

  // 배경
  const init = useMemo(() => recommendedBgByShot("thumbnail"), []);
  const [bgCategory, setBgCategory] = useState<BgCategory>(init.cat);
  const [bgOption, setBgOption] = useState<BgOption>(init.opt);
  const [bgCustom, setBgCustom] = useState("");

  // 사용자가 배경을 직접 고르면 샷 변경 시 자동추천 덮어쓰지 않음
  const userPickedBgRef = useRef(false);

  const onPickBgCategory = (cat: BgCategory) => {
    setBgCategory(cat);
    if (!bgCustom.trim()) setBgOption(BG_OPTIONS_BY_CATEGORY[cat][0]);
    userPickedBgRef.current = true;
  };

  const onPickBgOption = (opt: BgOption) => {
    setBgOption(opt);
    userPickedBgRef.current = true;
  };

  const onChangeShot = (s: Shot) => {
    setShot(s);
    if (!bgCustom.trim() && !userPickedBgRef.current) {
      const rec = recommendedBgByShot(s);
      setBgCategory(rec.cat);
      setBgOption(rec.opt);
    }
  };

  const key: ItemKey = group === "apparel" ? `apparel:${apparel}` : `shoes:${shoe}`;
  const preset = PRESETS[key];

  const backgroundPhrase = useMemo(() => {
    if (bgCustom.trim()) return bgCustom.trim();
    return BG_OPTION_PROMPT[bgOption];
  }, [bgCustom, bgOption]);

  const bgText = useMemo(() => {
    if (bgCustom.trim()) return `커스텀: ${bgCustom.trim()}`;
    return `${BG_CATEGORY_LABEL[bgCategory]} · ${BG_OPTION_LABEL[bgOption]}`;
  }, [bgCustom, bgCategory, bgOption]);

  // ✅ Prompt (핵심/상세 토글: 길이 과확장 방지)
  const prompt = useMemo(() => {
    // 전신 고정: detail 제외 / compact면 짧은 버전 사용
    const bodyLock =
      shot !== "detail" ? (compact ? BODYLOCK_SHORT : FULL_BODY_LOCK) : "";

    // 샷 문장: compact면 짧게
    const shotPhrase =
      compact ? (shot === "detail" ? "close-up details" : "clean framing") : preset.shot[shot];

    // 배경: compact면 “첫 구문만” 사용(광범위 확장 방지)
    const bgCompact = bgCustom.trim()
      ? bgCustom.trim()
      : BG_OPTION_PROMPT[bgOption].split(",")[0].trim();

    const bg = compact ? bgCompact : backgroundPhrase;

    // 품질: compact면 최소 3개, 상세면 기존 풀
    const quality = compact ? QUALITY_SHORT : COMMON_QUALITY;

    return joinClean([
      preset.base,
      shotPhrase,
      bodyLock,
      bg,
      color ? `${color} color` : "",
      material ? `${material} material` : "",
      group === "shoes" && heel ? `${heel} heel` : "",
      extra,
      quality,
    ]);
  }, [
    preset,
    shot,
    compact,
    bgOption,
    bgCustom,
    backgroundPhrase,
    color,
    material,
    heel,
    extra,
    group,
  ]);

  // ✅ Negative Prompt (핵심/상세 토글)
  const negativePrompt = useMemo(() => {
    if (compact) return NEGATIVE_SHORT;

    const bgBoost = negativeBoostByBg(bgOption);
    const shotBoost = negativeBoostByShot(shot);

    return joinClean([
      COMMON_NEGATIVE,
      BLUR_CONTROL_NEGATIVE,
      CROP_BLOCK_NEGATIVE,
      joinClean(bgBoost),
      joinClean(shotBoost),
    ]);
  }, [bgOption, shot, compact]);

  const itemLabel = useMemo(
    () => (group === "apparel" ? APPAREL_LABEL[apparel] : SHOE_LABEL[shoe]),
    [group, apparel, shoe]
  );

  const promptGuideKorean = useMemo(
    () =>
      buildPromptGuideKorean({
        group,
        shot,
        itemLabel,
        bgText,
        color,
        material,
        heel,
        extra,
        compact,
      }),
    [group, shot, itemLabel, bgText, color, material, heel, extra, compact]
  );

  const negativeGuideKorean = useMemo(
    () => buildNegativeGuideKorean({ bgCategory, shot, compact }),
    [bgCategory, shot, compact]
  );

  const translationRows = useMemo(() => buildCommaTranslationTable(prompt), [prompt]);

const copy = async (text: string) => {
  try {
    // 1️⃣ 최신 Clipboard API (localhost / HTTPS)
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alert("복사 완료");
      return;
    }

    // 2️⃣ fallback (네트워크 주소 / HTTP / 구형 브라우저)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!success) throw new Error("copy failed");
    alert("복사 완료");
  } catch (e) {
    console.error(e);
    alert("복사 실패: 브라우저 보안 설정을 확인하세요.");
  }
};


  const resetBgOnly = () => {
    setBgCustom("");
    userPickedBgRef.current = false;
    const rec = recommendedBgByShot(shot);
    setBgCategory(rec.cat);
    setBgOption(rec.opt);
  };

  const resetAll = () => {
    setColor("");
    setMaterial("");
    setHeel("");
    setExtra("");
    resetBgOnly();
  };

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: 26 }}>
      {/* 버튼 스타일 (hover/active shadow/indicator) */}
      <style jsx global>{`
        .option-btn {
          width: 100%;
          max-width: 100%;
          position: relative;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid #ddd;
          background: #fff;
          color: #111;
          cursor: pointer;
          font-weight: 900;
          letter-spacing: -0.2px;
          transition: background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .option-btn:hover {
          background: #f5f5f5;
        }
        .option-btn.active {
          background: #3a3a3a;
          color: #fff;
          border-color: #3a3a3a;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.15),
            inset 0 -1px 2px rgba(0, 0, 0, 0.25);
        }
        .option-btn.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 20%;
          width: 2px;
          height: 60%;
          background: #bdbdbd;
          border-radius: 2px;
        }
      `}</style>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>하루애 의류 · 신발 프롬프트</h1>

        <button
          onClick={() => setIsCollapsed((v) => !v)}
          style={{
            marginLeft: "auto",
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          {isCollapsed ? "펼치기" : "접기"}
        </button>

        <button
          onClick={resetAll}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          전체 초기화
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* 그룹 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Button active={group === "apparel"} onClick={() => setGroup("apparel")}>
              {GROUP_LABEL.apparel}
            </Button>
            <Button active={group === "shoes"} onClick={() => setGroup("shoes")}>
              {GROUP_LABEL.shoes}
            </Button>
          </div>

          {/* 아이템 */}
          <div style={{ border: "1px solid #eee", borderRadius: 18, padding: 14, marginBottom: 14, background: "#fff" }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              {group === "apparel" ? "의류 아이템" : "신발 아이템"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {group === "apparel"
                ? (Object.keys(APPAREL_LABEL) as ApparelItem[]).map((k) => (
                    <Button key={k} active={apparel === k} onClick={() => setApparel(k)}>
                      {APPAREL_LABEL[k]}
                    </Button>
                  ))
                : (Object.keys(SHOE_LABEL) as ShoeItem[]).map((k) => (
                    <Button key={k} active={shoe === k} onClick={() => setShoe(k)}>
                      {SHOE_LABEL[k]}
                    </Button>
                  ))}
            </div>
          </div>

          {/* 샷 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {(Object.keys(SHOT_LABEL) as Shot[]).map((s) => (
              <Button key={s} active={shot === s} onClick={() => onChangeShot(s)}>
                {SHOT_LABEL[s]}
              </Button>
            ))}
          </div>

          {/* ✅ 프롬프트 길이 (기본: 핵심) */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Button active={compact} onClick={() => setCompact(true)}>
              핵심(짧게)
            </Button>
            <Button active={!compact} onClick={() => setCompact(false)}>
              상세(길게)
            </Button>
          </div>

          {/* 배경 */}
          <div style={{ border: "1px solid #eee", borderRadius: 18, padding: 14, marginBottom: 14, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 900 }}>배경 선택</div>
              <button
                onClick={resetBgOnly}
                style={{
                  marginLeft: "auto",
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                배경 추천으로 되돌리기
              </button>
            </div>

            {/* 대분류 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              {(Object.keys(BG_CATEGORY_LABEL) as BgCategory[]).map((c) => (
                <Button key={c} active={!bgCustom.trim() && bgCategory === c} onClick={() => onPickBgCategory(c)}>
                  {BG_CATEGORY_LABEL[c]}
                </Button>
              ))}
            </div>

            {/* 소분류 (깨짐 방지용 minmax) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
                marginBottom: 10,
              }}
            >
              {BG_OPTIONS_BY_CATEGORY[bgCategory].map((opt) => (
                <Button key={opt} active={!bgCustom.trim() && bgOption === opt} onClick={() => onPickBgOption(opt)}>
                  {BG_OPTION_LABEL[opt]}
                </Button>
              ))}
            </div>

            {/* 커스텀 */}
            <Panel title="배경 커스텀(직접 입력)">
              <input
                value={bgCustom}
                onChange={(e) => {
                  setBgCustom(e.target.value);
                  if (e.target.value.trim()) userPickedBgRef.current = true;
                }}
                placeholder='예: "cozy cafe background, bokeh, shallow depth of field"'
                style={inputStyle}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                커스텀 입력이 있으면 프리셋보다 우선 적용됩니다.
              </div>
            </Panel>
          </div>

          {/* 옵션 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <Panel title="색상">
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="예: black / beige / navy"
                style={inputStyle}
              />
            </Panel>

            <Panel title="소재">
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder={group === "apparel" ? "예: cotton / wool / denim" : "예: leather / suede / knit"}
                style={inputStyle}
              />
            </Panel>

            <Panel title="굽(신발)">
              <input
                value={heel}
                onChange={(e) => setHeel(e.target.value)}
                placeholder="예: 0cm / 3cm / 5cm"
                disabled={group !== "shoes"}
                style={{
                  ...inputStyle,
                  opacity: group === "shoes" ? 1 : 0.5,
                  background: group === "shoes" ? "#fff" : "#f6f6f6",
                }}
              />
            </Panel>

            <Panel title="추가 키워드">
              <input
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="예: minimal, luxury, korean e-commerce"
                style={inputStyle}
              />
            </Panel>
          </div>
        </>
      )}

      {/* 결과 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.98fr", gap: 14, marginTop: 16 }}>
        {/* Prompt */}
        <div style={{ border: "1px solid #ddd", borderRadius: 18, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <strong>✅ Prompt</strong>
            <button
              onClick={() => copy(prompt)}
              style={{
                marginLeft: "auto",
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              복사
            </button>
          </div>
          <textarea
            readOnly
            value={prompt}
            style={{
              width: "100%",
              minHeight: 170,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 우측: Prompt 설명 + 번역표 */}
        <div style={{ border: "1px solid #eee", borderRadius: 18, padding: 14, background: "#fafafa", fontSize: 13, lineHeight: 1.65 }}>
          <strong>📌 Prompt 설명 (자동)</strong>

          <div style={{ marginTop: 10, fontWeight: 900 }}>현재 선택</div>
          <div style={{ marginTop: 6 }}>
            • 카테고리: <b>{GROUP_LABEL[group]}</b>
            <br />
            • 아이템: <b>{itemLabel}</b>
            <br />
            • 샷: <b>{SHOT_LABEL[shot]}</b>
            <br />
            • 배경: <b>{bgText}</b>
          </div>

          <div style={{ marginTop: 12, fontWeight: 900 }}>설명</div>
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            {promptGuideKorean.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>

          <div style={{ marginTop: 12, fontWeight: 900 }}>영문 Prompt 해석(콤마 단위)</div>
          <div style={{ marginTop: 10 }}>
            <Table rows={translationRows} />
          </div>
        </div>

        {/* Negative Prompt */}
        <div style={{ border: "1px solid #ddd", borderRadius: 18, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <strong>⛔ Negative Prompt ({compact ? "핵심" : "상세"} 자동)</strong>
            <button
              onClick={() => copy(negativePrompt)}
              style={{
                marginLeft: "auto",
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              복사
            </button>
          </div>
          <textarea
            readOnly
            value={negativePrompt}
            style={{
              width: "100%",
              minHeight: 150,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Negative 설명 */}
        <div style={{ border: "1px solid #eee", borderRadius: 18, padding: 14, background: "#fafafa", fontSize: 13, lineHeight: 1.65 }}>
          <strong>📌 Negative Prompt 설명(자동)</strong>
          <ul style={{ paddingLeft: 18, marginTop: 10 }}>
            {negativeGuideKorean.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}