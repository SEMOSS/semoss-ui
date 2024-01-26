import { observer } from 'mobx-react-lite';
import { styled, Button } from '@semoss/ui';

import { useBlocks, useWorkspace } from '@/hooks';
import { QueryState } from '@/stores';
import { Add } from '@mui/icons-material';
import { NewStepOverlay } from './NewStepOverlay';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousStepId?: string }): JSX.Element => {
        const { query, previousStepId = '' } = props;
        const { notebook } = useBlocks();
        const { workspace } = useWorkspace();

        /**
         * Create a new step
         */
        const openStepOverlay = () => {
            workspace.openOverlay(() => {
                return (
                    <NewStepOverlay
                        queryId={query.id}
                        previousStepId={previousStepId}
                        onClose={(newStepId) => {
                            workspace.closeOverlay();

                            if (newStepId) {
                                notebook.selectStep(query.id, newStepId);
                            }
                        }}
                    />
                );
            });
        };

        return (
            <StyledButton
                title="Add new cell"
                variant="contained"
                size="small"
                disabled={query.isLoading}
                onClick={openStepOverlay}
                startIcon={<Add />}
            >
                Add Cell
            </StyledButton>
        );
    },
);
