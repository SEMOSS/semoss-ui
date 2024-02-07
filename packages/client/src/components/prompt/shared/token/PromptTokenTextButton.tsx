import { styled } from '@/component-library';
import { THEME } from '@/constants';
import { blue, green } from '@mui/material/colors';

interface HoverButtonRootProps {
    disableHover: boolean;
}

export const PromptTokenTextButton = styled('button', {
    shouldForwardProp: (prop) => prop !== 'disableHover',
})<HoverButtonRootProps>(({ disableHover }) => ({
    background: 'none',
    color: 'inherit',
    border: 'none',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: '4px',
    paddingRight: '4px',
    marginLeft: '-2px',
    marginRight: '-2px',
    font: 'inherit',
    cursor: disableHover ? 'default' : 'pointer',
    outline: 'inherit',
    '&:hover': {
        backgroundColor: disableHover
            ? 'unset'
            : THEME.name === 'SEMOSS'
            ? blue[50]
            : green[50],
    },
}));
