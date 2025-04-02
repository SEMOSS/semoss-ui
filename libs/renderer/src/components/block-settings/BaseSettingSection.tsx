import { ReactNode } from "react";
import { styled, Stack, Typography, Tooltip } from "@semoss/ui";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const StyledTypography = styled(Typography)(() => ({
    width: "100%",
}));

/**
 * Standardized styling for all setting sections
 */

export const BaseSettingSection = (props: {
    label: string;
    children: ReactNode;
    wide?: boolean;
    description?: string;
    labelDirection?: "row" | "column";
}) => {
    const labelDirection = props.labelDirection || "row";
    return (
        <Stack
            direction={labelDirection}
            alignItems="start"
            justifyContent="space-between"
            // spacing={2}
        >
            <StyledTypography variant="body2" color="secondary">
                {props.label}
            </StyledTypography>
            {!!props.description?.length && (
                <Tooltip placement="top" title={props.description} arrow>
                    <HelpOutlineIcon
                        color="action"
                        sx={{
                            fontSize: 15,
                            marginLeft: "5px",
                        }}
                    />
                </Tooltip>
            )}
            <Stack
                direction="row"
                justifyContent="start"
                spacing={1}
                width="100%"
            >
                {props.children}
            </Stack>
        </Stack>
    );
};
