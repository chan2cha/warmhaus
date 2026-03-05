import z from "zod";

export const TYPE_OPTIONS = [
    { value: "LOW", label: "Low (부분공사) / 당분간은 어렵습니다" },
    { value: "MIDDLE", label: "Middle (올철거)" },
    { value: "HIGH", label: "High (올철거)" },
] ;
export const CHANNEL_OPTIONS = [

    { value: "blog", label: "블로그" },
    { value: "instagram", label: "인스타" },
    { value: "cafe", label: "카페" },
    { value: "referral", label: "지인추천" },
    { value: "etc", label: "기타" },
];

export const BUDGET_RANGE_OPTIONS = [
    { value: "1000_2000", label: "1,000~2,000만원" },
    { value: "2000_3000", label: "2,000~3,000만원" },
    { value: "3000_4000", label: "3,000~4,000만원" },
    { value: "4000_5000", label: "4,000~5,000만원" },
    { value: "5000_6000", label: "5,000~6,000만원" },
    { value: "6000_7000", label: "6,000~7,000만원" },
    { value: "7000_8000", label: "7,000~8,000만원" },
    { value: "8000_9000", label: "8,000~9,000만원" },
    { value: "9000_10000", label: "9,000~1억" },
    { value: "over_10000", label: "1억 이상" },
];



// ✅ 공사항목 예시(필요한 만큼 추가)
export const EXTENSION_OPTIONS = ["거실", "주방", "안방", "작은방A", "작은방B", "없음", "모름"] as const;
export const WINDOW_WORK_OPTIONS = ["전체 교체", "확장부만 교체", "내창만 교체", "외창만 교체", "없음", "모름","기타"] as const;
export const WINDOW_REFORM_OPTIONS = ["전체 리폼(교체 샷시 제외)", "없음", "모름", "기타"] as const;
export const DOOR_FRAME_WORK_OPTIONS = [
    "전체 교체",
    "모든 문만 교체",
    "욕실 문만 교체",
    "없음",
    "모름",
    "기타",
] as const;

export const DOOR_FRAME_REFORM_OPTIONS = [
    "문선 리폼(9mm문선)",
    "방문 교체",
    "없음",
    "모름",
    "기타",
] as const;

export const FLOOR_DEMOLITION_OPTIONS = [
    "전체 마루 철거",
    "전체 장판 철거",
    "부분 철거(예: 거실 마루 / 방 장판 철거)",
    "없음",
    "모름",
    "기타",
] as const;
export const FLOOR_WORK_OPTIONS = ["장판", "강마루", "원목 마루", "거실/주방타일 + 방마루", "없음", "모름", "기타"] as const;
export const MOLDING_WORK_OPTIONS = [
    "기본: 역계단 몰딩",
    "중간: 무몰딩",
    "고급: 마이너스 몰딩(히든몰딩)",
    "몰딩 리폼",
    "없음",
    "모름",
    "기타",
] as const;

export const PARTITION_DOOR_OPTIONS = ["중문 설치", "중문 가벽까지 설치", "없음",  "모름","기타"] as const;

export const FILM_WORK_OPTIONS = [
    "현관문 리폼",
    "주방 수납장 리폼",
    "안방 붙박이장 리폼",
    "작은방 수납장 리폼",
    "수납장 리폼",
    "없음",
    "모름",
    "기타",
] as const;

export const BATHROOM_WORK_OPTIONS = [
    "공용욕실(타일 덧방)",
    "공용욕실(올 철거)",
    "안방욕실(타일 덧방)",
    "안방욕실(올 철거)",
    "없음",
    "모름",
    "기타",
] as const;

