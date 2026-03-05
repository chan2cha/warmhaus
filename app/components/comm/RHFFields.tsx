"use client";

import * as React from "react";
import {Controller, Control, FieldErrors, Path, FieldValues} from "react-hook-form";
import { Box, Chip, MenuItem, Stack, TextField, TextFieldProps, Typography } from "@mui/material";

type LabelSide = "left" | "right";

 function FieldBlock({
                               label,
                               required,
                               side = "right",
                               children,
                           }: {
    label: string;
    required?: boolean;
    side?: LabelSide;
    children: React.ReactNode;
}) {
    const badge = required ? (
        <Chip
            size="small"
            label="필수"
            color="error"
            variant="outlined"
            sx={{
                height: 20,
                fontWeight: 900,
                "& .MuiChip-label": { px: 0.75 },
            }}
        />
    ) : null;

    return (
        <Stack spacing={0.75}>
            <Stack direction="row" spacing={0.75} alignItems="center">
                {side === "left" ? badge : null}
                <Typography fontWeight={900} sx={{ fontSize: 14 }}>
                    {label}
                </Typography>
                {side === "right" ? badge : null}
            </Stack>

            {children}
        </Stack>
    );
}

type RHFTextFieldProps<T extends FieldValues> = {
    name: Path<T>;
    control: Control<T>;
    errors: FieldErrors<T>;
    label: string;
    required?: boolean;
    side?: LabelSide;
    textFieldProps?: Omit<
        TextFieldProps,
        "name"  | "onChange" | "error" | "helperText" | "defaultValue"
    >;
    transform?: (next: string) => string;
};

export function RHFTextField<T extends FieldValues>({
                                    name,
                                    control,
                                    errors,
                                    label,
                                    required,
                                    side = "right",
                                    textFieldProps,
                                    transform,
                                }: RHFTextFieldProps<T>) {
    const errMsg = (errors as any)?.[name]?.message as string | undefined;

    return (
        <FieldBlock label={label} required={required} side={side}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        {...textFieldProps}
                        fullWidth
                        error={!!errMsg}
                        helperText={errMsg}
                        onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(transform ? transform(v) : v);
                        }}
                    />
                )}
            />
        </FieldBlock>
    );
}

type Option = { value: string; label: string };

type RHFSelectFieldProps<T extends FieldValues> = {
    name: Path<T>;
    control: Control<T>;
    errors: FieldErrors<T>;
    label: string;
    required?: boolean;
    side?: LabelSide;
    options: Option[];
    textFieldProps?: Omit<
        TextFieldProps,
        "select" | "name" | "value" | "onChange" | "error" | "helperText" | "defaultValue"
    >;
};

export function RHFSelectField<T extends FieldValues>({
                                      name,
                                      control,
                                      errors,
                                      label,
                                      required,
                                      side = "right",
                                      options,
                                      textFieldProps,
                                  }: RHFSelectFieldProps<T>) {
    const errMsg = (errors as any)?.[name]?.message as string | undefined;

    return (
        <FieldBlock label={label} required={required} side={side}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        {...textFieldProps}
                        select
                        fullWidth
                        label={undefined}
                        error={!!errMsg}
                        helperText={errMsg }
                    >
                        {options.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                                {o.label}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            />
        </FieldBlock>
    );
}