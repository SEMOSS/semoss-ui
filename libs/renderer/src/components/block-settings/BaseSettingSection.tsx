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
}) => {
    return (
        <Stack direction="column" spacing={1} className="base-setting-section">
            <Stack direction="row" alignItems="center" spacing={1}>
                <StyledTypography variant="body2">
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
            </Stack>
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
