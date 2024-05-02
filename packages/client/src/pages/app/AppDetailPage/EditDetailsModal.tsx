import { styled, Typography, Modal, IconButton, Button } from '@semoss/ui';
import CloseIcon from '@mui/icons-material/Close';

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
    runSetMainUses: () => Promise<void>;
}

export const EditDetailsModal = (props: EditDetailsModalProps) => {
    const { isOpen, onClose, runSetMainUses } = props;

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
                <Button onClick={() => runSetMainUses()}>
                    <pre>set test main uses</pre>
                </Button>

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
