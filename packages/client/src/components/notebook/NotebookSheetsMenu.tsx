import React, { useMemo } from 'react';
import {
    Stack,
    IconButton,
    Icon,
    Button,
    Tabs,
    Typography,
    styled,
} from '@semoss/ui';
import { Add } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useBlocks, useWorkspace } from '@/hooks';
import { NewQueryOverlay } from './NewQueryOverlay';

const StyledSheet = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    selected: boolean;
}>(({ theme, selected }) => ({
    padding: theme.spacing(1),
    backgroundColor: selected
        ? theme.palette.background.paper
        : theme.palette.background.default,
    color: '#666',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledButtonContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.primary.hover,
    },
}));

export const NotebookSheetsMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();
    const { workspace } = useWorkspace();

    /**
     * Edit or create a query
     */
    const openQueryOverlay = () => {
        workspace.openOverlay(() => (
            <NewQueryOverlay
                onClose={(newQueryId?: string) => {
                    if (newQueryId) {
                        notebook.selectQuery(newQueryId);
                    }
                    workspace.closeOverlay();
                }}
            />
        ));
    };

    return (
        <Stack direction="row" spacing={0}>
            {notebook.queriesList.map((q, i) => {
                return (
                    <StyledSheet
                        key={i}
                        selected={q.id === notebook.selectedQuery?.id}
                        onClick={(e) => {
                            notebook.selectQuery(q.id);
                        }}
                    >
                        <Typography variant={'body2'} fontWeight="bold">
                            {q.id}
                        </Typography>
                    </StyledSheet>
                );
            })}

            <StyledButtonContainer>
                <StyledIconButton
                    size="small"
                    onClick={() => {
                        openQueryOverlay();
                    }}
                >
                    <Icon color="primary">
                        <Add />
                    </Icon>
                </StyledIconButton>
            </StyledButtonContainer>
        </Stack>
    );
});
