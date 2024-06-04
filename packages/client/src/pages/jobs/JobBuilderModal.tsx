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
import { JobStandardFrequencyBuilder } from './JobStandardFrequencyBuilder';
import { JobCustomFrequencyBuilder } from './JobCustomFrequencyBuilder';
import { JobBuilder } from './job.types';
import { runPixel } from '@/api';

const emptyBuilder: JobBuilder = {
    id: null,
    name: '',
    pixel: '',
    tags: [],
    cronExpression: '0 0 12 * * ?',
    cronTz: 'US/Eastern',
};

export const JobBuilderModal = (props: {
    isOpen: boolean;
    close: () => void;
    getJobs: () => void;
    initialBuilder?: JobBuilder;
}) => {
    const { isOpen, close, getJobs, initialBuilder } = props;

    const [frequencyType, setFrequencyType] = useState<'custom' | 'standard'>(
        'standard',
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [builder, setBuilder] = useState<JobBuilder>(emptyBuilder);
    const setBuilderField = (field: string, value: string | string[]) => {
        setBuilder((previousBuilder) => ({
            ...previousBuilder,
            [field]: value,
        }));
    };
    const filter = createFilterOptions<string>();

    const isEditMode = useMemo(() => {
        return !!builder.id;
    }, [builder.id]);

    useEffect(() => {
        const builderToSet = !!initialBuilder ? initialBuilder : emptyBuilder;
        setBuilder(builderToSet);
        const cronValues = builderToSet.cronExpression.split(' ');
        if (cronValues.length < 6) {
            // invalid cron syntax, send to standard builder
            setFrequencyType('standard');
            return;
        } else if (Number.isNaN(cronValues[1]) || Number.isNaN(cronValues[2])) {
            // non-integer time values, must be custom
            setFrequencyType('custom');
            return;
        }

        if (
            cronValues[3] == '*' &&
            cronValues[4] == '*' &&
            cronValues[5] == '*'
        ) {
            setFrequencyType('standard');
            return;
        } else if (cronValues[3] == '*' && cronValues[4] == '*') {
            setFrequencyType('standard');
            return;
        } else if (cronValues[4] == '*' && cronValues[5] == '*') {
            setFrequencyType('standard');
            return;
        } else if (cronValues[5] == '*') {
            setFrequencyType('standard');
            return;
        } else {
            setFrequencyType('custom');
            return;
        }
    }, [initialBuilder ? initialBuilder.id : null]);

    const isCronExpressionValid: boolean = useMemo(() => {
        const cronValues = builder.cronExpression.split(' ');
        if (cronValues.length < 6) {
            // make sure it's valid cron syntax
            return false;
        }
        if (
            cronValues[1] !== '*' &&
            !(
                !Number.isNaN(cronValues[1]) &&
                parseInt(cronValues[1]) <= 59 &&
                parseInt(cronValues[1]) >= 0
            )
        ) {
            console.log('cron expression min invalid');
            return false;
        }
        if (
            cronValues[2] !== '*' &&
            !(
                !Number.isNaN(cronValues[2]) &&
                parseInt(cronValues[2]) <= 23 &&
                parseInt(cronValues[2]) >= 0
            )
        ) {
            console.log('cron expression hour invalid');
            return false;
        }
        if (
            cronValues[3] !== '*' &&
            !(
                !Number.isNaN(cronValues[3]) &&
                parseInt(cronValues[3]) <= 31 &&
                parseInt(cronValues[3]) >= 0
            )
        ) {
            console.log('cron expression 3 invalid');
            return false;
        }
        if (
            cronValues[4] !== '*' &&
            !(
                !Number.isNaN(cronValues[4]) &&
                parseInt(cronValues[4]) <= 12 &&
                parseInt(cronValues[4]) >= 1
            )
        ) {
            console.log('cron expression 4 invalid');
            return false;
        }
        if (
            cronValues[5] !== '?' &&
            !(
                !Number.isNaN(cronValues[5]) &&
                parseInt(cronValues[5]) <= 6 &&
                parseInt(cronValues[5]) >= 0
            )
        ) {
            console.log('cron expression 5 invalid');
            return false;
        }
        return true;
    }, [builder.cronExpression]);

    const isBaseFormValid: boolean = useMemo(() => {
        return !!builder.name && !!builder.pixel && !!builder.cronTz;
    }, [builder.name, builder.pixel, builder.cronTz]);

    const hasChanges: boolean = useMemo(() => {
        if (builder.id == null) {
            return true;
        }

        return (
            builder.name !== initialBuilder.name ||
            builder.pixel !== initialBuilder.pixel ||
            JSON.stringify(builder.tags) !==
                JSON.stringify(initialBuilder.tags) ||
            builder.cronTz !== initialBuilder.cronTz ||
            builder.cronExpression !== initialBuilder.cronExpression
        );
    }, [
        builder.name,
        builder.pixel,
        builder.tags,
        builder.cronTz,
        builder.cronExpression,
    ]);

    const addJob = async () => {
        setIsLoading(true);
        await runPixel(
            `META|ScheduleJob(jobName="${builder.name}",${
                builder.tags.length
                    ? `jobTags=${JSON.stringify(builder.tags)},`
                    : ''
            }jobGroup=["defaultGroup"],cronExpression="${
                builder.cronExpression
            } *",cronTz="${builder.cronTz}",recipe="<encode>${
                builder.pixel
            }</encode>",uiState="",triggerOnLoad=[false],triggerNow=[false]);`,
        );
        getJobs();
        close();
        setIsLoading(false);
    };

    const updateJob = async () => {
        setIsLoading(true);
        await runPixel(
            `META|EditScheduledJob(jobId="${builder.id}",jobName="${
                builder.name
            }",${
                builder.tags.length
                    ? `jobTags="${JSON.stringify(builder.tags)}",`
                    : ''
            }jobGroup=["defaultGroup"],cronExpression="${
                builder.cronExpression
            } *",cronTz="${builder.cronTz}",recipe="<encode>${
                builder.pixel
            }</encode>",uiState="",triggerOnLoad=[false],triggerNow=[false]);`,
        );
        close();
        setIsLoading(false);
    };

    return (
        <Modal open={isOpen} maxWidth="md" fullWidth>
            <Modal.Title>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <span>{isEditMode ? 'Edit' : 'Add'} Job</span>
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
                        getOptionLabel={(option: string) =>
                            option.replaceAll('_', ' ')
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Timezone"
                            />
                        )}
                    />
                    {frequencyType === 'standard' ? (
                        <JobStandardFrequencyBuilder
                            builder={builder}
                            setBuilderField={setBuilderField}
                        />
                    ) : (
                        <JobCustomFrequencyBuilder
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
                            !isCronExpressionValid ||
                            !hasChanges
                        }
                        onClick={() => {
                            isEditMode ? updateJob() : addJob();
                        }}
                        loading={isLoading}
                    >
                        {isEditMode ? 'Save' : 'Add'}
                    </Button>
                </Stack>
            </Modal.Actions>
        </Modal>
    );
};
