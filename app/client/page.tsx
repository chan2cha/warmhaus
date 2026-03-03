"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    MenuItem,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
    Divider,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import { useForm, Controller, useWatch ,SubmitHandler} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

declare global {
    interface Window {
        daum?: any;
    }
}

const CHANNEL_OPTIONS = [
    { value: "blog", label: "블로그" },
    { value: "instagram", label: "인스타" },
    { value: "cafe", label: "카페" },
    { value: "referral", label: "지인추천" },
    { value: "etc", label: "기타" },
];

const BUDGET_RANGE_OPTIONS = [
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
const EXTENSION_OPTIONS = ["거실", "주방", "안방", "작은방A", "작은방B", "없음", "모름"] as const;
const WINDOW_WORK_OPTIONS = ["전체 교체", "확장부만 교체", "내창만 교체", "외창만 교체", "없음", "모름","기타"] as const;
const WINDOW_REFORM_OPTIONS = ["전체 리폼(교체 샷시 제외)", "없음", "모름", "기타"] as const;
const DOOR_FRAME_WORK_OPTIONS = [
    "전체 교체",
    "모든 문만 교체",
    "욕실 문만 교체",
    "없음",
    "모름",
    "기타",
] as const;

const DOOR_FRAME_REFORM_OPTIONS = [
    "문선 리폼(9mm문선)",
    "방문 교체",
    "없음",
    "모름",
    "기타",
] as const;

const FLOOR_DEMOLITION_OPTIONS = [
    "전체 마루 철거",
    "전체 장판 철거",
    "부분 철거(예: 거실 마루 / 방 장판 철거)",
    "없음",
    "모름",
    "기타",
] as const;
const FLOOR_WORK_OPTIONS = ["장판", "강마루", "원목 마루", "거실/주방타일 + 방마루", "없음", "모름", "기타"] as const;
const MOLDING_WORK_OPTIONS = [
    "기본: 역계단 몰딩",
    "중간: 무몰딩",
    "고급: 마이너스 몰딩(히든몰딩)",
    "몰딩 리폼",
    "없음",
    "모름",
    "기타",
] as const;

const PARTITION_DOOR_OPTIONS = ["중문 설치", "중문 가벽까지 설치", "없음",  "모름","기타"] as const;

const FILM_WORK_OPTIONS = [
    "현관문 리폼",
    "주방 수납장 리폼",
    "안방 붙박이장 리폼",
    "작은방 수납장 리폼",
    "수납장 리폼",
    "없음",
    "모름",
    "기타",
] as const;

const BATHROOM_WORK_OPTIONS = [
    "공용욕실(타일 덧방)",
    "공용욕실(올 철거)",
    "안방욕실(타일 덧방)",
    "안방욕실(올 철거)",
    "없음",
    "모름",
    "기타",
] as const;

const TILE_WORK_OPTIONS = [
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
const ELECTRICAL_OPTIONS = [
    "기본: 다운라이트 ALL",
    "기본: 공용부-다운라이트 / 방 LED",
    "포인트 옵션: 마그네틱 조명 & 라인조명",
    "없음",
    "모름",
    "기타",
] as const;

const VERANDA_COAT_OPTIONS = [
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

const WALL_FINISH_OPTIONS = [
    "합지 도배",
    "실크 도배",
    "거실 도장 + 방 합지 도배",
    "거실 도장 + 방 실크 도배",
    "없음",
    "모름",
    "기타",
] as const;

// 에어컨(예시: 너 스샷에 맞춰 필요 옵션만 이어서 추가하면 됨)
const AIRCON_OPTIONS = [
    "1대 / 거실",
    "2대 / 거실, 방A",
    "3대 / 거실, 방A, 방B",
    "4대 / 거실, 방A, 방B, C",
    "5대 / 거실, 주방, 방A, 방B, C",
    "없음",
    "모름",
    "기타",
] as const;
const FURNITURE_ITEMS = [
    "주방",
    "신발장",
    "안방 붙박이장",
    "작은방 수납장",
    "베란다장",
    "기타",
] as const;
function onlyDigits(s: string) {
    return (s || "").replace(/[^0-9]/g, "");
}

// ✅ 한국 번호 포맷(휴대폰/02/지역/070/대표번호)
function formatPhoneKR(input: string) {
    const digits = onlyDigits(input).slice(0, 11);
    if (!digits) return "";

    if (/^(15|16|18)\d{2}/.test(digits)) {
        if (digits.length <= 4) return digits;
        return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
    }

    if (digits.startsWith("02")) {
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `02-${digits.slice(2)}`;
        if (digits.length <= 9) return `02-${digits.slice(2, 5)}-${digits.slice(5)}`;
        return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    if (digits.startsWith("070")) {
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `070-${digits.slice(3)}`;
        return `070-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    if (/^01[016789]/.test(digits)) {
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// ✅ 단독 선택 옵션: '없음', '모름', '전체...' (전체로 시작하는 모든 옵션)
function isExclusiveOption(opt: string) {
    return opt === "없음" || opt === "모름" || /^전체/.test(opt);
}

function toggleWithExclusive(values: string[], next: string) {
    const curr = values || [];
    const has = curr.includes(next);

    // next가 단독 옵션이면: 선택 시 단독, 해제 시 빈 배열
    if (isExclusiveOption(next)) {
        return has ? [] : [next];
    }

    // 일반 옵션을 누르면: 기존 단독 옵션(없음/모름/전체*) 제거 후 토글
    const withoutExclusive = curr.filter((v) => !isExclusiveOption(v));

    if (has) return withoutExclusive.filter((v) => v !== next);
    return [...withoutExclusive, next];
}

function hasAnyExclusive(values: string[]) {
    return (values || []).some(isExclusiveOption);
}

// --- 스키마 (MVP: 1~2개 섹션만 예시로 넣고 계속 확장하면 됨)
const FormSchema = z.object({
    // Step0
    name: z.string().min(1, "이름을 입력해주세요."),
    phone: z.string().min(9, "연락처를 입력해주세요."),
    channel: z.string().min(1, "알게 된 경로를 선택해주세요."),
    budget_range: z.string().min(1, "예산 범위를 선택해주세요."),

    zip_code: z.string().min(1, "주소찾기로 주소를 선택해주세요."),
    address_road: z.string().default(""),
    address_jibun: z.string().default(""),
    address_detail: z.string().min(1, "상세주소를 입력해주세요."),

    // Step1 (예시: 확장)
    extension_existing: z.array(z.string()).min(1, "현재 확장부를 선택해주세요."),
    extension_plan: z.array(z.string()).min(1, "확장공사를 선택해주세요."),

    // Step2 (예시: 샷시/도어)
    window_work: z.array(z.string()).min(1, "샷시 공사를 선택해주세요."),
    window_work_etc: z.string().default(""),
    window_reform: z.array(z.string()).default([]),
    window_reform_etc: z.string().default(""),
    door_frame_work: z.array(z.string()).min(1, "방문/방문틀 공사를 선택해주세요."),
    door_frame_work_etc: z.string().default(""),
    door_frame_reform: z.array(z.string()).default([]),
    door_frame_reform_etc: z.string().default(""),



    // Step3 (도어/바닥/몰딩/중문/필름)
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

// Step4 (욕실/타일/벽체마감)
    bathroom_work: z.array(z.string()).min(1, "욕실 공사를 선택해주세요."),
    bathroom_work_etc: z.string().default(""),

    tile_work: z.array(z.string()).min(1, "타일 공사를 선택해주세요."),
    tile_work_etc: z.string().default(""),

    wall_finish: z.array(z.string()).min(1, "벽체 마감 공사를 선택해주세요."),
    wall_finish_etc: z.string().default(""),

// Step5 (전기/베란다 벽면/에어컨)
    electrical_work: z.array(z.string()).min(1, "전기 공사를 선택해주세요."),
    electrical_work_etc: z.string().default(""),

    veranda_coat: z.array(z.string()).min(1, "베란다 벽면 탄성코트 공사를 선택해주세요."),
    veranda_coat_etc: z.string().default(""),


    aircon_work: z.array(z.string()).min(1, "에어컨 공사를 선택해주세요."),
    aircon_work_etc: z.string().default(""),

    // Step6
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

type FormValues = z.infer<typeof FormSchema>;

const steps = [
    "기본정보",
    "확장/구조",
    "샷시/도어",
    "바닥/몰딩/중문/필름",
    "욕실/타일/벽체마감",
    "전기/에어컨/베란다",
    "가구/도면/기타",
];

// ✅ 각 스텝에서 검증할 필드 목록(여기에 계속 추가하면 됨)

const stepFields: Array<Array<keyof FormValues>> = [
    ["name", "phone", "channel", "budget_range", "zip_code", "address_detail"],
    ["extension_existing", "extension_plan"],
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


export default function PublicFormStepperPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [submitDone, setSubmitDone] = useState(false);
    const [submitErr, setSubmitErr] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // 필드 DOM ref 맵(포커스/스크롤)
    const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const {
        control,
        handleSubmit,
        setValue,
        getValues,
        trigger,
        setFocus,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: "",
            phone: "",
            channel: "blog",
            budget_range: "4000_5000",
            zip_code: "",
            address_road: "",
            address_jibun: "",
            address_detail: "",
            extension_existing: [],
            extension_plan: [],
            window_work: [],
            window_work_etc: "",
            window_reform: [],
            window_reform_etc: "",
            door_frame_work: [],
            door_frame_work_etc: "",
            door_frame_reform: [],
            door_frame_reform_etc: "",

            hp: "",
            floor_demolition: [],
            floor_demolition_etc: "",
            floor_work: [],
            floor_work_etc: "",
            molding_work: [],
            molding_work_etc: "",

            partition_door: [],
            partition_door_etc: "",

            film_work: [],
            film_work_etc: "",

            bathroom_work: [],
            bathroom_work_etc: "",

            tile_work: [],
            tile_work_etc: "",
            electrical_work: [],
            electrical_work_etc: "",

            veranda_coat: [],
            veranda_coat_etc: "",

            wall_finish: [],
            wall_finish_etc: "",

            aircon_work: [],
            aircon_work_etc: "",

            furniture_replace: [],
            furniture_reform: [],
            furniture_replace_etc: "",
            furniture_reform_etc: "",
            furniture_none: false,

            plans: [],
            inquiry_note: "",
            consult_confirm: "",
        },
        mode: "onTouched",
    });

    const phone = useWatch({ control, name: "phone" });
    const plans = useWatch({ control, name: "plans" }) as any[];
    const zipCode = useWatch({ control, name: "zip_code" });
    // 주소 전체 문자열
    const addressFull = useMemo(() => {
        const v = getValues();
        const base = `[${v.zip_code}] ${(v.address_road || v.address_jibun || "").trim()}`.trim();
        return `${base} ${v.address_detail}`.trim();
    }, [getValues, useWatch({ control, name: "zip_code" }), useWatch({ control, name: "address_detail" })]);

    function openDaumPostcode() {
        if (!window.daum?.Postcode) {
            alert("주소검색 로딩 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        new window.daum.Postcode({
            oncomplete: function (data: any) {
                setValue("zip_code", data.zonecode || "", { shouldValidate: true });
                setValue("address_road", (data.roadAddress || "").trim());
                setValue("address_jibun", (data.jibunAddress || "").trim());
                setTimeout(() => setFocus("address_detail"), 0);
            },
        }).open();
    }

    function addPlans(files: FileList | null) {
        if (!files) return;
        const existing = (getValues("plans") || []) as any[];
        const merged = [...existing, ...Array.from(files)].slice(0, 3);
        setValue("plans", merged as any, { shouldValidate: true });
        if (existing.length + files.length > 3) alert("도면/사진은 최대 3장까지 업로드할 수 있어요.");
    }

    function removePlan(idx: number) {
        const existing = (getValues("plans") || []) as any[];
        const next = existing.filter((_: any, i: number) => i !== idx);
        setValue("plans", next as any, { shouldValidate: true });
    }

    // ✅ 첫 에러로 스크롤 + 포커스
    function focusFirstErrorInStep(stepIdx: number) {
        const fields = stepFields[stepIdx] || [];
        for (const f of fields) {
            if ((errors as any)?.[f]) {
                const key = String(f);
                const el = fieldRefs.current[key];
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                try {
                    setFocus(f as any);
                } catch {}
                return;
            }
        }
    }

    async function nextStep() {
        // 현재 스텝 필드만 검증
        const fields = stepFields[activeStep] || [];
        const ok = fields.length ? await trigger(fields as any) : true;
        if (!ok) {
            focusFirstErrorInStep(activeStep);
            return;
        }
        setActiveStep((s) => Math.min(s + 1, steps.length - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function prevStep() {
        setActiveStep((s) => Math.max(s - 1, 0));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 최종 제출
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSubmitting(true);
        setSubmitErr("");
        try {
            const phoneDigits = onlyDigits(data.phone);

            const budgetLabel = BUDGET_RANGE_OPTIONS.find((b) => b.value === data.budget_range)?.label || "";

            const res = await fetch("/api/client/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hp: data.hp,
                    name: data.name,
                    phone: phoneDigits,
                    channel: data.channel,
                    budget_range: data.budget_range,
                    budget_raw: budgetLabel,


                    zip_code: data.zip_code,
                    address_road: data.address_road,
                    address_jibun: data.address_jibun,
                    address_detail: data.address_detail,
                    address_full: addressFull,

                    // 예시 spec (여기에 공사항목 다 넣어 확장)
                    spec: {
                        // 확장/구조
                        extension_existing: data.extension_existing,
                        extension_plan: data.extension_plan,

                        // 샷시
                        window_work: data.window_work,
                        window_work_etc: data.window_work_etc,
                        window_reform: data.window_reform,
                        window_reform_etc: data.window_reform_etc,

                        // 방문/방문틀
                        door_frame_work: data.door_frame_work,
                        door_frame_work_etc: data.door_frame_work_etc,
                        door_frame_reform: data.door_frame_reform,
                        door_frame_reform_etc: data.door_frame_reform_etc,

                        // 바닥(철거 + 시공)
                        floor_demolition: data.floor_demolition,
                        floor_demolition_etc: data.floor_demolition_etc,
                        floor_work: data.floor_work,
                        floor_work_etc: data.floor_work_etc,

                        // 몰딩
                        molding_work: data.molding_work,
                        molding_work_etc: data.molding_work_etc,

                        // 중문
                        partition_door: data.partition_door,
                        partition_door_etc: data.partition_door_etc,

                        // 필름
                        film_work: data.film_work,
                        film_work_etc: data.film_work_etc,

                        // 욕실
                        bathroom_work: data.bathroom_work,
                        bathroom_work_etc: data.bathroom_work_etc,

                        // 타일
                        tile_work: data.tile_work,
                        tile_work_etc: data.tile_work_etc,

                        // 전기
                        electrical_work: data.electrical_work,
                        electrical_work_etc: data.electrical_work_etc,

                        // 베란다 벽면 탄성코트
                        veranda_coat: data.veranda_coat,
                        veranda_coat_etc: data.veranda_coat_etc,

                        // 벽체 마감
                        wall_finish: data.wall_finish,
                        wall_finish_etc: data.wall_finish_etc,

                        // 에어컨
                        aircon_work: data.aircon_work,
                        aircon_work_etc: data.aircon_work_etc,

                        // 가구(2배열 + 없음)
                        furniture_replace: data.furniture_replace,
                        furniture_reform: data.furniture_reform,
                        furniture_replace_etc: data.furniture_replace_etc,
                        furniture_reform_etc: data.furniture_reform_etc,
                        furniture_none: data.furniture_none,

                        // 도면
                        plan_count: (data.plans || []).length,
                    },
                }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "제출 실패");

            setSubmitDone(true);
        } catch (e: any) {
            setSubmitErr(e.message || "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitDone) {
        return (
            <Box sx={{ p: 2, maxWidth: 720, mx: "auto" }}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={900} gutterBottom>
                            접수 완료
                        </Typography>
                        <Typography color="text.secondary">
                            확인 후 연락드릴게요. (가능하면 1영업일 이내)
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <>
            <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

            <Box sx={{ p: 2, maxWidth: 720, mx: "auto" }}>
                <Stack spacing={2}>
                    <Typography variant="h5" fontWeight={900}>
                        상담 문의
                    </Typography>

                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {submitErr ? <Alert severity="error">{submitErr}</Alert> : null}

                            {/* ----- STEP CONTENTS ----- */}
                            {activeStep === 0 && (
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <Box
                                            ref={(el : HTMLDivElement | null) => {(fieldRefs.current["name"] = el)}}
                                            sx={{ flex: { sm: 1 }, minWidth: 0 }}
                                        >
                                            <Controller
                                                name="name"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        label="이름"
                                                        {...field}
                                                        error={!!errors.name}
                                                        helperText={errors.name?.message as any}
                                                        required
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </Box>

                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["phone"] = el
                                            }}
                                            sx={{ flex: { sm: 2 }, minWidth: 0 }}
                                        >
                                            <Controller
                                                name="phone"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        label="연락처"
                                                        value={phone}
                                                        onChange={(e) => field.onChange(formatPhoneKR(e.target.value))}
                                                        error={!!errors.phone}
                                                        helperText={errors.phone?.message as any}
                                                        inputMode="numeric"
                                                        placeholder="010-1234-5678"
                                                        required
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Stack>

                                    <Divider />

                                    {/* --- 주소: 모바일 최적화 --- */}
                                    <Stack spacing={1.5}>
                                        {/* 우편번호 + 주소찾기 (모바일도 한 줄 고정) */}
                                        <Stack direction="row" spacing={1} alignItems="stretch">
                                            <Box ref={(el :HTMLDivElement | null) => {
                                                fieldRefs.current["zip_code"] = el
                                            }} sx={{ flex: 1, minWidth: 0 }}>
                                                <Controller
                                                    name="zip_code"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <TextField
                                                            label="우편번호"
                                                            {...field}
                                                            fullWidth
                                                            InputProps={{ readOnly: true }}
                                                            error={!!errors.zip_code}
                                                            helperText={errors.zip_code?.message as any}
                                                            required
                                                        />
                                                    )}
                                                />
                                            </Box>

                                            <Button
                                                variant="outlined"
                                                onClick={openDaumPostcode}
                                                sx={{ whiteSpace: "nowrap", flexShrink: 0, px: 2 }}
                                            >
                                                주소찾기
                                            </Button>
                                        </Stack>

                                        {/* 주소찾기 전 안내 */}
                                        {!zipCode ? (
                                            <Alert severity="info" sx={{ py: 0.5 }}>
                                                주소찾기로 주소를 먼저 선택해주세요.
                                            </Alert>
                                        ) : null}

                                        {/* 상세주소 */}
                                        <Box ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["address_detail"] = el
                                        }}>
                                            <Controller
                                                name="address_detail"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        label="상세주소"
                                                        {...field}
                                                        fullWidth
                                                        disabled={!zipCode}
                                                        error={!!errors.address_detail}
                                                        helperText={
                                                            !zipCode
                                                                ? "주소를 선택하면 상세주소를 입력할 수 있어요."
                                                                : (errors.address_detail?.message as any)
                                                        }
                                                        required
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Stack>


                                    <Controller
                                        name="budget_range"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField select label="예산 범위" {...field} required fullWidth>
                                                {BUDGET_RANGE_OPTIONS.map((o) => (
                                                    <MenuItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />
                                    <Controller
                                        name="channel"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField select label="알게 된 경로" {...field} required>
                                                {CHANNEL_OPTIONS.map((o) => (
                                                    <MenuItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />

                                    {/* honeypot */}
                                    <Controller name="hp" control={control} render={({ field }) => <TextField sx={{ display: "none" }} {...field} />} />
                                </Stack>
                            )}

                            {activeStep === 1 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>기확장부(현재 확장된 공간) *</Typography>
                                    <Typography fontWeight={400}>현재 확장되어 있는 공간을 선택해 주세요.</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="extension_existing"
                                        options={EXTENSION_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />

                                    <Typography fontWeight={900}>확장공사(확장 예정) *</Typography>
                                    <Typography fontWeight={400}>확장 예정인 공간을 선택해 주세요.</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="extension_plan"
                                        options={[...EXTENSION_OPTIONS] as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                </Stack>
                            )}

                            {activeStep === 2 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>샷시 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="window_work"
                                        options={WINDOW_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    {/* ✅ 샷시 공사에서 '기타' 선택 시 텍스트 입력 */}
                                    <EtcTextField whenCheckedIn="window_work" etcName="window_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    {/* ✅ 부분교체 선택 시에만 노출 */}
                                    <WindowReformSection
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <Typography fontWeight={900}>방문/방문틀 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="door_frame_work"
                                        options={DOOR_FRAME_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField whenCheckedIn="door_frame_work" etcName="door_frame_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />


                                    <DoorFrameReformSection control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                </Stack>
                            )}
                            {activeStep === 3 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>바닥 철거 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="floor_demolition"
                                        options={FLOOR_DEMOLITION_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField
                                        whenCheckedIn="floor_demolition"
                                        etcName="floor_demolition_etc"
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                        placeholder="예) 거실 마루만 철거, 방 장판만 철거 등"
                                    />
                                    <Typography fontWeight={900}>바닥 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="floor_work"
                                        options={FLOOR_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField
                                        whenCheckedIn="floor_work"
                                        etcName="floor_work_etc"
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                        placeholder="예) 특정 공간만 바닥 변경 등"
                                    />
                                    <Typography fontWeight={900}>몰딩 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="molding_work"
                                        options={MOLDING_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField whenCheckedIn="molding_work" etcName="molding_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>중문 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="partition_door"
                                        options={PARTITION_DOOR_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField whenCheckedIn="partition_door" etcName="partition_door_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>필름 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="film_work"
                                        options={FILM_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField whenCheckedIn="film_work" etcName="film_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                </Stack>
                            )}

                            {activeStep === 4 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>욕실 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="bathroom_work"
                                        options={BATHROOM_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField whenCheckedIn="bathroom_work" etcName="bathroom_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>타일 공사 *</Typography>
                                    <CheckboxGroupWithUnknown
                                        name="tile_work"
                                        options={TILE_WORK_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <EtcTextField whenCheckedIn="tile_work" etcName="tile_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                    <Typography fontWeight={900}>벽체 마감 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="wall_finish" options={WALL_FINISH_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                    <EtcTextField whenCheckedIn="wall_finish" etcName="wall_finish_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                </Stack>
                            )}

                            {activeStep === 5 && (
                                <Stack spacing={2}>

                                    <Typography fontWeight={900}>전기 공사 *</Typography>
                                    <Typography fontWeight={300}>*가견적상, 기본적으로 주로 사용하는 제품으로 배치 및 갯수 설정 됩니다. 정확한 수치는 추후 조정 될 예정입니다.*</Typography>
                                    <CheckboxGroupWithUnknown name="electrical_work" options={ELECTRICAL_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                    <EtcTextField whenCheckedIn="electrical_work" etcName="electrical_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Divider />

                                    <Typography fontWeight={900}>베란다 벽면 탄성코트 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="veranda_coat" options={VERANDA_COAT_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                    <EtcTextField whenCheckedIn="veranda_coat" etcName="veranda_coat_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Divider />

                                    <Typography fontWeight={900}>에어컨 공사(천장형) *</Typography>
                                    <Typography fontWeight={300}>현장 상황에 따라 천장 단내림 공사가 수반 됩니다.</Typography>
                                    <CheckboxGroupWithUnknown name="aircon_work" options={AIRCON_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                    <EtcTextField whenCheckedIn="aircon_work" etcName="aircon_work_etc" control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                </Stack>
                            )}

                            {activeStep === 6 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>가구 공사 *</Typography>

                                    <Box
                                        ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["furniture_none"] = el;
                                        }}
                                    >
                                        <Controller
                                            name="furniture_none"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={!!field.value}
                                                            onChange={(e) => {
                                                                const next = e.target.checked;
                                                                if (next) {
                                                                    setValue("furniture_replace", [], { shouldValidate: false });
                                                                    setValue("furniture_reform", [], { shouldValidate: false });
                                                                    setValue("furniture_replace_etc", "", { shouldValidate: false });
                                                                    setValue("furniture_reform_etc", "", { shouldValidate: false });
                                                                    setValue("furniture_none", true, { shouldValidate: true });
                                                                } else {
                                                                    setValue("furniture_none", false, { shouldValidate: true });
                                                                }
                                                            }}
                                                        />
                                                    }
                                                    label="가구 공사 없음"
                                                />
                                            )}
                                        />
                                        {errors?.furniture_none ? <Alert severity="error">{errors.furniture_none?.message}</Alert> : null}
                                    </Box>

                                    <FurnitureMatrix
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />
                                    <Typography fontWeight={900}>평면도 첨부 </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        평면도가 아닌 파일은 온라인 견적에 반영이 어려울 수 있어요. (PDF/이미지 권장)
                                    </Typography>

                                    <Box
                                        ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["plans"] = el;
                                        }}
                                    >
                                        {errors?.plans ? <Alert severity="error">{errors.plans?.message as any}</Alert> : null}

                                        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                                            파일 추가
                                            <input
                                                hidden
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf"
                                                onChange={(e) => addPlans(e.target.files)}
                                            />
                                        </Button>

                                        {plans?.length ? (
                                            <Stack spacing={1} sx={{ mt: 1 }}>
                                                {plans.map((f: any, idx: number) => (
                                                    <Stack
                                                        key={idx}
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                                            {idx + 1}. {f.name}
                                                        </Typography>
                                                        <Button size="small" color="error" onClick={() => removePlan(idx)}>
                                                            제거
                                                        </Button>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                선택한 파일이 없습니다. (최대 3개)
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box
                                        ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["inquiry_note"] = el;
                                        }}
                                    >
                                        <Controller
                                            name="inquiry_note"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    label="기타 문의 사항"
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    minRows={3}
                                                    placeholder="원하시는 스타일, 요청사항, 참고할 점 등을 적어주세요."
                                                />
                                            )}
                                        />
                                    </Box>
                                    <Box
                                        ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["consult_confirm"] = el;
                                        }}
                                    >
                                        <Typography fontWeight={900} sx={{ mt: 2 }}>
                                            * 위 내용 바탕으로 간단한 상담은 전화로 진행됩니다. *
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mt: 1 }}>
                                            {`※ 유선 상담의 경우, 20~30분 소요 됩니다. 단순한 사항과 필수로 측정 되기에 정확하지 않을 수 있습니다.
상담 문의가 많아 일주일 이상 연락이 닿지 않는 경우에는 별도 메시지 또는 DM 보내주시면 감사 하겠습니다.

※ 내방 상담의 경우, 예약제로 진행되고 있습니다. 사전에 꼭 미리 연락 부탁드리겠습니다.
1~2시간 상담이 이뤄진 후, 상세 견적서를 매우 디테일 하여,
공사가 끝났을 때의 최종 견적서와 크게 다르지 않기에 구체적인 사양 & 예산을 잡기에 더욱 좋습니다.`}
                                        </Typography>

                                        <Controller
                                            name="consult_confirm"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    select
                                                    label="상담 진행 방식 확인 *"
                                                    {...field}
                                                    fullWidth
                                                    sx={{ mt: 1 }}
                                                    error={!!errors.consult_confirm}
                                                    helperText={errors.consult_confirm?.message as any}
                                                    required
                                                >
                                                    <MenuItem value="phone">예, 이해하였습니다. [유선 상담]으로 진행하겠습니다.</MenuItem>
                                                    <MenuItem value="office">예, 이해하였습니다. [내방 미팅]으로 진행하겠습니다.</MenuItem>
                                                </TextField>
                                            )}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        제출 시 입력하신 정보는 상담 목적으로만 사용됩니다.
                                    </Typography>
                                </Stack>
                            )}


                            {/* ----- STEP NAV ----- */}
                            <Box
                                sx={{
                                    position: { xs: "sticky", sm: "static" },
                                    bottom: { xs: 0, sm: "auto" },
                                    zIndex: 10,
                                    bgcolor: "background.paper",
                                    pt: 1,
                                    pb: "calc(env(safe-area-inset-bottom) + 8px)",
                                    mt: 2,
                                    borderTop: { xs: "1px solid", sm: "none" },
                                    borderColor: { xs: "divider", sm: "transparent" },
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    {/* Step0에서는 이전 버튼 숨김 */}
                                    {activeStep === 0 ? (
                                        <Box />
                                    ) : (
                                        <Button variant="text" disabled={submitting} onClick={prevStep}>
                                            이전
                                        </Button>
                                    )}

                                    {activeStep < steps.length - 1 ? (
                                        <Button variant="contained" disabled={submitting} onClick={nextStep}>
                                            다음
                                        </Button>
                                    ) : (
                                        <Button variant="contained" disabled={submitting} onClick={handleSubmit(onSubmit)}>
                                            제출
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </>
    );
}

/** ✅ 체크박스 그룹 + 모름 단독 처리 + 필수 에러 표시 + 포커스/스크롤 target */
function CheckboxGroupWithUnknown(props: {
    name: keyof FormValues;
    options: readonly string[];
    control: any;
    errors: any;
    setValue: any;
    fieldRefs: any;
}) {
    const { name, options, control, errors, setValue, fieldRefs } = props;

    const values = useWatch({ control, name }) as string[];
    const hasExclusive = hasAnyExclusive(values || []);

    // ref 등록(첫 에러 포커스용)
    useEffect(() => {
        if (!fieldRefs.current[name]) fieldRefs.current[name] = null;
    }, [fieldRefs, name]);

    return (
        <Box ref={(el) => {(fieldRefs.current[name] = el)}} data-field={name}>
            {errors?.[name] ? <Alert severity="error">{errors[name]?.message}</Alert> : null}

            <Stack spacing={0.5} sx={{ mt: 1 }}>
                {options.map((opt) => {
                    const checked = (values || []).includes(opt);
                    // ✅ 단독 옵션(없음/모름/전체*) 선택 중이면, 다른 일반 옵션은 비활성화
                    const disabled = hasExclusive && !isExclusiveOption(opt);

                    return (
                        <FormControlLabel
                            key={opt}
                            control={
                                <Checkbox
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => {
                                        const next = toggleWithExclusive(values || [], opt);
                                        setValue(name, next, { shouldValidate: true });
                                    }}
                                />
                            }
                            label={opt}
                        />
                    );
                })}
            </Stack>
        </Box>
    );
}

function WindowReformSection({
                                 control,
                                 errors,
                                 setValue,
                                 fieldRefs,
                             }: {
    control: any;
    errors: any;
    setValue: any;
    fieldRefs: any;
}) {
    const windowWork = useWatch({ control, name: "window_work" }) as string[];

    const partialKeys = ["확장부만 교체", "내창만 교체", "외창만 교체"];
    const hasPartial = (windowWork || []).some((v) => partialKeys.includes(v));

    // 부분교체가 아니면 값 초기화(숨김 UX 깔끔)
    useEffect(() => {
        if (!hasPartial) {
            setValue("window_reform", [], { shouldValidate: true });
            setValue("window_reform_etc", "", { shouldValidate: true });
        }
    }, [hasPartial, setValue]);

    const windowReform = useWatch({ control, name: "window_reform" }) as string[];
    const showEtc = (windowReform || []).includes("기타");

    if (!hasPartial) return null;

    return (
        <Stack spacing={1.5}>
            <Box
                ref={(el: HTMLDivElement | null) => {
                    fieldRefs.current["window_reform"] = el;
                }}
            >
                <Typography fontWeight={900}>샷시 리폼 *</Typography>
                <Typography variant="body2" color="text.secondary">
                    샷시 부분 교체 시 선택사항입니다.
                </Typography>

                <CheckboxGroupWithUnknown
                    name="window_reform"
                    options={WINDOW_REFORM_OPTIONS as any}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    fieldRefs={fieldRefs}
                />
            </Box>

            {showEtc && (
                <Box
                    ref={(el: HTMLDivElement | null) => {
                        fieldRefs.current["window_reform_etc"] = el;
                    }}
                >
                    <Controller
                        name="window_reform_etc"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="기타 내용"
                                {...field}
                                fullWidth
                                error={!!errors.window_reform_etc}
                                helperText={errors.window_reform_etc?.message as any}
                                placeholder="예) 하부만 리폼, 손잡이 교체 등"
                            />
                        )}
                    />
                </Box>
            )}
        </Stack>
    );
}

function DoorFrameReformSection({ control, errors, setValue, fieldRefs }: any) {
    const work = useWatch({ control, name: "door_frame_work" }) as string[];
    const isAllReplace = (work || []).includes("전체 교체");
    const need = (work || []).length > 0 && !isAllReplace;

    useEffect(() => {
        if (!need) {
            setValue("door_frame_reform", [], { shouldValidate: true });
            setValue("door_frame_reform_etc", "", { shouldValidate: true });
        }
    }, [need, setValue]);

    const reform = useWatch({ control, name: "door_frame_reform" }) as string[];
    const showEtc = (reform || []).includes("기타");

    if (!need) return null;

    return (
        <Stack spacing={1.5}>
            <Box
                ref={(el: HTMLDivElement | null) => {
                    fieldRefs.current["door_frame_reform"] = el;
                }}
            >
                <Typography fontWeight={900}>방문/방문틀 리폼 *</Typography>
                <Typography variant="body2" color="text.secondary">
                    방문/방문틀 부분 교체 시 선택사항입니다.
                </Typography>

                <CheckboxGroupWithUnknown
                    name="door_frame_reform"
                    options={DOOR_FRAME_REFORM_OPTIONS as any}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    fieldRefs={fieldRefs}
                />
            </Box>

            {showEtc && (
                <Box
                    ref={(el: HTMLDivElement | null) => {
                        fieldRefs.current["door_frame_reform_etc"] = el;
                    }}
                >
                    <Controller
                        name="door_frame_reform_etc"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                label="기타 내용"
                                {...field}
                                fullWidth
                                error={!!errors.door_frame_reform_etc}
                                helperText={errors.door_frame_reform_etc?.message as any}
                                placeholder="예) 문선만 리폼, 하부만 보수 등"
                            />
                        )}
                    />
                </Box>
            )}
        </Stack>
    );
}
function EtcTextField({
                          whenCheckedIn,
                          etcName,
                          control,
                          errors,
                          setValue,
                          fieldRefs,
                          label = "기타 내용",
                          placeholder = "기타 내용을 입력해주세요.",
                      }: {
    whenCheckedIn: keyof FormValues; // 체크 배열 필드
    etcName: keyof FormValues;       // 텍스트 필드
    control: any;
    errors: any;
    setValue: any;
    fieldRefs: any;
    label?: string;
    placeholder?: string;
}) {
    const arr = useWatch({ control, name: whenCheckedIn }) as string[];
    const show = (arr || []).includes("기타");

    useEffect(() => {
        if (!show) setValue(etcName as any, "", { shouldValidate: true });
    }, [show, setValue, etcName]);

    if (!show) return null;

    return (
        <Box
            ref={(el: HTMLDivElement | null) => {
                fieldRefs.current[String(etcName)] = el;
            }}
        >
            <Controller
                name={etcName as any}
                control={control}
                render={({ field }) => (
                    <TextField
                        label={label}
                        {...field}
                        fullWidth
                        error={!!errors?.[etcName]}
                        helperText={errors?.[etcName]?.message as any}
                        placeholder={placeholder}
                    />
                )}
            />
        </Box>
    );
}
function FurnitureMatrix({
                             control,
                             errors,
                             setValue,
                             fieldRefs,
                         }: {
    control: any;
    errors: any;
    setValue: any;
    fieldRefs: any;
}) {
    const replace = useWatch({ control, name: "furniture_replace" }) as string[];
    const reform = useWatch({ control, name: "furniture_reform" }) as string[];
    const furnitureNone = useWatch({ control, name: "furniture_none" }) as boolean;
    // ref: 첫 에러 포커스용(교체 기준으로 걸어둠)
    return (
        <Box
            ref={(el: HTMLDivElement | null) => {
                fieldRefs.current["furniture_replace"] = el;
            }}
        >
            {(errors?.furniture_replace || errors?.furniture_reform) ? (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {errors?.furniture_replace?.message || errors?.furniture_reform?.message}
                </Alert>
            ) : null}

            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                {/* 헤더 */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 72px 72px",
                        bgcolor: "action.hover",
                        px: 1.5,
                        py: 1,
                        fontWeight: 700,
                        fontSize: 13,
                    }}
                >
                    <Box />
                    <Box textAlign="center">교체</Box>
                    <Box textAlign="center">리폼</Box>
                </Box>

                {/* rows */}
                {FURNITURE_ITEMS.map((item) => {
                    const isReplaceChecked = (replace || []).includes(item);
                    const isReformChecked = (reform || []).includes(item);

                    return (
                        <Box
                            key={item}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "1fr 72px 72px",
                                alignItems: "center",
                                px: 1.5,
                                py: 1,
                                borderTop: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Box sx={{ fontSize: 14 }}>{item}</Box>

                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Checkbox
                                    checked={isReplaceChecked}
                                    disabled={!!furnitureNone}
                                    onChange={() => {
                                        if (furnitureNone) return;

                                        // ✅ 테이블에서 뭔가 선택하면 '없음' 자동 해제
                                        setValue("furniture_none", false, { shouldValidate: true });

                                        const next = isReplaceChecked
                                            ? (replace || []).filter((v) => v !== item)
                                            : [...(replace || []), item];
                                        setValue("furniture_replace", next, { shouldValidate: true });
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Checkbox
                                    checked={isReformChecked}
                                    disabled={!!furnitureNone}
                                    onChange={() => {
                                        if (furnitureNone) return;

                                        setValue("furniture_none", false, { shouldValidate: true });

                                        const next = isReformChecked
                                            ? (reform || []).filter((v) => v !== item)
                                            : [...(reform || []), item];
                                        setValue("furniture_reform", next, { shouldValidate: true });
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                교체/리폼은 중복 선택 가능합니다.
            </Typography>
        </Box>
    );
}