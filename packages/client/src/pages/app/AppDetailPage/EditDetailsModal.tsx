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
import CloseIcon from '@mui/icons-material/Close';
import { updateProjectDetails } from './appDetails.utility';
import { createFilterOptions, Autocomplete } from '@mui/material';

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
            <Modal.Content>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">Edit App Details</ModalHeading>
                    <IconButton onClick={() => onClose(true)}>
                        <CloseIcon />
                    </IconButton>
                </ModalHeaderWrapper>

                <ModalSectionHeading variant="h3">
                    Main Uses
                </ModalSectionHeading>
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

                <ModalSectionHeading variant="h3">Tags</ModalSectionHeading>
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
                            />
                        );
                    }}
                />
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
