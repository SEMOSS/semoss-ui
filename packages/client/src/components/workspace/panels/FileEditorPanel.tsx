import { observer } from 'mobx-react-lite';
import { Actions, TabNode } from 'flexlayout-react';
import { IconButton, Stack, useNotification } from '@semoss/ui';

import { useWorkspace } from '@/hooks';
import { FileEditor, FileEditorRefDef } from '@/components/common';
import { Panel } from './Panel';
import { useRef, useState } from 'react';
import { ContentCopyOutlined, SaveOutlined } from '@mui/icons-material';

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
            const model = workspace.selectedLayout?.model;
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

    return (
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

                            // trigger the save
                            fileEditorRef.current?.saveFile();
                        }}
                    >
                        <SaveOutlined fontSize="inherit" />
                    </IconButton>
                </>
            }
        >
            <FileEditor
                ref={fileEditorRef}
                type={'app'}
                space={workspace.appId}
                path={path}
                agentModelEngine={workspace.agentModelEngine}
                onChange={(content, isModified) => {
                    onFileEditorChange(isModified);
                }}
            />
        </Panel>
    );
});
