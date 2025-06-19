import { observer } from 'mobx-react-lite';
import {
    Avatar,
    Button,
    Divider,
    IconButton,
    Stack,
    styled,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Icon,
    Box,
} from '@mui/material';
import {
    CopyAllOutlined,
    RefreshOutlined,
    ThumbDownOffAltOutlined,
    ThumbUpAltOutlined,
    Window,
} from '@mui/icons-material';
import { useInsight } from '@semoss/sdk/react';
import { useNotification } from '@/components';
import { ChatRoom, ChatMessage } from '@/stores';
import { useState } from 'react';

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
    marginBottom: '10px',
}));

const StyledHover = styled('div')(() => ({
    opacity: 0,
    width: '100%',
    '&:hover': {
        opacity: 1,
    },
}));

const StepLabelContainer = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    marginTop: '8px',
    marginBottom: '16px',
    borderRadius: '12px',
    border: '1px solid #C4C4C4',
    backgroundColor: '#ffffff',
    '&:hover': {
        backgroundColor: '#F5F5F5',
        cursor: 'pointer',
    },
});

const IconStyled = styled(Icon)({
    marginRight: '16px',
    borderRadius: '4px',
    border: '1px solid #C4C4C4',
    backgroundColor: '#FFFFFF',
    color: '#757575',
    height: '40px',
    width: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const TextContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
});

const addTaskHandler = (rIdx) => {
    console.log(`Add new task after task ${rIdx + 1}`);
};

interface ChainOfThoughtMessageComponentProps {
    /** Room to render */
    room: ChatRoom;

    /** Message to render */
    message: ChatMessage;
}

export const ChainOfThoughtMessageComponent: React.FC<ChainOfThoughtMessageComponentProps> =
    observer((props) => {
        // set the get the room based on the params
        const { room, message } = props;
        const { system } = useInsight();

        const notification = useNotification();

        const [completedStepsSet, setCompletedStepsSet] = useState(new Set());
        const [onHoverSet, setOnHoverSet] = useState(new Set());

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
        const copy = (text: string) => {
            try {
                navigator.clipboard.writeText(text);

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
                        <Typography variant="body1">
                            <b>Response</b>
                        </Typography>
                        <Typography variant="body1">
                            Primary placeholder response text for new chain of
                            thought outlining the tasks generated in response to
                            the user prompt. I’ll help create a set of
                            sequential tasks in response to your request. I’ll
                            suggest apps or functions for each task which you
                            will be able to select or override with your own
                            selections.
                        </Typography>
                        <Stepper orientation="vertical">
                            {message.response.map((r, rIdx) => {
                                if (r.type === 'CONTENT') {
                                    return (
                                        <Step
                                            completed={completedStepsSet.has(
                                                rIdx,
                                            )}
                                            active
                                            key={`${r.content.length}_${rIdx}`}
                                            onMouseEnter={() => {
                                                const onHoverSetDup = new Set();
                                                onHoverSetDup.add(rIdx);
                                                setOnHoverSet(onHoverSetDup);
                                            }}
                                            onMouseLeave={() => {
                                                const onHoverSetDup = new Set();
                                                onHoverSetDup.delete(rIdx);
                                                setOnHoverSet(onHoverSetDup);
                                            }}
                                        >
                                            <StepLabel>
                                                <Typography variant="body2">
                                                    <b>Task Name {rIdx + 1}</b>
                                                </Typography>
                                                <Typography variant="body2">
                                                    Medium-length description
                                                    text for task {rIdx + 1}
                                                </Typography>
                                            </StepLabel>
                                            <StepContent>
                                                <StepLabelContainer
                                                    onClick={() => {
                                                        const setDup = new Set(
                                                            completedStepsSet,
                                                        );
                                                        setDup.add(rIdx);
                                                        setCompletedStepsSet(
                                                            setDup,
                                                        );
                                                    }}
                                                >
                                                    <IconStyled>
                                                        <Window />
                                                    </IconStyled>
                                                    <TextContainer>
                                                        <Typography variant="subtitle2">
                                                            <b>
                                                                App Name for
                                                                Task {rIdx + 1}
                                                            </b>
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            Description for the
                                                            suggested / matched
                                                            application or
                                                            function for task{' '}
                                                            {rIdx + 1}.
                                                        </Typography>
                                                    </TextContainer>
                                                </StepLabelContainer>
                                                <Typography variant="body2">
                                                    Thought process text for
                                                    task {rIdx}. Current content
                                                    text being returned for
                                                    task:{' '}
                                                    {r.content.slice(0, 250)}
                                                    {r.content.length > 250 &&
                                                        '...'}
                                                </Typography>
                                                <div
                                                    style={{
                                                        marginTop: '8px',
                                                        justifyContent:
                                                            'center',
                                                        display: onHoverSet.has(
                                                            rIdx,
                                                        )
                                                            ? 'flex'
                                                            : 'none',
                                                    }}
                                                >
                                                    <Button
                                                        color="primary"
                                                        variant="text"
                                                        onClick={() =>
                                                            addTaskHandler(rIdx)
                                                        }
                                                    >
                                                        <b>+ Add Task</b>
                                                    </Button>
                                                </div>
                                            </StepContent>
                                        </Step>
                                    );
                                }
                            })}
                        </Stepper>
                        <StyledHover>
                            <div>
                                <Divider />
                                <Stack
                                    direction={'row'}
                                    alignItems={'center'}
                                    justifyContent={'space-between'}
                                >
                                    <Button
                                        variant={'text'}
                                        size={'small'}
                                        color={'secondary'}
                                        startIcon={<RefreshOutlined />}
                                        onClick={() =>
                                            room.rewriteMessage(
                                                message.messageId,
                                            )
                                        }
                                    >
                                        Rewrite
                                    </Button>
                                    <Stack
                                        direction={'row'}
                                        alignItems={'center'}
                                        spacing={1}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                room.recordFeedback(
                                                    message.messageId,
                                                    false,
                                                );
                                            }}
                                        >
                                            <ThumbDownOffAltOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                room.recordFeedback(
                                                    message.messageId,
                                                    false,
                                                );
                                            }}
                                        >
                                            <ThumbUpAltOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                copy(
                                                    message.response.join('/n'),
                                                )
                                            }
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
