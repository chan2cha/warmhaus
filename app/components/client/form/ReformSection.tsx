import {Controller, useWatch} from "react-hook-form";
import {useEffect} from "react";
import {Box, Stack, TextField} from "@mui/material";
import {DOOR_FRAME_REFORM_OPTIONS, WINDOW_REFORM_OPTIONS} from "@/app/constants/formOptions";
import {CheckboxGroupWithUnknown} from "@/app/components/client/form/CheckboxGroupWithUnknown";

export function WindowReformSection({
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

export function DoorFrameReformSection({ control, errors, setValue, fieldRefs }: any) {
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