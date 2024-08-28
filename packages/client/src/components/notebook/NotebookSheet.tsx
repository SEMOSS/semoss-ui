import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Stack, Container, Button, CircularProgress } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { NotebookCell } from './NotebookCell';
import { ActionMessages } from '@/stores';
import { DeleteOutlined, PlayArrowRounded } from '@mui/icons-material';
import { LoadingScreen } from '@/components/ui';

const StyledSheet = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.primary.light}`,
}));

const StyledContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    overflow: 'auto',
    gap: theme.spacing(1),
}));

const StyledCell = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
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
    const [cellPlayCounter, setCellPlayCounter] = useState(null);

    // need a query to render the sheet
    if (!notebook.selectedQuery) {
        return (
            <StyledSheet>
                <div
                    className="splash-page"
                    style={{
                        // display: isSplashPageVisible ? "block" : "none",
                        backgroundColor: '#f0f4f8',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        textAlign: 'center',
                        fontFamily: "'Arial', sans-serif",
                    }}
                >
                    <div
                        className="splash-page-content"
                        style={{
                            backgroundColor: '#ffffff',
                            padding: '40px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            maxWidth: '500px',
                            width: '100%',
                        }}
                    >
                        <h1 style={{ color: '#333333', marginBottom: '20px' }}>
                            Welcome to My Notebook
                        </h1>
                        <p style={{ color: '#666666', marginBottom: '30px' }}>
                            This is a simple notebook app that allows you to
                            create, edit, and delete notes.
                        </p>
                        <button
                            //   onClick={handleSplashPageClick}
                            style={{
                                backgroundColor: '#007bff',
                                color: '#ffffff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </StyledSheet>
        );
    }

    console.log('selected qs', notebook.selectedQuery);
    console.log(state.getQuery(notebook.selectedQuery.id));

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
                &nbsp;
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
                            cellPlayCounter={cellPlayCounter}
                            setCellPlayCounter={setCellPlayCounter}
                        ></NotebookCell>
                    </StyledCell>
                ))}
            </StyledContainer>
        </StyledSheet>
    );
});
