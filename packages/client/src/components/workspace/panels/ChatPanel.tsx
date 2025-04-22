import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import {
    styled,
    Stack,
    TextField,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress,
    Avatar,
    Markdown,
    Popover,
    Paper,
} from '@semoss/ui';
import { SendRounded, SettingsOutlined } from '@mui/icons-material';

import { Panel } from './Panel';
import { runPixel } from '@/api';
import { useRootStore } from '@/hooks';

const StyledPage = styled(Stack)(() => ({
    width: '100%',
    height: '100%',
}));

const StyledScroll = styled('div')(() => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column-reverse',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 400,
    letterSpacing: '.1px',
    lineHeight: '48px',
    height: theme.spacing(4),
    width: theme.spacing(4),
    background: theme.palette.primary.main,
}));

const StyledRow = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(1),
}));

const StyledUserMessage = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.default,
}));

const StyledUserText = styled(Typography)(({ theme }) => ({
    marginTop: `${theme.spacing(0.5)} !important`,
}));

const StyledAgentResponse = styled('div')(({ theme }) => ({
    paddingLeft: theme.spacing(2),
}));

const StyledInputHolder = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
}));

const StyledPopover = styled(Popover)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: '4px',
    },
}));

const StyledPopoverContent = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    width: '252px',
}));

export const ChatPanel: React.FC = observer(() => {
    const { configStore } = useRootStore();

    const [settingsAnchorEle, setSettingsAnchorEle] =
        useState<HTMLButtonElement | null>(null);

    const [messages, setMessages] = useState<
        { question: string; response: string }[]
    >([]);
    const [instructions, setInstructions] = useState('');
    const [input, setInput] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    /**
     * Ask the model
     *
     * @param - input
     */
    const askModel = async (input: string) => {
        try {
            setIsLoading(true);

            // copy the previous
            const prev = [...messages];
            const last = { question: input, response: '' };

            // update the chat with the input
            setMessages([...prev, last]);

            // ask the room
            const { pixelReturn, errors } = await runPixel<
                [{ response: string }]
            >(
                `LLM(engine =["4801422a-5c62-421e-a00c-05c6a9e15de8"], ${
                    instructions
                        ? `context=["<encode>${instructions}</encode>"],`
                        : ''
                } command =["<encode>${input}</encode>"]);`,
            );

            if (errors.length) {
                throw new Error(errors.join());
            }

            // update the chat with the input
            setMessages([
                ...prev,
                {
                    question: input,
                    response: pixelReturn[0].output.response,
                },
            ]);

            // clear the input
            setInput('');
        } catch (e) {
            console.warn(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Panel>
            <StyledPage direction={'column'} spacing={0}>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    spacing={1}
                    padding={1}
                >
                    <Stack flex={1}>&nbsp;</Stack>
                    <Tooltip title="Open Options" placement="top">
                        <IconButton
                            size={'small'}
                            aria-label="Open Options"
                            onClick={(e) => {
                                setSettingsAnchorEle(e.currentTarget);
                            }}
                        >
                            <SettingsOutlined
                                color="inherit"
                                fontSize="small"
                            />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <StyledScroll>
                    <div>
                        {messages.map((m, mIdx) => {
                            return (
                                <React.Fragment key={mIdx}>
                                    <StyledRow
                                        direction={'column'}
                                        alignItems={'flex-end'}
                                    >
                                        <StyledUserMessage
                                            direction={'row'}
                                            alignItems={'flex-start'}
                                            spacing={1}
                                        >
                                            <StyledAvatar alt="user initials">
                                                {
                                                    configStore.store.user
                                                        .initials
                                                }
                                            </StyledAvatar>
                                            <Typography
                                                variant="body2"
                                                sx={{ marginTop: 0.5 }}
                                            >
                                                {m.question}
                                            </Typography>
                                        </StyledUserMessage>
                                    </StyledRow>
                                    {m.response && (
                                        <StyledRow
                                            direction={'column'}
                                            alignItems={'flex-start'}
                                        >
                                            <StyledAgentResponse>
                                                <Markdown>
                                                    {m.response}
                                                </Markdown>
                                            </StyledAgentResponse>
                                        </StyledRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </StyledScroll>
                <StyledInputHolder>
                    <TextField
                        placeholder="Ask a question"
                        variant={'outlined'}
                        value={input}
                        fullWidth
                        multiline
                        size="small"
                        minRows={1}
                        maxRows={4}
                        disabled={isLoading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                askModel(input);
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <Tooltip
                                    title={
                                        isLoading ? 'Please wait' : 'Ask agent'
                                    }
                                    placement="top"
                                >
                                    <IconButton
                                        size={'small'}
                                        type="button"
                                        color="primary"
                                        aria-label="Ask the agent"
                                        disabled={isLoading}
                                        onClick={() => {
                                            askModel(input);
                                        }}
                                    >
                                        {isLoading ? (
                                            <CircularProgress
                                                size={'24px'}
                                                color="primary"
                                            />
                                        ) : (
                                            <SendRounded
                                                color={'inherit'}
                                                fontSize="medium"
                                            />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            ),
                        }}
                    />
                </StyledInputHolder>
            </StyledPage>

            <StyledPopover
                id={'chat-footer--options'}
                open={!!settingsAnchorEle}
                anchorEl={settingsAnchorEle}
                onClose={() => {
                    // close it
                    setSettingsAnchorEle(null);
                }}
            >
                <StyledPopoverContent>
                    <Typography variant="subtitle2" sx={{ marginBottom: 2 }}>
                        Context:
                    </Typography>
                    <TextField
                        aria-label="Instructions"
                        type="string"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        minRows={3}
                        maxRows={6}
                        multiline={true}
                        size="small"
                        variant="outlined"
                        fullWidth={true}
                    />
                </StyledPopoverContent>
            </StyledPopover>
        </Panel>
    );
});
