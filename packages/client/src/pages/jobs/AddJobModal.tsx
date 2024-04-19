import { Close } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import {
    IconButton,
    Modal,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@semoss/ui';
import { useState } from 'react';
import { timezones } from './job.constants';

export interface JobBuilder {
    name: string;
    pixel: string;
    tags: string;
    cronExpression: string;
    cronTz: string;
}

export const AddJobModal = (props: { isOpen: boolean; close: () => void }) => {
    const { isOpen, close } = props;

    const [frequencyType, setFrequencyType] = useState<'custom' | 'standard'>(
        'standard',
    );
    const [builder, setBuilder] = useState({
        name: '',
        pixel: '',
        tags: '',
        cronExpression: '0 12 * * *',
        cronTz: 'Eastern Standard Time',
    });
    const setBuilderField = (field: string, value: string) => {
        setBuilder((previousBuilder) => ({ ...previousBuilder, field: value }));
    };

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
                <Stack spacing={2}>
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
                    <TextField
                        label="Tags"
                        size="small"
                        value={builder.tags}
                        onChange={(e) =>
                            setBuilderField('tags', e.target.value)
                        }
                        helperText="Comma-separated list of tags"
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
                </Stack>
            </Modal.Content>
        </Modal>
    );
};
