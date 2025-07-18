import { Delete } from '@mui/icons-material';
import {
    styled,
    Typography,
    TextField,
    Stack,
    Button,
    IconButton,
    List,
    Checkbox,
    FormControlLabel,
} from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import {
    KnowledgeOverlayComponent,
    RightMenu,
    ToolsOverlayComponent,
} from '@/components';
import { ChatRoom } from '@/stores';

const ENABLE_TOOLS = import.meta.env.ENABLE_TOOLS === 'true';

const StyledTextField = styled(TextField)(({ theme }) => ({
    color: theme.palette.text.primary,
    background: theme.palette.background.paper,
}));

interface OptionsMenuComponentProps {
    /** Options for the room */
    options: ChatRoom['options'];

    /** Update options on change */
    setOptions: (options: ChatRoom['options']) => void;

    /** Close the Menu */
    onClose?: () => void;
}

export const OptionsMenuComponent: React.FC<OptionsMenuComponentProps> =
    observer((props) => {
        const { options, setOptions, onClose } = props;

        const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
        const [isToolsOpen, setIsToolsOpen] = useState(false);

        return (
            <RightMenu
                mode={'fixed'}
                header={
                    <Typography
                        variant={'body1'}
                        fontWeight={'bold'}
                        noWrap={true}
                        sx={{
                            flex: 1,
                        }}
                    >
                        Chat Controls
                    </Typography>
                }
                onClose={() => onClose()}
            >
                <Stack direction={'column'} width={'100%'} spacing={1}>
                    <Typography variant="body1">Instructions</Typography>
                    <StyledTextField
                        size="small"
                        variant="outlined"
                        fullWidth
                        placeholder={'Instructions'}
                        multiline
                        minRows={4}
                        maxRows={6}
                        value={options.instructions}
                        onChange={(e) => {
                            setOptions({
                                ...options,
                                instructions: e.target.value,
                            });
                        }}
                    />
                </Stack>
                <Stack direction={'column'} width={'100%'} spacing={1} flex={1}>
                    <Stack
                        direction={'row'}
                        width={'100%'}
                        spacing={2}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                    >
                        <Typography variant="body1">Knowledge</Typography>
                        <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setIsKnowledgeOpen(true);
                            }}
                        >
                            Add
                        </Button>
                    </Stack>
                    <List dense={true}>
                        {options.knowledge ? (
                            <List.Item
                                dense={true}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        size="small"
                                        onClick={() => {
                                            // update the tools
                                            setOptions({
                                                ...options,
                                                knowledge: null,
                                            });
                                        }}
                                    >
                                        <Delete fontSize={'small'} />
                                    </IconButton>
                                }
                            >
                                <List.ItemText
                                    primary={options.knowledge.name}
                                />
                            </List.Item>
                        ) : (
                            <List.Item dense={true}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        width: '100%',
                                        textAlign: 'center',
                                    }}
                                >
                                    No knowledge added
                                </Typography>
                            </List.Item>
                        )}
                    </List>
                </Stack>
                {ENABLE_TOOLS && (
                    <Stack
                        direction={'column'}
                        width={'100%'}
                        spacing={1}
                        flex={1}
                    >
                        <Stack
                            direction={'row'}
                            width={'100%'}
                            spacing={2}
                            justifyContent={'space-between'}
                            alignItems={'center'}
                        >
                            <Typography variant="body1">Tools</Typography>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={() => {
                                    setIsToolsOpen(true);
                                }}
                            >
                                Add
                            </Button>
                        </Stack>

                        <List dense={true}>
                            {options.tools.length ? (
                                options.tools.map((t, tIdx) => {
                                    return (
                                        <List.Item
                                            key={t.id}
                                            dense={true}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    size="small"
                                                    onClick={() => {
                                                        // copy it
                                                        const updated = [
                                                            ...options.tools,
                                                        ];

                                                        // remove at index
                                                        updated.splice(tIdx, 1);

                                                        // update the tools
                                                        setOptions({
                                                            ...options,
                                                            tools: updated,
                                                        });
                                                    }}
                                                >
                                                    <Delete
                                                        fontSize={'small'}
                                                    />
                                                </IconButton>
                                            }
                                        >
                                            <List.ItemText primary={t.name} />
                                        </List.Item>
                                    );
                                })
                            ) : (
                                <List.Item dense={true}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            width: '100%',
                                            textAlign: 'center',
                                        }}
                                    >
                                        No tools added
                                    </Typography>
                                </List.Item>
                            )}
                        </List>
                    </Stack>
                )}

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={options.autoExecute}
                            onChange={(e, val) =>
                                setOptions({
                                    ...options,
                                    autoExecute: !options.autoExecute,
                                })
                            }
                        />
                    }
                    label="Auto-execute"
                />
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
            </RightMenu>
        );
    });
