import { observer } from 'mobx-react-lite';
import { styled, Button } from '@semoss/ui';

import { useBlocks, useWorkspace } from '@/hooks';
import { QueryState } from '@/stores';
import { Add } from '@mui/icons-material';
import { NewCellOverlay } from './NewCellOverlay';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

export const NotebookAddCellButton = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const { query, previousCellId = '' } = props;
        const { notebook } = useBlocks();
        const { workspace } = useWorkspace();

        /**
         * Create a new cell
         */
        const openCellOverlay = () => {
            workspace.openOverlay(() => {
                return (
                    <NewCellOverlay
                        queryId={query.id}
                        previousCellId={previousCellId}
                        onClose={(newCellId) => {
                            workspace.closeOverlay();

                            if (newCellId) {
                                notebook.selectCell(query.id, newCellId);
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
                onClick={openCellOverlay}
                startIcon={<Add />}
            >
                Add Cell
            </StyledButton>
        );
    },
);
