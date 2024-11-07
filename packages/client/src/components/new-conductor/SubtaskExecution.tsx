import React, { useState } from 'react';
import { Button, Chip, Grid, Stack, Typography, styled } from '@semoss/ui';
import { useBlocks, useConductor } from '@/hooks';
import { observer } from 'mobx-react-lite';

const StyledPaper = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

interface SubtaskExecutionProps {
    /**
     * id of the subtask
     */
    id: string;
}

export const SubtaskExecution = observer((props: SubtaskExecutionProps) => {
    const { id } = props;
    const { conductor } = useConductor();
    const { state } = useBlocks();

    const subtask = conductor.getSubtask(id);

    return (
        <Stack>
            <Typography variant={'body1'}>Execute subtask</Typography>
            <Grid container spacing={1}>
                <Grid item xs={5}>
                    <Typography variant="body1">Inputs</Typography>
                    <StyledPaper>
                        {Object.entries(subtask.inputs).map((kv) => {
                            const key = kv[0];
                            const value = kv[1];

                            return (
                                <Stack
                                    key={`${id}--input--${key}`}
                                    direction="row"
                                    gap={1}
                                >
                                    <Chip size="small" label={key} />
                                    <Typography variant="caption">
                                        {value}
                                    </Typography>
                                </Stack>
                            );
                        })}
                    </StyledPaper>
                </Grid>
                <Grid item xs={5}>
                    <Typography variant="body1">Ouputs</Typography>
                    <StyledPaper>
                        {Object.entries(subtask.outputs).map((kv) => {
                            const key = kv[0];
                            const value = kv[1];

                            return (
                                <Stack
                                    key={`${id}--output--${key}`}
                                    direction="row"
                                    gap={1}
                                >
                                    <Chip size="small" label={key} />
                                    <Typography variant="caption">
                                        {value}
                                    </Typography>
                                </Stack>
                            );
                        })}
                    </StyledPaper>
                </Grid>
            </Grid>
            <Button
                variant={'contained'}
                onClick={async () => {
                    subtask.setIsLoading(true);

                    const resp = await state.executeApp();
                    // debugger;

                    subtask.setSubtaskOutputs(resp);
                }}
            >
                Execute
            </Button>
        </Stack>
    );
});
