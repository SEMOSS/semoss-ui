import {
    KeyboardArrowDownRounded,
    RuleRounded,
    SendRounded,
} from '@mui/icons-material';
import {
    Button,
    CircularProgress,
    Container,
    IconButton,
    MenuItem,
    Select,
    Stack,
    styled,
    TextField,
    Tooltip,
} from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionsPickerComponent } from '@/components';
import { useChat } from '@/hooks';
import { ChatRoom } from '@/stores';

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === 'true';
const ENABLE_TASK = import.meta.env.VITE_ENABLE_TASK === 'true';

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

interface RoomInputComponentProps {
    /** Message to render */
    room: ChatRoom;
}

export const RoomInputComponent: React.FC<RoomInputComponentProps> = observer(
    (props) => {
        const { room } = props;
        const { chat } = useChat();

        // set the get the room based on the params
        const navigate = useNavigate();

        const [input, setInput] = useState('');

        /**
         * Ask the model
         *
         * @param - input
         */
        const askModel = async (input: string) => {
            try {
                // ignore if loading
                if (room.isLoading) {
                    return;
                }

                // ask the room
                room.askModel(input);

                // clear the input
                setInput('');
            } catch (_e) {
            } finally {
                // noop
            }
        };

        return (
            <Container maxWidth="md">
                <Stack direction={'column'} spacing={1}>
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                    >
                        {ENABLE_MODEL_SELECT ? (
                            <StyledSelect
                                size="small"
                                placeholder="Select a Model"
                                value={room.modelId}
                                onChange={(e) => {
                                    // set the selected model
                                    chat.setSelectedModel(e.target.value);

                                    navigate('/new');
                                }}
                                IconComponent={KeyboardArrowDownRounded}
                            >
                                {chat.models.options.map((m) => (
                                    <MenuItem key={m.app_id} value={m.app_id}>
                                        <Tooltip
                                            title={`Open new room with ${m.app_name}`}
                                            placement="top"
                                        >
                                            <span>{m.app_name}</span>
                                        </Tooltip>
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        ) : null}

                        <OptionsPickerComponent
                            options={room.options}
                            setOptions={(o) =>
                                room.setOptions({
                                    ...room.options,
                                    ...o,
                                })
                            }
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'center',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'center',
                            }}
                        />
                    </Stack>
                    <TextField
                        placeholder="Ask a question"
                        variant={'outlined'}
                        value={input}
                        fullWidth
                        multiline
                        size={'small'}
                        minRows={1}
                        maxRows={4}
                        disabled={room.isLoading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                askModel(input);
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <Tooltip
                                    title={
                                        room.isLoading
                                            ? 'Please wait'
                                            : 'Ask agent'
                                    }
                                    placement="top"
                                >
                                    <IconButton
                                        size={'small'}
                                        type="button"
                                        color="primary"
                                        aria-label="Ask the Model"
                                        disabled={room.isLoading}
                                        onClick={() => {
                                            askModel(input);
                                        }}
                                    >
                                        {room.isLoading ? (
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
                    {ENABLE_TASK && (
                        <Stack direction={'row'} alignItems={'center'}>
                            <Tooltip title={'Complete Tasks'} placement="top">
                                <span>
                                    <Button
                                        type="button"
                                        size={'small'}
                                        variant={'outlined'}
                                        color={
                                            room.options.chainOfThought
                                                ? 'primary'
                                                : 'secondary'
                                        }
                                        // may want to disable until GetCOT distinguishes CoT messages from normal chat messages
                                        disabled={room.isLoading}
                                        startIcon={
                                            <RuleRounded fontSize="inherit" />
                                        }
                                        onClick={() => {
                                            room.setOptions({
                                                ...room.options,
                                                chainOfThought:
                                                    !room.options
                                                        .chainOfThought,
                                            });
                                        }}
                                        sx={{
                                            color: room.options.chainOfThought
                                                ? 'primary'
                                                : 'text.primary',
                                        }}
                                    >
                                        Task
                                    </Button>
                                </span>
                            </Tooltip>
                        </Stack>
                    )}
                </Stack>
            </Container>
        );
    },
);
