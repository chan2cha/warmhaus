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
import { useForm, Controller, useWatch } from "react-hook-form";
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

const CONSULT_MODE = [
    { value: "priority", label: "우선 상담" },
    { value: "office", label: "내방 미팅" },
    { value: "visit", label: "현장 방문 미팅" },
];

// ✅ 공사항목 예시(필요한 만큼 추가)
const EXTENSION_OPTIONS = ["거실", "주방", "안방", "작은방A", "작은방B", "없음", "모름"] as const;
const WINDOW_WORK_OPTIONS = ["전체 교체", "확장부만 교체", "내창만 교체", "외창만 교체", "없음", "모름"] as const;
const DOOR_WORK_OPTIONS = ["현관문", "방문", "문틀/문선", "문교체 없음", "모름"] as const;

const FLOOR_WORK_OPTIONS = ["강마루", "원목마루", "장판", "타일", "바닥공사 없음", "모름"] as const;

const MOLDING_WORK_OPTIONS = ["걸레받이", "천장몰딩", "문선몰딩", "전체 몰딩교체", "몰딩 없음", "모름"] as const;

const PARTITION_DOOR_OPTIONS = ["중문(3연동)", "중문(스윙)", "중문(포켓/슬라이딩)", "중문 없음", "모름"] as const;

const FILM_WORK_OPTIONS = ["싱크대 필름", "붙박이장 필름", "문/문틀 필름", "기타 필름", "필름 없음", "모름"] as const;

const BATHROOM_WORK_OPTIONS = ["욕실 1개 전체", "욕실 2개 전체", "부분수리(도기/수전)", "방수", "욕실 없음", "모름"] as const;

const TILE_WORK_OPTIONS = ["욕실 벽/바닥", "현관", "주방", "거실", "타일 없음", "모름"] as const;

const WALL_FINISH_OPTIONS = ["도배", "페인트", "아트월", "부분보수", "벽체마감 없음", "모름"] as const;

const ELECTRICAL_OPTIONS = ["조명 교체", "스위치/콘센트", "배선/증설", "인터폰", "전기공사 없음", "모름"] as const;

const AIRCON_OPTIONS = ["벽걸이 신규", "스탠드 신규", "시스템에어컨", "이전설치", "에어컨 없음", "모름"] as const;

const FURNITURE_OPTIONS = ["붙박이장", "주방가구", "수납장", "선반/가구제작", "가구 없음", "모름"] as const;
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

// ✅ “모름” 처리: 모름 선택 시 단독
function toggleWithUnknown(values: string[], next: string, unknown = "모름") {
    const has = values.includes(next);
    if (next === unknown) return has ? [] : [unknown];

    const withoutUnknown = values.filter((v) => v !== unknown);
    if (has) return withoutUnknown.filter((v) => v !== next);
    return [...withoutUnknown, next];
}

function hasUnknown(values: string[], unknown = "모름") {
    return values.includes(unknown);
}

