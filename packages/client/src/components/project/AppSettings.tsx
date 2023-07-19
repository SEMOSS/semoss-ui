import { useEffect, useState } from 'react';
import {
    Avatar,
    Button,
    Switch,
    Table,
    Typography,
    Divider,
    TextField,
    styled,
} from '@semoss/ui';

import {
    Person,
    ToggleOff,
    Cached,
    PublishedWithChanges,
    InsertLink,
} from '@mui/icons-material';

import { useNotification } from '@semoss/components';

import { usePixel, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

const StyledAppSettings = styled('div')({
    width: '100%',
});

const StyledCardContainer = styled('div')(({ theme }) => ({
    width: '100%',
    gap: theme.spacing(2),
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: theme.shape.borderRadius,
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
}));

const StyledTopCardContainer = styled('div')(({ theme }) => ({
    width: '100%',
    gap: theme.spacing(2),
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: theme.shape.borderRadius,
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    marginBottom: theme.spacing(1),
}));

const StyledRightSwitch = styled(Switch)(({ theme }) => ({
    marginLeft: 'auto',
    paddingRight: theme.spacing(1),
}));

const StyledRightButton = styled(Button)(({ theme }) => ({
    marginLeft: 'auto',
    paddingRight: theme.spacing(1),
}));

const StyledCardDiv = styled('div')(({ theme }) => ({
    gap: theme.spacing(2),
    flex: '1 0 0',
    display: 'flex',
    padding: theme.spacing(2),
    alignItems: 'flex-start',
}));

const StyledCardLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    height: theme.spacing(33),
    width: '50%',
    gap: '1rem',
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

const StyledListItemHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    width: theme.spacing(79),
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

const StyledSubColumn = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSubRow = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    width: '100%',
    margin: '10px 0',
});

const StyledLeftActionContainer = styled('div')({
    display: 'flex',
    gap: '4px',
    flex: '1 0 0',
    alignItems: 'flex-end',
    justifyContent: 'center',
});

const StyledLeftActionDiv = styled('div')({
    gap: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledActionDivLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    paddingRight: theme.spacing(4),
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
}));

const StyledPersonIcon = styled(Person)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
}));

const StyledSwitchIcon = styled(ToggleOff)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: theme.spacing(1),
}));

const StyledRefreshIcon = styled(Cached)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: theme.spacing(1),
}));

const StyledCardRight = styled('div')(() => ({
    width: '50%',
}));

const StyledTable = styled(Table)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    borderColor: theme.palette.divider,
    borderStyle: 'solid',
}));

// User Table
interface User {
    id: string;
    name: string;
    date: string;
    time: string;
}

