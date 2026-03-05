import {Chip, Divider, Stack, Typography} from "@mui/material";

export function QuestionBlock({
                                  title,
                                  required,
                                  desc,
                                  children,
                                  divider = true,
                              }: {
    title: string;
    required?: boolean;
    desc?: string;
    children: React.ReactNode;
    divider?: boolean;
}) {
    return (
        <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={900}>{title}</Typography>
                {required ? (
                    <Chip
                        size="small"
                        label="필수"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontWeight: 900, "& .MuiChip-label": { px: 0.75 } }}
                    />
                ) : null}
            </Stack>

            {desc ? (
                <Typography fontWeight={400} color="text.secondary">
                    {desc}
                </Typography>
            ) : null}

            {children}

            {divider ? <Divider sx={{ my: 0.5 }} /> : null}
        </Stack>
    );
}