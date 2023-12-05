import { useMemo, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    styled,
    List,
    Divider,
    TextField,
    IconButton,
    InputAdornment,
    Typography,
} from '@semoss/ui';
import { useBlocks, useWorkspace } from '@/hooks';
import { Add, Search } from '@mui/icons-material';

import { NewQueryOverlay } from '@/components/notebook';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
}));

const StyledMenuHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledJson = styled('pre')(({ theme }) => ({
    ...theme.typography.caption,
    textWrap: 'wrap',
}));

/**
 * Render the QueryMenu
 */
export const QueryMenu = observer((): JSX.Element => {
    // get the store
    const { state, notebook } = useBlocks();
    const { workspace } = useWorkspace();

    // store the search
    const [querySearch, setQuerySearch] = useState('');
    const [blockSearch, setBlockSearch] = useState('');

    // get the queries as an array
    const queries = computed(() => {
        return Object.values(state.queries).sort((a, b) => {
            const aId = a.id.toLowerCase(),
                bId = b.id.toLowerCase();

            if (aId < bId) {
                return -1;
            }
            if (aId > bId) {
                return 1;
            }
            return 0;
        });
    }).get();

    // get the renderedQueries
    const renderedQueries = useMemo(() => {
        if (!querySearch) {
            return queries;
        }

        const cleaned = querySearch.toUpperCase();

        return queries.filter((q) => q.id.toUpperCase().indexOf(cleaned) > -1);
    }, [queries, querySearch]);

    // get the blocks as an array
    const blocks = computed(() => {
        return Object.values(state.blocks).sort((a, b) => {
            const aId = a.id.toLowerCase(),
                bId = b.id.toLowerCase();

            if (aId < bId) {
                return -1;
            }
            if (aId > bId) {
                return 1;
            }
            return 0;
        });
    }).get();

    // get the renderedBlocks
    const renderedBlocks = useMemo(() => {
        if (!blockSearch) {
            return blocks;
        }

        const cleaned = blockSearch.toUpperCase();

        return blocks.filter((q) => q.id.toUpperCase().indexOf(cleaned) > -1);
    }, [blocks, blockSearch]);

    /**
     * Edit or create a query
     */
    const openQueryOverlay = () => {
        workspace.openOverlay(() => {
            return (
                <NewQueryOverlay
                    onClose={(newQueryId) => {
                        workspace.closeOverlay();

                        if (newQueryId) {
                            // switch the view
                            workspace.setView('data');

                            // select the query
                            notebook.selectQuery(newQueryId);
                        }
                    }}
                />
            );
        });
    };

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <TextField
                    type="text"
                    size={'small'}
                    label={'Queries'}
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    sx={{
                        flex: '1',
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton
                    size="small"
                    color="default"
                    onClick={() => {
                        openQueryOverlay();
                    }}
                >
                    <Add />
                </IconButton>
            </StyledMenuHeader>
            <Divider />
            <StyledMenuScroll>
                <List>
                    {renderedQueries.map((q) => {
                        return (
                            <List.Item key={q.id} dense={true}>
                                <List.ItemButton
                                    onClick={() => {
                                        // switch the view
                                        workspace.setView('data');

                                        // select the query
                                        notebook.selectQuery(q.id);
                                    }}
                                >
                                    <List.ItemText
                                        primary={
                                            <Typography variant="subtitle2">
                                                {q.id}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                variant="caption"
                                                noWrap={true}
                                            >
                                                {JSON.stringify(q.data)}
                                            </Typography>
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
            <Divider />
            <StyledMenuHeader>
                <TextField
                    type="text"
                    size={'small'}
                    label={'Blocks'}
                    value={blockSearch}
                    onChange={(e) => setBlockSearch(e.target.value)}
                    sx={{
                        flex: '1',
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </StyledMenuHeader>
            <Divider />
            <StyledMenuScroll>
                <List>
                    {renderedBlocks.map((b) => {
                        return (
                            <List.Item key={b.id} dense={true}>
                                <div>
                                    <List.ItemText
                                        primary={
                                            <Typography variant="subtitle2">
                                                {b.id}
                                            </Typography>
                                        }
                                    />
                                    <StyledJson>
                                        {JSON.stringify(b.data, null, 2)}
                                    </StyledJson>
                                </div>
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
