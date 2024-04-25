import { useEffect, useMemo, useState } from 'react';
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
} from '@semoss/ui';
import { useBlocks, useRootStore } from '@/hooks';
import { Search, MoreVert, VisibilityRounded } from '@mui/icons-material';
import { AddTokenModal } from './AddTokenModal';
import { ActionMessages } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';

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

/**
 * Render the queries menu of the nodebook
 */
export const NotebookTokensMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();
    const notification = useNotification();

    const [addTokenModal, setAddTokenModal] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const tokens = useMemo(() => {
        return Object.entries(state.tokens);
    }, [Object.entries(state.tokens).length]);

    const copyAlias = (projectId: string) => {
        try {
            navigator.clipboard.writeText(projectId);

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

    const s = {
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
                        children: [],
                    },
                },
            },
        },
    };

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Tokens</StyledMenuTitle>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            setAddTokenModal(true);
                        }}
                    >
                        Add Token
                    </Button>
                </Stack>
            </Stack>
            <StyledMenuScroll>
                <List disablePadding>
                    {tokens.map((t, index) => {
                        const token = t[1];
                        return (
                            <List.Item
                                key={token.alias}
                                disablePadding
                                secondaryAction={
                                    <>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            paddingY="8px"
                                        >
                                            {process.env.NODE_ENV ===
                                            'development' ? (
                                                <Tooltip
                                                    placement={'top'}
                                                    sx={{
                                                        background:
                                                            'transparent !important',
                                                        backgroundColor:
                                                            'transparent !important',
                                                    }}
                                                    title={
                                                        <div
                                                            style={{
                                                                width: '200px',
                                                            }}
                                                        >
                                                            <BlocksRenderer
                                                                state={s}
                                                            />
                                                        </div>
                                                    }
                                                    enterDelay={500}
                                                    leaveDelay={200}
                                                >
                                                    <IconButton>
                                                        <VisibilityRounded />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <IconButton>
                                                    <VisibilityRounded />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                title="Open Menu"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setAnchorEl(
                                                        e.currentTarget,
                                                    );
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
                                                            message:
                                                                ActionMessages.DELETE_TOKEN,
                                                            payload: {
                                                                id: t[0],
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
                                <List.ItemButton>
                                    <List.ItemText
                                        disableTypography
                                        primary={
                                            <Typography variant="subtitle2">
                                                {token.alias} - {token.type}
                                            </Typography>
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
            <AddTokenModal
                open={addTokenModal}
                onClose={() => {
                    setAddTokenModal(false);
                }}
            />
        </StyledMenu>
    );
});
