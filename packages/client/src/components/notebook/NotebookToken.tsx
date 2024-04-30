import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    IconButton,
    List,
    Menu,
    Typography,
    Stack,
    useNotification,
    Tooltip,
    TextField,
    Icon,
} from '@semoss/ui';
import { Token } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';
import { CheckCircle, MoreVert, VisibilityRounded } from '@mui/icons-material';

import { ActionMessages, SerializedState } from '@/stores';
import { useBlocks } from '@/hooks';

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
            // disablePadding
            secondaryAction={
                <>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        paddingY="8px"
                    >
                        {process.env.NODE_ENV === 'development' ? (
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
                        )}
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
            {/* <List.ItemButton sx={{width: '70%'}}> */}
            <List.ItemText
                disableTypography
                primary={
                    !openRenameAlias ? (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();

                                setOpenRenameAlias(true);
                            }}
                        >
                            <Typography variant="subtitle2">
                                {token.alias} - {token.type}
                            </Typography>
                        </div>
                    ) : (
                        <Stack
                            direction="row"
                            sx={{ width: '150px' }}
                            justifyContent="center"
                            alignItems={'center'}
                        >
                            <TextField
                                inputRef={(input) => input && input.focus()}
                                focused={true}
                                fullWidth
                                size={'small'}
                                variant="standard"
                                value={newTokenAlias}
                                onChange={(e) => {
                                    setNewTokenAlias(e.target.value);
                                }}
                                onBlur={() => {
                                    setOpenRenameAlias(false);
                                    setNewTokenAlias(token.alias);
                                }}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                            />
                            <IconButton>
                                <Icon color="success">
                                    <CheckCircle
                                        onClick={() => {
                                            console.log('rename');
                                        }}
                                    />
                                </Icon>
                            </IconButton>
                        </Stack>
                    )
                }
            />
            {/* </List.ItemButton> */}
        </List.Item>
    );
});
