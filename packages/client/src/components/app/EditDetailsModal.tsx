import {
    styled,
    Typography,
    Modal,
    IconButton,
    Button,
    TextField,
    useNotification,
} from '@semoss/ui';
import { useRootStore } from '@/hooks';
import { Control, Controller } from 'react-hook-form';
import { updateProjectDetails } from './app-details.utility';
import { createFilterOptions, Autocomplete } from '@mui/material';
import { Close } from '@mui/icons-material';

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

interface EditDetailsModalProps {
    isOpen: boolean;
    onClose: (reset?: boolean) => void;
    control: Control<any, any>;
    getValues: any;
    setValue: any;
}

export const EditDetailsModal = (props: EditDetailsModalProps) => {
    const { isOpen, onClose, control, getValues, setValue } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const filter = createFilterOptions<string>();

    const handleEditAppDetails = async () => {
        const appId = getValues('appId');
        const detailsForm = getValues('detailsForm');

        const res = await updateProjectDetails(
            monolithStore,
            appId,
            detailsForm.mainUses,
            detailsForm.tags,
        );

        if (res.type === 'error') {
            notification.add({
                color: 'error',
                message: res.output,
            });
        } else {
            notification.add({
                color: 'success',
                message: 'Successfully saved App Details.',
            });

            setValue('mainUses', detailsForm.mainUses);
            setValue('tags', detailsForm.tags);
            onClose();
        }
    };

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
                                    renderOption={(props, option) => (
                                        <li {...props}>{option}</li>
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
