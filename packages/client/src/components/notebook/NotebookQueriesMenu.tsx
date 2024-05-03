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
import { useBlocks, useRootStore, useWorkspace } from '@/hooks';
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
    Download,
} from '@mui/icons-material';
import { NewQueryOverlay } from './NewQueryOverlay';
import { ActionMessages } from '@/stores';
import { NotebookTokensMenu } from './NotebookTokensMenu';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
}));

// const StyledMenu = styled('div')(({ theme, disabled }) => {
//     const palette = theme.palette as unknown as {
//         background: Record<string, string>;
//     };
//     return {
//         display: 'flex',
//         flexDirection: 'column',
//         height: '100%',
//         width: '100%',
//         paddingTop: theme.spacing(1),
//         backgroundColor: palette.background["paper1"],
//     };
// });

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

    const { monolithStore, configStore } = useRootStore();

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

    // requests download id with DownloadAppNotebook pixel and appId then downloads with monolithStore.download
    const exportHandler = async () => {
        workspace.setLoading(true);

        try {
            // export  the app
            const response = await monolithStore.runQuery<[string]>(
                `DownloadAppNotebook ( "${workspace.appId}" ) ;`,
            );

            const key = response.pixelReturn[0].output;
            // throw an error if there is no key
            // throw an error if index / size return as 0 indicating app is new and has not yet been saved
            if (!key) {
                throw new Error('Error downloading app notebook');
            } else if (key == 'Index: 0, Size: 0') {
                throw new Error(
                    'Error downloading app notebook. Save new apps before downloading.',
                );
            } else {
                // if no issues are indicated in the return download the app
                await monolithStore.download(configStore.store.insightID, key);
                notification.add({
                    color: 'success',
                    message: 'Success',
                });
            }
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            workspace.setLoading(false);
        }
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
        <Stack direction="column" spacing={0} sx={{ height: '100%' }}>
            <Stack
                spacing={2}
                paddingBottom={1}
                paddingLeft={2}
                paddingRight={2}
                paddingTop={3}
            >
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">
                        {notebook.selectedQuery?.id}
                    </StyledMenuTitle>
                    <IconButton
                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                            setAnchorEl(event.currentTarget);
                        }}
                    >
                        <MoreVert />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleQueryOptionsMenuClose}
                    >
                        <List disablePadding dense>
                            {/* <List.Item disablePadding>
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
                        </List.Item> */}
                            <List.Item disablePadding>
                                <List.ItemButton
                                    onClick={() => {
                                        duplicateQuery(
                                            notebook.selectedQuery?.id,
                                        );
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
                            <List.Item disablePadding>
                                <List.ItemButton onClick={exportHandler}>
                                    <StyledListIcon>
                                        <Download
                                            color="inherit"
                                            fontSize="small"
                                        />
                                    </StyledListIcon>
                                    <List.ItemText primary="Export" />
                                </List.ItemButton>
                            </List.Item>
                            <Divider />
                            <List.Item disablePadding>
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message:
                                                ActionMessages.DELETE_QUERY,
                                            payload: {
                                                queryId:
                                                    notebook.selectedQuery?.id,
                                            },
                                        });
                                        // if (notebook.queriesList.length) {
                                        //     const nextQueryIndex =
                                        //         anchorQuery.index >=
                                        //         notebook.queriesList.length
                                        //             ? notebook.queriesList.length -
                                        //               1
                                        //             : anchorQuery.index;
                                        //     notebook.selectQuery(
                                        //         notebook.queriesList[nextQueryIndex]
                                        //             .id,
                                        //     );
                                        // }
                                        handleQueryOptionsMenuClose();
                                    }}
                                >
                                    <StyledListIcon>
                                        <Delete
                                            color="error"
                                            fontSize="small"
                                        />
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
                </Stack>
            </Stack>
            <NotebookTokensMenu />
        </Stack>
    );
});
