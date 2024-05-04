import {
    styled,
    Typography,
    Modal,
    IconButton,
    Button,
    TextField,
    useNotification,
} from '@semoss/ui';
import { useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import { fetchMainUses } from './appDetails.utility';

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
    const notification = useNotification();
    const [mainUses, setMainUses] = useState('');

    const runSetMainUses = async () => {
        const appId = getValues('appId');
        const res = await fetchMainUses(appId);

        if (res.type === 'error') {
            notification.add({
                color: 'error',
                message: res.output,
            });
        } else {
            notification.add({
                color: 'success',
                message: res.output,
            });
        }
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
                <TextField
                    fullWidth
                    value={mainUses}
                    onChange={(e) => setMainUses(e.target.value)}
                />

                <ModalSectionHeading variant="h3">Tags</ModalSectionHeading>

                <ModalFooter>
                    <Button onClick={() => onClose()} variant="text">
                        Cancel
                    </Button>
                    <Button onClick={null} variant="contained">
                        Save
                    </Button>
                </ModalFooter>
            </EditModalInnerContainer>
        </Modal>
    );
};
