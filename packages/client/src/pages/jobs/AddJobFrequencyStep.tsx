import { Stack, TextField } from '@semoss/ui';
import { JobBuilder } from './AddJobModal';

export const AddJobFrequencyStep = (props: {
    builder: JobBuilder;
    setBuilderField: (field: string, value: string) => void;
}) => {
    const { builder, setBuilderField } = props;
    return (
        <Stack spacing={2}>
            <TextField
                label="Name"
                value={builder.name}
                onChange={(e) => setBuilderField('name', e.target.value)}
            />
            <TextField
                label="Pixel"
                value={builder.pixel}
                onChange={(e) => setBuilderField('pixel', e.target.value)}
                multiline
                rows={3}
            />
            <TextField
                label="Tags"
                value={builder.tags}
                onChange={(e) => setBuilderField('tags', e.target.value)}
                helperText="Comma-separated list of tags"
            />
        </Stack>
    );
};
