import { useState } from 'react';
import {
    styled,
    Typography,
    TextField,
    Stack,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { Delete } from '@mui/icons-material';

import { ChatRoom } from '@/stores';
import {
    KnowledgeOverlayComponent,
    RightMenu,
    ToolsOverlayComponent,
} from '@/components';

const ENABLE_TOOLS = process.env.ENABLE_TOOLS === 'true';

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
                        flex={1}
                        noWrap={true}
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
                            <ListItem
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
                                <ListItemText
                                    primary={options.knowledge.name}
                                />
                            </ListItem>
                        ) : (
                            <ListItem dense={true}>
                                <Typography
                                    variant="caption"
                                    textAlign={'center'}
                                    width={'100%'}
                                >
                                    No knowledge added
                                </Typography>
                            </ListItem>
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
                                        <ListItem
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
                                            <ListItemText primary={t.name} />
                                        </ListItem>
                                    );
                                })
                            ) : (
                                <ListItem dense={true}>
                                    <Typography
                                        variant="caption"
                                        textAlign={'center'}
                                        width={'100%'}
                                    >
                                        No tools added
                                    </Typography>
                                </ListItem>
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
