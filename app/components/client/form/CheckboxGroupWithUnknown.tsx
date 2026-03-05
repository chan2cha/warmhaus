import {FormValues} from "@/app/constants/formOptions";
import { useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import {Alert, Checkbox, FormControlLabel, Stack} from "@mui/material";
import {useEffect} from "react";
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

/** ✅ 체크박스 그룹 + 모름 단독 처리 + 필수 에러 표시 + 포커스/스크롤 target */
export function CheckboxGroupWithUnknown(props: {
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
