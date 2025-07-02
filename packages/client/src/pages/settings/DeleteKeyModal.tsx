import { Button, Modal, Typography } from '@semoss/ui';

export const DeleteKeyModal = (props: {
    isOpen: { [key: string]: any };
    close: () => void;
    deleteJob: () => void;
}) => {
    const { isOpen, close, deleteJob } = props;
    return (
        <Modal onClose={close} open={Object.keys(isOpen).length > 0}>
            <Modal.Content>
                <Modal.Title>Delete Job</Modal.Title>
                <Modal.Content>
                    <Typography variant="body1">
                        {`Are you sure you want to delete the ${isOpen['keyName']} key.This action is permanent.`}
                    </Typography>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={close}
                        data-testid={'delete-job-cancel-btn'}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteJob()}
                        data-testid={'delete-job-delete-btn'}
                    >
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal.Content>
        </Modal>
    );
};
