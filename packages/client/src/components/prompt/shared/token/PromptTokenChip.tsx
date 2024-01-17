import { blue, green } from '@mui/material/colors';
import { styled, Chip } from '@semoss/ui';
import { THEME } from '@/constants';

interface ChipRootProps {
    isChipSelected: boolean;
    disableHover: boolean;
}
const primaryLight = THEME.name === 'SEMOSS' ? blue[50] : green[50];
export const PromptTokenChip = styled(Chip, {
    shouldForwardProp: (prop) =>
        prop !== 'isChipSelected' && prop !== 'disableHover',
})<ChipRootProps>(({ theme, isChipSelected, disableHover }) => ({
    backgroundColor: isChipSelected ? theme.palette.primary.main : primaryLight,
    color: isChipSelected ? primaryLight : theme.palette.primary.main,
    cursor: disableHover ? 'default' : 'pointer',
    fontWeight: '600',
    marginLeft: '1px',
    marginRight: '1px',
    marginBottom: '2px',
    '&:hover': {
        backgroundColor: disableHover
            ? primaryLight
            : theme.palette.primary.main,
        color: disableHover ? theme.palette.primary.main : primaryLight,
    },
}));
