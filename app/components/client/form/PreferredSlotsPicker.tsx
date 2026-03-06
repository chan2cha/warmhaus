"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";

type FormValuesLike = {
    preferred_slots: string[];
};

type UnavailableItem = {
    start_at: string; // ISO string
    end_at?: string;
};

type Props<T extends FormValuesLike> = {
    control: Control<T>;
    consultType: "phone" | "office" | "";
    errors?: any;
};

const FIXED_TIMES = [
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00"
];

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

// ISO -> 로컬 "YYYY-MM-DDTHH:mm"
function isoToLocalDateTime(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";

    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
    )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function buildSlots(selectedDate: Dayjs | null) {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return FIXED_TIMES.map((time) => `${dateStr}T${time}`);
}

function toDateKey(localDT: string) {
    return localDT.slice(0, 10);
}

function formatSlotLabel(localDT: string) {
    return dayjs(localDT).format("MM.DD HH:mm");
}

function formatTimeOnly(localDT: string) {
    return dayjs(localDT).format("HH:mm");
}

export function PreferredSlotsPicker<T extends FormValuesLike>({
                                                                   control,
                                                                   consultType,
                                                                   errors,
                                                               }: Props<T>) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [loading, setLoading] = useState(false);
    const [fetchErr, setFetchErr] = useState("");
    const [unavailable, setUnavailable] = useState<string[]>([]);

    const maxCount = consultType === "office" ? 3 : 2;
    const type = consultType || "phone";

    useEffect(() => {
        if (!selectedDate) return;

        const ymd = selectedDate.format("YYYY-MM-DD");
        let ignore = false;

        async function fetchUnavailable() {
            setLoading(true);
            setFetchErr("");

            try {
                const res = await fetch(
                    `/api/client/unavailable-slots?date=${ymd}&consultType=${type}`
                );
                const json = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(json.error || "예약 불가 시간 조회 실패");
                }

                if (ignore) return;

                const items = Array.isArray(json.items) ? (json.items as UnavailableItem[]) : [];
                const blocked = items
                    .map((item) => isoToLocalDateTime(item.start_at))
                    .filter(Boolean);

                setUnavailable(blocked);
            } catch (e: any) {
                if (!ignore) {
                    setFetchErr(e.message || "예약 불가 시간 조회 실패");
                    setUnavailable([]);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchUnavailable();

        return () => {
            ignore = true;
        };
    }, [selectedDate, type]);

    const daySlots = useMemo(() => buildSlots(selectedDate), [selectedDate]);
    const unavailableSet = useMemo(() => new Set(unavailable), [unavailable]);

    return (
        <Controller
            name={"preferred_slots" as any}
            control={control}
            render={({ field }) => {
                const value = Array.isArray(field.value)
                    ? field.value.filter(Boolean)
                    : [];

                function toggleSlot(slot: string) {
                    const current = Array.isArray(field.value)
                        ? field.value.filter(Boolean)
                        : [];

                    const exists = current.includes(slot);

                    if (exists) {
                        field.onChange(current.filter((v: string) => v !== slot));
                        return;
                    }

                    if (current.length >= maxCount) {
                        return;
                    }

                    field.onChange([...current, slot]);
                }

                const selectedDateKey = selectedDate?.format("YYYY-MM-DD") || "";
                const selectedOnThisDay = value.filter(
                    (v: string) => toDateKey(v) === selectedDateKey
                );

                return (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="info">
                            선택한 시간은 <b>희망 후보</b>로 접수되며, 실제 확정은 통화/메시지 협의 후 진행됩니다.
                        </Alert>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography fontWeight={900}>
                                {type === "office" ? "내방" : "유선"} 희망 가능 날짜/시간
                            </Typography>
                            <Chip
                                size="small"
                                variant="outlined"
                                label={`${maxCount}개까지 선택`}
                            />
                            <Chip
                                size="small"
                                variant="outlined"
                                label="30분 단위 / 21:00까지"
                            />
                        </Stack>

                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                            <DatePicker

                                label="희망 날짜 선택"
                                value={selectedDate}
                                onChange={(v) => setSelectedDate(v)}
                                disablePast
                                format="YYYY-MM-DD"
                              localeText={{
                                 toolbarTitle: "날짜 선택"
                              }}
                                slotProps={{
                                    toolbar:{
                                        toolbarFormat: "YYYY년 M월 D일"
                                    },
                                    textField: {
                                        fullWidth: true,
                                        size: "small",
                                    },
                                }}
                            />
                        </LocalizationProvider>

                        {fetchErr ? <Alert severity="error">{fetchErr}</Alert> : null}

                        <Box>
                            <Typography fontWeight={900} sx={{ mb: 1 }}>
                                {selectedDate
                                    ? `${selectedDate.format("YYYY.MM.DD")} 시간 선택`
                                    : "날짜를 선택해주세요"}
                            </Typography>

                            {loading ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={18} />
                                    <Typography variant="body2" color="text.secondary">
                                        예약 불가 시간 불러오는 중...
                                    </Typography>
                                </Stack>
                            ) : (
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    {daySlots.map((slot) => {
                                        const selected = value.includes(slot);
                                        const disabled = unavailableSet.has(slot);

                                        return (
                                            <Chip
                                                key={slot}
                                                label={formatTimeOnly(slot)}
                                                clickable={!disabled}
                                                disabled={disabled}
                                                color={selected ? "primary" : "default"}
                                                variant={selected ? "filled" : "outlined"}
                                                onClick={() => toggleSlot(slot)}
                                            />
                                        );
                                    })}
                                </Stack>
                            )}

                            {!loading && selectedOnThisDay.length === 0 ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    이 날짜에서 아직 선택한 시간이 없습니다.
                                </Typography>
                            ) : null}
                        </Box>

                        <Box>
                            <Typography fontWeight={900} sx={{ mb: 1 }}>
                                선택한 후보
                            </Typography>

                            {value.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    아직 선택한 시간이 없습니다.
                                </Typography>
                            ) : (
                                <Stack spacing={1}>
                                    {value.map((slot:any, idx:any) => (
                                        <Stack
                                            key={slot}
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 2,
                                                px: 1.5,
                                                py: 1,
                                            }}
                                        >
                                            <Typography variant="body2">
                                                {idx + 1}순위 · {formatSlotLabel(slot)}
                                            </Typography>

                                            <Chip
                                                label="제거"
                                                size="small"
                                                variant="outlined"
                                                onClick={() => toggleSlot(slot)}
                                            />
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        {(errors as any)?.preferred_slots ? (
                            <Alert severity="error">
                                {(errors as any)?.preferred_slots?.message as any}
                            </Alert>
                        ) : null}
                    </Stack>
                );
            }}
        />
    );
}