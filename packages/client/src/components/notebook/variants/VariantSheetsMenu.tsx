import { useEffect } from 'react';
import { IconButton, Stack, styled, Typography, Icon } from '@semoss/ui';
import { useBlocks, useWorkspace } from '@/hooks';
import { ActionMessages } from '@/stores';
import { MoreVert, Add } from '@mui/icons-material';
import { NewVariantOverlay } from './NewVariantOverlay';
import { observer } from 'mobx-react-lite';

const StyledMenu = styled(Stack)(({ theme }) => ({
    overflowX: 'scroll',
}));

const StyledTab = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
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
    display: 'flex',
    alignItems: 'center',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    '&:hover': {
        backgroundColor: theme.palette.primary.hover,
    },
}));

export const VariantSheetsMenu = observer(() => {
    const { state, notebook } = useBlocks();
    const { workspace } = useWorkspace();

    // Create and/or set the selected variant in state.
    useEffect(() => {
        if (notebook.selectedVariant) return;

        if (notebook.variantsList.length) {
            notebook.selectVariant(notebook.variantsList[0]);
        } else {
            const id = state.dispatch({
                message: ActionMessages.ADD_VARIANT,
                payload: {
                    id: 'default',
                    variant: {
                        id: 'default',
                        to: '',
                        models: [
                            {
                                id: '',
                                name: '',
                                topP: 0,
                                temperature: 0,
                                length: 0,
                            },
                        ],
                    },
                },
            });

            notebook.selectVariant(id);
        }
    }, []);

    const handleSetVariant = (id: string) => {
        notebook.selectVariant(id);
    };

    // Open modal to create a new Variant
    const openVariantOverlay = () => {
        workspace.openOverlay(() => (
            <NewVariantOverlay
                onClose={(newQueryId?: string) => {
                    if (newQueryId) {
                        notebook.selectVariant(newQueryId);
                    }
                    workspace.closeOverlay();
                }}
            />
        ));
    };

    return (
        <StyledMenu direction="row" spacing={0}>
            {notebook.variantsList.map((id: string, idx) => (
                <StyledTab
                    selected={id === notebook.selectedVariant?.id}
                    key={`sheet-${idx}`}
                >
                    <Typography variant="body2" fontWeight="bold">
                        {id}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => {
                            handleSetVariant(id);
                        }}
                    >
                        <MoreVert />
                    </IconButton>
                </StyledTab>
            ))}

            <StyledButtonContainer>
                <StyledIconButton
                    size="small"
                    onClick={() => {
                        openVariantOverlay();
                    }}
                >
                    <Icon color="primary">
                        <Add />
                    </Icon>
                </StyledIconButton>
            </StyledButtonContainer>
        </StyledMenu>
    );
});
