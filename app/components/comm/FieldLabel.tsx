import { Box, Chip, Stack, Typography } from "@mui/material";

function FieldLabel({
                        label,
                        required,
                        side = "right",
                    }: {
    label: string;
    required?: boolean;
    side?: "left" | "right";
}) {
    const badge = required ? (
        <Chip
            size="small"
            label="필수"
            color="error"
            variant="outlined"
            sx={{ height: 20, fontWeight: 900, "& .MuiChip-label": { px: 0.75 } }}
        />
    ) : null;

    return (
        <Stack direction="row" spacing={0.75} alignItems="center">
            {side === "left" ? badge : null}
            <Typography fontWeight={900} sx={{ fontSize: 14 }}>
                {label}
            </Typography>
            {side === "right" ? badge : null}
        </Stack>
    );
}

export function FieldBlock({
                        label,
                        required,
                        children,
                        side = "right",
                    }: {
    label: string;
    required?: boolean;
    side?: "left" | "right";
    children: React.ReactNode;
}) {
    return (
        <Stack spacing={0.75}>
            <FieldLabel label={label} required={required} side={side} />
            {children}
        </Stack>
    );
}