// --- 스키마 (MVP: 1~2개 섹션만 예시로 넣고 계속 확장하면 됨)
const FormSchema = z.object({
    // Step0
    name: z.string().min(1, "이름을 입력해주세요."),
    phone: z.string().min(9, "연락처를 입력해주세요."),
    channel: z.string().min(1, "알게 된 경로를 선택해주세요."),
    budget_range: z.string().min(1, "예산 범위를 선택해주세요."),
    consult_mode: z.string().min(1, "상담 방식을 선택해주세요."),

    zip_code: z.string().min(1, "주소찾기로 주소를 선택해주세요."),
    address_road: z.string().optional(),
    address_jibun: z.string().optional(),
    address_detail: z.string().min(1, "상세주소를 입력해주세요."),

    // Step1 (예시: 확장)
    extension_existing: z.array(z.string()).min(1, "현재 확장부를 선택해주세요."),
    extension_plan: z.array(z.string()).min(1, "확장공사를 선택해주세요."),

    // Step2 (예시: 샷시)
    window_work: z.array(z.string()).min(1, "샷시 공사를 선택해주세요."),
    // Step3 (도어/바닥/몰딩/중문/필름)
    door_work: z.array(z.string()).min(1, "도어 공사를 선택해주세요."),
    floor_work: z.array(z.string()).min(1, "바닥 공사를 선택해주세요."),
    molding_work: z.array(z.string()).min(1, "몰딩 공사를 선택해주세요."),
    partition_door: z.array(z.string()).min(1, "중문을 선택해주세요."),
    film_work: z.array(z.string()).min(1, "필름 공사를 선택해주세요."),

// Step4 (욕실/타일/벽체마감)
    bathroom_work: z.array(z.string()).min(1, "욕실 공사를 선택해주세요."),
    tile_work: z.array(z.string()).min(1, "타일 공사를 선택해주세요."),
    wall_finish: z.array(z.string()).min(1, "벽체마감을 선택해주세요."),

// Step5 (전기/에어컨/가구)
    electrical_work: z.array(z.string()).min(1, "전기 공사를 선택해주세요."),
    aircon_work: z.array(z.string()).min(1, "에어컨 공사를 선택해주세요."),
    furniture_work: z.array(z.string()).min(1, "가구 공사를 선택해주세요."),
    // Step6
    plans: z.array(z.any()).max(3, "도면/사진은 최대 3장까지 가능합니다.").optional(),

    hp: z.string().optional(), // honeypot
});

type FormValues = z.infer<typeof FormSchema>;

const steps = [
    "기본정보",
    "확장/구조",
    "샷시",
    "도어/바닥/몰딩/중문/필름",
    "욕실/타일/벽체마감",
    "전기/에어컨/가구",
    "도면/기타",
];

// ✅ 각 스텝에서 검증할 필드 목록(여기에 계속 추가하면 됨)

const stepFields: Array<Array<keyof FormValues>> = [
    ["name", "phone", "channel", "budget_range", "consult_mode", "zip_code", "address_detail"],
    ["extension_existing", "extension_plan"],
    ["window_work"],

    // Step3
    ["door_work", "floor_work", "molding_work", "partition_door", "film_work"],

    // Step4
    ["bathroom_work", "tile_work", "wall_finish"],

    // Step5
    ["electrical_work", "aircon_work", "furniture_work"],

    [], // Step6
];


