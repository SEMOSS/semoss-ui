import { useEffect, useMemo, useState } from 'react';
import { Close } from '@mui/icons-material';

import {
    AutocompleteTwo,
    Button,
    IconButton,
    Modal,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    useNotification,
} from '@semoss/ui';

import { runPixelTwo } from '../../runPixelTwo';
import { JobBuilder } from './job.types';
import { getEncodeByJobType } from './job.utils';
import { JobTypesBuilder } from './JobTypesBuilder';
import { JobTypeCustomJob, JobTypeSendEmail, timezones } from './job.constants';
import { JobStandardFrequencyBuilder } from './JobStandardFrequencyBuilder';
import { JobCustomFrequencyBuilder } from './JobCustomFrequencyBuilder';

const emptyBuilder: JobBuilder = {
    id: null,
    name: '',
    pixel: '',
    tags: [],
    cronExpression: '0 0 12 ? * ?',
    cronTz: 'US/Eastern',
    smtpHost: '',
    smtpPort: '',
    subject: '',
    jobType: 'Custom Job',
    to: [],
    cc: [],
    bcc: [],
    from: '',
    message: '',
    username: '',
    password: '',
};

export const JobBuilderModal = (props: {
    isOpen: boolean;
    close: () => void;
    getJobs: () => void;
    initialBuilder?: JobBuilder;
}) => {
    const { isOpen, close, getJobs, initialBuilder } = props;
    const notification = useNotification();

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

    // Helper to split and pad cron expression to 7 fields
    const getCronFields = (cronExpr: string) => {
        const fields = cronExpr.split(' ');
        while (fields.length < 7) fields.push('*');
        return fields.slice(0, 7);
    };

    const isEditMode = useMemo(() => {
        return !!builder.id;
    }, [builder.id]);

    // Set builder on open/edit, use initialBuilder.cronExpression as-is
    useEffect(() => {
        if (initialBuilder) {
            setBuilder(initialBuilder);
            // Optionally set frequencyType based on cronExpression if needed
        } else {
            setBuilder(emptyBuilder);
        }
    }, [initialBuilder ? initialBuilder.id : null]);

    const CRON_PATTERNS: RegExp[] = [
        /^(\*|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:\-[0-9]|\-(?:[1-5][0-9]))?|(?:\,(?:[0-9]|(?:[1-5][0-9])))*))$/, // Seconds: 0-59
        /^(\*|(?:\*|(?:[0-9]|(?:[1-5][0-9])))\/(?:[0-9]|(?:[1-5][0-9]))|(?:[0-9]|(?:[1-5][0-9]))(?:(?:\-[0-9]|\-(?:[1-5][0-9]))?|(?:\,(?:[0-9]|(?:[1-5][0-9])))*))$/, // Minutes: 0-59
        /^(\*|(?:\*|(?:\*|(?:[0-9]|1[0-9]|2[0-3])))\/(?:[0-9]|1[0-9]|2[0-3])|(?:[0-9]|1[0-9]|2[0-3])(?:(?:\-(?:[0-9]|1[0-9]|2[0-3]))?|(?:\,(?:[0-9]|1[0-9]|2[0-3]))*))$/, // Hours: 0-23
        /^(\*|\?|L(?:W|\-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:W|\/(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:[1-9]|(?:[12][0-9])|3[01])(?:(?:\-(?:[1-9]|(?:[12][0-9])|3[01]))?|(?:\,(?:[1-9]|(?:[12][0-9])|3[01]))*))$/, // Day of Month: 1-31, ?
        /^(\*|(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:\-(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?|(?:\,(?:[1-9]|1[012]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))*))$/, // Month: 1-12
        /^(\*|\?|[0-6](?:L|\#[1-5])?|(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT)(?:(?:\-(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))?|(?:\,(?:[0-6]|SUN|MON|TUE|WED|THU|FRI|SAT))*))$/, // Day of Week: 0-6, ?
        /^(\*|(?:[1-9][0-9]{3})(?:(?:\-[1-9][0-9]{3})?|(?:\,[1-9][0-9]{3})*))$/, // Year: 1000-9999
    ];

    // Validation: 7-field cron, allow '?' for day of month (index 3)
    const isCronExpressionValid: boolean = useMemo(() => {
        const cronValues = getCronFields(builder.cronExpression);

        if (cronValues.length !== 7) return false;

        for (let i = 0; i < 7; i++) {
            if (!CRON_PATTERNS[i].test(cronValues[i])) {
                return false;
            }
        }

        return true;
    }, [builder.cronExpression]);

    const isBaseFormValid: boolean = useMemo(() => {
        switch (builder.jobType) {
            case JobTypeSendEmail:
                return (
                    !!builder.name &&
                    !!builder.smtpHost &&
                    !!builder.smtpPort &&
                    !!builder.subject &&
                    !!builder.jobType &&
                    !!builder.to &&
                    !!builder.from &&
                    !!builder.message &&
                    !!builder.username &&
                    !!builder.password &&
                    !!builder.cronTz
                );
            case JobTypeCustomJob:
                return !!builder.name && !!builder.pixel && !!builder.cronTz;
        }
    }, [
        builder.name,
        builder.pixel,
        builder.cronTz,
        builder.smtpHost,
        builder.smtpPort,
        builder.subject,
        builder.jobType,
        builder.to,
        builder.from,
        builder.message,
        builder.username,
        builder.password,
    ]);

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
            builder.cronExpression !== initialBuilder.cronExpression ||
            builder.smtpHost !== initialBuilder.smtpHost ||
            builder.smtpPort !== initialBuilder.smtpPort ||
            builder.subject !== initialBuilder.subject ||
            builder.jobType !== initialBuilder.jobType ||
            JSON.stringify(builder.to) !== JSON.stringify(initialBuilder.to) ||
            JSON.stringify(builder.cc) !== JSON.stringify(initialBuilder.cc) ||
            JSON.stringify(builder.bcc) !==
            JSON.stringify(initialBuilder.bcc) ||
            builder.from !== initialBuilder.from ||
            builder.message !== initialBuilder.message ||
            builder.username !== initialBuilder.username ||
            builder.password !== initialBuilder.password
        );
    }, [
        builder.name,
        builder.pixel,
        builder.tags,
        builder.cronTz,
        builder.cronExpression,
        builder.smtpHost,
        builder.smtpPort,
        builder.subject,
        builder.jobType,
        builder.to,
        builder.from,
        builder.message,
        builder.username,
        builder.password,
    ]);

    // Don't close modal before error notification
    const addJob = async () => {
        setIsLoading(true);
        try {
            const encode = getEncodeByJobType(builder);
            const response = await runPixelTwo(
                `META|ScheduleJob(jobName=["${builder.name}"],${builder.tags.length
                    ? ` jobTags=${JSON.stringify(builder.tags)},`
                    : ''
                } jobGroup=["defaultGroup"], cronExpression=["${builder.cronExpression}"], cronTz=["${builder.cronTz}"], recipe=["<encode>${encode}</encode>"], uiState='{"jobType":"${builder.jobType}","jobName":"${builder.name}", "cronExpression":"${builder.cronExpression}","cronTimeZone":"${builder.cronTz}","recipe":"${builder.pixel}","recipeParameters":""}',triggerOnLoad=[false],triggerNow=[false]);`,
            );
            if (response.errors.length) {
                await notification.add({
                    color: 'error',
                    message: response.errors[0], // fixed typo: should be response.errors[0]
                });
                setIsLoading(false);
                return; // Don't close modal
            }
        } catch (e) {
            await notification.add({
                color: 'error',
                message: 'Unable to add job',
            });
            setIsLoading(false);
            return; // Don't close modal
        }
        getJobs();
        closeModal();
        setIsLoading(false);
    };

    // Similar fix for updateJob
    const updateJob = async () => {
        setIsLoading(true);
        try {
            const encode = getEncodeByJobType(builder);
            const response = await runPixelTwo(
                `META|EditScheduledJob(jobId="${builder.id}",jobName="${builder.name}",${builder.tags.length
                    ? `jobTags=${JSON.stringify(builder.tags)},`
                    : ''
                }jobGroup=["defaultGroup"],cronExpression="${builder.cronExpression}",cronTz="${builder.cronTz}",recipe="<encode>${encode}</encode>",uiState='{"jobType":"${builder.jobType}", "jobName":"${builder.name}", "cronExpression":"${builder.cronExpression}", "cronTimeZone":"${builder.cronTz}"}',triggerOnLoad=[false],triggerNow=[false]);`,
            );
            if (response.errors.length) {
                await notification.add({
                    color: 'error',
                    message: response.errors[0],
                });
                setIsLoading(false);
                return;
            }
        } catch (e) {
            await notification.add({
                color: 'error',
                message: 'Unable to update job',
            });
            setIsLoading(false);
            return;
        }
        getJobs();
        closeModal();
        setIsLoading(false);
    };

    const closeModal = () => {
        setBuilder(emptyBuilder);
        close();
    };

    return (
        <Modal open={isOpen} maxWidth="md" fullWidth>
            <Modal.Title>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <span>{isEditMode ? 'Edit' : 'Add'} Job</span>
                    <IconButton aria-label="close" onClick={closeModal} data-testid={'job-builder-close-btn'}>
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
                        onChange={(e) => setBuilderField('name', e.target.value)}
                    />
                    <JobTypesBuilder builder={builder} setBuilderField={setBuilderField} />
                    <ToggleButtonGroup value={frequencyType} size="small">
                        <ToggleButton value="standard" onClick={() => setFrequencyType('standard')} data-testid={'job-builder-standard-btn'}>Standard</ToggleButton>
                        <ToggleButton value="custom" onClick={() => setFrequencyType('custom')} data-testid={'job-builder-custom-btn'}>Custom</ToggleButton>
                    </ToggleButtonGroup>
                    <AutocompleteTwo
                        value={builder.cronTz}
                        options={timezones}
                        onChange={(_, value) => setBuilderField('cronTz', value)}
                        size="small"
                        getOptionLabel={(option: string) => option.replaceAll('_', ' ')}
                        renderInput={(params) => <TextField {...params} variant="outlined" label="Timezone" />}
                    />
                    {frequencyType === 'standard' ? (
                        <JobStandardFrequencyBuilder builder={builder} setBuilderField={setBuilderField} />
                    ) : (
                        <JobCustomFrequencyBuilder builder={builder} setBuilderField={setBuilderField} />
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Stack direction="row" spacing={1} paddingX={2} paddingBottom={2}>
                    <Button type="button" disabled={isLoading} onClick={closeModal} data-testid={'job-builder-cancel-btn'}>Cancel</Button>
                    <Button
                        type="submit"
                        variant={'contained'}
                        disabled={isLoading || !isBaseFormValid || !isCronExpressionValid || !hasChanges}
                        onClick={() => { isEditMode ? updateJob() : addJob(); }}
                        loading={isLoading}
                        data-testid={'job-builder-add-save-btn'}
                    >
                        {isEditMode ? 'Save' : 'Add'}
                    </Button>
                </Stack>
            </Modal.Actions>
        </Modal>
    );
};
