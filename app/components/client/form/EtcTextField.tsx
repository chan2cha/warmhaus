import {FormValues} from "@/app/constants/formOptions";
import {Controller, useWatch} from "react-hook-form";
import {useEffect} from "react";
import {Box, TextField} from "@mui/material";

export function EtcTextField({
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