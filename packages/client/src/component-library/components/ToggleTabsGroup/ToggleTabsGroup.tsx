import React, { ReactNode } from 'react';
import { styled, Theme, SxProps } from '@mui/material';
import { Tabs, TabsProps } from '../Tabs';
import { Box } from '../Box';

type COLORS = 'default' | 'primary';
export interface ToggleTabsProps extends TabsProps<string | number> {
    color?: COLORS;
    // * Props applied to the tab indicator element.
    children?: ReactNode;

    TabIndicatorProps?: React.HTMLAttributes<HTMLDivElement>;

    boxSx?: SxProps;

    sx?: SxProps<Theme>;
}

const StyledBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'color',
})<{
    color: COLORS;
}>(({ theme, color }) => {
    return {
        backgroundColor:
            theme.palette.mode === 'dark'
                ? '#0000000A'
                : color === 'primary'
                ? `${theme.palette.primary.light}1D`
                : 'rgba(0, 0, 0, 0.04)',
        border: theme.palette.mode === 'dark' ? '1px' : '0',
        borderRadius: '12px',
        width: 'fit-content',
        borderColor: 'rgba(4, 113, 240, 0.5)',
    };
});

const StyledToggleGroup = styled(Tabs, {
    shouldForwardProp: (prop) => prop !== 'color',
})<{
    color: COLORS;
}>(({ theme, color }) => ({
    minHeight: theme.spacing(4),
    padding: theme.spacing(0.5),
    '& .MuiTab-root': {
        borderRadius: '6px',
        lineHeight: 0,
        minHeight: 'unset',
        color:
            theme.palette.mode === 'dark'
                ? '#8BCAFF'
                : color === 'primary'
                ? theme.palette.primary.main
                : theme.palette.text.disabled,
        fontWeight: 700,
    },
    '& .MuiTab-root.Mui-selected': {
        backgroundColor:
            theme.palette.mode === 'dark'
                ? `${theme.palette.primary.light}1D`
                : '#FFFFFF',
        fontWeight: 700,
        color:
            color === 'primary'
                ? theme.palette.primary.dark
                : theme.palette.text.secondary,
    },
}));

export const ToggleTabsGroup = (props: ToggleTabsProps) => {
    const { color = 'default', sx, boxSx, ...otherProps } = props;
    return (
        <StyledBox color={color} sx={boxSx}>
            <StyledToggleGroup
                color={color}
                TabIndicatorProps={{ style: { display: 'none' } }}
                sx={sx}
                {...otherProps}
            />
        </StyledBox>
    );
};
