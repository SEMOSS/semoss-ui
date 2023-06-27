import { useState, useEffect } from 'react';
import { styled, Input, Grid, Card, Typography } from '@semoss/ui';
import {
    mdiAccountGroup,
    mdiClipboardTextOutline,
    mdiDatabase,
    mdiDatabaseSearch,
    mdiTabletCellphone,
    mdiTextBoxMultipleOutline,
    mdiClock,
} from '@mdi/js';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { SETTINGS_ROUTES } from './settings.constants';

const StyledSearch = styled('div')({
    width: '50%',
});

const StyledSetHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
}));

//
const DEFAULT_CARDS = SETTINGS_ROUTES.filter((r) => !!r.path);

export const SettingsIndexPage = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState(DEFAULT_CARDS);
    const [search, setSearch] = useState<string>('');

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
        <>
            <Typography variant="subtitle1">
                View and make changes to settings at the database, project, and
                insight level.
                {adminMode
                    ? ' As an admin conduct queries on SEMOSS specific databases as well as view and edit existing social properties'
                    : ''}
            </Typography>
            <StyledSetHeader>
                <StyledSearch>
                    <Input
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        placeholder={'Search....'}
                        // Move to Header
                    ></Input>
                </StyledSearch>
            </StyledSetHeader>
            <Grid container spacing={2}>
                {cards.map((c, i) => {
                    return (
                        <Grid item key={i} sm={12} md={6} lg={4} xl={3}>
                            <Card onClick={() => navigate(c.path)}>
                                <Card.Header title={c.title} />
                                <Card.Content sx={{ marginTop: -2 }}>
                                    <Typography variant="caption">
                                        {c.description}
                                    </Typography>
                                </Card.Content>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </>
    );
};
