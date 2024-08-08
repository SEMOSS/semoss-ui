import { useState } from 'react';
import { useBlocks } from '@/hooks';
import {
    Stack,
    Typography,
    Button,
    TextField,
    Modal,
    useNotification,
} from '@semoss/ui';
import { ActionMessages, VariableType } from '@/stores';

export interface AddVariableModalProps {
    /**
     * Open modal
     */
    open: boolean;

    /**
     * What type of variable
     */
    type: VariableType;

    /**
     * reference pointer
     */
    to: string;

    /**
     * If its a cell we need extra meta
     */
    cellId?: string;

    /**
     * Closes Modal
     */
    onClose: () => void;
}

export const AddVariableModal = (props: AddVariableModalProps) => {
    const { open, type, to, cellId, onClose } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const [newAlias, setNewAlias] = useState('');

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>Add Variable</Modal.Title>
            <Modal.Content>
                <Stack
                    direction="row"
                    spacing={1}
                    pt={1}
                    className="add-variable-modal__content"
                >
                    <TextField
                        fullWidth
                        label={'Alias'}
                        error={
                            Boolean(state.variables[newAlias]) ||
                            newAlias.includes('.')
                        }
                        onChange={(e) => setNewAlias(e.target.value)}
                        helperText={
                            state.variables[newAlias] ||
                            newAlias.includes('.') ? (
                                <Typography variant={'caption'} color={'error'}>
                                    {newAlias.includes('.')
                                        ? "Periods aren't acceptable characters"
                                        : 'Please provide a unique alias'}
                                </Typography>
                            ) : (
                                ''
                            )
                        }
                    />
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button
                    variant={'contained'}
                    disabled={
                        !newAlias ||
                        Boolean(state.variables[newAlias]) ||
                        newAlias.includes('.')
                    }
                    onClick={() => {
                        const success = state.dispatch({
                            message: ActionMessages.ADD_VARIABLE,
                            payload: {
                                id: newAlias,
                                to: to,
                                cellId: cellId,
                                type: type,
                            },
                        });

                        notification.add({
                            color: success ? 'success' : 'error',
                            message: success
                                ? `Successfully added ${newAlias}`
                                : `Unable to add ${newAlias}, due to syntax or a duplicated alias`,
                        });

                        if (success) {
                            onClose();
                        }
                    }}
                >
                    Add
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
