import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Modal,
    TextField,
    useNotification,
    Stack,
    Alert,
} from '@semoss/ui';

import { useBlocks } from '@/hooks';
import { ContentCopyOutlined, ErrorOutlined } from '@mui/icons-material';
import { ActionMessages, SerializedState } from '@/stores';
import { autorun } from 'mobx';

/**
 * Dev Mode for the BlocksWorkspace
 */
export const BlocksWorkspaceDev = observer(() => {
    const notification = useNotification();
    const { state } = useBlocks();

    // const json = state.toJSON();

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [alert, setAlert] = useState<string>('');
    const [stateStr, setStateStr] = useState<string>();

    /**
     * Validate and save the state
     */
    const validateState = (str: string): boolean => {
        try {
            // try to parse any errors
            JSON.parse(str);

            // clear the alert
            setAlert('');

            return true;
        } catch (e) {
            // set the alert
            setAlert(e.message);

            return false;
        }
    };

    /**
     * Try to save the state
     */
    const updateState = (str: string) => {
        try {
            if (!validateState(str)) {
                throw new Error('a');
            }

            // try to parse any errors
            const s = JSON.parse(str) as SerializedState;

            // dispatch a message
            state.dispatch({
                message: ActionMessages.SET_STATE,
                payload: {
                    state: s,
                },
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });

            // set the alert
            setAlert(e.message);
        }
    };

    /**
     * Copy the content to the clipboard
     * @param content - content that will be copied
     */
    const copy = (content: string) => {
        try {
            navigator.clipboard.writeText(content);

            notification.add({
                color: 'success',
                message: 'Succesfully copied to clipboard',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    /**
     * Trigger a method on document keydown
     */
    const onDocumentKeydown = useCallback((event: KeyboardEvent) => {
        // dev mode is ctrl + d
        if (event.key === 'd' && event.ctrlKey) {
            setIsOpen(true);
        }
    }, []);

    useEffect(
        () =>
            autorun(() => {
                // get the json
                const json = state.toJSON();

                // stringify it
                const str = JSON.stringify(json, null, 4);

                // update the state string
                setStateStr(str);
            }),
        [],
    );

    useEffect(() => {
        // attach the event listener
        document.addEventListener('keydown', onDocumentKeydown);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', onDocumentKeydown);
        };
    }, [onDocumentKeydown]);

    // don't open it if not necessary
    if (!isOpen) {
        return null;
    }

    return (
        <Modal
            fullWidth={true}
            maxWidth={'sm'}
            open={isOpen}
            onClose={() => {
                setIsOpen(false);
            }}
        >
            <Modal.Title>Dev</Modal.Title>
            <Modal.Content>
                <Stack direction="column" spacing={2} py={1}>
                    <TextField
                        label={'State'}
                        multiline={true}
                        minRows={5}
                        maxRows={15}
                        value={stateStr}
                        onChange={(e) => {
                            const str = e.target.value;

                            // validate
                            validateState(str);

                            // update
                            setStateStr(str);
                        }}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent={'space-between'}
                    >
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                copy(stateStr);
                            }}
                            startIcon={
                                <ContentCopyOutlined fontSize="inherit" />
                            }
                        >
                            Copy
                        </Button>

                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                updateState(stateStr);
                            }}
                            startIcon={
                                <ContentCopyOutlined fontSize="inherit" />
                            }
                        >
                            Update
                        </Button>
                    </Stack>
                    {alert && (
                        <Alert severity="error" icon={<ErrorOutlined />}>
                            <Alert.Title>{alert}</Alert.Title>
                        </Alert>
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => setIsOpen(false)}>Cancel</Button>
            </Modal.Actions>
        </Modal>
    );
});
