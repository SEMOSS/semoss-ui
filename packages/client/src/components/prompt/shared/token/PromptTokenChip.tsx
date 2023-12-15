import { blue } from '@mui/material/colors';
import { styled, Chip } from '@mui/material';

interface ChipRootProps {
    isChipSelected: boolean;
    disableHover: boolean;
}
export const PromptTokenChip = styled(Chip, {
    shouldForwardProp: (prop) =>
        prop !== 'isChipSelected' && prop !== 'disableHover',
})<ChipRootProps>(({ isChipSelected, disableHover, theme }) => ({
    backgroundColor: isChipSelected ? theme.palette.primary.main : blue[50],
    color: isChipSelected ? blue[50] : theme.palette.primary.main,
    cursor: disableHover ? 'default' : 'pointer',
    fontWeight: '600',
    marginLeft: '1px',
    marginRight: '1px',
    marginBottom: '2px',
    '&:hover': {
        backgroundColor: disableHover ? blue[50] : theme.palette.primary.main,
        color: disableHover ? theme.palette.primary.main : blue[50],
    },
}));
