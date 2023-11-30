import { ReactNode } from 'react';
import { Stack, Typography } from '@semoss/ui';

/**
 * Standardized styling for all setting sections
 */

export const BaseSettingSection = (props: {
    label: string;
    children: ReactNode;
}) => {
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
        >
            <Typography variant="body2">{props.label}</Typography>
            <Stack direction="row" justifyContent="end" spacing={2} width="50%">
                {props.children}
            </Stack>
        </Stack>
    );
};
