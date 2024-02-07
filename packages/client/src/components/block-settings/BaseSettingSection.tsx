import { ReactNode } from 'react';
import { styled, Stack, Typography } from '@/component-library';

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
}) => {
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
        >
            <StyledTypography variant="body2">{props.label}</StyledTypography>
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
