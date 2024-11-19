import React from 'react';
import { TokenOutlined } from '@mui/icons-material';
import { styled, CustomPaletteOptions } from '@semoss/ui';

const StyledContainer = styled('div')(({ theme }) => {
    return {
        '.MuiIcon-fontSizeLarge': {
            width: '2em',
            height: '2em',
        },
    };
});

const StyledIcon = styled(TokenOutlined)(({ theme }) => {
    const palette = theme.palette as unknown as CustomPaletteOptions;

    return {
        color: palette.purple['300'],
    };
});

export const Vector = () => {
    return (
        <StyledContainer>
            <StyledIcon fontSize={'large'} />
        </StyledContainer>
    );
};
