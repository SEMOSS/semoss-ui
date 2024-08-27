import { useEffect } from 'react';
import { IconButton, Stack, styled, Typography } from '@semoss/ui';
import { useBlocks } from '@/hooks';
import { ActionMessages } from '@/stores';
import { MoreVert } from '@mui/icons-material';
import { toJS } from 'mobx';

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

export const VariantSheetsMenu = () => {
    const { state, notebook } = useBlocks();

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
                        models: [],
                    },
                },
            });

            notebook.selectVariant(id);
        }
    }, []);

    const handleSetVariant = (id: string) => {
        notebook.selectVariant(id);
    };

    return (
        <StyledMenu direction="row" spacing={0}>
            {notebook.variantsList.map((id: string, idx) => (
                <StyledTab
                    selected={id === notebook.selectedVariant.id}
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
        </StyledMenu>
    );
};
