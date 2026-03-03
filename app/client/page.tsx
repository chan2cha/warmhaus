"use client";

import Script from "next/script";
import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

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
    { value: "2000_3000", label: "2000~3000" },
    { value: "3000_4000", label: "3000~4000" },
    { value: "4000_5000", label: "4000~5000" },
    { value: "5000_6000", label: "5000~6000" },
    { value: "6000_7000", label: "6000~7000" },
    { value: "7000_8000", label: "7000~8000" },
    { value: "8000_9000", label: "8000~9000" },
    { value: "9000_10000", label: "9000~10000" },
    { value: "over_10000", label: "1억 이상" },
];

function onlyDigits(s: string) {
    return (s || "").replace(/[^0-9]/g, "");
}
function formatPhoneKR(input: string) {
    const digits = onlyDigits(input).slice(0, 11); // 최대 11자리(대부분 케이스)
    if (!digits) return "";

    // 1) 대표번호(15xx/16xx/18xx) 8자리
    // 예: 15881234 -> 1588-1234
    if (/^(15|16|18)\d{2}/.test(digits)) {
        if (digits.length <= 4) return digits;
        return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
    }

    // 2) 서울(02)
    if (digits.startsWith("02")) {
        if (digits.length <= 2) return digits;                 // 02
        if (digits.length <= 5) return `02-${digits.slice(2)}`; // 02-XXX
        if (digits.length <= 9) return `02-${digits.slice(2, 5)}-${digits.slice(5)}`; // 02-XXX-XXXX
        return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;  // 02-XXXX-XXXX
    }

    // 3) 070 인터넷전화 / 050x 등의 특수(일반적으로 3자리 지역번호처럼 처리)
    // 0505 같은 경우도 있을 수 있는데, MVP는 3자리 prefix로 처리해도 대부분 OK
    // 070-XXXX-XXXX
    if (digits.startsWith("070")) {
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `070-${digits.slice(3)}`; // 070-XXXX(입력중)
        return `070-${digits.slice(3, 7)}-${digits.slice(7)}`;   // 070-XXXX-XXXX
    }

    // 4) 휴대폰(010/011/016/017/018/019)
    if (/^01[016789]/.test(digits)) {
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`; // 010-1234-5678
    }

    // 5) 그 외 지역번호(031/032/033/041/042/043/044/051/052/053/054/055/061/062/063/064 등)
    // 기본: 3-3/4-4 형태
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`; // 031-XXX
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`; // 031-XXX-XXXX
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`; // 031-XXXX-XXXX
}

export default function PublicFormPage() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [err, setErr] = useState("");

    // 기본
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // 유입/예산
    const [channel, setChannel] = useState("blog");
    const [budgetRange, setBudgetRange] = useState("3000_4000");

    // 주소(daum)
    const [zipCode, setZipCode] = useState("");
    const [addrRoad, setAddrRoad] = useState("");
    const [addrDetail, setAddrDetail] = useState("");

    // 기타
    const [type, setType] = useState("");
    const [area, setArea] = useState("");
    const [yearBuilt, setYearBuilt] = useState("");
    const [startDate, setStartDate] = useState("");
    const [moveinDate, setMoveinDate] = useState("");

    // 도면 파일(최대 3개) - 지금은 UI/검증만
    const [plans, setPlans] = useState<File[]>([]);

    // honeypot
    const [hp, setHp] = useState("");

    const addressFull = useMemo(() => {
        const base = `[${zipCode}] ${addrRoad }`.trim();
        return `${base} ${addrDetail}`.trim();
    }, [zipCode, addrRoad,  addrDetail]);

    function openDaumPostcode() {
        if (!window.daum?.Postcode) {
            alert("주소검색 로딩 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        new window.daum.Postcode({
            oncomplete: function (data: any) {
                // data: zonecode, roadAddress, jibunAddress 등
                setZipCode(data.zonecode || "");
                setAddrRoad(data.roadAddress || "");
                // 상세주소는 사용자 입력 유지
            },
        }).open();
    }

    function onPlanChange(files: FileList | null) {
        if (!files) return;
        const arr = Array.from(files);
        const merged = [...plans, ...arr].slice(0, 3);
        setPlans(merged);
        if (arr.length + plans.length > 3) {
            alert("도면/사진은 최대 3장까지 업로드할 수 있어요.");
        }
    }

    function removePlan(idx: number) {
        setPlans((prev) => prev.filter((_, i) => i !== idx));
    }

    async function submit() {
        setLoading(true);
        setErr("");

        try {
            const phoneDigits = onlyDigits(phone);
            if (!name.trim()) throw new Error("이름을 입력해주세요.");
            if (phoneDigits.length < 9) throw new Error("연락처를 정확히 입력해주세요.");
            if (!zipCode || (!addrRoad )) throw new Error("주소찾기로 주소를 선택해주세요.");
            if (!addrDetail.trim()) throw new Error("상세주소를 입력해주세요.");

            const budgetLabel = BUDGET_RANGE_OPTIONS.find((b) => b.value === budgetRange)?.label || "";

            const res = await fetch("/api/public/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hp,
                    name,
                    phone: phoneDigits,

                    channel, // blog/instagram/...
                    budget_range: budgetRange,
                    budget_raw: budgetLabel, // 당장은 label을 budget_raw에 저장해도 좋음

                    zip_code: zipCode,
                    address_road: addrRoad,
                    address_detail: addrDetail,
                    address_full: addressFull,

                    type,
                    area,
                    year_built: yearBuilt,
                    start_date: startDate || null,
                    movein_date: moveinDate || null,

                    // 도면 업로드는 다음 단계에서 실제 업로드/연결
                    plan_count: plans.length,
                }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "제출에 실패했어요.");

            setDone(true);
        } catch (e: any) {
            setErr(e.message || "error");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <Box sx={{ p: 2, maxWidth: 560, mx: "auto" }}>
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
            {/* Daum postcode script */}
            <Script
                src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="afterInteractive"
            />

            <Box sx={{ p: 2, maxWidth: 560, mx: "auto" }}>
                <Stack spacing={2}>
                    <Typography variant="h5" fontWeight={900}>
                        상담 문의
                    </Typography>
                    <Typography color="text.secondary">
                        아래 정보를 입력해주시면 빠르게 연락드릴게요.
                    </Typography>

                    {err ? <Alert severity="error">{err}</Alert> : null}

                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} required />
                                <TextField
                                    label="연락처"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhoneKR(e.target.value))}
                                    placeholder="010-1234-5678"
                                    inputMode="numeric"
                                    required
                                />

                                <Divider />

                                <TextField
                                    select
                                    label="알게 된 경로"
                                    value={channel}
                                    onChange={(e) => setChannel(e.target.value)}
                                >
                                    {CHANNEL_OPTIONS.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>
                                            {o.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    label="예산 범위(단위:만)"
                                    value={budgetRange}
                                    onChange={(e) => setBudgetRange(e.target.value)}
                                >
                                    {BUDGET_RANGE_OPTIONS.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>
                                            {o.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <Divider />

                                {/* Address */}
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                    <TextField label="우편번호" value={zipCode} InputProps={{ readOnly: true }} fullWidth />
                                    <Button variant="outlined" onClick={openDaumPostcode} sx={{ whiteSpace: "nowrap" }}>
                                        주소찾기
                                    </Button>
                                </Stack>

                                <TextField
                                    label="도로명주소"
                                    value={addrRoad}
                                    InputProps={{ readOnly: true }}
                                />
                                <TextField
                                    label="상세주소"
                                    value={addrDetail}
                                    onChange={(e) => setAddrDetail(e.target.value)}
                                    required
                                />

                                <Divider />

                                <TextField label="원하는 타입(선택)" value={type} onChange={(e) => setType(e.target.value)} placeholder="아파트 / 빌라 등" />
                                <TextField label="면적(선택)" value={area} onChange={(e) => setArea(e.target.value)} placeholder="34/25" />
                                <TextField label="준공년도(선택)" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="2016" />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        label="공사 시작일(선택)"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                    <TextField
                                        label="입주 예정일(선택)"
                                        type="date"
                                        value={moveinDate}
                                        onChange={(e) => setMoveinDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth
                                    />
                                </Stack>

                                <Divider />

                                {/* Plans upload UI (max 3) */}
                                <Stack spacing={1}>
                                    <Typography fontWeight={900}>도면/사진 업로드 (최대 3장)</Typography>
                                    <Button variant="outlined" component="label">
                                        파일 선택
                                        <input
                                            hidden
                                            type="file"
                                            multiple
                                            accept="image/*,application/pdf"
                                            onChange={(e) => onPlanChange(e.target.files)}
                                        />
                                    </Button>

                                    {plans.length > 0 ? (
                                        <Stack spacing={1}>
                                            {plans.map((f, idx) => (
                                                <Stack key={idx} direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                                        {idx + 1}. {f.name}
                                                    </Typography>
                                                    <Button size="small" color="error" onClick={() => removePlan(idx)}>
                                                        제거
                                                    </Button>
                                                </Stack>
                                            ))}
                                            <Typography variant="caption" color="text.secondary">
                                                * 실제 업로드/자동 첨부는 다음 단계에서 연결합니다.
                                            </Typography>
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            선택한 파일이 없습니다.
                                        </Typography>
                                    )}
                                </Stack>

                                {/* honeypot */}
                                <TextField label="(숨김)" value={hp} onChange={(e) => setHp(e.target.value)} sx={{ display: "none" }} />

                                <Button variant="contained" size="large" disabled={loading} onClick={submit}>
                                    {loading ? "제출 중..." : "제출하기"}
                                </Button>

                                <Typography variant="caption" color="text.secondary">
                                    제출 시 입력하신 정보는 상담 목적으로만 사용됩니다.
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </>
    );
}