import { styled } from '@semoss/ui';

export const SidebarText = styled('div')(({ theme }) => ({
    ...theme.typography.body1,
    display: 'flex',
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    alignItems: 'flex-start',
    color: theme.palette.text.secondary,
    textAlign: 'center',
    fontSize: '10px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '157%',
}));
