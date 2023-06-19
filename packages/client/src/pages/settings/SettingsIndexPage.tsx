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

const StyledSearch = styled('div')({
    width: '50%',
});

const StyledSetHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
}));

const cardsArr = [
    {
        title: 'Database Settings',
        route: '/settings/database-permissions',
        description: 'View and edit settings for databases',
        pendingRequests: 15,
        icon: mdiDatabase,
        adminPortal: false,
    },
    {
        title: 'Project Settings',
        route: '/settings/project-permissions',
        description: 'View and edit settings for projects',
        pendingRequests: 15,
        icon: mdiClipboardTextOutline,
        adminPortal: false,
    },
    {
        title: 'Insight Settings',
        route: '/settings/insight-permissions',
        description: 'View and edit settings for project insights',
        pendingRequests: 15,
        icon: mdiTextBoxMultipleOutline,
        adminPortal: false,
    },
    {
        title: 'Member Settings',
        route: '/settings/members',
        description:
            'Add new members, reset passwords, and edit member-based permissions.',
        pendingRequests: 15,
        icon: mdiAccountGroup,
        adminPortal: true,
    },
    {
        title: 'Admin Query',
        route: '/settings/admin-query',
        description: 'Query on SEMOSS based databases',
        pendingRequests: 3,
        icon: mdiDatabaseSearch,
        adminPortal: true,
    },
    {
        title: 'Social Properties',
        route: '/settings/social-properties',
        description: 'Edit social properties',
        pendingRequests: 3,
        icon: mdiTabletCellphone,
        adminPortal: true,
    },
    {
        title: 'Jobs',
        route: '/settings/jobs',
        description: 'View, add, and edit scheduled jobs',
        pendingRequests: 3,
        icon: mdiClock,
        adminPortal: false,
    },
    // {
    //     title: 'External Connections',
    //     route: '/settings/external-connections',
    //     description:
    //         'Integrate with external services like Dropbox, Google, Github, and more.',
    //     pendingRequests: 15,
    //     icon: mdiDatabase,
    // },
    // {
    //     title: 'Teams',
    //     route: '/settings/teams',
    //     description: 'Create and manage teams and set team level permissions.',
    //     pendingRequests: 15,
    //     icon: mdiDatabase,
    // },
    // {
    //     title: 'Teams Management',
    //     route: '/settings/teams-management',
    //     description: 'Create teams and manage members.',
    //     pendingRequests: 15,
    //     icon: mdiDatabase,
    // },
    // {
    //     title: 'Teams Permissions',
    //     route: '/settings/teams-permissions',
    //     description: 'Edit permission roles of teams.',
    //     pendingRequests: 15,
    //     icon: mdiDatabase,
    // },
    // {
    //     title: 'My Profile',
    //     route: '/settings/my-profile',
    //     description: 'Update profile settings.',
    //     pendingRequests: 15,
    //     icon: mdiDatabase,
    // },
    // {
    //     title: 'Theming',
    //     route: '/settings/theme',
    //     description: 'Update theme, this is an admin process.',
    //     pendingRequests: 15,
    //     icon: mdiDatabase,
    // },
];

export const SettingsIndexPage = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState(cardsArr);
    const [search, setSearch] = useState<string>('');

    // load while it filters admin
    const [loading, setLoading] = useState(true);

    const { adminMode } = useSettings();

    useEffect(() => {
        if (!search) {
            // reset the options if there is no search value
            setCards(cardsArr);
        } else {
            const filtered = cardsArr.filter((c) => {
                return c.title.toLowerCase().includes(search.toLowerCase());
            });
            setCards(filtered);
        }

        if (loading) {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    }, [search]);

    if (loading) {
        return (
            <LoadingScreen.Trigger description="Retrieving Settings"></LoadingScreen.Trigger>
        );
    }

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
                    return c.adminPortal && !adminMode ? (
                        <div key={i}></div>
                    ) : (
                        <Grid item key={i} sm={12} md={6} lg={4} xl={3}>
                            <Card onClick={() => navigate(c.route)}>
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
