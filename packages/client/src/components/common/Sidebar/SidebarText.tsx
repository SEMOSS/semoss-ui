import { styled } from '@semoss/ui';

export const SidebarText = styled('div')(({ theme }) => ({
    ...theme.typography.body1,
    display: 'flex',
    alignItems: 'flex-start',
    color: 'inherit',
    textAlign: 'center',
    fontSize: '10px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '157%',
}));
