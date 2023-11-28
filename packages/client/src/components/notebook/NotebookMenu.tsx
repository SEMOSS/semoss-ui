import { useMemo, useState } from 'react';
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
import { useNotebook } from '@/hooks';
import { Add, Edit, Search } from '@mui/icons-material';
import { QueryOverlay } from './QueryOverlay';

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
    const { notebook } = useNotebook();

    const [search, setSearch] = useState<string>('');

    const renderedQueries = useMemo(() => {
        const s = search.toLowerCase();

        return notebook.queriesList.filter(
            (q) => q.id.toLowerCase().indexOf(s) > -1,
        );
    }, [search, notebook.queriesList]);

    /**
     * Edit or create a query
     * @param id - id to open in the overlay. If not defined, it will create a new one.
     */
    const openQueryOverlay = (id = '') => {
        notebook.openOverlay(() => (
            <QueryOverlay id={id} onClose={() => notebook.closeOverlay()} />
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
                            <List.Item
                                key={q.id}
                                dense={true}
                                secondaryAction={
                                    <List.ItemButton
                                        onClick={() => openQueryOverlay(q.id)}
                                    >
                                        <Edit />
                                    </List.ItemButton>
                                }
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        console.log(q.id);
                                        notebook.selectQuery(q.id);
                                    }}
                                >
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
                                </List.ItemButton>
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
