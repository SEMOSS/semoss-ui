import { useState, useEffect } from 'react';
import {
    styled,
    Grid,
    Card,
    Typography,
    Select,
    Search,
    MenuItem,
} from '@semoss/ui';

import { Icon } from '@semoss/components';

import { Search as SearchIcon, AccessTime } from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { SETTINGS_ROUTES } from './settings.constants';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSearchbarContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSort = styled(Select)(({ theme }) => ({
    display: 'flex',
    width: theme.spacing(28),
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '3px',
    flexShrink: '0',
}));

const StyledIcon = styled(Icon)({
    fontSize: '30px',
});

const CardActionsLeft = styled('div')({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
});

const CardActionsRight = styled('div')({
    display: 'flex',
    marginLeft: 'auto',
});

const DEFAULT_CARDS = SETTINGS_ROUTES.filter(
    (r) => !!r.path && r.history.length < 2,
);

console.log('', DEFAULT_CARDS);
export const SettingsIndexPage = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState(DEFAULT_CARDS);
    const [search, setSearch] = useState<string>('');
    const [sort, setSort] = useState('Name');

    const { adminMode } = useSettings();

    useEffect(() => {
        // reset the options if there is no search value
        if (!search) {
            setCards(DEFAULT_CARDS);
            return;
        }

        const cleanedSearch = search.toLowerCase();

        const filtered = DEFAULT_CARDS.filter((c) => {
            return c.title.toLowerCase().includes(cleanedSearch);
        });

        setCards(filtered);
    }, [search]);

    return (
        <StyledContainer>
            <StyledSearchbarContainer>
                <Search
                    label={'Search'}
                    onChange={(e) => {
                        setSearch(e.target.value);
                    }}
                    placeholder={'Search Databases'}
                    InputProps={{
                        startAdornment: <SearchIcon />,
                    }}
                    sx={{ width: '100%' }}
                />
                <StyledSort
                    label={'Sort'}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <MenuItem value="Name">Name</MenuItem>
                </StyledSort>
            </StyledSearchbarContainer>

            <Grid container spacing={2}>
                {cards.map((c, i) => {
                    return (
                        <Grid item key={i} sm={12} md={6} lg={4} xl={3}>
                            <Card onClick={() => navigate(c.path)}>
                                <Card.Header
                                    title={c.title}
                                    titleTypographyProps={{ variant: 'h5' }}
                                    avatar={<StyledIcon path={c.icon} />}
                                />
                                <Card.Content sx={{ marginTop: -2 }}>
                                    <Typography variant="caption">
                                        {c.description}
                                    </Typography>
                                </Card.Content>
                                {/* disabled for now */}
                                {/* <Card.Actions>
                                    <CardActionsLeft>
                                        <AccessTime fontSize="small" />
                                        <Typography variant="caption">
                                            7/19/2023 10:00AM
                                        </Typography>
                                    </CardActionsLeft>
                                    <CardActionsRight>tbd</CardActionsRight>
                                </Card.Actions> */}
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </StyledContainer>
    );
};
