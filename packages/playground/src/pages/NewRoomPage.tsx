import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Typography,
    Button,
    Unstable_Grid2 as Grid,
    Chip,
    Stack,
    Container,
    Paper,
    IconButton,
    TextField,
    Tooltip,
    MenuItem,
    Select,
    FormControl,
    Badge,
    CircularProgress,
    Link,
} from '@mui/material';
import { Resizable } from 're-resizable';
import {
    ArrowForward,
    AttachFileRounded,
    ConstructionOutlined,
    KeyboardArrowDownRounded,
    RuleRounded,
    SendRounded,
    TuneRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    AlertTitle,
    KnowledgeOverlayComponent,
    ToolsOverlayComponent,
    useNotification,
    OptionsPickerComponent,
    OptionsMenuComponent,
    PromptLibraryComponent,
} from '@/components';
import { useChat, usePixel } from '@/hooks';
import { ChatRoom } from '@/stores';
import { TEMPERATURE, TOKEN_LENGTH } from '@/constants';
import { useInsight } from '@semoss/sdk/react';
import { Prompt } from '@/types';

const APP_DESCRIPTION = process.env.APP_DESCRIPTION
    ? process.env.APP_DESCRIPTION
    : '';

const ENABLE_MODEL_SELECT = process.env.ENABLE_MODEL_SELECT === 'true';
const ENABLE_TASK = process.env.ENABLE_TASK === 'true';
const ENABLE_TOOLS = process.env.ENABLE_TOOLS === 'true';

const StyledPage = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
}));

const StyledContent = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflow: 'auto',
}));

const StyledHolder = styled('div')(({ theme }) => ({
    height: '98px',
}));

const StyledItem = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled?: boolean }>(({ theme, disabled }) => ({
    padding: theme.spacing(2),
    color: theme.palette.text.primary,
    height: '82px',
    boxShadow: '0px 5px 8px 0px rgba(0, 0, 0, 0.08)',
    borderRadius: theme.shape.borderRadius,
    borderColor: disabled ? `${theme.palette.action.disabled} !important` : '',
    borderTop: '3px solid',
    borderLeft: '3px solid',
    cursor: disabled ? undefined : 'pointer',
    pointerEvents: disabled ? 'none' : undefined,
}));

const StyledDescription = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledTextFieldActions = styled(Stack)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    paddingBottom: theme.spacing(1),
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    fontSize: '14px',
    maxWidth: '220px',
    '& .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline':
        {
            border: 'none',
            borderRadius: theme.shape.borderRadiusSm,
        },
    '& .MuiSelect-icon': {
        color: theme.palette.text.primary,
        top: 'calc(50% - 10px)',
        height: '20px',
        width: '20px',
    },
    '& .MuiSelect-select': {
        padding: theme.spacing(1),
    },
})) as unknown as typeof Select;

const StyledAlert = styled(Alert)(({ theme }) => ({
    background: 'linear-gradient(90deg, #DCD7F9 0%, #EBF4FE 100%)',
    border: '1px solid #BAB5F4',
    borderRadius: '8px',
    color: theme.palette.text.primary,
}));

const StyledChip = styled(Chip)(() => ({
    background: '#BAB5F4',
}));

const StyledLink = styled(Link)(() => ({
    color: 'inherit',
    textDecorationColor: 'inherit',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-input::placeholder': {
        color: theme.palette.text.primary,
        opacity: 1,
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderRadius: theme.spacing(1),
        },
    },
}));