export const TILE_WORK_OPTIONS = [
    "현관 바닥",
    "주방 벽면",
    "거실 베란다 바닥",
    "안방 베란다 바닥",
    "주방 베란다 바닥",
    "세탁실 바닥",
    "실외기 바닥",
    "거실+주방 바닥",
    "없음",
    "모름",
    "기타",
] as const;
export const ELECTRICAL_OPTIONS = [
    "기본: 다운라이트 ALL",
    "기본: 공용부-다운라이트 / 방 LED",
    "포인트 옵션: 마그네틱 조명 & 라인조명",
    "없음",
    "모름",
    "기타",
] as const;

export const VERANDA_COAT_OPTIONS = [
    "주방 베란다",
    "안방 베란다",
    "거실 베란다",
    "작은방 A 베란다",
    "작은방 B 베란다",
    "세탁실 베란다",
    "실외기 베란다",
    "없음",
    "모름",
    "기타",
] as const;

export const WALL_FINISH_OPTIONS = [
    "합지 도배",
    "실크 도배",
    "거실 도장 + 방 합지 도배",
    "거실 도장 + 방 실크 도배",
    "없음",
    "모름",
    "기타",
] as const;

// 에어컨(예시: 너 스샷에 맞춰 필요 옵션만 이어서 추가하면 됨)
export const AIRCON_OPTIONS = [
    "1대 / 거실",
    "2대 / 거실, 방A",
    "3대 / 거실, 방A, 방B",
    "4대 / 거실, 방A, 방B, C",
    "5대 / 거실, 주방, 방A, 방B, C",
    "없음",
    "모름",
    "기타",
] as const;
export const FURNITURE_ITEMS = [
    "주방",
    "신발장",
    "안방 붙박이장",
    "작은방 수납장",
    "베란다장",
    "기타",
] as const;

