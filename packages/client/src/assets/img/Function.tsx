import React from 'react';

import { SwitchAccessShortcutOutlined } from '@mui/icons-material';
import { styled, CustomPaletteOptions } from '@semoss/ui';

import { Box } from '@mui/material';

const StyledContainer = styled('div')(({ theme }) => {
    return {
        // width: '50px', height: '50px',
        '.MuiIcon-fontSizeLarge': {
            width: '2em',
            height: '2em',
        },
    };
});

const StyledIcon = styled(SwitchAccessShortcutOutlined)(({ theme }) => {
    const palette = theme.palette as unknown as CustomPaletteOptions;

    return {
        color: palette.pink['300'],
    };
});

export const Function = () => {
    debugger
    return (
        <StyledContainer>
            <StyledIcon fontSize="large" />
        </StyledContainer>
    );
};
