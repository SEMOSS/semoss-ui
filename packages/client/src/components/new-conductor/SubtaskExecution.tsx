import React, { useEffect, useState } from 'react';
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
    threadedExecuteTrigger: number;
}

export const SubtaskExecution = observer((props: SubtaskExecutionProps) => {
    const { id } = props;
    const { threadedExecuteTrigger } = props;
    const { conductor } = useConductor();
    const { state } = useBlocks();

    const subtask = conductor.getSubtask(id);

    const [inputOutputHeight, setInputOutputHeight] = useState('50px');

    const executeApp = async () => {
        subtask.setIsLoading(true);

        const resp = await state.executeApp();
        // debugger;

        subtask.setSubtaskOutputs(resp);
    };

    useEffect(() => {
        if (threadedExecuteTrigger > 0) {
            executeApp();
        }
    }, [threadedExecuteTrigger]);

    useEffect(() => {
        const inputCount = Object.entries(subtask.inputs).length;
        const outputCount = Object.entries(subtask.outputs).length;

        setInputOutputHeight(`${Math.max(inputCount, outputCount) * 40}px`);
    }, [subtask.outputs, subtask.inputs]);

    return (
        <Stack
            sx={
                {
                    // border: '1px solid red'
                }
            }
        >
            <Typography variant={'body1'} sx={{ margin: '20px 0px 30px' }}>
                <b>Execute subtask</b>
            </Typography>
            <Grid container spacing={1}>
                <Grid item xs={5}>
                    <Typography
                        sx={{
                            marginBottom: '7.5px',
                            paddingLeft: '7.5px',
                        }}
                        variant="body1"
                    >
                        Inputs
                    </Typography>
                    <StyledPaper
                        sx={{
                            padding: '15px',
                            borderRadius: '12.5px',
                            height: inputOutputHeight,
                            minHeight: '125px',
                        }}
                    >
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
                    <Typography
                        sx={{
                            marginBottom: '7.5px',
                            paddingLeft: '7.5px',
                        }}
                        variant="body1"
                    >
                        Outputs
                    </Typography>
                    <StyledPaper
                        sx={{
                            padding: '15px',
                            borderRadius: '12.5px',
                            height: inputOutputHeight,
                            minHeight: '125px',
                            overflowX: 'scroll',
                        }}
                    >
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
            {/* <Button
                variant={'contained'}
                onClick={async () => {
                    subtask.setIsLoading(true);

                    const resp = await state.executeApp();
                    // debugger;

                    subtask.setSubtaskOutputs(resp);
                }}
            >
                Execute
            </Button> */}
        </Stack>
    );
});
