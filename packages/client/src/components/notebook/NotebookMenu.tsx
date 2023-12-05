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
} from '@semoss/ui';
import { useBlocks, useWorkspace } from '@/hooks';
import { Add, Search } from '@mui/icons-material';
import { NewQueryOverlay } from './NewQueryOverlay';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
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

/**
 * Render the side menu of the nodebook
 */
export const NotebookMenu = observer((): JSX.Element => {
    const { notebook } = useBlocks();
    const { workspace } = useWorkspace();

    const [search, setSearch] = useState<string>('');

    const renderedQueries = useMemo(() => {
        const s = search.toLowerCase();

        return notebook.queriesList.filter(
            (q) => q.id.toLowerCase().indexOf(s) > -1,
        );
    }, [search, notebook.queriesList]);

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
            <NewQueryOverlay onClose={() => workspace.closeOverlay()} />
        ));
    };

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <TextField
                    type="text"
                    size={'small'}
                    label={'Queries'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth={true}
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
                                    selected={
                                        q.id === notebook.selectedQuery?.id
                                    }
                                    onClick={() => {
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
        </StyledMenu>
    );
});
