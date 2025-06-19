import { observer } from 'mobx-react-lite';
import {
    Avatar,
    Button,
    Divider,
    IconButton,
    Stack,
    styled,
    Typography,
} from '@mui/material';
import {
    AppsRounded,
    CodeRounded,
    CopyAllOutlined,
    FunctionsRounded,
    ThumbDownOffAltOutlined,
    ThumbUpAltOutlined,
} from '@mui/icons-material';
import { useInsight } from '@semoss/sdk/react';
import { Chip, Markdown, useNotification } from '@/components';
import { ChatRoom, ChatMessage } from '@/stores';

const StyledUserMessage = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.default,
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

const StyledAgentResponse = styled(Stack)(({ theme }) => ({
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
}));

const StyledSidebarOpen = styled(Stack, {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})<{
    isSelected: boolean;
}>(({ theme, isSelected }) => ({
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadiusLg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: isSelected
        ? theme.palette.primary.main
        : theme.palette.secondary.border,
    cursor: 'pointer',
}));

const StyledHover = styled('div')(() => ({
    opacity: 0,
    width: '100%',
    '&:hover': {
        opacity: 1,
    },
}));

interface RoomMessageComponentProps {
    /** Room to render */
    room: ChatRoom;

    /** Message to render */
    message: ChatMessage;
}

