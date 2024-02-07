import { useMemo, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Chip,
    List,
    Divider,
    TextField,
    IconButton,
    InputAdornment,
    Stack,
    Typography,
} from '@/component-library';
import { useBlocks, useWorkspace } from '@/hooks';
import { Add, Search } from '@mui/icons-material';

import { NewQueryOverlay } from '@/components/notebook';
import { QueryMenuItem } from './QueryMenuItem';

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

const StyledJson = styled('pre')(({ theme }) => ({
    ...theme.typography.caption,
    textWrap: 'wrap',
}));

const StyledList = styled(List)(() => ({
    overflow: 'auto',
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
     * Create a new query
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
        <Stack id="query-blocks-menu" height="100%" divider={<Divider />}>
            <Stack height="50%" id="query-menu">
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
                <StyledList>
                    {renderedQueries.map((q) => {
                        // We can use BlocksMenuCard and repurpose it or use this component that has the similar code
                        return <QueryMenuItem key={q.id} query={q} />;
                    })}
                </StyledList>
            </Stack>
            <Stack height="50%" id="existing-blocks-menu">
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
                <StyledList>
                    {renderedBlocks.map((b) => {
                        return (
                            <List.Item key={b.id} dense={true}>
                                <div>
                                    <List.ItemText
                                        disableTypography
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
                </StyledList>
            </Stack>
        </Stack>
    );
});
