import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
    Stack,
    Typography,
    Button,
    CircularProgress,
    Paper,
    TextField,
    styled,
    Alert,
    Markdown,
    Divider,
    Box
} from '@semoss/ui';

import { useEngine, useRootStore } from '@/hooks';
import { EngineModelTestSidebar } from '@/components/settings';
import { runPixel } from '@semoss/sdk/react';
import { IconButton, Avatar } from '@mui/material';
import { Send, CopyAll, Refresh, ThumbUpOffAlt, ThumbDownOffAlt } from '@mui/icons-material';

const StyledLayout = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(2),
}));

const StyledContainer = styled('div')(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledChatContainer = styled('div')(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    overflow: 'hidden',
    maxHeight: '80%'
}));

const StyledMessagesBox = styled('div')(({ theme }) => ({
    // flex: 1,
    // overflowY: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'transparent',
    maxHeight: '100%'
}));

const StyledMessagesContainer = styled('div')(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'transparent',
    maxHeight: '100%'
}));

const StyledMessageBubble = styled('div')<{ isUser: boolean }>(({ theme, isUser }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: isUser ? theme.palette.grey[100] : 'transparent',
    color: theme.palette.text.primary,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    maxWidth: '100%',
    wordWrap: 'break-word',
    margin: theme.spacing(1, 1)
}));

const StyledInputContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-end',
    margin: theme.spacing(1, 1),
    maxWidth: '100%',
    '& .MuiInputBase-root': {
        padding: '0% 1%'
    }
}));

const StyledForm = styled('form')(() => ({
    width: '100%',
    height: '5%'
}));

const StyledSendButton = styled(IconButton)(({ theme }) => ({
    padding: 0,
    '&:hover': { backgroundColor: 'transparent', color: theme.palette.primary.main }
}));

const StyledRewriteButton = styled(Button)(({ theme }) => ({
    color: 'black',
    opacity: 0.7,
    ...theme.typography.caption
}));


const StyledDivider = styled(Divider)({
    marginTop: 5,
    marginBottom: 1.5
});

const StyledChatTitle = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1, 1),
    background: theme.palette.primary.selected
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    '&&': {
        marginRight: theme.spacing(1),
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        float: 'inline-start',
        bottom: '0.5em',
        fontSize: 'small',
        height: '2.5em',
        width: '2.5em'
    }
}));

interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    tokens?: number;
}

interface Model {
    model_id: string;
    model_name: string;
    tag?: string;
}

