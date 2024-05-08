import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Alert,
    styled,
    Button,
    Icon,
    IconButton,
    List,
    Menu,
    Modal,
    Typography,
    Stack,
    useNotification,
    Tooltip,
    TextField,
    LinearProgress,
} from '@semoss/ui';
import { Variable } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';
import {
    ContentCopy,
    MoreVert,
    WarningAmberOutlined,
    Widgets,
} from '@mui/icons-material';

import { ActionMessages, SerializedState } from '@/stores';
import { useBlocks } from '@/hooks';

const StyledListItem = styled(List.Item)(() => ({
    '&.MuiListItem-root': {
        paddingTop: '0px',
        paddingBottom: '0px',
    },
}));

const StyledTooltip = styled(Tooltip)(() => ({
    fontWeight: 'bold',
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    '&.MuiLinearProgress-root': {
        height: '2px',
        backgroundColor: 'transparent',
        marginTop: '13px',
        '.MuiLinearProgress-barColorDeterminate': {},
    },
}));

const StyledPointerStack = styled(Stack)(({ theme }) => ({
    '&:hover': {
        cursor: 'pointer',
    },
}));

interface NotebookTokenProps {
    /** Id of the variable */
    id: string;
    /** Variable Value */
    variable: Variable;
}

export const NotebookVariable = observer((props: NotebookTokenProps) => {
    const { id, variable } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const [openRenameAlias, setOpenRenameAlias] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [newTokenAlias, setNewTokenAlias] = useState(variable.alias);
    const [openReassignModal, setOpenReassignModal] = useState(false);
    const [newTokenType, setNewTokenType] = useState('');

    /**
     * Copys the alias to use in notebook
     * @param alias
     */
    const copyAlias = (alias: string) => {
        try {
            navigator.clipboard.writeText(`{{${alias}}}`);

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
     * To show Preview of Block
     * @param to what block to render
     * @returns Serialized State
     */
    const getStateWithBlock = (to: string) => {
        const block = state.getBlock(to);

        const s: SerializedState = {
            dependencies: {},
            variables: {},
            queries: {},
            blocks: {
                'page-1': {
                    id: 'page-1',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                    },
                    listeners: {
                        onPageLoad: [],
                    },
                    slots: {
                        content: {
                            name: 'content',
                            children: [to],
                        },
                    },
                },
                [to]: {
                    id: block.id,
                    widget: block.widget,
                    data: block.data,
                    parent: null,
                    listeners: block.listeners,
                    slots: block.slots,
                },
            },
        };

        return s;
    };

    return (
        <StyledListItem
            sx={{}}
            key={variable.alias}
            secondaryAction={
                <>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        paddingY="8px"
                    >
                        <IconButton
                            onClick={() => {
                                copyAlias(variable.alias);
                                setAnchorEl(null);
                            }}
                        >
                            <ContentCopy />
                        </IconButton>
                        <IconButton
                            title="Open Menu"
                            onClick={(e) => {
                                e.preventDefault();
                                setAnchorEl(e.currentTarget);
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => {
                                setAnchorEl(null);
                            }}
                        >
                            <Menu.Item
                                value="Delete"
                                onClick={() => {
                                    state.dispatch({
                                        message: ActionMessages.DELETE_VARIABLE,
                                        payload: {
                                            id: id,
                                        },
                                    });
                                    setAnchorEl(null);
                                }}
                            >
                                Delete
                            </Menu.Item>
                            <Menu.Item
                                value="Delete"
                                onClick={() => {
                                    setOpenReassignModal(true);
                                }}
                            >
                                Reassign
                            </Menu.Item>
                        </Menu>
                    </Stack>
                </>
            }
        >
            <List.ItemText
                disableTypography
                primary={
                    <Stack>
                        <StyledTooltip
                            placement={'right'}
                            title={
                                variable.type === 'block' ? (
                                    <div
                                        style={{
                                            width: '200px',
                                        }}
                                    >
                                        <BlocksRenderer
                                            state={getStateWithBlock(
                                                variable.to,
                                            )}
                                        />
                                    </div>
                                ) : (
                                    state.getVariable(
                                        variable.to,
                                        variable.type,
                                    )
                                )
                            }
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor:
                                            variable.type === 'block'
                                                ? 'transparent'
                                                : 'white',
                                        color: 'black',
                                    },
                                },
                            }}
                            enterDelay={500}
                            leaveDelay={200}
                        >
                            <CustomWrapper>
                                <div>
                                    {!openRenameAlias ? (
                                        <StyledPointerStack
                                            spacing={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();

                                                setOpenRenameAlias(true);
                                            }}
                                        >
                                            <Typography variant="body1">
                                                {variable.alias}
                                            </Typography>
                                            <Typography variant="body2">
                                                {variable.type}
                                            </Typography>
                                        </StyledPointerStack>
                                    ) : (
                                        <Stack
                                            spacing={1}
                                            direction="column"
                                            sx={{ width: '80%' }}
                                        >
                                            <TextField
                                                inputRef={(input) =>
                                                    input && input.focus()
                                                }
                                                focused={true}
                                                fullWidth
                                                size={'small'}
                                                variant="standard"
                                                value={newTokenAlias}
                                                onChange={(e) => {
                                                    setNewTokenAlias(
                                                        e.target.value,
                                                    );
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        console.log(
                                                            'Save alias',
                                                        );

                                                        setOpenRenameAlias(
                                                            false,
                                                        );
                                                        setNewTokenAlias(
                                                            newTokenAlias,
                                                        );

                                                        notification.add({
                                                            color: 'success',
                                                            message: `Succesfully renamed variable ${variable.alias} to ${newTokenAlias}, remember to save your app.`,
                                                        });

                                                        state.dispatch({
                                                            message:
                                                                ActionMessages.RENAME_VARIABLE,
                                                            payload: {
                                                                to: variable.to,
                                                                alias: newTokenAlias,
                                                            },
                                                        });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    setOpenRenameAlias(false);
                                                    setNewTokenAlias(
                                                        variable.alias,
                                                    );

                                                    notification.add({
                                                        color: 'warning',
                                                        message: `Unsuccesfully renamed variable ${variable.alias}, press enter to save.`,
                                                    });
                                                }}
                                                InputProps={{
                                                    disableUnderline: true,
                                                }}
                                            />
                                            <StyledLinearProgress
                                                color={'warning'}
                                            />
                                        </Stack>
                                    )}
                                </div>
                                <Modal
                                    open={openReassignModal}
                                    onClose={() => {
                                        setOpenReassignModal(false);
                                    }}
                                >
                                    <Modal.Title>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                        >
                                            {newTokenType ? (
                                                'Change Value'
                                            ) : (
                                                <div>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            display: 'inline',
                                                        }}
                                                    >
                                                        What type of variable
                                                        would you like to switch{' '}
                                                        <Typography
                                                            variant="h6"
                                                            color="primary"
                                                            fontWeight="bold"
                                                            sx={{
                                                                display:
                                                                    'inline',
                                                            }}
                                                        >
                                                            {variable.alias}
                                                        </Typography>{' '}
                                                        to?
                                                    </Typography>
                                                </div>
                                            )}
                                        </Stack>
                                    </Modal.Title>
                                    <Modal.Content>
                                        {!newTokenType ? (
                                            <Stack
                                                direction="row"
                                                gap={1}
                                                justifyContent={'center'}
                                            >
                                                <Stack
                                                    direction="row"
                                                    onClick={() => {
                                                        setNewTokenType(
                                                            'block',
                                                        );
                                                    }}
                                                >
                                                    <Icon color={'primary'}>
                                                        <Widgets />
                                                    </Icon>
                                                    <Typography variant="caption">
                                                        Block
                                                    </Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    onClick={() => {
                                                        setNewTokenType(
                                                            'block',
                                                        );
                                                    }}
                                                >
                                                    <Icon color={'primary'}>
                                                        <Widgets />
                                                    </Icon>
                                                    <Typography variant="caption">
                                                        Cell
                                                    </Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    onClick={() => {
                                                        setNewTokenType(
                                                            'block',
                                                        );
                                                    }}
                                                >
                                                    <Icon color={'primary'}>
                                                        <Widgets />
                                                    </Icon>
                                                    <Typography variant="caption">
                                                        Database
                                                    </Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    onClick={() => {
                                                        setNewTokenType(
                                                            'block',
                                                        );
                                                    }}
                                                >
                                                    <Icon color={'primary'}>
                                                        <Widgets />
                                                    </Icon>
                                                    <Typography variant="caption">
                                                        Vector
                                                    </Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    onClick={() => {
                                                        setNewTokenType(
                                                            'block',
                                                        );
                                                    }}
                                                >
                                                    <Icon color={'primary'}>
                                                        <Widgets />
                                                    </Icon>
                                                    <Typography variant="caption">
                                                        LLM
                                                    </Typography>
                                                </Stack>
                                                <Stack
                                                    direction="row"
                                                    onClick={() => {
                                                        setNewTokenType(
                                                            'block',
                                                        );
                                                    }}
                                                >
                                                    <Icon color={'primary'}>
                                                        <Widgets />
                                                    </Icon>
                                                    <Typography variant="caption">
                                                        Storage
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        ) : (
                                            <Stack direction={'column'}>
                                                <Alert
                                                    severity="warning"
                                                    icon={
                                                        <WarningAmberOutlined />
                                                    }
                                                >
                                                    Any changes to variables,
                                                    may cause breaking changes
                                                    to your app. Please keep
                                                    that in mind.
                                                </Alert>
                                                <Stack>
                                                    <Typography
                                                        variant={'body1'}
                                                        fontWeight="bold"
                                                    >
                                                        From {variable.type}:
                                                    </Typography>
                                                    {variable.type ===
                                                    'block' ? (
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <BlocksRenderer
                                                                state={getStateWithBlock(
                                                                    variable.to,
                                                                )}
                                                            />
                                                        </div>
                                                    ) : (
                                                        state.getVariable(
                                                            variable.to,
                                                            variable.type,
                                                        )
                                                    )}

                                                    <Typography
                                                        variant={'body1'}
                                                        fontWeight="bold"
                                                    >
                                                        To {newTokenType}:
                                                    </Typography>
                                                    <TextField />
                                                </Stack>
                                            </Stack>
                                        )}
                                    </Modal.Content>
                                    <Modal.Actions>
                                        <Button
                                            disabled={!newTokenType}
                                            onClick={() => {
                                                setNewTokenType('');
                                            }}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            disabled={true}
                                            variant={'contained'}
                                            onClick={() => {
                                                console.log('step');
                                            }}
                                        >
                                            Set
                                        </Button>
                                    </Modal.Actions>
                                </Modal>
                            </CustomWrapper>
                        </StyledTooltip>
                    </Stack>
                }
            />
        </StyledListItem>
    );
});

const CustomWrapper = React.forwardRef<HTMLDivElement>(function MyComponent(
    props: { children: HTMLDivElement },
    ref,
) {
    return (
        <div {...props} ref={ref}>
            {props.children}
        </div>
    );
});
