import { styled } from '@semoss/ui';

export const SidebarItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is selected */
    selected?: boolean;

    /** Track if item is disabled */
    disabled?: boolean;
}>(({ theme, selected, disabled }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: disabled
        ? 'rgba(0, 0, 0, 0.3)'
        : selected
        ? theme.palette.primary.main
        : 'rgba(0, 0, 0, 0.54)',
    textDecoration: 'none',
    width: '100%',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    cursor: disabled ? undefined : 'pointer',
    pointerEvents: disabled ? 'none' : undefined,
    backgroundColor: selected ? 'rgba(4, 113, 240, 0.12)' : 'transparent',
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: 'rgba(4, 113, 240, 0.12)',
        transition: 'backgroundColor 2s ease',
    },
}));
