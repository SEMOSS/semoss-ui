import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    LinearProgress,
    Stack,
    TextField,
    Container,
    Avatar,
    Typography,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { Lightbulb, Person, PlayArrow } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { LoadingScreen } from '@/components/ui';

interface ChatMessage {
    /** Agent Message */
    agent: string;

    /** User Message */
    user: string;
}

const StyledChat = styled('div')(() => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#FFFFFF',
    overflow: 'hidden',
}));

const StyledScroll = styled('div')(() => ({
    display: 'flex',
    flex: '1',
    flexDirection: 'column',
    overflowX: 'hidden',
    overflowY: 'auto',
    direction: 'rtl',
    transform: 'rotate(180deg)',
}));

const StyledScrollInner = styled('div')(() => ({
    direction: 'ltr',
    transform: 'rotate(180deg)',
}));

const StyledMessage = styled('div', {
    shouldForwardProp: (prop) => prop !== 'agent',
})<{
    /** Track if the message is an agent */
    agent: boolean;
}>(({ theme, agent }) => ({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    // backgroundColor: agent ? theme.palette.background.paper : 'transparent',
    '&:hover #chat-messages--action': {
        visibility: 'visible',
    },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    marginTop: -theme.spacing(0.75),
    width: 32,
    height: 32,
}));

const StyledContent = styled('div')(() => ({
    flex: '1',
    overflow: 'hidden',
}));

const StyledTextField = styled(TextField)(() => ({
    flex: '1',
}));

export interface ChatBlockDef extends BlockDef<'chat'> {
    widget: 'chat';
    data: {
        /**
         * Track if the chat block is loading
         */
        loading?: boolean;

        /**
         * Current message being asked by the user
         */
        ask: string;

        /**
         * History of messages
         */
        history: ChatMessage[];
    };
    listeners: {
        /**
         * Callback triggered when the chat is initially loaded
         */
        onLoad: true;

        /**
         * Callback triggered when the message is asked
         */
        onAsk: true;
    };
}

export const ChatBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners, setData } = useBlock<ChatBlockDef>(id);

    // track if the chat is initialized
    const [isInitialized, setIsInitialized] = useState(false);

    let history: { agent: string; user: string }[] = [];
    try {
        history = JSON.parse(
            data.history as unknown as string,
        ) as ChatMessage[];
    } catch (e) {
        console.log(e);
    }

    // reset the ask when the history changes
    useEffect(() => {
        // reset the ask
        setData('ask', '');
    }, [data.history]);

    // method called when the component is initialized
    useEffect(() => {
        // update the state
        setIsInitialized(true);

        // trigger it
        listeners.onLoad();
    }, []);

    /**
     * Trigger the events linked to the onAsk listener
     */
    const onAsk = () => {
        // trigger it
        listeners.onAsk();
    };

    // track if the loading screen is on
    const isLoading = !isInitialized || data.loading;

    return (
        <StyledChat id={id} {...attrs}>
            <LoadingScreen>
                {isLoading ? <LoadingScreen.Trigger /> : null}
                <Stack direction={'column'} height={'100%'} flex={1}>
                    <StyledScroll>
                        <StyledScrollInner>
                            {isInitialized ? (
                                history.map((m, idx) => {
                                    return (
                                        <React.Fragment key={idx}>
                                            {m.user ? (
                                                <StyledMessage agent={false}>
                                                    <Container maxWidth="md">
                                                        <Stack
                                                            direction={'row'}
                                                            spacing={3}
                                                            overflow={'hidden'}
                                                        >
                                                            <StyledAvatar alt="message icon">
                                                                <Person />
                                                            </StyledAvatar>
                                                            <StyledContent>
                                                                <Typography variant="body2">
                                                                    {m.user}
                                                                </Typography>
                                                            </StyledContent>
                                                        </Stack>
                                                    </Container>
                                                </StyledMessage>
                                            ) : (
                                                <></>
                                            )}
                                            {m.agent ? (
                                                <StyledMessage agent={true}>
                                                    <Container maxWidth="md">
                                                        <Stack
                                                            direction={'row'}
                                                            spacing={3}
                                                            overflow={'hidden'}
                                                        >
                                                            <StyledAvatar alt="message icon">
                                                                <Lightbulb />
                                                            </StyledAvatar>
                                                            <StyledContent>
                                                                <ReactMarkdown
                                                                    remarkPlugins={[
                                                                        remarkGfm,
                                                                    ]}
                                                                >
                                                                    {m.agent}
                                                                </ReactMarkdown>
                                                            </StyledContent>
                                                        </Stack>
                                                    </Container>
                                                </StyledMessage>
                                            ) : (
                                                <></>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <></>
                            )}
                        </StyledScrollInner>
                    </StyledScroll>
                    <Stack direction={'row'} alignItems={'center'}>
                        <StyledTextField
                            size="small"
                            value={data.ask}
                            disabled={isLoading}
                            helperText={
                                isLoading ? (
                                    <LinearProgress color="primary" />
                                ) : (
                                    false
                                )
                            }
                            type={'text'}
                            onChange={(e) => {
                                const value = e.target.value;

                                // update the value
                                setData('ask', value);
                            }}
                            onKeyDown={(e) => {
                                if (e.code === 'Enter') {
                                    onAsk();
                                }
                            }}
                        />

                        <IconButton
                            title="Ask the chat"
                            disabled={isLoading}
                            color={'primary'}
                            size="small"
                            onClick={() => {
                                onAsk();
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress
                                    size="0.75em"
                                    variant="indeterminate"
                                />
                            ) : (
                                <PlayArrow />
                            )}
                        </IconButton>
                    </Stack>
                </Stack>
            </LoadingScreen>
        </StyledChat>
    );
});
