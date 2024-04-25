import { Select, styled } from '@semoss/ui';

export const StyledSelect = styled(Select)(({ theme }) => ({
    '& .MuiSelect-select': {
        color: theme.palette.text.secondary,
        display: 'flex',
        gap: theme.spacing(1),
        alignItems: 'center',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        '&:focus': {
            backgroundColor: 'inherit !important',
        },
    },
}));

export const StyledSelectItem = styled(Select.Item)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
}));
