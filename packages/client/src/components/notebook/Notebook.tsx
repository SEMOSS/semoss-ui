import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Stack, Container, Button, CircularProgress } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { NotebookCell } from './NotebookCell';
import { ActionMessages } from '@/stores';
import { PlayArrowRounded } from '@mui/icons-material';

const StyledSheet = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    flex: 1,
    overflow: 'hidden',
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
}));

const StyledContainedButton = styled(Button)(() => ({
    lineHeight: '1.25rem',
}));

interface NotebookProps {
    /** Id of the notebook */
    id: string;
}

/**
 * Render a sheet in the notebook (contains the individual steps)
 */
export const Notebook = observer((props: NotebookProps): JSX.Element => {
    const { id } = props;
    const { state } = useBlocks();
    const [cellPlayCounter, setCellPlayCounter] = useState(null);

    // need a notebook to render it
    const notebook = state.getQuery(id);
    if (!notebook) {
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
                &nbsp;
                <Stack direction="row" alignItems="center" spacing={1}>
                    <StyledContainedButton
                        title="Run all cells"
                        variant="contained"
                        size="small"
                        color="primary"
                        disableElevation
                        startIcon={
                            notebook.isLoading ? (
                                <CircularProgress size="0.75em" />
                            ) : (
                                <PlayArrowRounded />
                            )
                        }
                        disabled={notebook.isLoading}
                        onClick={() =>
                            state.dispatch({
                                message: ActionMessages.RUN_QUERY,
                                payload: {
                                    queryId: id,
                                },
                            })
                        }
                    >
                        Run All
                    </StyledContainedButton>
                </Stack>
            </Stack>
            <StyledContainer maxWidth={'xl'}>
                {notebook.list.map((cellId) => (
                    <StyledCell key={cellId}>
                        <NotebookCell
                            queryId={id}
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
