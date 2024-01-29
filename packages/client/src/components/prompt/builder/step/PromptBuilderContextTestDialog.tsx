import { useState, useEffect } from 'react';
import {
    Button,
    CircularProgress,
    IconButton,
    Modal,
    Stack,
    Typography,
} from '@semoss/ui';
import { Close } from '@mui/icons-material';
import { useRootStore } from '@/hooks';

export const PromptBuilderContextTestDialog = (props: {
    llm: string;
    context: string;
    open: boolean;
    close: () => void;
}) => {
    const { monolithStore } = useRootStore();

    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');

    const ask = async () => {
        setLoading(true);
        const LLMresponse = await monolithStore.runQuery(
            `LLM(engine="${props.llm}", command=["<encode>${props.context}</encode>"])`,
        );

        const { output: LLMOutput } = LLMresponse.pixelReturn[0];

        setResponse(LLMOutput?.response ?? LLMOutput ?? '');
        setLoading(false);
    };

    useEffect(() => {
        if (props.open) {
            ask();
        }
    }, [props.open]);

    return (
        <Modal
            onClose={(_, reason: string) => {
                if (reason && reason == 'backdropClick') {
                    return;
                }
                props.close();
            }}
            fullWidth
            maxWidth="md"
            open={props.open}
        >
            <Modal.Title>Test Prompt</Modal.Title>
            <IconButton
                aria-label="close"
                onClick={() => props.close()}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <Close />
            </IconButton>
            <Modal.Content sx={{ height: '35vh' }}>
                {loading ? (
                    <Stack
                        width="100%"
                        height="100%"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <CircularProgress variant="indeterminate" />
                        <Typography variant="caption">
                            Running your prompt context against the selected
                            LLM...
                        </Typography>
                    </Stack>
                ) : (
                    response
                )}
            </Modal.Content>
            <Modal.Actions>
                <Stack direction="row" spacing={1} padding={1}>
                    <Button
                        variant="text"
                        onClick={props.close}
                        color="primary"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={ask}
                        color="primary"
                        disabled={loading}
                    >
                        Retry
                    </Button>
                </Stack>
            </Modal.Actions>
        </Modal>
    );
};
