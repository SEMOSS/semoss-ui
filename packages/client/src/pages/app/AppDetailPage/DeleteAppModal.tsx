import { useRootStore } from '@/hooks';
import { Modal, Button, styled, useNotification } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';

const StyledModalContent = styled('div')(({ theme }) => ({}));

interface DeleteAppModalProps {
    isOpen: boolean;
    appId: string;
    appName: string;
    onDelete: () => void;
    close: () => void;
}

export const DeleteAppModal = (props: DeleteAppModalProps) => {
    const { isOpen, appId, appName, close } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const navigate = useNavigate();

    const handleDelete = async () => {
        const res = await monolithStore.runQuery(
            `DeleteProject(project=['${appId}']);`,
        );

        const operationType = res.pixelReturn[0].operationType;
        const output = res.pixelReturn[0].output;

        if (operationType.indexOf('ERROR') === -1) {
            notification.add({
                color: 'success',
                message: `Successfully deleted ${appName}`,
            });
            navigate('/');
        } else {
            notification.add({
                color: 'error',
                message: output,
            });
        }
        close();
    };

    return (
        <Modal open={isOpen} onClose={close}>
            <StyledModalContent>
                <Modal.Title>Are you Sure?</Modal.Title>

                <Modal.Content>
                    This action is irreversable. This will permanentely delete
                    this app.
                </Modal.Content>

                <Modal.Actions>
                    <Button onClick={close} variant="text" color="success">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                    >
                        Delete
                    </Button>
                </Modal.Actions>
            </StyledModalContent>
        </Modal>
    );
};