export const RoomMessageComponent: React.FC<RoomMessageComponentProps> =
    observer((props) => {
        // set the get the room based on the params
        const { room, message } = props;
        const { system } = useInsight();

        const notification = useNotification();

        const loginType = Object.keys(system.config.logins)[0];
        const userName: string =
            typeof system.config.logins[loginType] === 'string'
                ? (system.config.logins[loginType] as unknown as string)
                : '';

        const initials: string = userName
            .match(/(\b\S)?/g)
            .join('')
            .match(/(^\S|\S$)?/g)
            .join('')
            .toUpperCase();

        /**
         * Copy the text
         * @param text - text to copy
         */
        const copyMessage = () => {
            try {
                navigator.clipboard.writeText(message.responseText);

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
         * Copy the text
         * @param text - text to copy
         */
        const recordFeedback = async (rating: boolean) => {
            try {
                await room.recordFeedback(message.messageId, rating);

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
            <Stack direction={'column'} spacing={3}>
                <StyledUserMessage
                    direction={'row'}
                    alignItems={'flex-start'}
                    spacing={1}
                >
                    <StyledAvatar alt="user initials">{initials}</StyledAvatar>
                    <Typography variant="body1" marginTop={0.5}>
                        {message.question}
                    </Typography>
                </StyledUserMessage>
                {message.response.length > 0 ? (
                    <StyledAgentResponse direction={'column'} spacing={1}>
                        {message.response.map((r, rIdx) => {
                            if (r.type === 'CONTENT') {
                                return (
                                    <Markdown key={rIdx}>{r.content}</Markdown>
                                );
                            } else if (r.type === 'CODE') {
                                const isSelected =
                                    room.sidebar.isOpen &&
                                    room.sidebar.options.type === 'CODE' &&
                                    room.sidebar.options.name === r.name;

                                return (
                                    <StyledSidebarOpen
                                        key={rIdx}
                                        isSelected={isSelected}
                                        direction={'row'}
                                        alignItems={'center'}
                                        spacing={2}
                                        onClick={() => {
                                            // toggle open / closed based on the state
                                            if (isSelected) {
                                                room.closeSidebar();
                                            } else {
                                                room.openSidebar({
                                                    type: 'CODE',
                                                    name: r.name,
                                                });
                                            }
                                        }}
                                    >
                                        <CodeRounded fontSize="medium" />
                                        <Stack
                                            direction={'column'}
                                            spacing={1}
                                            flex={1}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                textOverflow={'ellipsis'}
                                            >
                                                {r.name}
                                            </Typography>
                                            <Typography variant="caption">
                                                Click to Open
                                            </Typography>
                                        </Stack>
                                    </StyledSidebarOpen>
                                );
                            } else if (r.type === 'FUNCTION') {
                                const isSelected =
                                    room.sidebar.isOpen &&
                                    room.sidebar.options.type === 'FUNCTION' &&
                                    room.sidebar.options.response.id === r.id;

                                return (
                                    <>
                                        <StyledSidebarOpen
                                            key={rIdx}
                                            isSelected={isSelected}
                                            direction={'row'}
                                            alignItems={'center'}
                                            spacing={2}
                                            onClick={() => {
                                                // toggle open / closed based on the state
                                                if (isSelected) {
                                                    room.closeSidebar();
                                                } else {
                                                    room.openSidebar({
                                                        type: 'FUNCTION',
                                                        response: r,
                                                    });
                                                }
                                            }}
                                        >
                                            <FunctionsRounded fontSize="medium" />
                                            <Stack
                                                direction={'column'}
                                                spacing={1}
                                                flex={1}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    textOverflow={'ellipsis'}
                                                >
                                                    {r.name}
                                                </Typography>
                                                <Typography variant="caption">
                                                    Click to Open
                                                </Typography>
                                            </Stack>
                                        </StyledSidebarOpen>
                                        {r.content !== null && (
                                            <Markdown>{r.content}</Markdown>
                                        )}
                                    </>
                                );
                            } else if (
                                r.type === 'APP' ||
                                r.type === 'PROJECT'
                            ) {
                                const isSelected =
                                    room.sidebar.isOpen &&
                                    room.sidebar.options.type === 'APP' &&
                                    room.sidebar.options.response.id === r.id;

                                return (
                                    <>
                                        <StyledSidebarOpen
                                            key={rIdx}
                                            isSelected={isSelected}
                                            direction={'row'}
                                            alignItems={'center'}
                                            spacing={2}
                                            onClick={() => {
                                                // toggle open / closed based on the state
                                                if (isSelected) {
                                                    room.closeSidebar();
                                                } else {
                                                    room.openSidebar({
                                                        type: 'APP',
                                                        response: r,
                                                    });
                                                }
                                            }}
                                        >
                                            <AppsRounded fontSize="medium" />
                                            <Stack
                                                direction={'column'}
                                                spacing={1}
                                                flex={1}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    textOverflow={'ellipsis'}
                                                >
                                                    {r.name}
                                                </Typography>
                                                <Typography variant="caption">
                                                    Click to Open
                                                </Typography>
                                            </Stack>
                                        </StyledSidebarOpen>
                                        {r.content !== null && (
                                            <Markdown>{r.content}</Markdown>
                                        )}
                                    </>
                                );
                            } else if (r.type === 'CONCLUSION') {
                                return (
                                    <Button
                                        key={rIdx}
                                        onClick={() => {
                                            room.askModel(
                                                'Based on the previous results give me an answer',
                                                {
                                                    ...room.options,
                                                    chainOfThought: false,
                                                },
                                            );
                                        }}
                                    >
                                        Get Result
                                    </Button>
                                );
                            }
                        })}
                        {message.sources.length > 0 ? (
                            <Stack
                                direction={'row'}
                                spacing={1}
                                flexWrap={'wrap'}
                            >
                                {message.sources.map((s, sIdx) => {
                                    const isSelected =
                                        room.sidebar.isOpen &&
                                        room.sidebar.options.type ===
                                            'VECTOR_FILE' &&
                                        room.sidebar.options.name === s;

                                    return (
                                        <Chip
                                            key={sIdx}
                                            label={s}
                                            color={
                                                isSelected
                                                    ? 'primary'
                                                    : 'default'
                                            }
                                            onClick={() => {
                                                // toggle open / closed based on the state
                                                if (isSelected) {
                                                    room.closeSidebar();
                                                } else {
                                                    room.openSidebar({
                                                        type: 'VECTOR_FILE',
                                                        name: s,
                                                        engine: room.options
                                                            ?.knowledge?.id,
                                                    });
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        ) : null}
                        <StyledHover>
                            <div>
                                <Divider />
                                <Stack
                                    direction={'row'}
                                    alignItems={'center'}
                                    justifyContent={'space-between'}
                                >
                                    &nbsp;
                                    <Stack
                                        direction={'row'}
                                        alignItems={'center'}
                                        spacing={1}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                recordFeedback(false);
                                            }}
                                        >
                                            <ThumbDownOffAltOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                recordFeedback(true);
                                            }}
                                        >
                                            <ThumbUpAltOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => copyMessage()}
                                        >
                                            <CopyAllOutlined fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </div>
                        </StyledHover>
                    </StyledAgentResponse>
                ) : null}
            </Stack>
        );
    });
