import React, { useState, useEffect } from 'react';
import {
    styled,
    Input,
    Button,
    Icon,
    Grid,
    Dropdown,
} from '@semoss/components';
import { theme } from '@/theme';
import { Card } from '@/components/ui';
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

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

const StyledSearch = styled('div', {
    width: '50%',
    // display: 'flex',
    // alignItems: 'center',
});

const StyledCard = styled(Card, {
    '&:hover': {
        cursor: 'pointer',
        boxShadow: '20',
    },
});

const StyledCardHeader = styled(Card.Header, {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.space['0'],
    // border: 'solid black',
});

const StyledCardContent = styled(Card.Content, {
    // border: 'solid black',
    fontSize: theme.fontSizes.sm,
    height: '8rem',
});

const StyledCardFooter = styled(Card.Footer, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '1rem',
    paddingRight: theme.space['0'],
});

const StyledHeaderIcon = styled(Icon, {
    height: '2rem',
    width: '2rem',
    marginRight: '.5rem',
    display: 'flex',
    alignItems: 'center',
});

const StyledSet = styled('div', {
    // borderBottomWidth: theme.borderWidths.default,
    // borderBottomColor: theme.colors['grey-4'],
    // paddingBottom: theme.space['8'],
    // marginBottom: theme.space['12'],
});

const StyledSetHeader = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space['8'],
});

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.sm,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['8'],
});

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

export const SettingsPage = () => {
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
        <StyledContainer>
            <StyledDescription>
                View and make changes to settings at the database, project, and
                insight level.
                {adminMode
                    ? ' As an admin conduct queries on SEMOSS specific databases as well as view and edit existing social properties'
                    : ''}
            </StyledDescription>
            <StyledSet>
                <StyledSetHeader>
                    <StyledSearch>
                        <Input
                            onChange={(e: string) => {
                                setSearch(e);
                            }}
                            placeholder={'Search....'}
                            // Move to Header
                        ></Input>
                    </StyledSearch>
                </StyledSetHeader>
            </StyledSet>

            <Grid>
                {cards.map((c, i) => {
                    return c.adminPortal && !adminMode ? (
                        <div key={i}></div>
                    ) : (
                        <Grid.Item
                            key={i}
                            responsive={{
                                sm: 12,
                                md: 6,
                                lg: 4,
                                xl: 3,
                            }}
                        >
                            <StyledCard onClick={() => navigate(c.route)}>
                                <StyledCardHeader>
                                    <StyledHeaderIcon
                                        path={c.icon}
                                    ></StyledHeaderIcon>
                                    <div>{c.title}</div>
                                </StyledCardHeader>
                                <StyledCardContent>
                                    {c.description}
                                </StyledCardContent>
                                {/* <StyledCardFooter>
                                    <p>
                                        <b>{c.pendingRequests} </b> Pending
                                        Requests
                                    </p>
                                    <IconDiv>
                                        <Icon path={mdiDotsVertical}></Icon>
                                    </IconDiv>
                                </StyledCardFooter> */}
                            </StyledCard>
                        </Grid.Item>
                    );
                })}
            </Grid>
        </StyledContainer>
    );
};
