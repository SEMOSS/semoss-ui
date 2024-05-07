import {
    styled,
    Typography,
    Modal,
    IconButton,
    Button,
    TextField,
    useNotification,
    // Autocomplete,
} from '@semoss/ui';
import { useRootStore } from '@/hooks';
import { Control, Controller } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import { fetchMainUses } from './appDetails.utility';
import { createFilterOptions, Autocomplete } from '@mui/material';

const EditModalInnerContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
});

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

const ModalFooter = styled('div')({
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
});

const ModalSectionHeading = styled(Typography)({
    fontSize: 16,
    fontWeight: 500,
    margin: '1rem 0 0.5rem 0',
});

interface EditDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    control: Control<any, any>;
    getValues: any;
}

export const EditDetailsModal = (props: EditDetailsModalProps) => {
    const { isOpen, onClose, control, getValues } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const filter = createFilterOptions<string>();

    const handleEditAppDetails = async () => {
        const mainUses = getValues('mainUses');
        const tags = getValues('tags');

        // const appId = getValues('appId');
        // const res = await fetchMainUses(monolithStore, appId);

        // if (res.type === 'error') {
        //     notification.add({
        //         color: 'error',
        //         message: res.output,
        //     });
        // } else {
        //     notification.add({
        //         color: 'success',
        //         message: res.output,
        //     });
        // }
    };

    return (
        <Modal open={isOpen} fullWidth>
            <EditModalInnerContainer>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">Edit App Details</ModalHeading>
                    <IconButton onClick={() => onClose()}>
                        <CloseIcon />
                    </IconButton>
                </ModalHeaderWrapper>

                <ModalSectionHeading variant="h3">
                    Main Uses
                </ModalSectionHeading>
                <Controller
                    name="mainUses"
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
                    name="tags"
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

                <ModalFooter>
                    <Button onClick={() => onClose()} variant="text">
                        Cancel
                    </Button>
                    <Button onClick={handleEditAppDetails} variant="contained">
                        Save
                    </Button>
                </ModalFooter>
            </EditModalInnerContainer>
        </Modal>
    );
};
