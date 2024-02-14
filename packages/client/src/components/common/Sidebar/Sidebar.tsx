import { styled } from '@semoss/ui';

export const Sidebar = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    flexShrink: '0',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: theme.spacing(7),
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: theme.palette.divider,
}));