export default function PublicFormStepperPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [submitDone, setSubmitDone] = useState(false);
    const [submitErr, setSubmitErr] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // 필드 DOM ref 맵(포커스/스크롤)
    const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

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
            consult_mode: "priority",
            zip_code: "",
            address_road: "",
            address_jibun: "",
            address_detail: "",
            extension_existing: [],
            extension_plan: [],
            window_work: [],
            plans: [],
            hp: "",
            door_work: [],
            floor_work: [],
            molding_work: [],
            partition_door: [],
            film_work: [],

            bathroom_work: [],
            tile_work: [],
            wall_finish: [],

            electrical_work: [],
            aircon_work: [],
            furniture_work: [],
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
    const onSubmit = async (data: FormValues) => {
        setSubmitting(true);
        setSubmitErr("");
        try {
            const phoneDigits = onlyDigits(data.phone);

            const budgetLabel = BUDGET_RANGE_OPTIONS.find((b) => b.value === data.budget_range)?.label || "";

            const res = await fetch("/api/public/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hp: data.hp,
                    name: data.name,
                    phone: phoneDigits,
                    channel: data.channel,
                    budget_range: data.budget_range,
                    budget_raw: budgetLabel,
                    consult_mode: data.consult_mode,

                    zip_code: data.zip_code,
                    address_road: data.address_road,
                    address_jibun: data.address_jibun,
                    address_detail: data.address_detail,
                    address_full: addressFull,

                    // 예시 spec (여기에 공사항목 다 넣어 확장)
                    spec: {
                        extension_existing: data.extension_existing,
                        extension_plan: data.extension_plan,
                        window_work: data.window_work,
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
                                            ref={(el) => (fieldRefs.current["name"] = el)}
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
                                            ref={(el) => (fieldRefs.current["phone"] = el)}
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
                                            <Box ref={(el) => (fieldRefs.current["zip_code"] = el)} sx={{ flex: 1, minWidth: 0 }}>
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
                                        <Box ref={(el) => (fieldRefs.current["address_detail"] = el)}>
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
                                        name="consult_mode"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField select label="상담 방식" {...field} required>
                                                {CONSULT_MODE.map((o) => (
                                                    <MenuItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    />
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
                                    <CheckboxGroupWithUnknown
                                        name="extension_existing"
                                        options={EXTENSION_OPTIONS as any}
                                        control={control}
                                        errors={errors}
                                        setValue={setValue}
                                        fieldRefs={fieldRefs}
                                    />

                                    <Typography fontWeight={900}>확장공사(확장 예정) *</Typography>
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
                                </Stack>
                            )}
                            {activeStep === 3 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>도어 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="door_work" options={DOOR_WORK_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>바닥 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="floor_work" options={FLOOR_WORK_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>몰딩 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="molding_work" options={MOLDING_WORK_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>중문 *</Typography>
                                    <CheckboxGroupWithUnknown name="partition_door" options={PARTITION_DOOR_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>필름 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="film_work" options={FILM_WORK_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                </Stack>
                            )}

                            {activeStep === 4 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>욕실 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="bathroom_work" options={BATHROOM_WORK_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>타일 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="tile_work" options={TILE_WORK_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>벽체마감 *</Typography>
                                    <CheckboxGroupWithUnknown name="wall_finish" options={WALL_FINISH_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                </Stack>
                            )}

                            {activeStep === 5 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>전기 공사 *</Typography>
                                    <CheckboxGroupWithUnknown name="electrical_work" options={ELECTRICAL_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>에어컨 *</Typography>
                                    <CheckboxGroupWithUnknown name="aircon_work" options={AIRCON_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />

                                    <Typography fontWeight={900}>가구 *</Typography>
                                    <CheckboxGroupWithUnknown name="furniture_work" options={FURNITURE_OPTIONS as any} control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                </Stack>
                            )}

                            {activeStep === 6 && (
                                <Stack spacing={2}>
                                    <Typography fontWeight={900}>도면/사진 (최대 3장)</Typography>
                                    <Button variant="outlined" component="label">
                                        파일 선택
                                        <input hidden type="file" multiple accept="image/*,application/pdf" onChange={(e) => addPlans(e.target.files)} />
                                    </Button>

                                    {plans?.length ? (
                                        <Stack spacing={1}>
                                            {plans.map((f: any, idx: number) => (
                                                <Stack key={idx} direction="row" spacing={1} justifyContent="space-between" alignItems="center">
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
                                        <Typography variant="body2" color="text.secondary">
                                            선택한 파일이 없습니다.
                                        </Typography>
                                    )}


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
    const unknown = "모름";
    const hasUnk = hasUnknown(values || [], unknown);

    // ref 등록(첫 에러 포커스용)
    useEffect(() => {
        if (!fieldRefs.current[name]) fieldRefs.current[name] = null;
    }, [fieldRefs, name]);

    return (
        <Box ref={(el) => (fieldRefs.current[name] = el)} data-field={name}>
            {errors?.[name] ? <Alert severity="error">{errors[name]?.message}</Alert> : null}

            <Stack spacing={0.5} sx={{ mt: 1 }}>
                {options.map((opt) => {
                    const checked = (values || []).includes(opt);
                    const disabled = hasUnk && opt !== unknown;

                    return (
                        <FormControlLabel
                            key={opt}
                            control={
                                <Checkbox
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => {
                                        const next = toggleWithUnknown(values || [], opt, unknown);
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