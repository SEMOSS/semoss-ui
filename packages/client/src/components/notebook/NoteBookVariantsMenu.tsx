import { useMemo } from 'react';
import { styled, Stack, List } from '@semoss/ui';
import { useBlocks } from '@/hooks';

const StyledMenu = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    overflowY: 'scroll',
}));

export const NotebookVariantsMenu = () => {
    const { state } = useBlocks();

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <div>Variants</div>
            </Stack>
            <List disablePadding></List>
        </StyledMenu>
    );
};
