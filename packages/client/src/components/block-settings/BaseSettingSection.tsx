import { ReactNode } from 'react';
import { Stack, Typography } from '@semoss/ui';

/**
 * Standardized styling for all setting sections
 */

export const BaseSettingSection = (props: {
    label: string;
    children: ReactNode;
    wide?: boolean;
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justifyContent?:
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'space-evenly';
}) => {
    const {
        label,
        children,
        wide,
        direction = 'row',
        alignItems = 'center',
        justifyContent = 'space-between',
    } = props;
    return (
        <Stack
            direction={direction}
            alignItems={alignItems}
            justifyContent={justifyContent}
        >
            <Typography variant="body2">{label}</Typography>
            <Stack
                direction={direction}
                justifyContent="end"
                spacing={1}
                width={wide ? '60%' : '50%'}
            >
                {children}
            </Stack>
        </Stack>
    );
};