export const NewRoomPage = observer(() => {
    const { chat } = useChat();
    const navigate = useNavigate();
    const { system } = useInsight();
    const notification = useNotification();

    const loginType = Object.keys(system.config.logins)[0];
    const userName: string =
        typeof system.config.logins[loginType] === 'string'
            ? (system.config.logins[loginType] as unknown as string)
            : '';

    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const [options, setOptions] = useState<ChatRoom['options']>({
        instructions: '',
        knowledge: null,
        tools: [],
        tokenLength: TOKEN_LENGTH,
        temperature: TEMPERATURE,
        autoExecute: false,
        showUi: false,
        chainOfThought: false,
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

    const getPrompts = usePixel<Prompt[]>(`ListPrompt(collect=[3]);`, {
        data: [],
    });

    /**
     * Open a prompt prompt
     * @param prompt - prompt to trigger
     */
    const askPrompt = (prompt: Prompt) => {
        // ignore if loading
        if (isLoading) {
            return;
        }

        // TODO: Fix
        setInput(prompt.CONTEXT);
        askModel(prompt.CONTEXT);
    };

    /**
     * Ask the model
     *
     * @param - input
     */
    const askModel = async (input: string) => {
        try {
            // ignore if loading
            if (isLoading) {
                return;
            }

            // turn the loading screen
            setIsLoading(true);

            // create a new room
            const room = await chat.openRoom(chat.models.selected, input);

            // ask the room
            await room.askModel(input, options);

            // clear the input
            setInput('');

            // go to the new room
            navigate(`/room/${room.roomId}`);
        } catch (e) {
            // send notification
            notification.add({
                message: e.message,
                color: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    let buttonTooltip = '';
    if (isLoading) {
        buttonTooltip = 'Please wait';
    } else if (!chat.models.selected) {
        buttonTooltip = 'Please select a model';
    } else if (!input) {
        buttonTooltip = 'Please enter input';
    } else {
        buttonTooltip = 'Ask agent';
    }

    return (
        <StyledPage direction={'column'} spacing={3}>
            <Stack
                direction={'row'}
                padding={1}
                alignItems={'center'}
                justifyContent={'flex-end'}
                spacing={1}
                width={'100%'}
            >
                <Stack direction={'row'} alignItems={'center'} spacing={1}>
                    <IconButton
                        size="small"
                        color={'default'}
                        onClick={() => {
                            setIsMenuOpen(!isMenuOpen);
                        }}
                    >
                        <TuneRounded fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
            <Stack
                flex={1}
                direction={'row'}
                width={'100%'}
                spacing={3}
                overflow={'hidden'}
            >
                <StyledContent
                    direction={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                >
                    {isKnowledgeOpen && (
                        <KnowledgeOverlayComponent
                            knowledge={options.knowledge}
                            onClose={(success, knowledge) => {
                                // if its successful, update the options
                                if (success) {
                                    setOptions({
                                        ...options,
                                        knowledge: knowledge,
                                    });
                                }

                                // close the modal
                                setIsKnowledgeOpen(false);
                            }}
                        />
                    )}

                    {isToolsOpen && (
                        <ToolsOverlayComponent
                            tools={options.tools}
                            onClose={(success, tools) => {
                                // update the tools if successful
                                if (success) {
                                    setOptions({
                                        ...options,
                                        tools: tools,
                                    });
                                }

                                // close it
                                setIsToolsOpen(false);
                            }}
                        />
                    )}
                    {!isPromptLibraryOpen && (
                        <Container maxWidth="md">
                            <Stack direction={'column'} spacing={3}>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography variant="h3" fontWeight="bold">
                                        Welcome
                                        {userName
                                            ? ', ' + userName?.split(' ')[0]
                                            : ''}
                                    </Typography>
                                </Stack>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <StyledDescription variant={'body1'}>
                                        {APP_DESCRIPTION}
                                    </StyledDescription>
                                </Stack>
                                <StyledAlert
                                    icon={
                                        <StyledChip size="small" label="NEW" />
                                    }
                                    color="info"
                                >
                                    <AlertTitle>Agent Tools</AlertTitle>
                                    Explore tools for file search, code, and
                                    function calling.{' '}
                                    <StyledLink
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setIsToolsOpen(true);
                                        }}
                                    >
                                        Try it out!
                                    </StyledLink>
                                </StyledAlert>
                                <Stack direction={'column'} spacing={1}>
                                    {ENABLE_MODEL_SELECT ? (
                                        <StyledSelect
                                            size="small"
                                            placeholder="Select a Model"
                                            disabled={isLoading}
                                            value={chat.models.selected}
                                            onChange={(e) => {
                                                chat.setSelectedModel(
                                                    e.target.value,
                                                );
                                            }}
                                            IconComponent={
                                                KeyboardArrowDownRounded
                                            }
                                        >
                                            {chat.models.options.map((m) => (
                                                <MenuItem
                                                    key={m.app_id}
                                                    value={m.app_id}
                                                >
                                                    {m.app_name}
                                                </MenuItem>
                                            ))}
                                        </StyledSelect>
                                    ) : null}

                                    <FormControl>
                                        <StyledTextField
                                            placeholder="Ask a question..."
                                            variant={'outlined'}
                                            value={input}
                                            fullWidth
                                            multiline
                                            minRows={4}
                                            maxRows={6}
                                            disabled={isLoading}
                                            onChange={(e) =>
                                                setInput(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    askModel(input);
                                                }
                                            }}
                                            InputProps={{
                                                sx: {
                                                    paddingBottom: '56px',
                                                },
                                            }}
                                        />
                                        <StyledTextFieldActions
                                            direction={'row'}
                                            alignItems={'center'}
                                        >
                                            {ENABLE_TASK && (
                                                <Tooltip
                                                    title={'Complete Tasks'}
                                                    placement="top"
                                                >
                                                    <Button
                                                        type="button"
                                                        size={'small'}
                                                        variant={'outlined'}
                                                        color={
                                                            options.chainOfThought
                                                                ? 'primary'
                                                                : 'secondary'
                                                        }
                                                        disabled={isLoading}
                                                        startIcon={
                                                            <RuleRounded fontSize="inherit" />
                                                        }
                                                        onClick={() => {
                                                            setOptions({
                                                                ...options,
                                                                chainOfThought:
                                                                    !options.chainOfThought,
                                                            });
                                                        }}
                                                        sx={{
                                                            color: options.chainOfThought
                                                                ? 'primary'
                                                                : 'text.primary',
                                                        }}
                                                    >
                                                        Task
                                                    </Button>
                                                </Tooltip>
                                            )}

                                            <Stack
                                                direction={'row'}
                                                flex={1}
                                                spacing={0}
                                                justifyContent={'flex-end'}
                                            >
                                                <OptionsPickerComponent
                                                    isDisabled={isLoading}
                                                    options={options}
                                                    setOptions={(o) =>
                                                        setOptions({
                                                            ...options,
                                                            ...o,
                                                        })
                                                    }
                                                />
                                                {ENABLE_TOOLS && (
                                                    <Tooltip
                                                        title={'Add Tools'}
                                                        placement="top"
                                                    >
                                                        <IconButton
                                                            size={'medium'}
                                                            type="button"
                                                            aria-label="Add Tools"
                                                            disabled={isLoading}
                                                            color={
                                                                isToolsOpen
                                                                    ? 'primary'
                                                                    : 'default'
                                                            }
                                                            onClick={() => {
                                                                setIsToolsOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Badge
                                                                color="primary"
                                                                variant="dot"
                                                                invisible={
                                                                    options
                                                                        .tools
                                                                        .length ===
                                                                    0
                                                                }
                                                            >
                                                                <ConstructionOutlined fontSize="medium" />
                                                            </Badge>
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                <Tooltip
                                                    title={'Add Knowledge'}
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size={'medium'}
                                                        type="button"
                                                        aria-label="Add Knowledge"
                                                        disabled={isLoading}
                                                        color={
                                                            isKnowledgeOpen
                                                                ? 'primary'
                                                                : 'default'
                                                        }
                                                        onClick={() => {
                                                            setIsKnowledgeOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Badge
                                                            color={'primary'}
                                                            variant="dot"
                                                            invisible={
                                                                !options.knowledge
                                                            }
                                                        >
                                                            <AttachFileRounded fontSize="medium" />
                                                        </Badge>
                                                        <Badge />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip
                                                    title={buttonTooltip}
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size={'medium'}
                                                        type="button"
                                                        color="primary"
                                                        aria-label="Ask the Model"
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
                                                                color={
                                                                    'inherit'
                                                                }
                                                                fontSize="medium"
                                                            />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </StyledTextFieldActions>
                                    </FormControl>
                                </Stack>
                                <Stack
                                    direction={'column'}
                                    spacing={2}
                                    width={'100%'}
                                >
                                    <Stack
                                        direction={'row'}
                                        alignItems={'center'}
                                        justifyContent={'space-between'}
                                    >
                                        <Typography
                                            variant="body1"
                                            fontWeight={'medium'}
                                        >
                                            Start Now
                                        </Typography>
                                        <Button
                                            size="medium"
                                            color="inherit"
                                            variant="text"
                                            endIcon={<ArrowForward />}
                                            disabled={isLoading}
                                            onClick={() =>
                                                setIsPromptLibraryOpen(true)
                                            }
                                        >
                                            View All
                                        </Button>
                                    </Stack>
                                    <StyledHolder>
                                        {getPrompts.status === 'LOADING' && (
                                            <CircularProgress color="primary" />
                                        )}
                                        {getPrompts.status !== 'LOADING' && (
                                            <Grid container spacing={2}>
                                                {getPrompts.data.map(
                                                    (p, index) => {
                                                        const borderColor = [
                                                            '#BAB5F4',
                                                            '#8CD98D',
                                                            '#93CEF8',
                                                        ];

                                                        if (!p) {
                                                            return null;
                                                        }

                                                        return (
                                                            <Grid
                                                                key={p.ID}
                                                                xs={4}
                                                            >
                                                                <StyledItem
                                                                    disabled={
                                                                        isLoading
                                                                    }
                                                                    onClick={() => {
                                                                        askPrompt(
                                                                            p,
                                                                        );
                                                                    }}
                                                                    sx={{
                                                                        borderColor:
                                                                            borderColor[
                                                                                index
                                                                            ],
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant={
                                                                            'body1'
                                                                        }
                                                                        noWrap={
                                                                            true
                                                                        }
                                                                    >
                                                                        {
                                                                            p.TITLE
                                                                        }
                                                                    </Typography>
                                                                </StyledItem>
                                                            </Grid>
                                                        );
                                                    },
                                                )}
                                            </Grid>
                                        )}
                                    </StyledHolder>
                                </Stack>
                            </Stack>
                        </Container>
                    )}

                    {isPromptLibraryOpen && (
                        <PromptLibraryComponent
                            onClose={(success, p) => {
                                // if there is a prompt ask
                                if (success) {
                                    askPrompt(p);
                                }

                                setIsPromptLibraryOpen(false);
                            }}
                        />
                    )}
                </StyledContent>
                {isMenuOpen && (
                    <Resizable
                        defaultSize={{
                            width: 360,
                            height: '100%',
                        }}
                        minWidth={280}
                        handleStyles={{
                            top: { pointerEvents: 'none' },
                            right: { pointerEvents: 'none' },
                            bottom: { pointerEvents: 'none' },
                            topRight: { pointerEvents: 'none' },
                            bottomRight: { pointerEvents: 'none' },
                            bottomLeft: { pointerEvents: 'none' },
                            topLeft: { pointerEvents: 'none' },
                        }}
                        style={{
                            // paddingTop: '8px',
                            paddingRight: '8px',
                            paddingBottom: '8px',
                        }}
                    >
                        <OptionsMenuComponent
                            options={options}
                            setOptions={(o) => {
                                setOptions(o);
                            }}
                            onClose={() => {
                                setIsMenuOpen(false);
                            }}
                        />
                    </Resizable>
                )}
            </Stack>
        </StyledPage>
    );
});
