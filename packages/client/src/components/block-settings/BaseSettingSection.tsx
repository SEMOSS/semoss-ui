import { ReactNode } from 'react';
import { styled, Stack, Typography, Tooltip } from '@semoss/ui';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const StyledTypography = styled(Typography)(() => ({
    width: '30%',
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
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
        >
            <StyledTypography variant="body2">{props.label}</StyledTypography>
            {!!props.description?.length && (
                <Tooltip placement="top" title={props.description} arrow>
                    <HelpOutlineIcon
                        color="action"
                        sx={{
                            fontSize: 15,
                            marginLeft: '5px',
                        }}
                    />
                </Tooltip>
            )}
            <Stack
                direction="row"
                justifyContent="end"
                spacing={1}
                width="100%"
            >
                {props.children}
            </Stack>
        </Stack>
    );
};
