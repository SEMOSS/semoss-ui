import { useState } from 'react';
import {
    JobTypeCustomJob,
    JobTypeOptions,
    JobTypeSendEmail,
} from './job.constants';
import { JobBuilder, JobTypes } from './job.types';
import { Stack, TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { JobTypesSendEmailBuilder } from './JobTypesSendEmailBuilder';
import { JobTypesCustomJobBuilder } from './JobTypesCustomJobBuilder';

export const JobTypesBuilder = (props: {
    builder: JobBuilder;
    setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { builder, setBuilderField } = props;
    return (
        <Stack spacing={2} width="100%">
            <Autocomplete
                size="small"
                options={JobTypeOptions}
                value={builder.jobType}
                renderInput={(params) => {
                    return <TextField {...params} label="Job Type" />;
                }}
                fullWidth
                onChange={(_, value) => setBuilderField('jobType', value)}
            />
            {builder.jobType === JobTypeCustomJob && (
                <JobTypesCustomJobBuilder
                    builder={builder}
                    setBuilderField={setBuilderField}
                />
            )}
            {builder.jobType === JobTypeSendEmail && (
                <JobTypesSendEmailBuilder
                    builder={builder}
                    setBuilderField={setBuilderField}
                />
            )}
        </Stack>
    );
};
