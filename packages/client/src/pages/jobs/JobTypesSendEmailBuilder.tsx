import { JobBuilder } from './job.types';
import { Stack, TextField } from '@semoss/ui';
import { Autocomplete, createFilterOptions } from '@mui/material';

export const JobTypesSendEmailBuilder = (props: {
    builder: JobBuilder;
    setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { builder, setBuilderField } = props;
    const filter = createFilterOptions<string>();
    return (
        <Stack spacing={2} width="100%">
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
                renderOption={(props, option) => <li {...props}>{option}</li>}
                freeSolo
                renderInput={(params) => <TextField {...params} label="Tags" />}
            />
            <TextField
                label="SMTP Host"
                size="small"
                value={builder.smtpHost}
                onChange={(e) => setBuilderField('smtpHost', e.target.value)}
            />
            <TextField
                label="SMTP Port"
                size="small"
                value={builder.smtpPort}
                onChange={(e) => setBuilderField('smtpPort', e.target.value)}
            />
            <TextField
                label="Subject"
                size="small"
                value={builder.subject}
                onChange={(e) => setBuilderField('subject', e.target.value)}
            />
            <Autocomplete
                value={(builder.to as string[]) ?? []}
                fullWidth
                multiple
                size="small"
                onChange={(_, newValue) => {
                    setBuilderField('to', newValue);
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
                renderOption={(props, option) => <li {...props}>{option}</li>}
                freeSolo
                renderInput={(params) => <TextField {...params} label="To" />}
            />
            <Autocomplete
                value={(builder.cc as string[]) ?? []}
                fullWidth
                multiple
                size="small"
                onChange={(_, newValue) => {
                    setBuilderField('cc', newValue);
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
                renderOption={(props, option) => <li {...props}>{option}</li>}
                freeSolo
                renderInput={(params) => <TextField {...params} label="CC" />}
            />
            <Autocomplete
                value={(builder.bcc as string[]) ?? []}
                fullWidth
                multiple
                size="small"
                onChange={(_, newValue) => {
                    setBuilderField('bcc', newValue);
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
                renderOption={(props, option) => <li {...props}>{option}</li>}
                freeSolo
                renderInput={(params) => <TextField {...params} label="BCC" />}
            />
            <TextField
                label="From"
                size="small"
                value={builder.from}
                onChange={(e) => setBuilderField('from', e.target.value)}
            />
            <TextField
                label="Message"
                size="small"
                value={builder.message}
                onChange={(e) => setBuilderField('message', e.target.value)}
                multiline
                rows={3}
            />
            <TextField
                label="User Name"
                size="small"
                value={builder.username}
                onChange={(e) => setBuilderField('username', e.target.value)}
            />
            <TextField
                label="Password"
                size="small"
                type="password"
                value={builder.password}
                onChange={(e) => setBuilderField('password', e.target.value)}
            />
        </Stack>
    );
};
