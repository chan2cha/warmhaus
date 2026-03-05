import {useWatch} from "react-hook-form";
import {Alert, Box, Checkbox, Typography} from "@mui/material";
import {FURNITURE_ITEMS} from "@/app/constants/formOptions";

export function FurnitureMatrix({
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