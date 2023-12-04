import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    Container,
    Select,
    CircularProgress,
    ButtonGroup,
    Typography,
} from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { NotebookStep } from './NotebookStep';
import { NotebookNewStep } from './NotebookNewStep';
import { ActionMessages } from '@/stores';
import { DeleteOutlined, PlayArrowRounded } from '@mui/icons-material';

const StyledSheet = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
}));

const StyledTopbar = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
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

const StyledStep = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing(5),
    paddingBottom: theme.spacing(5),
}));

const StyledStepSpaccer = styled('div')(({ theme }) => ({
    width: theme.spacing(3),
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
            <StyledTopbar
                alignItems={'center'}
                justifyContent={'space-between'}
                direction="row"
                paddingX={2}
                paddingY={1.25}
                spacing={2}
            >
                <Stack direction="row" alignItems={'center'} spacing={2}>
                    <Select
                        size="small"
                        value={notebook.selectedQuery.mode}
                        onChange={(e) =>
                            state.dispatch({
                                message: ActionMessages.UPDATE_QUERY,
                                payload: {
                                    queryId: notebook.selectedQuery.id,
                                    path: 'mode',
                                    value: e.target.value,
                                },
                            })
                        }
                    >
                        <Select.Item value="automatic"> Automatic </Select.Item>
                        <Select.Item value="manual"> Manual </Select.Item>
                    </Select>
                    <Typography variant="subtitle2">
                        {notebook.selectedQuery.id}
                    </Typography>
                </Stack>
                <ButtonGroup size="small">
                    <ButtonGroup.Item
                        title="Run all of the steps"
                        variant="outlined"
                        startIcon={
                            notebook.selectedQuery.isLoading ? (
                                <CircularProgress size="1em" />
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
                    </ButtonGroup.Item>
                    <ButtonGroup.Item
                        title="Delete the query"
                        variant="outlined"
                        disabled={notebook.selectedQuery.isLoading}
                        onClick={() => {
                            // copy and add the step to the end
                            state.dispatch({
                                message: ActionMessages.DELETE_QUERY,
                                payload: {
                                    queryId: notebook.selectedQuery.id,
                                },
                            });
                        }}
                    >
                        <DeleteOutlined fontSize="small" />
                    </ButtonGroup.Item>
                </ButtonGroup>
            </StyledTopbar>
            <StyledContainer maxWidth={'xl'}>
                {notebook.selectedQuery.steps.map((s) => (
                    <StyledStep key={s.id}>
                        <NotebookStep step={s}></NotebookStep>
                        {notebook.selectedStep &&
                        notebook.selectedStep.id === s.id ? (
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                            >
                                <StyledStepSpaccer />
                                <NotebookNewStep step={s} />
                            </Stack>
                        ) : null}
                    </StyledStep>
                ))}
                {notebook.selectedQuery.steps.length === 0 && (
                    <StyledStep>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <StyledStepSpaccer />
                            <NotebookNewStep step={null} />
                        </Stack>
                    </StyledStep>
                )}
            </StyledContainer>
        </StyledSheet>
    );
});
