import { blue, green } from '@mui/material/colors';
import { styled, Chip } from '@mui/material';
import { THEME } from '@/constants';

interface ChipRootProps {
    isChipSelected: boolean;
    disableHover: boolean;
}
const primaryMain = THEME.name === 'SEMOSS' ? '#1976d2' : '#26890D';
const primaryLight = THEME.name === 'SEMOSS' ? blue[50] : green[50];

// note: "primaryMain" doesn't seem to work in CFG AI context
// giving SEMOSS blue instead of green
export const PromptTokenChip = styled(Chip, {
    shouldForwardProp: (prop) =>
        prop !== 'isChipSelected' && prop !== 'disableHover',
})<ChipRootProps>(({ isChipSelected, disableHover }) => ({
    backgroundColor: isChipSelected ? primaryMain : primaryLight,
    color: isChipSelected ? primaryLight : primaryMain,
    cursor: disableHover ? 'default' : 'pointer',
    fontWeight: '600',
    marginLeft: '1px',
    marginRight: '1px',
    marginBottom: '2px',
    '&:hover': {
        backgroundColor: disableHover ? primaryLight : primaryMain,
        color: disableHover ? primaryMain : primaryLight,
    },
}));
