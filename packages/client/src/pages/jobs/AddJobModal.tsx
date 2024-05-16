import { Close } from '@mui/icons-material';
import { Autocomplete, createFilterOptions } from '@mui/material';
import {
    Button,
    IconButton,
    Modal,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@semoss/ui';
import { useEffect, useMemo, useState } from 'react';
import { timezones } from './job.constants';
import { AddJobStandardFrequency } from './AddJobStandardFrequency';
import { AddJobCustomFrequency } from './AddJobCustomFrequency';
import { JobBuilder } from './job.types';

export const AddJobModal = (props: { isOpen: boolean; close: () => void }) => {
    const { isOpen, close } = props;

    const [frequencyType, setFrequencyType] = useState<'custom' | 'standard'>(
        'standard',
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [builder, setBuilder] = useState<JobBuilder>({
        name: '',
        pixel: '',
        tags: [],
        cronExpression: '0 12 * * *',
        cronTz: 'Eastern Standard Time',
    });
    const setBuilderField = (field: string, value: string | string[]) => {
        setBuilder((previousBuilder) => ({
            ...previousBuilder,
            [field]: value,
        }));
    };
    const filter = createFilterOptions<string>();

    useEffect(() => {
        const cronValues = builder.cronExpression.split(' ');
        if (cronValues.length < 5) {
            // invalid cron syntax, send to standard builder
            setFrequencyType('standard');
            return;
        } else if (Number.isNaN(cronValues[0]) || Number.isNaN(cronValues[1])) {
            // non-integer time values, must be custom
            setFrequencyType('custom');
            return;
        }

        // check daily
        if (
            cronValues[2] == '*' &&
            cronValues[3] == '*' &&
            cronValues[4] == '*'
        ) {
            setFrequencyType('standard');
            return;
        } else if (cronValues[2] == '*' && cronValues[3] == '*') {
            setFrequencyType('standard');
            return;
        } else if (cronValues[3] == '*' && cronValues[4] == '*') {
            setFrequencyType('standard');
            return;
        } else if (cronValues[4] == '*') {
            setFrequencyType('standard');
            return;
        } else {
            setFrequencyType('custom');
            return;
        }
    }, []);
    const isCronExpressionValid: boolean = useMemo(() => {
        const cronValues = builder.cronExpression.split(' ');
        if (cronValues.length < 5) {
            // make sure it's valid cron syntax
            return false;
        }
        if (
            cronValues[0] !== '*' &&
            !(
                !Number.isNaN(cronValues[0]) &&
                parseInt(cronValues[0]) <= 59 &&
                parseInt(cronValues[0]) >= 0
            )
        ) {
            return false;
        }
        if (
            cronValues[1] !== '*' &&
            !(
                !Number.isNaN(cronValues[1]) &&
                parseInt(cronValues[1]) <= 23 &&
                parseInt(cronValues[1]) >= 0
            )
        ) {
            return false;
        }
        if (
            cronValues[2] !== '*' &&
            !(
                !Number.isNaN(cronValues[2]) &&
                parseInt(cronValues[2]) <= 31 &&
                parseInt(cronValues[2]) >= 0
            )
        ) {
            return false;
        }
        if (
            cronValues[3] !== '*' &&
            !(
                !Number.isNaN(cronValues[3]) &&
                parseInt(cronValues[3]) <= 12 &&
                parseInt(cronValues[3]) >= 1
            )
        ) {
            return false;
        }
        if (
            cronValues[4] !== '*' &&
            !(
                !Number.isNaN(cronValues[4]) &&
                parseInt(cronValues[4]) <= 6 &&
                parseInt(cronValues[4]) >= 0
            )
        ) {
            return false;
        }
        return true;
    }, [builder.cronExpression]);
    const isBaseFormValid: boolean = useMemo(() => {
        return !!builder.name && !!builder.pixel && !!builder.cronTz;
    }, [builder.name, builder.pixel, builder.cronTz]);

    return (
        <Modal open={isOpen} maxWidth="md" fullWidth>
            <Modal.Title>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <span>Add Job</span>
                    <IconButton aria-label="close" onClick={close}>
                        <Close />
                    </IconButton>
                </Stack>
            </Modal.Title>
            <Modal.Content>
                <Stack spacing={2} paddingTop={1}>
                    <TextField
                        label="Name"
                        size="small"
                        value={builder.name}
                        onChange={(e) =>
                            setBuilderField('name', e.target.value)
                        }
                    />
                    <TextField
                        label="Pixel"
                        size="small"
                        value={builder.pixel}
                        onChange={(e) =>
                            setBuilderField('pixel', e.target.value)
                        }
                        multiline
                        rows={3}
                    />
                    <Autocomplete
                        value={(builder.tags as string[]) ?? []}
                        fullWidth
                        multiple
                        size="small"
                        onChange={(_, newValue) => {
                            setBuilderField('tags', newValue);
                        }}
                        filterOptions={(options, params) => {
                            const filtered = filter(options, params);

                            const { inputValue } = params;
                            const isExisting = options.some(
                                (option) => inputValue === option,
                            );
                            if (inputValue !== '' && !isExisting) {
                                filtered.push(inputValue);
                            }

                            return filtered;
                        }}
                        options={[]}
                        renderOption={(props, option) => (
                            <li {...props}>{option}</li>
                        )}
                        freeSolo
                        renderInput={(params) => (
                            <TextField {...params} label="Tags" />
                        )}
                    />
                    <ToggleButtonGroup value={frequencyType} size="small">
                        <ToggleButton
                            value="standard"
                            onClick={() => setFrequencyType('standard')}
                        >
                            Standard
                        </ToggleButton>
                        <ToggleButton
                            value="custom"
                            onClick={() => setFrequencyType('custom')}
                        >
                            Custom
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Autocomplete
                        value={builder.cronTz}
                        options={timezones}
                        onChange={(_, value) =>
                            setBuilderField('cronTz', value)
                        }
                        size="small"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Timezone"
                            />
                        )}
                    />
                    {frequencyType === 'standard' ? (
                        <AddJobStandardFrequency
                            builder={builder}
                            setBuilderField={setBuilderField}
                        />
                    ) : (
                        <AddJobCustomFrequency
                            builder={builder}
                            setBuilderField={setBuilderField}
                        />
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Stack
                    direction="row"
                    spacing={1}
                    paddingX={2}
                    paddingBottom={2}
                >
                    <Button type="button" disabled={isLoading} onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant={'contained'}
                        disabled={
                            isLoading ||
                            !isBaseFormValid ||
                            !isCronExpressionValid
                        }
                    >
                        Create
                    </Button>
                </Stack>
            </Modal.Actions>
        </Modal>
    );
};
