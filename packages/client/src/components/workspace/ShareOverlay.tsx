import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Alert,
    Button,
    IconButton,
    Modal,
    TextField,
    Tabs,
    useNotification,
    Typography,
    Stack,
} from '@semoss/ui';
import { resolvePath } from 'react-router-dom';
import { ContentCopyOutlined, WarningAmberOutlined } from '@mui/icons-material';
import { useRootStore } from '@/hooks';

interface ShareOverlayProps {
    /** Id of the app to share */
    appId: string;

    /** Method called to close overlay  */
    onClose: () => void;

    /** Are there diffs */
    diffs?: boolean;
}

export const ShareOverlay = observer((props: ShareOverlayProps) => {
    const { appId, diffs, onClose = () => null } = props;

    const notification = useNotification();

    const [shareModalTab, setShareModalTab] = useState(0);

    // create the url + iframe
    const base = window.location.href.replace(window.location.hash, '#');
    const path = resolvePath(`./s/${appId}`, base);
    const url = path.pathname;
    const iframe = `<iframe frameborder="0" width="1000" height="600" style="border: 1px solid #ccc;" src="${url}"></iframe>`;

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

    return (
        <>
            <Modal.Title>Share</Modal.Title>
            <Modal.Content>
                {diffs && (
                    <Alert severity="warning" icon={<WarningAmberOutlined />}>
                        Save app prior to sharing to reflect the latest changes
                    </Alert>
                )}
                <Stack direction="column" spacing={2}>
                    <Tabs
                        value={shareModalTab}
                        onChange={(event, value: number) => {
                            setShareModalTab(value);
                        }}
                    >
                        <Tabs.Item label="URL"></Tabs.Item>
                        <Tabs.Item label="IFrame"></Tabs.Item>
                    </Tabs>
                    {shareModalTab === 0 && (
                        <Stack>
                            <Typography variant="subtitle1">
                                Share a link for external use
                            </Typography>
                            <TextField
                                size="small"
                                value={url}
                                fullWidth={true}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                copy(url);
                                            }}
                                        >
                                            <ContentCopyOutlined fontSize="inherit" />
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Stack>
                    )}
                    {shareModalTab === 1 && (
                        <Stack>
                            <Typography variant="subtitle1">
                                Embed the app as an iframe
                            </Typography>
                            <TextField
                                size="small"
                                value={iframe}
                                multiline={true}
                                fullWidth={true}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                copy(iframe);
                                            }}
                                        >
                                            <ContentCopyOutlined fontSize="inherit" />
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Stack>
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose()}>Cancel</Button>
            </Modal.Actions>
        </>
    );
});
