import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    Icon,
    IconButton,
    List,
    Menu,
    Typography,
    Stack,
    useNotification,
    Tooltip,
    TextField,
    LinearProgress,
} from '@semoss/ui';
import { Token } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';
import { CheckCircle, MoreVert, VisibilityRounded } from '@mui/icons-material';

import { ActionMessages, SerializedState } from '@/stores';
import { useBlocks } from '@/hooks';

import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import GestureIcon from '@mui/icons-material/Gesture';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { ReactNode } from 'react';

const StyledTooltip = styled(Tooltip)(() => ({
    fontWeight: 'bold',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
}));

const StyledMenuTitle = styled(Typography)(() => ({
    fontWeight: 'bold',
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    '&.MuiLinearProgress-root': {
        height: '2px',
        backgroundColor: 'transparent',
        marginTop: '0px',
        '.MuiLinearProgress-barColorDeterminate': {},
    },
}));

const StyledPointerStack = styled(Stack)(({ theme }) => ({
    '&:hover': {
        cursor: 'pointer',
    },
}));

interface NotebookTokenProps {
    /** Id of the token */
    id: string;
    /** Token Value */
    token: Token;
}

export const NotebookToken = observer((props: NotebookTokenProps) => {
    const { id, token } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const textFieldRef = useRef(null);
    const [openRenameAlias, setOpenRenameAlias] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [newTokenAlias, setNewTokenAlias] = useState(token.alias);

    // useEffect(() => {
    //     console.log('here here')
    //     if (openRenameAlias) {
    //         setTimeout(() => {
    //             console.log('here')
    //             textFieldRef.current.focus();
    //         }, 3000);
    //     }
    // }, [openRenameAlias]);
    /**
     * Copys the alias to use in notebook
     * @param alias
     */
    const copyAlias = (alias: string) => {
        try {
            navigator.clipboard.writeText(alias);

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
            tokens: {},
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
        <List.Item
            key={token.alias}
            sx={{ borer: 'solid red' }}
            secondaryAction={
                <>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        paddingY="8px"
                    >
                        {/* {process.env.NODE_ENV === 'development' ? (
                            <StyledTooltip
                                placement={'right'}
                                title={
                                    token.type === 'block' ? (
                                        <div
                                            style={{
                                                width: '200px',
                                            }}
                                        >
                                            <BlocksRenderer
                                                state={getStateWithBlock(
                                                    token.to,
                                                )}
                                            />
                                        </div>
                                    ) : (
                                        state.getToken(token.to, token.type)
                                    )
                                }
                                componentsProps={{
                                    tooltip: {
                                        sx: {
                                            bgcolor:
                                                token.type === 'block'
                                                    ? 'transparent'
                                                    : 'white',
                                            color: 'black',
                                        },
                                    },
                                }}
                                enterDelay={500}
                                leaveDelay={200}
                            >
                                <IconButton>
                                    <VisibilityRounded />
                                </IconButton>
                            </StyledTooltip>
                        ) : (
                            <IconButton>
                                <VisibilityRounded />
                            </IconButton>
                        )} */}
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
                                value="copy"
                                onClick={() => {
                                    copyAlias(token.alias);
                                    setAnchorEl(null);
                                }}
                            >
                                Copy Token
                            </Menu.Item>
                            <Menu.Item
                                value="Delete"
                                onClick={() => {
                                    state.dispatch({
                                        message: ActionMessages.DELETE_TOKEN,
                                        payload: {
                                            id: id,
                                        },
                                    });
                                    setAnchorEl(null);
                                }}
                            >
                                Delete Token
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
                            // open={true}
                            placement={'right'}
                            title={
                                token.type === 'block' ? (
                                    <div
                                        style={{
                                            width: '200px',
                                        }}
                                    >
                                        <BlocksRenderer
                                            state={getStateWithBlock(token.to)}
                                        />
                                    </div>
                                ) : (
                                    state.getToken(token.to, token.type)
                                )
                            }
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor:
                                            token.type === 'block'
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
                                            // sx={{ border: 'solid red' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();

                                                setOpenRenameAlias(true);
                                            }}
                                        >
                                            <Stack
                                                direction={'row'}
                                                alignItems={'center'}
                                                sx={{
                                                    // border: 'solid blue',
                                                    marginTop: '5px',
                                                }}
                                            >
                                                <Icon color={'secondary'}>
                                                    <WidgetsIcon />
                                                </Icon>
                                                <Typography variant="subtitle2">
                                                    {token.alias} - {token.type}
                                                </Typography>
                                            </Stack>
                                            <div
                                                style={{
                                                    height: '2px',
                                                }}
                                            ></div>
                                        </StyledPointerStack>
                                    ) : (
                                        <Stack
                                            direction="column"
                                            sx={{ width: '80%' }}
                                        >
                                            <Stack
                                                direction="row"
                                                justifyContent={'space-between'}
                                                alignItems={'center'}
                                            >
                                                <Icon color={'secondary'}>
                                                    <WidgetsIcon />
                                                </Icon>
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
                                                                message: `Succesfully renamed token ${token.alias} to ${newTokenAlias}, remember to save your app.`,
                                                            });

                                                            state.dispatch({
                                                                message:
                                                                    ActionMessages.RENAME_TOKEN,
                                                                payload: {
                                                                    to: token.to,
                                                                    alias: newTokenAlias,
                                                                },
                                                            });
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        setOpenRenameAlias(
                                                            false,
                                                        );
                                                        setNewTokenAlias(
                                                            token.alias,
                                                        );

                                                        notification.add({
                                                            color: 'warning',
                                                            message: `Unsuccesfully renamed token ${token.alias}, press enter to save.`,
                                                        });
                                                    }}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                    }}
                                                />
                                                {/* <IconButton>
                                        <Icon color="success">
                                            <CheckCircle
                                                onClick={() => {
                                                    console.log('rename');
                                                }}
                                            />
                                        </Icon>
                                    </IconButton> */}
                                            </Stack>
                                            <StyledLinearProgress
                                                color={'secondary'}
                                            />
                                        </Stack>
                                    )}
                                </div>
                            </CustomWrapper>
                        </StyledTooltip>
                    </Stack>
                }
            />
        </List.Item>
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
