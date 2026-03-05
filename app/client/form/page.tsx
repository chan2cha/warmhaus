"use client";

import Script from "next/script";
import {useMemo, useRef, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Divider,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import {Controller, SubmitHandler, useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {NoticeBlock} from "../../components/client/form/NoticeBlock";
import {RHFSelectField, RHFTextField} from "@/app/components/comm/RHFFields";
import {
    AIRCON_OPTIONS,
    BATHROOM_WORK_OPTIONS,
    BUDGET_RANGE_OPTIONS,
    CHANNEL_OPTIONS,
    DOOR_FRAME_WORK_OPTIONS,
    ELECTRICAL_OPTIONS,
    EXTENSION_OPTIONS,
    FILM_WORK_OPTIONS,
    FLOOR_DEMOLITION_OPTIONS,
    FLOOR_WORK_OPTIONS,
    FormSchema,
    FormValues,
    MOLDING_WORK_OPTIONS,
    PARTITION_DOOR_OPTIONS,
    stepFields,
    steps,
    TILE_WORK_OPTIONS,
    TYPE_OPTIONS,
    VERANDA_COAT_OPTIONS,
    WALL_FINISH_OPTIONS,
    WINDOW_WORK_OPTIONS
} from "@/app/constants/formOptions";
import {QuestionBlock} from "@/app/components/client/form/QuestionBlock";
import {CheckboxGroupWithUnknown} from "@/app/components/client/form/CheckboxGroupWithUnknown";
import {EtcTextField} from "@/app/components/client/form/EtcTextField";
import {DoorFrameReformSection, WindowReformSection} from "@/app/components/client/form/ReformSection";
import {FurnitureMatrix} from "@/app/components/client/form/FurnitureMatrix";

declare global {
    interface Window {
        daum?: any;
    }
}
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
            channel: "",
            budget_range: "4000_5000",
            desired_type: "",
            zip_code: "",
            address_road: "",
            address_jibun: "",
            address_detail: "",
            area_unit: "sqm",
            area_pyeong: "",
            start_date: "",
            move_in_date: "",
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


    const plans = useWatch({ control, name: "plans" }) as any[];
    const addressRoad = useWatch({ control, name: "address_road" });
    const addressJibun = useWatch({ control, name: "address_jibun" });
    const furnitureReplace = useWatch({ control, name: "furniture_replace" }) as string[] | undefined;
    const furnitureReform = useWatch({ control, name: "furniture_reform" }) as string[] | undefined;

    const areaUnit = useWatch({ control, name: "area_unit" });
    const unitLabel = areaUnit === "sqm" ? "㎡" : "평";
    const showReplaceEtc = (furnitureReplace || []).includes("기타");
    const showReformEtc = (furnitureReform || []).includes("기타");
    const hasBaseAddr = !!((addressRoad || "").trim() || (addressJibun || "").trim());
    const baseAddrText = ((addressRoad || "").trim() || (addressJibun || "").trim());
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
                setValue("zip_code", data.zonecode || "");
                setValue("address_road", (data.roadAddress || "").trim(),{shouldValidate:true});
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
            const unit = data.area_unit === "sqm" ? "㎡" : "평";
            const area_pyeong = `${data.area_pyeong.replace(/\s+/g, "")} ${unit}`; // "143/114 ㎡"
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
                    start_date: data.start_date,
                    move_in_date: data.move_in_date,

                    zip_code: data.zip_code,
                    address_road: data.address_road,
                    address_jibun: data.address_jibun,
                    address_detail: data.address_detail,
                    address_full: addressFull,
                    area_pyeong: area_pyeong,

                    type:data.desired_type,

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
                            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2,"& .MuiStepLabel-label": {
                                    display: { xs: "none", sm: "block" }, // ✅ 모바일 라벨 숨김
                                }, }}>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>
                            <Box
                                sx={{
                                    display: { xs: "block", sm: "none" },
                                    mb: 3,                 // ✅ 헤더 ↔ 컨텐츠 크게 분리
                                    mt: 0.5,
                                    px: 1.25,
                                    py: 1.25,
                                    borderRadius: 2,
                                    bgcolor: "background.paper",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    boxShadow: 1,          // ✅ 살짝 떠보이게
                                }}
                            >
                                <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography
                                        fontWeight={900}
                                        sx={{
                                            fontSize: 18,
                                            lineHeight: 1.2,
                                            pr: 1,
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {steps[activeStep]}
                                    </Typography>

                                    <Chip
                                        size="small"
                                        label={`Step ${activeStep + 1}/${steps.length}`}
                                        variant="outlined"
                                        sx={{ fontWeight: 800 }}
                                    />
                                </Stack>

                                <Divider sx={{ borderBottomWidth: 2 }} />

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                    아래 항목을 입력/선택한 뒤 “다음”을 눌러주세요.
                                </Typography>
                            </Box>
                            {submitErr ? <Alert severity="error">{submitErr}</Alert> : null}

                            {/* ----- STEP CONTENTS ----- */}
                            {activeStep === 0 && (
                                <Stack spacing={2}>
                                    <NoticeBlock />

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["name"] = el;
                                            }}
                                            sx={{ flex: { sm: 1 }, minWidth: 0 }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="name"
                                                control={control}
                                                errors={errors}
                                                label="이름"
                                                required
                                                textFieldProps={{ placeholder: "홍길동" }}
                                            />
                                        </Box>

                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["phone"] = el;
                                            }}
                                            sx={{ flex: { sm: 2 }, minWidth: 0 }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="phone"
                                                control={control}
                                                errors={errors}
                                                label="연락처"
                                                required
                                                transform={formatPhoneKR}
                                                textFieldProps={{
                                                    inputMode: "numeric",
                                                    placeholder: "010-1234-5678",
                                                }}
                                            />
                                        </Box>
                                    </Stack>

                                    <Divider />

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["start_date"] = el;
                                            }}
                                            sx={{ flex: 1, minWidth: 0 }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="start_date"
                                                control={control}
                                                errors={errors}
                                                label="공사 시작일(예정 날짜)"
                                                required
                                                textFieldProps={{ type: "date" }}
                                            />
                                        </Box>

                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["move_in_date"] = el;
                                            }}
                                            sx={{ flex: 1, minWidth: 0 }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="move_in_date"
                                                control={control}
                                                errors={errors}
                                                label="입주 예정일(예정 날짜)"
                                                required
                                                textFieldProps={{ type: "date" }}
                                            />
                                        </Box>
                                    </Stack>

                                    {/* --- 주소 --- */}
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={1} alignItems="stretch">
                                            <Box
                                                ref={(el: HTMLDivElement | null) => {
                                                    fieldRefs.current["address_road"] = el;
                                                }}
                                                sx={{ flex: 1, minWidth: 0 }}
                                            >
                                                {/* ✅ 주소 표시(도로명 우선, 없으면 지번) */}
                                                <RHFTextField<FormValues>
                                                    name="address_road"
                                                    control={control}
                                                    errors={errors}
                                                    label="현장 주소"
                                                    required
                                                    textFieldProps={{
                                                        placeholder: "주소찾기를 눌러 선택",
                                                        value: baseAddrText,              // ✅ 표시값 강제
                                                        InputProps: { readOnly: true },
                                                    }}
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

                                        {!hasBaseAddr  ? (
                                            <Alert severity="info" sx={{ py: 0.5 }}>
                                                주소찾기로 주소를 먼저 선택해주세요.
                                            </Alert>
                                        ) : null}

                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["address_detail"] = el;
                                            }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="address_detail"
                                                control={control}
                                                errors={errors}
                                                label="상세주소"
                                                required
                                                textFieldProps={{
                                                    disabled: !hasBaseAddr,
                                                    placeholder: hasBaseAddr ? "예) 101동 1203호" : "주소 선택 후 입력 가능",
                                                }}
                                            />
                                        </Box>
                                    </Stack>
                                        <Box ref={(el: HTMLDivElement | null) => { fieldRefs.current["area_pyeong"] = el; }}>
                                        <Typography fontWeight={900} sx={{ mb: 0.5 }}>
                                            공급/전용 면적
                                        </Typography>

                                        <Controller
                                            name="area_unit"
                                            control={control}
                                            render={({ field }) => (
                                                <RadioGroup
                                                    row
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    sx={{ mb: 1 }}
                                                >
                                                    <FormControlLabel value="sqm" control={<Radio />} label="㎡" />
                                                    <FormControlLabel value="pyeong" control={<Radio />} label="평" />
                                                </RadioGroup>
                                            )}
                                        />

                                        <RHFTextField<FormValues>
                                            name="area_pyeong"
                                            control={control}
                                            errors={errors}
                                            label={`공급/전용 (${unitLabel})`}
                                            required
                                            textFieldProps={{
                                                inputMode: "decimal",
                                                placeholder: areaUnit === "sqm" ? "예) 143/114" : "예) 43/34",
                                                InputProps: {
                                                    endAdornment: <InputAdornment position="end">{unitLabel}</InputAdornment>,
                                                },
                                            }}
                                        />

                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                                            숫자만 입력하세요. 단위는 위에서 선택하면 자동으로 적용됩니다. (예: 143/114)
                                        </Typography>
                                    </Box>
                                    <RHFSelectField<FormValues>
                                        name="budget_range"
                                        control={control}
                                        errors={errors}
                                        label="예산 범위"
                                        required
                                        options={BUDGET_RANGE_OPTIONS}
                                    />

                                    <RHFSelectField<FormValues>
                                        name="channel"
                                        control={control}
                                        errors={errors}
                                        label="알게 된 경로"
                                        required
                                        options={CHANNEL_OPTIONS}
                                    />

                                    {/* honeypot */}
                                    <Controller name="hp" control={control} render={({ field }) => <TextField sx={{ display: "none" }} {...field} />} />
                                </Stack>
                            )}


                            {activeStep === 1 && (
                                <Stack spacing={2}>
                                    <QuestionBlock title="원하는 타입 " required>
                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["desired_type"] = el;
                                            }}
                                        >
                                            {errors?.desired_type ? (
                                                <Alert severity="error" sx={{ mb: 1 }}>
                                                    {errors.desired_type.message as any}
                                                </Alert>
                                            ) : null}

                                            <Controller
                                                name="desired_type"
                                                control={control}
                                                render={({ field }) => (
                                                    <Stack spacing={0.5}>
                                                        {TYPE_OPTIONS.map((opt) => (
                                                            <FormControlLabel
                                                                key={opt.value}
                                                                control={
                                                                    <Checkbox
                                                                        checked={field.value === opt.value}
                                                                        onChange={() => field.onChange(opt.value)}
                                                                    />
                                                                }
                                                                label={opt.label}
                                                            />
                                                        ))}
                                                    </Stack>
                                                )}
                                            />
                                        </Box>
                                    </QuestionBlock>

                                    <QuestionBlock
                                        title="기확장부(현재 확장된 공간) " required
                                        desc="현재 확장되어 있는 공간을 선택해 주세요."
                                    >
                                        <CheckboxGroupWithUnknown
                                            name="extension_existing"
                                            options={EXTENSION_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock
                                        title="확장공사(확장 예정) " required
                                        desc="확장 예정인 공간을 선택해 주세요."
                                        divider={false}
                                    >
                                        <CheckboxGroupWithUnknown
                                            name="extension_plan"
                                            options={[...EXTENSION_OPTIONS] as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>
                                </Stack>
                            )}

                            {activeStep === 2 && (
                                <Stack spacing={2}>
                                    <QuestionBlock title="샷시 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="window_work"
                                            options={WINDOW_WORK_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="window_work"
                                            etcName="window_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    {/* 부분교체가 아닐 땐 WindowReformSection이 null 반환 */}
                                    <QuestionBlock
                                        title="샷시 리폼 " required
                                        desc="샷시 부분 교체 시 선택사항입니다."
                                    >
                                        <WindowReformSection
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock title="방문/방문틀 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="door_frame_work"
                                            options={DOOR_FRAME_WORK_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="door_frame_work"
                                            etcName="door_frame_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    {/* 부분교체가 아닐 땐 DoorFrameReformSection이 null 반환 */}
                                    <QuestionBlock
                                        title="방문/방문틀 리폼 " required
                                        desc="방문/방문틀 부분 교체 시 선택사항입니다."
                                        divider={false}
                                    >
                                        <DoorFrameReformSection
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>
                                </Stack>
                            )}

                            {activeStep === 3 && (
                                <Stack spacing={2}>
                                    <QuestionBlock title="바닥 철거 공사 " required>
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
                                    </QuestionBlock>

                                    <QuestionBlock title="바닥 공사 " required>
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
                                    </QuestionBlock>

                                    <QuestionBlock title="몰딩 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="molding_work"
                                            options={MOLDING_WORK_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="molding_work"
                                            etcName="molding_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock title="중문 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="partition_door"
                                            options={PARTITION_DOOR_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="partition_door"
                                            etcName="partition_door_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock title="필름 공사 " required divider={false}>
                                        <CheckboxGroupWithUnknown
                                            name="film_work"
                                            options={FILM_WORK_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="film_work"
                                            etcName="film_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>
                                </Stack>
                            )}

                            {activeStep === 4 && (
                                <Stack spacing={2}>
                                    <QuestionBlock title="욕실 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="bathroom_work"
                                            options={BATHROOM_WORK_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="bathroom_work"
                                            etcName="bathroom_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock title="타일 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="tile_work"
                                            options={TILE_WORK_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="tile_work"
                                            etcName="tile_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock title="벽체 마감 공사 " required divider={false}>
                                        <CheckboxGroupWithUnknown
                                            name="wall_finish"
                                            options={WALL_FINISH_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="wall_finish"
                                            etcName="wall_finish_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>
                                </Stack>
                            )}

                            {activeStep === 5 && (
                                <Stack spacing={2}>
                                    <QuestionBlock
                                        title="전기 공사 "
                                        desc="*가견적상, 기본적으로 주로 사용하는 제품으로 배치 및 갯수 설정 됩니다. 정확한 수치는 추후 조정 될 예정입니다."
                                    >
                                        <CheckboxGroupWithUnknown
                                            name="electrical_work"
                                            options={ELECTRICAL_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="electrical_work"
                                            etcName="electrical_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock title="베란다 벽면 탄성코트 공사 " required>
                                        <CheckboxGroupWithUnknown
                                            name="veranda_coat"
                                            options={VERANDA_COAT_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="veranda_coat"
                                            etcName="veranda_coat_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>

                                    <QuestionBlock
                                        title="에어컨 공사(천장형) " required
                                        desc="현장 상황에 따라 천장 단내림 공사가 수반 됩니다."
                                        divider={false}
                                    >
                                        <CheckboxGroupWithUnknown
                                            name="aircon_work"
                                            options={AIRCON_OPTIONS as any}
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                        <EtcTextField
                                            whenCheckedIn="aircon_work"
                                            etcName="aircon_work_etc"
                                            control={control}
                                            errors={errors}
                                            setValue={setValue}
                                            fieldRefs={fieldRefs}
                                        />
                                    </QuestionBlock>
                                </Stack>
                            )}

                            {activeStep === 6 && (
                                <Stack spacing={2}>
                                    <QuestionBlock title="가구 공사" required divider={false}>
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
                                                                        setValue("furniture_none", true, { shouldValidate: false });
                                                                    } else {
                                                                        setValue("furniture_none", false, { shouldValidate: false });
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label="가구 공사 없음"
                                                    />
                                                )}
                                            />
                                            {errors?.furniture_none ? (
                                                <Alert severity="error">{errors.furniture_none?.message as any}</Alert>
                                            ) : null}
                                        </Box>

                                        <FurnitureMatrix control={control} errors={errors} setValue={setValue} fieldRefs={fieldRefs} />
                                    </QuestionBlock>

                                    {/* (선택) 교체/리폼 기타 텍스트가 따로 있다면 RHFTextField로 통일 */}
                                    {showReplaceEtc  ? (
                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["furniture_replace_etc"] = el;
                                            }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="furniture_replace_etc"
                                                control={control}
                                                errors={errors}
                                                label="가구 교체 - 기타 내용"
                                                required
                                                textFieldProps={{ placeholder: "예) 상부장 추가, 길이 변경 등" }}
                                            />
                                        </Box>
                                    ) : null}

                                    {showReformEtc ? (
                                        <Box
                                            ref={(el: HTMLDivElement | null) => {
                                                fieldRefs.current["furniture_reform_etc"] = el;
                                            }}
                                        >
                                            <RHFTextField<FormValues>
                                                name="furniture_reform_etc"
                                                control={control}
                                                errors={errors}
                                                label="가구 리폼 - 기타 내용"
                                                required
                                                textFieldProps={{ placeholder: "예) 문짝만 교체, 도장 리폼 등" }}
                                            />
                                        </Box>
                                    ) : null}

                                    <Divider sx={{ my: 1 }} />

                                    <QuestionBlock title="평면도 첨부" required>
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
                                    </QuestionBlock>

                                    <Divider sx={{ my: 1 }} />

                                    <Box
                                        ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["inquiry_note"] = el;
                                        }}
                                    >
                                        <RHFTextField<FormValues>
                                            name="inquiry_note"
                                            control={control}
                                            errors={errors}
                                            label="기타 문의 사항"
                                            textFieldProps={{
                                                multiline: true,
                                                minRows: 3,
                                                placeholder: "원하시는 스타일, 요청사항, 참고할 점 등을 적어주세요.",
                                            }}
                                        />
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Box
                                        ref={(el: HTMLDivElement | null) => {
                                            fieldRefs.current["consult_confirm"] = el;
                                        }}
                                    >
                                        <Typography fontWeight={900} sx={{ mt: 1 }}>
                                            위 내용 바탕으로 간단한 상담은 전화로 진행됩니다.
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mt: 1 }}>
                                            {`※ 유선 상담의 경우, 20~30분 소요 됩니다. 단순한 사항과 필수로 측정 되기에 정확하지 않을 수 있습니다.
상담 문의가 많아 일주일 이상 연락이 닿지 않는 경우에는 별도 메시지 또는 DM 보내주시면 감사 하겠습니다.

※ 내방 상담의 경우, 예약제로 진행되고 있습니다. 사전에 꼭 미리 연락 부탁드리겠습니다.
1~2시간 상담이 이뤄진 후, 상세 견적서를 매우 디테일 하여,
공사가 끝났을 때의 최종 견적서와 크게 다르지 않기에 구체적인 사양 & 예산을 잡기에 더욱 좋습니다.`}
                                        </Typography>

                                        <RHFSelectField<FormValues>
                                            name="consult_confirm"
                                            control={control}
                                            errors={errors}
                                            label="상담 진행 방식 확인"
                                            required
                                            options={[
                                                { value: "phone", label: "예, 이해하였습니다. [유선 상담]으로 진행하겠습니다." },
                                                { value: "office", label: "예, 이해하였습니다. [내방 미팅]으로 진행하겠습니다." },
                                            ]}
                                            textFieldProps={{ sx: { mt: 1 } }}
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