// --- 스키마 (MVP: 1~2개 섹션만 예시로 넣고 계속 확장하면 됨)
export const FormSchema = z.object({
    // Step0
    name: z.string().min(1, "이름을 입력해주세요."),
    phone: z.string().min(9, "연락처를 입력해주세요."),
    desired_type: z.string().min(1, "필수 질문입니다."),
    channel: z.string().min(1, "알게 된 경로를 선택해주세요."),
    budget_range: z.string().min(1, "예산 범위를 선택해주세요."),
    start_date: z.string().min(1, "공사 시작일을 선택해주세요."),
    move_in_date: z.string().min(1, "입주 예정일을 선택해주세요."),

    zip_code: z.string().default(""),
    address_road: z.string().default(""),
    address_jibun: z.string().default(""),
    address_detail: z.string().min(1, "상세주소를 입력해주세요."),
    baseAddrText: z.string().default(""),

    area_unit: z.enum(["sqm", "pyeong"]),
    area_pyeong: z
        .string()
        .min(1, "면적을 입력해주세요.")
        .regex(/^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/, "형식: 공급/전용 (예: 143/114)"),
    // Step2 (예시: 확장)
    extension_existing: z.array(z.string()).min(1, "현재 확장부를 선택해주세요."),
    extension_plan: z.array(z.string()).min(1, "확장공사를 선택해주세요."),

    // Step3 (예시: 샷시/도어)
    window_work: z.array(z.string()).min(1, "샷시 공사를 선택해주세요."),
    window_work_etc: z.string().default(""),
    window_reform: z.array(z.string()).default([]),
    window_reform_etc: z.string().default(""),
    door_frame_work: z.array(z.string()).min(1, "방문/방문틀 공사를 선택해주세요."),
    door_frame_work_etc: z.string().default(""),
    door_frame_reform: z.array(z.string()).default([]),
    door_frame_reform_etc: z.string().default(""),



    // Step4 (도어/바닥/몰딩/중문/필름)
    floor_demolition: z.array(z.string()).min(1, "바닥 철거 공사를 선택해주세요."),
    floor_demolition_etc: z.string().default(""),
    floor_work: z.array(z.string()).min(1, "바닥 공사를 선택해주세요."),
    floor_work_etc: z.string().default(""),
    molding_work: z.array(z.string()).min(1, "몰딩 공사를 선택해주세요."),
    molding_work_etc: z.string().default(""),

    partition_door: z.array(z.string()).min(1, "중문 공사를 선택해주세요."),
    partition_door_etc: z.string().default(""),

    film_work: z.array(z.string()).min(1, "필름 공사를 선택해주세요."),
    film_work_etc: z.string().default(""),

// Step5 (욕실/타일/벽체마감)
    bathroom_work: z.array(z.string()).min(1, "욕실 공사를 선택해주세요."),
    bathroom_work_etc: z.string().default(""),

    tile_work: z.array(z.string()).min(1, "타일 공사를 선택해주세요."),
    tile_work_etc: z.string().default(""),

    wall_finish: z.array(z.string()).min(1, "벽체 마감 공사를 선택해주세요."),
    wall_finish_etc: z.string().default(""),

// Step6 (전기/베란다 벽면/에어컨)
    electrical_work: z.array(z.string()).min(1, "전기 공사를 선택해주세요."),
    electrical_work_etc: z.string().default(""),

    veranda_coat: z.array(z.string()).min(1, "베란다 벽면 탄성코트 공사를 선택해주세요."),
    veranda_coat_etc: z.string().default(""),


    aircon_work: z.array(z.string()).min(1, "에어컨 공사를 선택해주세요."),
    aircon_work_etc: z.string().default(""),

    // Step7
    furniture_replace: z.array(z.string()).default([]),
    furniture_reform: z.array(z.string()).default([]),
    furniture_none: z.boolean().default(false),
    furniture_replace_etc: z.string().default(""),
    furniture_reform_etc: z.string().default(""),
    plans: z.array(z.any()).max(3, "도면/사진은 최대 3장까지 가능합니다.").default([]),
    inquiry_note: z.string().default(""),

    consult_confirm: z
        .string()
        .min(1, "상담 진행 방식 확인 항목을 선택해주세요."),
    hp: z.string().default(""), // honeypot
}).superRefine((val, ctx) => {
    if (val.start_date && val.move_in_date) {
        if (new Date(val.move_in_date) < new Date(val.start_date)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["move_in_date"],
                message: "입주 예정일은 공사 시작일 이후여야 합니다.",
            });
        }
    }

    // ✅ 주소(도로명/지번) 최소 1개는 있어야 함
    const hasBaseAddr = !!(val.address_road?.trim() || val.address_jibun?.trim());
    if (!hasBaseAddr) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["address_road"], // 표시용(도로명)으로 걸자
            message: "주소찾기로 주소를 선택해주세요.",
        });
    }
    const partialKeys = ["확장부만 교체", "내창만 교체", "외창만 교체"];
    const hasPartial = (val.window_work || []).some((v) => partialKeys.includes(v));
    const etcPairs:  Array<[string, string, string]> = [
        ["window_work","window_work_etc","기타 내용을 입력해주세요."],
        ["window_reform","window_reform_etc","기타 내용을 입력해주세요."],
        ["door_frame_work","door_frame_work_etc","기타 내용을 입력해주세요."],
        ["door_frame_reform","door_frame_reform_etc","기타 내용을 입력해주세요."],
        ["floor_demolition", "floor_demolition_etc", "기타 내용을 입력해주세요."],
        ["floor_work", "floor_work_etc", "기타 내용을 입력해주세요."],
        ["molding_work", "molding_work_etc", "기타 내용을 입력해주세요."],
        ["partition_door", "partition_door_etc", "기타 내용을 입력해주세요."],
        ["film_work", "film_work_etc", "기타 내용을 입력해주세요."],
        ["bathroom_work", "bathroom_work_etc", "기타 내용을 입력해주세요."],
        ["tile_work", "tile_work_etc", "기타 내용을 입력해주세요."],
        ["electrical_work", "electrical_work_etc", "기타 내용을 입력해주세요."],
        ["veranda_coat", "veranda_coat_etc", "기타 내용을 입력해주세요."],
        ["wall_finish", "wall_finish_etc", "기타 내용을 입력해주세요."],
        ["aircon_work", "aircon_work_etc", "기타 내용을 입력해주세요."],
        ["furniture_replace", "furniture_replace_etc", "교체-기타 내용을 입력해주세요."],
        ["furniture_reform", "furniture_reform_etc", "리폼-기타 내용을 입력해주세요."],
    ];

    for (const [arrKey, etcKey, msg] of etcPairs) {
        const arr = (val as any)[arrKey] as string[] | undefined;
        const etc = (val as any)[etcKey] as string | undefined;
        if ((arr || []).includes("기타") && (!etc || etc.trim().length < 1)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [etcKey as any],
                message: msg,
            });
        }
    }

    // 부분교체 선택 시: window_reform 필수
    if (hasPartial) {
        if (!val.window_reform || val.window_reform.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["window_reform"],
                message: "샷시 리폼을 선택해주세요.",
            });
        }


    }