export const EngineModelTestPage = () => {
    const { active } = useEngine();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    const [selectedModel, setSelectedModel] = useState<Model>({
        model_id: active.id,
        model_name: '',
    });
    const [temperature, setTemperature] = useState<number>(0.1);
    const [maxTokens, setMaxTokens] = useState<number>(2000);
    const [insightId, setInsightId] = useState<string>("");
    const [isInsightLoading, setIsInsightLoading] = useState<boolean>(true);

    const { control, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            prompt: '',
        },
    });

    const { monolithStore, configStore } = useRootStore();
    const promptValue = watch('prompt');

    //Helper to extract user initials for avatar
    function getInitials(name: string) {
        return `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`
    }

    // Helper to create a new insight from backend
    const createNewInsight = async () => {
        setIsInsightLoading(true);
        try {
            const { insightId: newId } = await runPixel('1+1;', 'new');
            setInsightId(newId);
        } catch (e) {
            setError(e.message || 'Failed to create new chat session.');
        } finally {
            setIsInsightLoading(false);
        }
    };

    useEffect(() => {
        setSelectedModel({
            model_id: active.id,
            model_name: '',
        });
        setMessages([]);
        createNewInsight(); // Get a new insightId from backend
    }, [active.id]);

    const sendMessage = async (data: { prompt: string }) => {
        if (!data.prompt.trim()) return;

        setError('');
        setIsLoading(true);
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            content: data.prompt,
            isUser: true,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        try {
            const pixel = `LLM(engine="${selectedModel.model_id}", command=["<encode>${data.prompt}</encode>"], paramValues=[{"temperature":${temperature}, "max_tokens":${maxTokens}}])`;
            const response = await monolithStore.runQuery(pixel, insightId);
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                const errorMessage = output.response || output || 'An error occurred while processing your request';
                if (errorMessage.toLowerCase().includes('token limit') || errorMessage.toLowerCase().includes('context length')) {
                    throw new Error('Prompt is larger than the token limit, please shorten/break it into multiple prompts');
                } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('access')) {
                    throw new Error('You do not have permission to use this model');
                } else {
                    throw new Error(errorMessage);
                }
            }
            const assistantMessage: Message = {
                id: output.messageId,
                content: output.response || 'No response received',
                isUser: false,
                timestamp: new Date(),
                tokens: output.numberOfTokensInResponse || 0,
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
            reset();
        }
    };

    const sendFeedback = async (messageId: string, rating: boolean) => {
        const pixel = `SubmitLLMFeedback(messageId="${messageId}", feedbackText="", rating="${rating}`;
        try{
            const response = await runPixel(pixel);
            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                const errorMessage = ""+output || 'An error occurred while submitting feedback';
                throw new Error(errorMessage);
            } else {
                return output;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while submitting feedback');
        }
    }

    return (
        <StyledLayout>
            <EngineModelTestSidebar
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                temperature={temperature}
                setTemperature={setTemperature}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
            />
            <StyledContainer>
                <StyledPaper variant="elevation" elevation={2} square>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h4">Test Model</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ marginBottom: '20px' }}>
                            Test and interact with this LLM model. Ask questions, experiment with different prompts,
                            and adjust parameters to see how the model responds. Chat history is not retained across sessions.
                        </Typography>
                        {error && (
                            <Alert severity="error" onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}
                        <StyledMessagesBox>
                            <StyledChatTitle>
                                <Typography variant="subtitle1">Chat History</Typography>
                                {messages.length > 0 && (
                                    <Button
                                        variant="text"
                                        startIcon={<Refresh />}
                                        size="small"
                                        onClick={() => {
                                            setMessages([]);
                                            createNewInsight();
                                        }}
                                        disabled={isLoading || isInsightLoading}
                                    >
                                        Clear Chat
                                    </Button>
                                )}
                            </StyledChatTitle>
                            <StyledMessagesContainer>
                                {isInsightLoading ? (
                                    <Typography variant="body2" color="secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                        Initializing chat session...
                                    </Typography>
                                ) : messages.length === 0 ? (
                                    <Typography variant="body2" color="secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                        Start a conversation by typing a message below
                                    </Typography>
                                ) : (
                                    messages.map((message, index) => (
                                        <div key={message.id}>
                                            <StyledMessageBubble isUser={message.isUser}>
                                                {message.isUser && <StyledAvatar>{getInitials(configStore.store.user.name)}</StyledAvatar>}
                                                {!message.isUser && <Typography variant="subtitle2" sx={{ mb: 2 }}>Response</Typography>}
                                                <div><Markdown>{message.content}</Markdown></div>
                                                {!message.isUser && <StyledDivider></StyledDivider>}
                                                {message.tokens && (
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                            Tokens: {message.tokens}
                                                        </Typography>
                                                        <Divider orientation="vertical" flexItem />
                                                        <StyledRewriteButton
                                                            variant="text"
                                                            startIcon={<Refresh />}
                                                            size="small"
                                                            onClick={() => handleSubmit(sendMessage)}
                                                            disabled={isLoading || isInsightLoading}
                                                        >
                                                            Rewrite
                                                        </StyledRewriteButton>
                                                        <Box sx={{ flexGrow: 1 }} />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigator.clipboard.writeText(message.content)}
                                                            sx={{ padding: 0 }}
                                                            aria-label="Liked the model's response"
                                                        >
                                                            <ThumbUpOffAlt fontSize="small" sx={{ opacity: 0.7 }} />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigator.clipboard.writeText(message.content)}
                                                            sx={{ padding: 0 }}
                                                            aria-label="Disliked the model's response"
                                                        >
                                                            <ThumbDownOffAlt fontSize="small" sx={{ opacity: 0.7 }} />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigator.clipboard.writeText(message.content)}
                                                            sx={{ padding: 0 }}
                                                            aria-label="Copy tokens to clipboard"
                                                        >
                                                            <CopyAll fontSize="small" sx={{ opacity: 0.7 }} />
                                                        </IconButton>
                                                    </Stack>
                                                )}
                                            </StyledMessageBubble>
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <StyledMessageBubble isUser={false}>
                                        <CircularProgress size={20} />
                                        <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                                            Generating response...
                                        </Typography>
                                    </StyledMessageBubble>
                                )}
                            </StyledMessagesContainer>
                            <StyledForm onSubmit={handleSubmit(sendMessage)} >
                                <StyledInputContainer>
                                    <Controller
                                        name="prompt"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                multiline
                                                maxRows={1}
                                                placeholder="Ask a question..."
                                                variant="outlined"
                                                fullWidth
                                                disabled={isLoading || isInsightLoading}
                                                InputProps={{
                                                    endAdornment: (
                                                        <StyledSendButton
                                                            type="submit"
                                                            disabled={isLoading || !promptValue?.trim() || isInsightLoading}
                                                            aria-label="Send message"
                                                            disableRipple={true}
                                                        >
                                                            {isLoading ? <CircularProgress size={20} /> : <Send />}
                                                        </StyledSendButton>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                </StyledInputContainer>
                            </StyledForm>
                        </StyledMessagesBox>
                    </Stack>
                </StyledPaper>
            </StyledContainer>
        </StyledLayout>
    );
};
