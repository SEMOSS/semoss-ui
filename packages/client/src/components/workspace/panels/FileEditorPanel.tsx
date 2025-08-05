import { observer } from 'mobx-react-lite';
import { Actions, TabNode } from 'flexlayout-react';
import { IconButton, Stack, useNotification, Modal, Button, TextField, Box } from '@semoss/ui';

import { useWorkspace } from '@/hooks';
import { FileEditor, FileEditorRefDef } from '@/components/common';
import { Panel } from './Panel';
import { useRef, useState } from 'react';
import { ContentCopyOutlined, SaveOutlined } from '@mui/icons-material';
import type { FileSavedEventDetail } from '@/types/types';

interface FileEditorPanelProps {
    /** Path to the file location */
    path: string;
}

export const FileEditorPanel = observer((props: FileEditorPanelProps) => {
    const { path } = props;
    const { workspace } = useWorkspace();
    const notification = useNotification();

    const [isModified, setIsModified] = useState(false);

    const fileEditorRef = useRef<FileEditorRefDef>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [commitMsg, setCommitMsg] = useState('');

    // get the name
    const name = path.split('/').pop();

    /**
     * Triggered when a file is changed
     * @param isModified - isModified
     */
    const onFileEditorChange = (isModified: boolean) => {
        try {
            // update
            setIsModified(isModified);

            // update the tabs
            updatePanels(isModified);
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });
        }
    };

    /**
     * Triggered when a file is changed
     * @param isModified - isModified
     */
    const updatePanels = (isModified: boolean) => {
        try {
            // get the model
            const model = workspace.model;
            if (!model) {
                throw new Error('Missing model');
            }

            // visit the notes, and see if it exists
            model.visitNodes((node) => {
                // check if it is a tabNode
                if (node instanceof TabNode) {
                    // it needs to be a file-editor
                    const component = node.getComponent();
                    if (component !== 'file-editor') {
                        return;
                    }

                    // path and space need to match
                    const config = node.getConfig();
                    if (path !== config.path) {
                        return;
                    }

                    const id = node.getId();
                    if (isModified) {
                        model.doAction(Actions.renameTab(id, `${name}*`));
                    } else {
                        model.doAction(Actions.renameTab(id, `${name}`));
                    }
                }
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });
        }
    };

    /**
     * Copy the path to the clipboard
     */
    const copyPath = async () => {
        try {
            await navigator.clipboard.writeText(path);

            notification.add({
                color: 'success',
                message: 'Successfully copied path',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy path',
            });
        }
    };
	// Save handler for modal
	const handleModalSave = async () => {
		try {
			await fileEditorRef.current?.saveFile(commitMsg);
			setModalOpen(false);
			setCommitMsg('');
			notification.add({
				color: 'success',
				message: `Save successful! File is saved with the following commit message: ${commitMsg}`,
			});
		} catch (e) {
			notification.add({
				color: 'error',
				message: e.message || 'Error saving file',
			});
		}
	};

	
	//  Handle file saved callback - trigger versions table refresh
	 
	const handleFileSaved = () => {
		// Dispatch a custom event to notify other components that a file was saved
		const event: CustomEvent<FileSavedEventDetail> = new CustomEvent('fileSaved', {
			detail: {
				appId: workspace.appId,
				path: path,
				type: 'file'
			}
		});
		window.dispatchEvent(event);
	};    return (
        <Panel
            actions={
                <>
                    <IconButton
                        size={'small'}
                        color={'default'}
                        title={`Copy path - ${path}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyPath();
                        }}
                    >
                        <ContentCopyOutlined fontSize="inherit" />
                    </IconButton>
                    <Stack flex={1}>&nbsp;</Stack>
                    <IconButton
                        size={'small'}
                        color={'default'}
                        title={'Save'}
                        disabled={!isModified}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setModalOpen(true);
                        }}
                    >
                        <SaveOutlined fontSize="inherit" />
                    </IconButton>
                    
                    <Modal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        aria-labelledby="commit-modal-title"
                        aria-describedby="commit-modal-description"
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                bgcolor: 'background.paper',
                                boxShadow: 24,
                                p: 5,
                                width: '90vw',
                                maxWidth: 600,
                                minWidth: 300,
                                height: 'auto',
                                maxHeight: '80vh',
                                borderRadius: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                                alignItems: 'center',
                                overflow: 'auto',
                            }}
                        >
                            <h2 id="commit-modal-title" style={{ margin: 0, fontWeight: 700, fontSize: '2rem', textAlign: 'center' }}>
                                Enter Commit Message
                            </h2>
                            <TextField
                                autoFocus
                                fullWidth
                                multiline
                                minRows={1}
                                maxRows={5}
                                label="Commit Message"
                                value={commitMsg}
                                onChange={e => setCommitMsg(e.target.value)}
                                sx={{ mt: 2, fontSize: '1.1rem' }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={!commitMsg.trim()}
                                onClick={handleModalSave}
                                sx={{ mt: 2, width: '20%', fontSize: '1.1rem', alignSelf: 'center' }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Modal>
                </>
            }
        >
            <FileEditor
                ref={fileEditorRef}
                type={'app'}
                space={workspace.appId}
                insightId={workspace.insightId}
                path={path}
                agentModelEngine={workspace.agentModelEngine}
                onFileSaved={handleFileSaved}
                onChange={(content, isModified) => {
                    onFileEditorChange(isModified);
                }}
            />
        </Panel>
    );
});