export const AppSettings = (props) => {
    const { id } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    //states on initial load
    const [portalLink, setPortalLink] = useState<string>('');
    const [reactors, setReactors] = useState([]);
    const [user, setUser] = useState<User>({});
    const [enablePublish, setEnablePublish] = useState<boolean>(true);

    const getProjectReactors = usePixel(
        `GetProjectAvailableReactors(project=['${id}']);`,
    );

    const getPortalLink = usePixel(
        //pixel fetch link --> dummy pixel
        `GetProjectAvailableReactors(project=['${id}']);`,
    );

    const getLastCompiledPerson = usePixel(
        //pixel fetch user info --> dummy pixel
        `GetProjectAvailableReactors(project=['${id}']);`,
    );

    //on mount, set link, set initial reactors, set last compiled by
    useEffect(() => {
        if (
            getProjectReactors.status !== 'SUCCESS' ||
            !getProjectReactors.data
        ) {
            setReactors([
                'reloadInsightClasses',
                'getAllCasesInTriage',
                'moveCases',
                'assignNextCase',
                'getNextCase',
            ]);
        }

        if (getPortalLink.status !== 'SUCCESS') {
            setPortalLink('https://amedeloitte.sharepoint.com/:p:/s/123456');
        }

        if (getLastCompiledPerson.status !== 'SUCCESS') {
            setUser({
                id: 'test',
                name: 'Rose Memis',
                date: '7/18/2023',
                time: '10:00AM',
            });
        }
    }, []);

    /** LOADING */
    if (getProjectReactors.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Getting members" />;
    }

    const recompileReactors = () => {
        const pixelString = `ReloadInsightClasses('${id}');`;

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        content: output,
                    });

                    return;
                }

                notification.add({
                    color: 'success',
                    content: 'Successfully recompiled',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    const publish = () => {
        const pixelString = `PublishProject('${id}');`;

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        content: output,
                    });

                    return;
                }

                notification.add({
                    color: 'success',
                    content: 'Successfully published',
                });

                //if success setPortalLink?
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    const enablePublishing = () => {
        setEnablePublish((publish) => !publish);
        console.log('test enable publishing', enablePublish);
        //if enablePublish --> hit new reactor

        if (enablePublish)
            notification.add({
                color: 'success',
                content: 'Successfully enabled publishing',
            });
    };

    return (
        <StyledAppSettings>
            <StyledTopCardContainer>
                <StyledCardDiv>
                    <StyledCardLeft>
                        <StyledListItemHeader>
                            <Typography variant="h6">Portal</Typography>
                        </StyledListItemHeader>

                        <StyledLeftActionContainer>
                            <StyledLeftActionDiv>
                                <StyledActionDivLeft>
                                    <Typography variant="body2">
                                        Last compiled by:
                                    </Typography>
                                </StyledActionDivLeft>
                                <Avatar>
                                    <StyledPersonIcon />
                                </Avatar>
                                <Typography variant="body2">
                                    {user.name}
                                </Typography>
                                <Typography variant="body2">
                                    {user.time}
                                </Typography>
                                <Typography variant="body2">on</Typography>
                                <Typography variant="body2">
                                    {user.date}
                                </Typography>
                            </StyledLeftActionDiv>
                        </StyledLeftActionContainer>
                    </StyledCardLeft>

                    <StyledCardRight>
                        <StyledSubColumn>
                            <StyledSubRow>
                                <StyledSwitchIcon />
                                <Typography variant="subtitle1">
                                    Enable Publishing
                                </Typography>
                            </StyledSubRow>

                            <StyledSubRow>
                                <Typography variant="body2">
                                    Enable the publishing of the portal.
                                </Typography>

                                <StyledRightSwitch
                                    value={enablePublish}
                                    onClick={() => {
                                        enablePublishing();
                                    }}
                                ></StyledRightSwitch>
                            </StyledSubRow>
                        </StyledSubColumn>

                        <Divider />

                        <StyledSubColumn>
                            <StyledSubRow>
                                <StyledRefreshIcon />
                                <Typography variant="subtitle1">
                                    Publish Portal
                                </Typography>
                            </StyledSubRow>

                            <StyledSubRow>
                                <Typography variant="body2">
                                    Publish the portal to generate a shareable
                                    link.
                                </Typography>

                                <StyledRightButton
                                    variant="outlined"
                                    onClick={() => {
                                        publish();
                                    }}
                                >
                                    <PublishedWithChanges />
                                    Publish
                                </StyledRightButton>
                            </StyledSubRow>

                            <StyledSubRow>
                                <TextField
                                    focused={false}
                                    label={'Link'}
                                    variant={'outlined'}
                                    defaultValue={portalLink}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        startAdornment: <InsertLink />,
                                    }}
                                >
                                    {portalLink}
                                </TextField>
                            </StyledSubRow>
                        </StyledSubColumn>
                    </StyledCardRight>
                </StyledCardDiv>
            </StyledTopCardContainer>

            <StyledCardContainer>
                <StyledCardDiv>
                    <StyledCardLeft>
                        <StyledListItemHeader>
                            <Typography variant="h6">Reactors</Typography>
                        </StyledListItemHeader>

                        <StyledListItemHeader>
                            Custom reactors created for the portal.
                        </StyledListItemHeader>
                        <Button
                            variant="contained"
                            onClick={() => {
                                recompileReactors();
                            }}
                        >
                            Recompile
                        </Button>
                        <StyledLeftActionContainer>
                            <StyledLeftActionDiv>
                                <StyledActionDivLeft>
                                    <Typography variant="body2">
                                        Last compiled by:
                                    </Typography>
                                </StyledActionDivLeft>
                                <Avatar>
                                    <StyledPersonIcon />
                                </Avatar>
                                <Typography variant="body2">
                                    {user.name}
                                </Typography>
                                <Typography variant="body2">
                                    {user.time}
                                </Typography>
                                <Typography variant="body2">on</Typography>
                                <Typography variant="body2">
                                    {user.date}
                                </Typography>
                            </StyledLeftActionDiv>{' '}
                        </StyledLeftActionContainer>
                    </StyledCardLeft>
                    <StyledCardRight>
                        <StyledTable>
                            <Table.Body>
                                {reactors.map((reactor, i) => {
                                    return (
                                        <Table.Row key={reactor + i}>
                                            <Table.Cell>{reactor}</Table.Cell>
                                            <Table.Cell align="right">
                                                <Person fontSize="medium" />
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </StyledTable>
                    </StyledCardRight>
                </StyledCardDiv>
            </StyledCardContainer>
        </StyledAppSettings>
    );
};
