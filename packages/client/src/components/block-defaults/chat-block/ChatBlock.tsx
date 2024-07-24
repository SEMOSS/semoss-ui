import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    TextField,
    Avatar,
    Typography,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { Lightbulb, PlayArrow } from '@mui/icons-material';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MARKDOWN_COMPONENTS } from './chat.constants';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { computed } from 'mobx';

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

const StyledScrollInner = styled('div')(({ theme }) => ({
    direction: 'ltr',
    transform: 'rotate(180deg)',
    paddingBottom: theme.spacing(1),
}));

const StyledMessage = styled('div', {
    shouldForwardProp: (prop) => prop !== 'agent',
})<{
    /** Track if the it is an agent */
    agent: boolean;
}>(({ theme, agent }) => ({
    position: 'relative',
    display: 'flex',
    justifyContent: agent ? 'flex-start' : 'flex-end',
    width: '100%',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingRight: theme.spacing(1),
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    marginTop: -theme.spacing(0.75),
    width: 32,
    height: 32,
}));

const StyledContent = styled('div', {
    shouldForwardProp: (prop) => prop !== 'agent',
})<{
    /** Track if the it is an agent */
    agent: boolean;
}>(({ theme, agent }) => ({
    maxWidth: '70%',
    padding: theme.spacing(1),
    color: agent ? theme.palette.common.white : theme.palette.text.primary,
    backgroundColor: agent
        ? theme.palette.primary.light
        : theme.palette.grey['200'],
    borderRadius: theme.shape.borderRadius,
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

    // track if the loading screen is on
    const isLoading = !isInitialized || data.loading;

    let history: { agent: string; user: string }[] = [];
    if (!isLoading) {
        try {
            history = JSON.parse(
                data.history as unknown as string,
            ) as ChatMessage[];
        } catch (e) {
            console.log(e);
        }
    }

    // const history: ChatMessage[] = useMemo(() => {
    //     return computed(() => {
    //         if (!isInitialized) {
    //             return [];
    //         }

    //         try {
    //             return JSON.parse(
    //                 data.history as unknown as string,
    //             ) as ChatMessage[];
    //         } catch (e) {
    //             console.log(e);
    //         }

    //         return []

    //     });
    // }, [isInitialized]).get();

    // reset the ask when the history changes
    useEffect(() => {
        // reset the ask
        setData('ask', '');
    }, [data.history]);

    // method called when the component is initialized
    useEffect(() => {
        // trigger it
        listeners.onLoad();

        // update the state
        setIsInitialized(true);
    }, []);

    /**
     * Trigger the events linked to the onAsk listener
     */
    const onAsk = () => {
        // trigger it
        listeners.onAsk();
    };

    console.log(data.history);

    return (
        <StyledChat id={id} {...attrs}>
            <Stack direction={'column'} height={'100%'} flex={1}>
                <StyledScroll>
                    <StyledScrollInner>
                        {isInitialized ? (
                            history.map((m, idx) => {
                                return (
                                    <React.Fragment key={idx}>
                                        {m.user ? (
                                            <StyledMessage agent={false}>
                                                <StyledContent agent={false}>
                                                    <Typography variant="body2">
                                                        {m.user}
                                                    </Typography>
                                                </StyledContent>
                                            </StyledMessage>
                                        ) : (
                                            <></>
                                        )}
                                        {m.agent ? (
                                            <StyledMessage agent={true}>
                                                <Stack
                                                    direction={'row'}
                                                    spacing={2}
                                                    overflow={'hidden'}
                                                >
                                                    <StyledAvatar alt="message icon">
                                                        <Lightbulb />
                                                    </StyledAvatar>
                                                    <StyledContent agent={true}>
                                                        <ReactMarkdown
                                                            components={
                                                                MARKDOWN_COMPONENTS
                                                            }
                                                            remarkPlugins={[
                                                                remarkGfm,
                                                            ]}
                                                        >
                                                            {m.agent}
                                                        </ReactMarkdown>
                                                    </StyledContent>
                                                </Stack>
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
                <Stack direction={'row'} alignItems={'center'} spacing={1}>
                    <StyledTextField
                        size="small"
                        value={data.ask}
                        disabled={isLoading}
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
                                size="1em"
                                variant="indeterminate"
                            />
                        ) : (
                            <PlayArrow />
                        )}
                    </IconButton>
                </Stack>
            </Stack>
        </StyledChat>
    );
});
