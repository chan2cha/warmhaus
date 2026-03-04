"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

type Rules = {
    allowedRegions: string[]; // 주소에 포함될 키워드들
    closedMonths: string[];   // ["2026-03","2026-04"]
    budgetGradeMap: {
        A: string[];
        B: string[];
        C: string[];
    };
    closedMonthAction?: "REJECTED" | "HOLD";
};

function linesToArray(s: string) {
    return (s || "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
}
function arrayToLines(arr?: string[]) {
    return (arr || []).join("\n");
}
function normalizeMonth(s: string) {
    const m = (s || "").trim();
    const match = m.match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return "";
    const year = match[1];
    const mm = String(Number(match[2])).padStart(2, "0");
    if (Number(mm) < 1 || Number(mm) > 12) return "";
    return `${year}-${mm}`;
}
function sortMonths(ms: string[]) {
    return [...ms].sort((a, b) => a.localeCompare(b));
}

export default function AdminRulesPage() {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // ✅ MVP 관리자 이메일 (나중에 auth로 교체)
    const adminEmail = useMemo(() => "chan2cha91@gmail.com", []);

    // form state
    const [allowedRegionsText, setAllowedRegionsText] = useState(""); // multiline
    const [closedMonths, setClosedMonths] = useState<string[]>([]);
    const [closedMonthInput, setClosedMonthInput] = useState("");

    const [aBudgetsText, setABudgetsText] = useState("");
    const [bBudgetsText, setBBudgetsText] = useState("");
    const [cBudgetsText, setCBudgetsText] = useState("");
    const [partialOpen, setPartialOpen] = useState<Record<string, { fromDay: number }>>({});
    const [partialMonthInput, setPartialMonthInput] = useState("");
    const [partialFromDayInput, setPartialFromDayInput] = useState("");
    const [closedMonthAction, setClosedMonthAction] = useState<"REJECTED" | "HOLD">("REJECTED");

    async function load() {
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch("/api/public/rules", { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            const rules: Rules = json.rules || {
                allowedRegions: [],
                closedMonths: [],
                partialOpen,
                budgetGradeMap: { A: [], B: [], C: [] },
                closedMonthAction: "REJECTED",
            };

            setAllowedRegionsText(arrayToLines(rules.allowedRegions || []));
            setClosedMonths(sortMonths(rules.closedMonths || []));

            setABudgetsText(arrayToLines(rules.budgetGradeMap?.A || []));
            setBBudgetsText(arrayToLines(rules.budgetGradeMap?.B || []));
            setCBudgetsText(arrayToLines(rules.budgetGradeMap?.C || []));

            setClosedMonthAction(rules.closedMonthAction || "REJECTED");
        } catch (e: any) {
            setMsg({ type: "error", text: e.message || "불러오기 실패" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function addClosedMonth(raw: string) {
        const normalized = normalizeMonth(raw);
        if (!normalized) {
            setMsg({ type: "error", text: "마감 월은 YYYY-MM 형식으로 입력해주세요. 예) 2026-03" });
            return;
        }
        setClosedMonths((prev) => sortMonths(Array.from(new Set([...prev, normalized]))));
        setClosedMonthInput("");
    }

    function addPartialOpen() {
        const m = normalizeMonth(partialMonthInput);
        const day = Number(partialFromDayInput);

        if (!m) return setMsg({ type: "error", text: "부분 허용 월은 YYYY-MM 형식입니다. 예) 2026-04" });
        if (!Number.isFinite(day) || day < 1 || day > 31)
            return setMsg({ type: "error", text: "fromDay는 1~31 사이 숫자여야 합니다." });

        setPartialOpen((prev) => ({ ...prev, [m]: { fromDay: day } }));
        setPartialMonthInput("");
        setPartialFromDayInput("");
    }

    function removePartialOpen(month: string) {
        setPartialOpen((prev) => {
            const next = { ...prev };
            delete next[month];
            return next;
        });
    }
    function removeClosedMonth(m: string) {
        setClosedMonths((prev) => prev.filter((x) => x !== m));
    }

    async function save() {
        setMsg(null);
        setLoading(true);
        try {
            const rules: Rules = {
                allowedRegions: linesToArray(allowedRegionsText),
                closedMonths,
                budgetGradeMap: {
                    A: linesToArray(aBudgetsText),
                    B: linesToArray(bBudgetsText),
                    C: linesToArray(cBudgetsText),
                },
                closedMonthAction,
            };

            if (!rules.allowedRegions.length) throw new Error("허용 지역(allowedRegions)을 최소 1개 이상 입력해주세요.");
            if (!rules.budgetGradeMap.A.length && !rules.budgetGradeMap.B.length && !rules.budgetGradeMap.C.length) {
                throw new Error("예산 등급 매핑을 입력해주세요.");
            }

            const res = await fetch("/api/admin/rules", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-email": adminEmail,
                },
                body: JSON.stringify({ rules }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "저장 실패");

            setMsg({ type: "success", text: "저장 완료! (grade 산정 룰에 즉시 반영됩니다)" });
        } catch (e: any) {
            setMsg({ type: "error", text: e.message || "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
            <Stack spacing={2}>
                <Typography variant="h5" fontWeight={900}>
                    리드 룰 설정
                </Typography>

                {msg ? <Alert severity={msg.type}>{msg.text}</Alert> : null}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <TextField
                                label="허용 지역 키워드 (줄바꿈으로 여러 줄)"
                                value={allowedRegionsText}
                                onChange={(e) => setAllowedRegionsText(e.target.value)}
                                fullWidth
                                multiline
                                minRows={5}
                                placeholder={`예)\n서울\n경기 성남\n경기 분당\n경기 판교`}
                            />

                            <Divider />

                            <Stack spacing={1}>
                                <Typography fontWeight={900}>마감 월 (YYYY-MM)</Typography>

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                                    <TextField
                                        label="예) 2026-03"
                                        value={closedMonthInput}
                                        onChange={(e) => setClosedMonthInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addClosedMonth(closedMonthInput);
                                            }
                                        }}
                                        fullWidth
                                    />
                                    <Button variant="outlined" onClick={() => addClosedMonth(closedMonthInput)} disabled={loading}>
                                        추가
                                    </Button>
                                </Stack>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {closedMonths.length ? (
                                        closedMonths.map((m) => (
                                            <Chip key={m} label={m} onDelete={() => removeClosedMonth(m)} variant="outlined" />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            등록된 마감 월이 없습니다.
                                        </Typography>
                                    )}
                                </Stack>

                                <TextField
                                    select
                                    label="마감 월 처리 방식"
                                    value={closedMonthAction}
                                    onChange={(e) => setClosedMonthAction(e.target.value as any)}
                                    fullWidth
                                >
                                    <option value="REJECTED">REJECTED (부적합)</option>
                                    <option value="HOLD">HOLD (보류)</option>
                                </TextField>
                            </Stack>

                            <Divider />

                            <Typography fontWeight={900}>부분 허용 (월 중 특정 일자부터 가능)</Typography>
                            <Typography variant="body2" color="text.secondary">
                                예) 2026-04 / 22 → 2026년 4월은 22일부터 공사 시작 가능
                            </Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <TextField
                                    label="월 (YYYY-MM)"
                                    value={partialMonthInput}
                                    onChange={(e) => setPartialMonthInput(e.target.value)}
                                    fullWidth
                                    placeholder="2026-04"
                                />
                                <TextField
                                    label="가능 시작일 (fromDay)"
                                    value={partialFromDayInput}
                                    onChange={(e) => setPartialFromDayInput(e.target.value)}
                                    fullWidth
                                    placeholder="22"
                                    inputMode="numeric"
                                />
                                <Button variant="outlined" onClick={addPartialOpen} disabled={loading} sx={{ whiteSpace: "nowrap" }}>
                                    추가
                                </Button>
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                {Object.keys(partialOpen || {}).length ? (
                                    Object.entries(partialOpen)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([m, v]) => (
                                            <Chip
                                                key={m}
                                                label={`${m} : ${v.fromDay}일부터`}
                                                onDelete={() => removePartialOpen(m)}
                                                variant="outlined"
                                            />
                                        ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        등록된 부분 허용 규칙이 없습니다.
                                    </Typography>
                                )}
                            </Stack>

                            <Typography fontWeight={900}>예산 → Grade 매핑</Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <TextField
                                    label="Grade A 예산값 (줄바꿈)"
                                    value={aBudgetsText}
                                    onChange={(e) => setABudgetsText(e.target.value)}
                                    fullWidth
                                    multiline
                                    minRows={6}
                                    placeholder={`예)\nover_10000\n9000_10000\n8000_9000`}
                                />
                                <TextField
                                    label="Grade B 예산값 (줄바꿈)"
                                    value={bBudgetsText}
                                    onChange={(e) => setBBudgetsText(e.target.value)}
                                    fullWidth
                                    multiline
                                    minRows={6}
                                    placeholder={`예)\n7000_8000\n6000_7000\n5000_6000`}
                                />
                                <TextField
                                    label="Grade C 예산값 (줄바꿈)"
                                    value={cBudgetsText}
                                    onChange={(e) => setCBudgetsText(e.target.value)}
                                    fullWidth
                                    multiline
                                    minRows={6}
                                    placeholder={`예)\n4000_5000\n3000_4000\n2000_3000\n1000_2000`}
                                />
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                                <Button variant="outlined" onClick={load} disabled={loading}>
                                    불러오기
                                </Button>
                                <Button variant="contained" onClick={save} disabled={loading}>
                                    저장
                                </Button>
                            </Stack>

                            <Typography variant="caption" color="text.secondary">
                                저장하면 이후 접수되는 리드의 grade 산정에 즉시 반영됩니다.
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}