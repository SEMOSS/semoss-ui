import { styled } from '@mui/material';
import { THEME } from '@/constants';
import { blue, green } from '@mui/material/colors';

interface HoverButtonRootProps {
    disableHover: boolean;
}
// note: "theme.palette.primary.main" doesn't seem to work in CFG AI context
// giving SEMOSS blue instead of green
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
