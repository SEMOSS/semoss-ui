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
import { Close } from '@mui/icons-material';
import { removeUnderscores } from '@/utility';

const StyledModalHeading = styled(Modal.Title)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

const StyledTitle = styled(Typography)({
    fontWeight: 500,
});

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledSubtitle = styled(Typography)(({ theme }) => ({
    fontWeight: 500,
    paddingBottom: theme.spacing(1),
}));

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
            <StyledModalHeading>
                <StyledTitle variant="h6">Edit App Details</StyledTitle>

                <IconButton size="small" onClick={() => onClose(true)}>
                    <Close />
                </IconButton>
            </StyledModalHeading>

            <StyledModalContent>
                <div>
                    <StyledSubtitle variant="subtitle1">
                        Main Uses
                    </StyledSubtitle>
                    <Controller
                        name="detailsForm.mainUses"
                        control={control}
                        render={({ field }) => {
                            return (
                                <TextField
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                    fullWidth
                                    multiline
                                    rows={7}
                                />
                            );
                        }}
                    />
                </div>

                <div>
                    <StyledSubtitle variant="subtitle1">Tags</StyledSubtitle>
                    <Controller
                        name="detailsForm.tags"
                        control={control}
                        render={({ field }) => {
                            return (
                                <Autocomplete
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
                </div>

                {projectMetaKeys.map((key) => {
                    const { metakey, display_options } = key;
                    const label =
                        metakey.slice(0, 1).toUpperCase() + metakey.slice(1);

                    if (display_options === 'markdown') {
                        return (
                            <StyledEditorContainer key={metakey}>
                                <StyledSubtitle variant="subtitle1">
                                    {removeUnderscores(metakey)}
                                </StyledSubtitle>
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
                                                (field.value as string) || ''
                                            }
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
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
                                                (field.value as string) || ''
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
                                        <Autocomplete<string, true, false, true>
                                            freeSolo={true}
                                            multiple={true}
                                            label={label}
                                            options={
                                                filterOptions[metakey]
                                                    ? filterOptions[metakey]
                                                    : []
                                            }
                                            value={
                                                (field.value as string[]) || []
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
                                        <Autocomplete<string, true, false, true>
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
            </StyledModalContent>

            <Modal.Actions>
                <Button onClick={() => onClose(true)} variant="text">
                    Cancel
                </Button>
                <Button onClick={handleEditAppDetails} variant="contained">
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
