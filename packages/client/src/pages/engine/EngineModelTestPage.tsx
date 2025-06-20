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
    Markdown
} from '@semoss/ui';

import { useEngine, useRootStore } from '@/hooks';
import { EngineModelTestSidebar } from '@/components/settings';

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
}));

const StyledMessagesContainer = styled('div')(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
}));

const StyledMessageBubble = styled('div')<{ isUser: boolean }>(({ theme, isUser }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
    color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    maxWidth: '80%',
    wordWrap: 'break-word',
}));

const StyledInputContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
}));

interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    tokens?: number;
}

interface Model {
    database_id: string;
    database_name: string;
    tag?: string;
}

export const EngineModelTestPage = () => {
    const { id } = useEngine();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Model selection and parameters
    const [selectedModel, setSelectedModel] = useState<Model>({
        database_id: id,
        database_name: '',
    });
    const [temperature, setTemperature] = useState<number>(0.1);
    const [maxTokens, setMaxTokens] = useState<number>(2000);

    const { control, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            prompt: '',
        },
    });

    const { monolithStore } = useRootStore();
    const promptValue = watch('prompt');

    // Initialize with current model
    useEffect(() => {
        setSelectedModel({
            database_id: id,
            database_name: '',
        });
    }, [id]);

    const validateTokenLimit = (prompt: string): boolean => {
        // Basic token estimation (rough approximation: 1 token ≈ 4 characters)
        const estimatedTokens = Math.ceil(prompt.length / 4);
        const modelTokenLimit = 4096; // Default limit, should be fetched from model metadata

        if (estimatedTokens > modelTokenLimit) {
            setError(`Prompt is larger than the token limit, please shorten/break it into multiple prompts`);
            return false;
        }
        return true;
    };

    const continueGeneration = async (lastMessage: Message) => {
        setIsLoading(true);
        setError('');

        try {
            // Use the last response as context and ask to continue
            const continuePrompt = "Please continue your previous response.";
            const pixel = `LLM(engine="${selectedModel.database_id}", command=["<encode>${continuePrompt}</encode>"], paramValues=[{"temperature":${temperature}, "max_tokens":${maxTokens}}])`;

            const response = await monolithStore.runQuery(pixel);
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output.response || 'An error occurred while continuing the response');
            }

            // Update the last message with continued content
            setMessages(prev => prev.map(msg =>
                msg.id === lastMessage.id
                    ? { ...msg, content: msg.content + '\n\n' + (output.response || '') }
                    : msg
            ));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred while continuing');
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (data: { prompt: string }) => {
        if (!data.prompt.trim()) return;
        
        if (!validateTokenLimit(data.prompt)) {
            return;
        }

        setError('');
        setIsLoading(true);

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            content: data.prompt,
            isUser: true,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            // Call LLM using the LLM reactor
            const pixel = `LLM(engine="${selectedModel.database_id}", command=["<encode>${data.prompt}</encode>"], paramValues=[{"temperature":${temperature}, "max_tokens":${maxTokens}}])`;

            const response = await monolithStore.runQuery(pixel);
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                // Handle specific error types
                const errorMessage = output.response || output || 'An error occurred while processing your request';
                if (errorMessage.toLowerCase().includes('token limit') || errorMessage.toLowerCase().includes('context length')) {
                    throw new Error('Prompt is larger than the token limit, please shorten/break it into multiple prompts');
                } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('access')) {
                    throw new Error('You do not have permission to use this model');
                } else {
                    throw new Error(errorMessage);
                }
            }

            // Add assistant message
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
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
                            <Typography variant="h5">Test Model</Typography>
                            {messages.length > 0 && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setMessages([])}
                                    disabled={isLoading}
                                >
                                    Clear Chat
                                </Button>
                            )}
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

                        <StyledChatContainer>
                            <StyledMessagesContainer>
                                {messages.length === 0 ? (
                                    <Typography variant="body2" color="secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                        Start a conversation by typing a message below
                                    </Typography>
                                ) : (
                                    messages.map((message, index) => (
                                        <div key={message.id}>
                                            <StyledMessageBubble isUser={message.isUser}>
                                                <div><Markdown>{message.content}</Markdown></div>
                                                {message.tokens && (
                                                    <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                                                        Tokens: {message.tokens}
                                                    </Typography>
                                                )}
                                            </StyledMessageBubble>
                                            {!message.isUser && index === messages.length - 1 && !isLoading && (
                                                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => continueGeneration(message)}
                                                        disabled={isLoading}
                                                    >
                                                        Continue
                                                    </Button>
                                                </Stack>
                                            )}
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

                            <form onSubmit={handleSubmit(sendMessage)}>
                                <StyledInputContainer>
                                    <Controller
                                        name="prompt"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                multiline
                                                maxRows={4}
                                                placeholder="Enter your prompt here..."
                                                variant="outlined"
                                                fullWidth
                                                disabled={isLoading}
                                            />
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isLoading || !promptValue?.trim()}
                                        sx={{ minWidth: '100px' }}
                                    >
                                        {isLoading ? <CircularProgress size={20} /> : 'Send'}
                                    </Button>
                                </StyledInputContainer>
                            </form>
                        </StyledChatContainer>
                    </Stack>
                </StyledPaper>
            </StyledContainer>
        </StyledLayout>
    );
};
