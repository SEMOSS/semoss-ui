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
import { useBlocks, useDesigner } from '@/hooks';
import { Add, Search } from '@mui/icons-material';

import { QueryOverlay } from './QueryOverlay';

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
    const { state } = useBlocks();
    const { designer } = useDesigner();

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
     * @param id - id to open in the overlay. If not defined, it will create a new one.
     */
    const openQueryOverlay = (id = '') => {
        designer.openOverlay(() => {
            return <QueryOverlay id={id} />;
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
                            <List.ItemButton
                                key={q.id}
                                dense={true}
                                onClick={() => {
                                    openQueryOverlay(q.id);
                                }}
                            >
                                <div>
                                    <List.ItemText
                                        primary={
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                            >
                                                {q.id}
                                            </Typography>
                                        }
                                    />
                                    <StyledJson>
                                        {JSON.stringify(q, null, 2)}
                                    </StyledJson>
                                </div>
                            </List.ItemButton>
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
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                            >
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
