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
    TextField, Tooltip,
    Typography,
} from "@mui/material";
import {Rules} from "@/app/type/type";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";

function sortMonths(ms: string[]) {
    return [...ms].sort((a, b) => a.localeCompare(b));
}
function formatMonthInput(raw: string) {
    const digits = (raw || "").replace(/[^0-9]/g, "").slice(0, 6); // YYYYMM
    if (digits.length <= 4) return digits; // YYYY까지만
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
}

function normalizeMonthFlexible(raw: string) {
    const digits = (raw || "").replace(/[^0-9]/g, "");
    if (digits.length !== 6) return "";
    const yyyy = digits.slice(0, 4);
    const mm = digits.slice(4, 6);
    const nmm = Number(mm);
    if (nmm < 1 || nmm > 12) return "";
    return `${yyyy}-${mm}`;
}
function formatDateInput(raw: string) {
    const digits = (raw || "").replace(/[^0-9]/g, "").slice(0, 8); // YYYYMMDD
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function normalizeDateFlexible(raw: string) {
    const digits = (raw || "").replace(/[^0-9]/g, "");
    if (digits.length !== 8) return null;

    const yyyy = digits.slice(0, 4);
    const mm = digits.slice(4, 6);
    const dd = digits.slice(6, 8);

    const nmm = Number(mm);
    const ndd = Number(dd);
    if (nmm < 1 || nmm > 12) return null;
    if (ndd < 1 || ndd > 31) return null;

    return  `${yyyy}-${mm}-${dd}`;
}

export default function AdminRulesPage() {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [minBudgetManwon, setMinBudgetManwon] = useState<number>(0);
    const [preferredBudgetManwon, setPreferredBudgetManwon] = useState<number>(0);
    // ✅ MVP 관리자 이메일 (나중에 auth로 교체)
    const adminEmail = useMemo(() => "chan2cha91@gmail.com", []);

    // form state
    const [allowedRegions, setAllowedRegions] = useState<string[]>([]);
    const [allowedRegionInput, setAllowedRegionInput] = useState("");
    const [closedMonths, setClosedMonths] = useState<string[]>([]);
    const [closedMonthInput, setClosedMonthInput] = useState("");

    const [partialOpen, setPartialOpen] = useState<string[]>([]);
    const [partialDateInput, setPartialDateInput] = useState(""); // YYYY-MM-DD
    function addAllowedRegion(raw: string) {
        const v = (raw || "").trim();
        if (!v) return;
        setAllowedRegions((prev) => Array.from(new Set([...prev, v])));
        setAllowedRegionInput("");
    }

    function removeAllowedRegion(v: string) {
        setAllowedRegions((prev) => prev.filter((x) => x !== v));
    }
    async function load() {
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch("/api/client/rules", { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            const rules: Rules = json.rules || {
                allowedRegions: [],
                closedMonths: [],
                partialOpen:[],
                budgetGradeMap: { A: [], B: [], C: [] },

            };

            setAllowedRegions((rules.allowedRegions || []).map((s) => String(s).trim()).filter(Boolean));
            setClosedMonths(sortMonths(rules.closedMonths || []));


            setMinBudgetManwon(Number(rules?.minBudgetManwon ?? 0));
            setPreferredBudgetManwon(Number(rules?.preferredBudgetManwon ?? 0));
            setPartialOpen(rules.partialOpen || []);
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
        const normalized = normalizeMonthFlexible(raw);
        if (!normalized) {
            setMsg({ type: "error", text: "마감 월은 YYYYMM 또는 YYYY-MM 형식으로 입력해주세요. 예) 202603" });
            return;
        }
        setClosedMonths((prev) => sortMonths(Array.from(new Set([...prev, normalized]))));
        setClosedMonthInput("");
    }

    function addPartialOpen() {
        const parsed = normalizeDateFlexible(partialDateInput);
        if (!parsed) {
            return setMsg({ type: "error", text: "부분 허용 날짜는 YYYYMMDD 또는 YYYY-MM-DD 입니다. 예) 20260422" });
        }


        setPartialOpen((prev) => sortMonths(Array.from(new Set([...prev, parsed]))));
        setPartialDateInput("");
    }

    function removePartialOpen(v: string) {
        setPartialOpen((prev) => prev.filter((x) => x !== v));
    }
    function removeClosedMonth(m: string) {
        setClosedMonths((prev) => prev.filter((x) => x !== m));
    }

    async function save() {
        setMsg(null);
        setLoading(true);
        try {
            const rules: Rules = {
                allowedRegions,
                closedMonths,
                partialOpen,
                preferredBudgetManwon,
                minBudgetManwon,

            };

            if (!allowedRegions.length) throw new Error("허용 지역을 최소 1개 이상 추가해주세요.");
            if (minBudgetManwon > preferredBudgetManwon) throw new Error("최소 예산은 선호 예산보다 클 수 없습니다.");

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
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h5" fontWeight={900}>
                        룰 설정
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title="불러오기">
      <span>
        <IconButton aria-label="불러오기" onClick={load} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
        </IconButton>
      </span>
                        </Tooltip>

                        <Tooltip title="저장">
      <span>
        <IconButton aria-label="저장" onClick={save} disabled={loading}>
          <SaveIcon />
        </IconButton>
      </span>
                        </Tooltip>
                    </Stack>
                </Stack>
                {msg ? <Alert severity={msg.type}>{msg.text}</Alert> : null}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack spacing={1}>
                                <Typography fontWeight={900}>허용 지역</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    예) 서울 / 경기 성남 / 경기 분당 / 경기 판교
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        label="지역 추가"
                                        value={allowedRegionInput}
                                        onChange={(e) => setAllowedRegionInput(e.target.value)}
                                        size="small"
                                        fullWidth
                                        placeholder="예) 서울, 경기 성남"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addAllowedRegion(allowedRegionInput);
                                            }
                                        }}
                                    />

                                    <Tooltip title="추가">
      <span>
        <IconButton
            aria-label="허용 지역 추가"
            onClick={() => addAllowedRegion(allowedRegionInput)}
            disabled={loading}
            sx={{ flexShrink: 0 }}
        >
          <AddIcon />
        </IconButton>
      </span>
                                    </Tooltip>
                                </Stack>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {allowedRegions.length ? (
                                        allowedRegions.map((r) => (
                                            <Chip key={r} label={r} onDelete={() => removeAllowedRegion(r)} variant="outlined" size="small" color={"primary"} />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            등록된 허용 지역이 없습니다.
                                        </Typography>
                                    )}
                                </Stack>
                            </Stack>

                            <Divider />

                            <Stack spacing={1}>
                                <Typography fontWeight={900}>마감 월</Typography>

                                {/* 입력 + 작은 추가 버튼 */}
                                <Stack direction="row" spacing={1} alignItems="center">

                                    <TextField
                                        label="예) 202603 또는 2026-03"
                                        value={closedMonthInput}
                                        onChange={(e) => setClosedMonthInput(formatMonthInput(e.target.value))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addClosedMonth(closedMonthInput);
                                            }
                                        }}
                                        size="small"
                                        fullWidth
                                    />

                                    <Tooltip title="추가">
      <span>
        <IconButton
            onClick={() => addClosedMonth(closedMonthInput)}
            disabled={loading}
            sx={{ flexShrink: 0 }}
            aria-label="마감 월 추가"
        >
          <AddIcon />
        </IconButton>
      </span>
                                    </Tooltip>
                                </Stack>


                                {/* 등록된 마감 월 */}
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {closedMonths.length ? (
                                        closedMonths.map((m) => (
                                            <Chip key={m} color={"primary"} label={m} onDelete={() => removeClosedMonth(m)} variant="outlined" size="small" />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            등록된 마감 월이 없습니다.
                                        </Typography>
                                    )}
                                </Stack>
                            </Stack>

                            <Divider />

                            <Typography fontWeight={900}>부분 허용 (월 중 특정 일자부터 가능)</Typography>
                            <Typography variant="body2" color="text.secondary">
                                예) 2026-04-22 → 2026년 4월은 22일부터 공사 시작 가능
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    label="부분 허용 날짜 (YYYYMMDD 또는 YYYY-MM-DD)"
                                    value={partialDateInput}
                                    onChange={(e) => setPartialDateInput(formatDateInput(e.target.value))}
                                    size="small"
                                    fullWidth
                                    placeholder="예) 20260422"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addPartialOpen();
                                        }
                                    }}
                                />

                                <Tooltip title="추가">
    <span>
      <IconButton
          onClick={addPartialOpen}
          disabled={loading}
          aria-label="부분 허용 추가"
          sx={{ flexShrink: 0 }}
      >
        <AddIcon />
      </IconButton>
    </span>
                                </Tooltip>
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                {partialOpen.length ? (
                                    sortMonths(partialOpen).map((v) => (
                                        <Chip
                                            key={v}
                                            label={v}              // ✅ 이미 "YYYY-MM-DD" or "[YYYY-MM] 20일부터 가능" 같은 문자열이면 그대로
                                            onDelete={() => removePartialOpen(v)}
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                        />
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        등록된 부분 허용 규칙이 없습니다.
                                    </Typography>
                                )}
                            </Stack>
                            <Divider/>
                            <Typography fontWeight={900}>예산 기준</Typography>

                            <Stack direction={{ xs: "row", sm: "row" }} spacing={1}>
                                <TextField
                                    label="최소 예산(만원) — 이하: C"
                                    type="number"
                                    value={minBudgetManwon}
                                    onChange={(e) => setMinBudgetManwon(Number(e.target.value || 0))}
                                    slotProps={{
                                        htmlInput: { min: 0, step: 100 },
                                    }}

                                    size="small"
                                    fullWidth
                                />
                                <TextField
                                    label="선호 예산(만원) — 이상: A"
                                    type="number"
                                    value={preferredBudgetManwon}
                                    onChange={(e) => setPreferredBudgetManwon(Number(e.target.value || 0))}
                                    slotProps={{
                                        htmlInput: { min: 0, step: 100 },
                                    }}

                                    size="small"
                                    fullWidth
                                />
                            </Stack>

                            <Typography variant="caption" color="text.secondary">
                                예산이 선호 예산 이상이면 A, 최소 예산 이하이면 C, 그 사이는 B로 분류됩니다.
                            </Typography>
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