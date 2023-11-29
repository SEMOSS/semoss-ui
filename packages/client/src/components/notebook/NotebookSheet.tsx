import { observer } from 'mobx-react-lite';
import { styled, Stack } from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { NotebookStep } from './NotebookStep';
import { NotebookNewStep } from './NotebookNewStep';

const StyledSheet = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    padding: theme.spacing(2),
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
    const { notebook } = useBlocks();

    // need a query to render the sheet
    if (!notebook.selectedQuery) {
        return null;
    }

    return (
        <StyledSheet>
            {notebook.selectedQuery.steps.map((s) => (
                <StyledStep key={s.id}>
                    <NotebookStep step={s}></NotebookStep>
                    {notebook.selectedStep &&
                    notebook.selectedStep.id === s.id ? (
                        <Stack direction="row" alignItems="center" spacing={2}>
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
        </StyledSheet>
    );
});