// ✅ '전체 교체'가 아닌 선택(= 부분 교체/선택형)일 때만 리폼 질문 노출 + 필수
    const isAllReplace = (val.door_frame_work || []).includes("전체 교체");
    const hasDoorWork = (val.door_frame_work || []).length > 0;
    const needDoorReform = hasDoorWork && !isAllReplace;

    if (needDoorReform) {
        if (!val.door_frame_reform || val.door_frame_reform.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["door_frame_reform"],
                message: "방문/방문틀 리폼을 선택해주세요.",
            });
        }
    }
    const hasAnyFurniture =
        (val.furniture_replace || []).length > 0 || (val.furniture_reform || []).length > 0;

    if (val.furniture_none) {
        // 없음 체크면 교체/리폼 선택이 있으면 에러(안전장치)
        if (hasAnyFurniture) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["furniture_none"],
                message: "가구 공사 '없음'을 선택하면 교체/리폼 선택을 해제해주세요.",
            });
        }
    } else {
        // 없음이 아니면: 교체 또는 리폼 중 최소 1개는 선택 (원하는 정책)
        if (!hasAnyFurniture) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["furniture_replace"],
                message: "가구 공사를 선택하거나 '없음'을 선택해주세요.",
            });
        }
    }
});

export type FormValues = z.infer<typeof FormSchema>;

export const steps = [
    "기본정보",
    "확장/구조",
    "샷시/도어",
    "바닥/몰딩/중문/필름",
    "욕실/타일/벽체마감",
    "전기/에어컨/베란다",
    "가구/도면/기타",
];

// ✅ 각 스텝에서 검증할 필드 목록(여기에 계속 추가하면 됨)

export const stepFields: Array<Array<keyof FormValues>> = [
    ["name", "phone","start_date", "move_in_date","channel", "budget_range", "zip_code", "address_detail"],
    ["desired_type","extension_existing",  "extension_plan"],
    ["window_work", "window_work_etc","window_reform", "window_reform_etc","door_frame_work",
        "door_frame_work_etc",
        "door_frame_reform",
        "door_frame_reform_etc",],

// Step3
    [
        "floor_demolition",
        "floor_demolition_etc",
        "floor_work",
        "floor_work_etc",
        "molding_work",
        "molding_work_etc",
        "partition_door",
        "partition_door_etc",
        "film_work",
        "film_work_etc",
    ],

// Step4
    ["bathroom_work", "bathroom_work_etc", "tile_work", "tile_work_etc","wall_finish",
        "wall_finish_etc"],

    // Step5
    [
        "electrical_work",
        "electrical_work_etc",
        "veranda_coat",
        "veranda_coat_etc",

        "aircon_work",
        "aircon_work_etc",

    ],

    ["furniture_replace",
        "furniture_reform",
        "furniture_replace_etc",
        "furniture_reform_etc",
        "furniture_none",
        "plans",
        "inquiry_note",
        "consult_confirm",], // Step6
];
