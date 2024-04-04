import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    List,
    Divider,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    Stack,
    Menu,
    useNotification,
} from '@semoss/ui';
import { useBlocks, useWorkspace } from '@/hooks';
import {
    Add,
    Search,
    CheckCircle,
    MoreVert,
    Error as ErrorIcon,
    Pending,
    Edit,
    ContentCopy,
    Delete,
    HourglassEmpty,
} from '@mui/icons-material';
import { NewQueryOverlay } from './NewQueryOverlay';
import { ActionMessages } from '@/stores';

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

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    width: theme.spacing(4),
    minWidth: 'unset',
}));

/**
 * Render the queries menu of the nodebook
 */
export const NotebookQueriesMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();
    const { workspace } = useWorkspace();
    const notification = useNotification();

    const [querySearch, setQuerySearch] = useState<string>('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [anchorQuery, setAnchorQuery] = useState<null | {
        index: number;
        id: string;
    }>(null);
    const open = Boolean(anchorEl);

    const renderedQueries = useMemo(() => {
        const s = querySearch.toLowerCase();

        return notebook.queriesList.filter(
            (q) => q.id.toLowerCase().indexOf(s) > -1,
        );
    }, [querySearch, notebook.queriesList]);

    // select the query on load
    useEffect(() => {
        // if there are no queries do not select one
        if (renderedQueries.length === 0) {
            return;
        }

        // select the first query
        const q = renderedQueries[0];
        notebook.selectQuery(q.id);
    }, []);

    /**
     * Edit or create a query
     */
    const openQueryOverlay = () => {
        workspace.openOverlay(() => (
            <NewQueryOverlay
                onClose={(newQueryId?: string) => {
                    if (newQueryId) {
                        notebook.selectQuery(newQueryId);
                    }
                    workspace.closeOverlay();
                }}
            />
        ));
    };

    /**
     * Copy a query
     * @param id - id of the query to copy
     */
    const duplicateQuery = (id: string) => {
        try {
            // get the query
            const query = state.getQuery(id);
            if (!query) {
                throw new Error(`Cannot find query ${id}`);
            }

            // get the json
            const json = query.toJSON();

            // get a new id
            const newQueryId = `${json.id} Copy`;

            // dispatch it
            state.dispatch({
                message: ActionMessages.NEW_QUERY,
                payload: {
                    queryId: newQueryId,
                    config: {
                        cells: json.cells,
                    },
                },
            });

            // close the options and select it
            handleQueryOptionsMenuClose();
            notebook.selectQuery(newQueryId);
        } catch (e) {
            // log it
            console.error(e);

            // notify the user
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    const handleQueryOptionsMenuClose = () => {
        setAnchorEl(null);
        setAnchorQuery(null);
    };

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Queries</StyledMenuTitle>
                    <IconButton
                        size="small"
                        color="default"
                        onClick={() => {
                            openQueryOverlay();
                        }}
                    >
                        <Add />
                    </IconButton>
                </Stack>
                <TextField
                    type="text"
                    size="small"
                    placeholder="Search Queries"
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>
            <StyledMenuScroll>
                <List disablePadding>
                    {renderedQueries.map((q, index) => {
                        return (
                            <List.Item
                                key={q.id}
                                disablePadding
                                secondaryAction={
                                    <>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            paddingY="8px"
                                        >
                                            {q.isLoading ? (
                                                <HourglassEmpty
                                                    color="disabled"
                                                    titleAccess="Loading"
                                                />
                                            ) : q.isError ? (
                                                <ErrorIcon
                                                    color="error"
                                                    titleAccess="Error"
                                                />
                                            ) : q.isSuccessful ? (
                                                <CheckCircle
                                                    color="success"
                                                    titleAccess="Success"
                                                />
                                            ) : (
                                                <Pending
                                                    color="disabled"
                                                    titleAccess="Pending"
                                                />
                                            )}
                                            <IconButton
                                                onClick={(
                                                    event: React.MouseEvent<HTMLElement>,
                                                ) => {
                                                    setAnchorEl(
                                                        event.currentTarget,
                                                    );
                                                    setAnchorQuery({
                                                        index: index,
                                                        id: q.id,
                                                    });
                                                }}
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </Stack>
                                    </>
                                }
                            >
                                <List.ItemButton
                                    selected={
                                        q.id === notebook.selectedQuery?.id
                                    }
                                    onClick={() => {
                                        notebook.selectQuery(q.id);
                                    }}
                                >
                                    <List.ItemText
                                        disableTypography
                                        primary={
                                            <Typography variant="subtitle2">
                                                {q.id}
                                            </Typography>
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        );
                    })}
                </List>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleQueryOptionsMenuClose}
                >
                    <List disablePadding dense>
                        <List.Item disablePadding>
                            <List.ItemButton
                                onClick={() => {
                                    notebook.selectQuery(anchorQuery?.id);
                                    handleQueryOptionsMenuClose();
                                }}
                            >
                                <StyledListIcon>
                                    <Edit color="inherit" fontSize="small" />
                                </StyledListIcon>
                                <List.ItemText primary="Edit" />
                            </List.ItemButton>
                        </List.Item>
                        <List.Item disablePadding>
                            <List.ItemButton
                                onClick={() => {
                                    duplicateQuery(anchorQuery?.id);
                                }}
                            >
                                <StyledListIcon>
                                    <ContentCopy
                                        color="inherit"
                                        fontSize="small"
                                    />
                                </StyledListIcon>
                                <List.ItemText primary="Duplicate" />
                            </List.ItemButton>
                        </List.Item>
                        <Divider />
                        <List.Item disablePadding>
                            <List.ItemButton
                                onClick={() => {
                                    state.dispatch({
                                        message: ActionMessages.DELETE_QUERY,
                                        payload: {
                                            queryId: anchorQuery?.id,
                                        },
                                    });
                                    if (notebook.queriesList.length) {
                                        const nextQueryIndex =
                                            anchorQuery.index >=
                                            notebook.queriesList.length
                                                ? notebook.queriesList.length -
                                                  1
                                                : anchorQuery.index;
                                        notebook.selectQuery(
                                            notebook.queriesList[nextQueryIndex]
                                                .id,
                                        );
                                    }
                                    handleQueryOptionsMenuClose();
                                }}
                            >
                                <StyledListIcon>
                                    <Delete color="error" fontSize="small" />
                                </StyledListIcon>
                                <List.ItemText
                                    primary="Delete"
                                    primaryTypographyProps={{
                                        color: 'error',
                                    }}
                                ></List.ItemText>
                            </List.ItemButton>
                        </List.Item>
                    </List>
                </Menu>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
