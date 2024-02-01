import { observer } from 'mobx-react-lite';
import { styled, Stack, Container, Button, CircularProgress } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { NotebookCell } from './NotebookCell';
import { ActionMessages } from '@/stores';
import { DeleteOutlined, PlayArrowRounded } from '@mui/icons-material';
import { NotebookQueryModeButton } from './NotebookQueryModeButton';

const StyledSheet = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    overflow: 'auto',
}));

const StyledCell = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    paddingBottom: theme.spacing(5),
}));

const StyledContainedButton = styled(Button)(() => ({
    lineHeight: '1.25rem',
}));

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
    minWidth: 'unset',
}));

const StyledButtonLabel = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
}));

/**
 * Render a sheet in the notebook (contains the individual steps)
 */
export const NotebookSheet = observer((): JSX.Element => {
    const { notebook, state } = useBlocks();

    // need a query to render the sheet
    if (!notebook.selectedQuery) {
        return null;
    }

    return (
        <StyledSheet>
            <Stack
                alignItems={'center'}
                justifyContent={'space-between'}
                direction="row"
                paddingLeft={3}
                paddingRight={3}
                paddingY={1.25}
                spacing={2}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <NotebookQueryModeButton query={notebook.selectedQuery} />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <StyledContainedButton
                        title="Run all cells"
                        variant="contained"
                        size="small"
                        color="primary"
                        disableElevation
                        startIcon={
                            notebook.selectedQuery.isLoading ? (
                                <CircularProgress size="0.75em" />
                            ) : (
                                <PlayArrowRounded />
                            )
                        }
                        disabled={notebook.selectedQuery.isLoading}
                        onClick={() =>
                            state.dispatch({
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: notebook.selectedQuery.id,
                                },
                            })
                        }
                    >
                        Run All
                    </StyledContainedButton>
                    <StyledButton
                        title="Delete query"
                        disabled={notebook.selectedQuery.isLoading}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                            state.dispatch({
                                message: ActionMessages.DELETE_QUERY,
                                payload: {
                                    queryId: notebook.selectedQuery.id,
                                },
                            });
                            if (notebook.queriesList.length) {
                                notebook.selectQuery(
                                    notebook.queriesList[0].id,
                                );
                            }
                        }}
                    >
                        <StyledButtonLabel>
                            <DeleteOutlined fontSize="small" />
                        </StyledButtonLabel>
                    </StyledButton>
                </Stack>
            </Stack>
            <StyledContainer maxWidth={'xl'}>
                {notebook.selectedQuery.list.map((cellId) => (
                    <StyledCell key={cellId}>
                        <NotebookCell
                            queryId={notebook.selectedQuery.id}
                            cellId={cellId}
                        ></NotebookCell>
                    </StyledCell>
                ))}
            </StyledContainer>
        </StyledSheet>
    );
});
