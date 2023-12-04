import { blue } from '@mui/material/colors';
import { styled } from '@mui/material';

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
        backgroundColor: disableHover ? 'unset' : blue[50],
    },
}));
