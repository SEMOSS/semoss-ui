import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlocks, useConductor } from '@/hooks';
import { Button, Grid, Stack, TextField, Typography } from '@semoss/ui';

import { useForm, Controller } from 'react-hook-form';

interface SubtaskSelectedAppInputsInterface {
    /**
     * id of the subtask
     */
    id: string;

    /**
     * Used to set app inputs in the parent
     */
    onComplete: (map?: Record<string, unknown>) => void;
}

export const SubtaskSelectedAppInputs = observer(
    (props: SubtaskSelectedAppInputsInterface) => {
        const { id, onComplete } = props;
        const { conductor } = useConductor();
        const subtask = conductor.getSubtask(id);

        const { control, handleSubmit } = useForm({
            defaultValues: Object.fromEntries(
                Object.keys(subtask?.inputs || {}).map((key) => [key, '']),
            ),
        });

        if (!subtask) {
            return <>unable to locate subtask</>;
        }

        const onSubmit = (data: any) => {
            console.log(data);
            onComplete(data);
        };

        return (
            <Stack
                sx={{
                    padding: '16px 0 0 16px',
                }}
                direction="column"
            >
                <Typography
                    variant="body2"
                    sx={{ marginTop: '10px', marginBottom: '5px' }}
                >
                    Map the user input to app input.
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        marginTop: '25px',
                        marginBottom: '15px',
                        fontSize: '15px',
                    }}
                >
                    <b>Inputs</b>
                </Typography>

                <Grid container spacing={1} sx={{ marginBottom: '7.5px' }}>
                    <Grid item xs={1.85}>
                        <Typography variant="body2" sx={{ fontWeight: '500' }}>
                            App Inputs
                        </Typography>
                    </Grid>
                    <Grid
                        item
                        xs={1}
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            fontSize: '14px',
                            marginLeft: '15px',
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: '500' }}>
                            Type
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        {/* empty spacer */}
                    </Grid>
                </Grid>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {Object.entries(subtask.inputs).map(([key, value], i) => (
                        <Grid container spacing={1} key={i}>
                            <Grid item xs={1.85} sx={{ marginTop: '5px' }}>
                                <Controller
                                    name={key}
                                    control={control}
                                    rules={{
                                        required: 'This field is required',
                                    }}
                                    render={({
                                        field,
                                        fieldState: { error },
                                    }) => (
                                        <TextField
                                            {...field}
                                            size="small"
                                            label={key}
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid
                                item
                                xs={1.25}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    marginLeft: '15px',
                                }}
                            >
                                integer
                            </Grid>
                        </Grid>
                    ))}
                    <Stack direction="row" gap={1} sx={{ marginTop: '8px' }}>
                        <Button color="secondary" variant="outlined">
                            Back
                        </Button>
                        <Button variant="contained" type="submit">
                            Confirm
                        </Button>
                    </Stack>
                </form>
            </Stack>
        );
    },
);
