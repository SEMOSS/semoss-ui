import {
    styled,
    Typography,
    Modal,
    IconButton,
    Button,
    TextField,
    Stack,
    Autocomplete,
} from '@semoss/ui';
import { usePixel, useRootStore } from '@/hooks';
import { Control, Controller } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import { createFilterOptions } from '@mui/material';
import { useEffect, useState } from 'react';
import { MarkdownEditor } from '../common';
import { removeUnderscores } from '@/utility';

const ModalHeaderWrapper = styled('div')({
    alignItems: 'center',
    display: 'flex',
    marginBottom: '1rem',
    justifyContent: 'space-between',
});

const ModalHeading = styled(Typography)({
    fontSize: 20,
    fontWeight: 500,
});

const ModalSectionHeading = styled(Typography)({
    fontSize: 16,
    fontWeight: 500,
    margin: '1rem 0 0.75rem 0',
});

const StyledModalFooter = styled(Modal.Actions)({
    padding: '0 20px 20px',
});

const StyledEditorContainer = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

interface EditDetailsModalProps {
    isOpen: boolean;
    onClose: (reset?: boolean) => void;
    control: Control<any, any>;
    onSubmit: any;
}

export const EditDetailsModal = (props: EditDetailsModalProps) => {
    const { isOpen, onClose, control, onSubmit } = props;
    const { configStore } = useRootStore();

    const filter = createFilterOptions<string>();

    const handleEditAppDetails = () => {
        onSubmit();
    };

    // filter metakeys to the ones we want
    const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
        (k) => {
            return (
                k.metakey !== 'description' &&
                k.metakey !== 'markdown' &&
                k.metakey !== 'tag' &&
                k.metakey !== 'tags'
            );
        },
    );

    // track the options
    const [filterOptions, setFilterOptions] = useState<
        Record<string, string[]>
    >(() => {
        return projectMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = [];

            return prev;
        }, {});
    });

    // get the values
    const projectMetaValues = usePixel<
        {
            METAKEY: string;
            METAVALUE: string;
            count: number;
        }[]
    >(`META | GetProjectMetaValues ( metaKeys = ['tag'] ) ;`);

    useEffect(() => {
        if (projectMetaValues.status !== 'SUCCESS') {
            return;
        }

        // format the engine meta into a map
        const updated = projectMetaValues.data.reduce((prev, current) => {
            if (!prev[current.METAKEY]) {
                prev[current.METAKEY] = [];
            }

            prev[current.METAKEY].push(current.METAVALUE);

            return prev;
        }, {});

        // add metakeys that don't get options from projects/engines but stored in config call
        const metaKeysWithOpts = projectMetaKeys.filter((k) => {
            return k.display_options === 'select-box';
        });

        metaKeysWithOpts.forEach((filter) => {
            if (filter.display_values) {
                const split = filter.display_values.split(',');
                const formatted = [];
                split.forEach((val) => {
                    formatted.push(val);
                });

                updated[filter.metakey] = formatted;
            }
        });

        setFilterOptions(updated);
    }, [projectMetaValues.status, projectMetaValues.data]);

    return (
        <Modal open={isOpen} fullWidth>
            <Modal.Content>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">Edit App Details</ModalHeading>
                    <IconButton onClick={() => onClose(true)}>
                        <CloseIcon />
                    </IconButton>
                </ModalHeaderWrapper>
                <Stack spacing={4}>
                    <Controller
                        name="detailsForm.markdown"
                        control={control}
                        render={({ field }) => {
                            return (
                                <TextField
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                    fullWidth
                                    multiline
                                    rows={7}
                                    label="Main Uses"
                                />
                            );
                        }}
                    />

                    <Controller
                        name="detailsForm.tag"
                        control={control}
                        render={({ field }) => {
                            return (
                                <Autocomplete
                                    key={'tag'}
                                    options={[]}
                                    value={field.value}
                                    fullWidth
                                    multiple
                                    freeSolo
                                    onChange={(_, val) => field.onChange(val)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Tags" />
                                    )}
                                    filterOptions={(options, params) => {
                                        const filtered = filter(
                                            options,
                                            params,
                                        );

                                        const { inputValue } = params;
                                        const isExisting = options.some(
                                            (option) => inputValue === option,
                                        );
                                        if (inputValue !== '' && !isExisting) {
                                            filtered.push(inputValue);
                                        }

                                        return filtered;
                                    }}
                                />
                            );
                        }}
                    />

                    {projectMetaKeys.map((key) => {
                        const { metakey, display_options } = key;
                        const label =
                            metakey.slice(0, 1).toUpperCase() +
                            metakey.slice(1);

                        if (display_options === 'markdown') {
                            return (
                                <StyledEditorContainer key={metakey}>
                                    <ModalSectionHeading variant="h3">
                                        {removeUnderscores(metakey)}
                                    </ModalSectionHeading>
                                    <Controller
                                        name={`detailsForm.${metakey}`}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <MarkdownEditor
                                                    value={
                                                        (field.value as string) ||
                                                        ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                />
                                            );
                                        }}
                                    />
                                </StyledEditorContainer>
                            );
                        } else if (display_options === 'textarea') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={`detailsForm.${metakey}`}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                multiline
                                                minRows={3}
                                                maxRows={3}
                                                label={label}
                                                value={
                                                    (field.value as string) ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        );
                                    }}
                                />
                            );
                        } else if (display_options === 'single-typeahead') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={`detailsForm.${metakey}`}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Autocomplete<string, false>
                                                label={label}
                                                options={
                                                    filterOptions[metakey]
                                                        ? filterOptions[metakey]
                                                        : []
                                                }
                                                value={
                                                    (field.value as string) ||
                                                    ''
                                                }
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            );
                        } else if (display_options === 'multi-typeahead') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={`detailsForm.${metakey}`}
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Autocomplete<
                                                string,
                                                true,
                                                false,
                                                true
                                            >
                                                freeSolo={true}
                                                multiple={true}
                                                label={label}
                                                options={
                                                    filterOptions[metakey]
                                                        ? filterOptions[metakey]
                                                        : []
                                                }
                                                value={
                                                    (field.value as string[]) ||
                                                    []
                                                }
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            );
                        } else if (display_options === 'select-box') {
                            return (
                                <Controller
                                    key={metakey}
                                    name={`detailsForm.${metakey}`}
                                    control={control}
                                    render={({ field }) => {
                                        const formattedValue =
                                            typeof field.value === 'string'
                                                ? [field.value]
                                                : field.value;

                                        return (
                                            <Autocomplete<
                                                string,
                                                true,
                                                false,
                                                true
                                            >
                                                multiple={true}
                                                label={label}
                                                options={
                                                    filterOptions[metakey]
                                                        ? filterOptions[metakey]
                                                        : []
                                                }
                                                value={
                                                    (formattedValue as string[]) ||
                                                    []
                                                }
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        );
                                    }}
                                />
                            );
                        }
                    })}
                </Stack>
            </Modal.Content>

            <StyledModalFooter>
                <Button onClick={() => onClose(true)} variant="text">
                    Cancel
                </Button>
                <Button onClick={handleEditAppDetails} variant="contained">
                    Save
                </Button>
            </StyledModalFooter>
        </Modal>
    );
};
