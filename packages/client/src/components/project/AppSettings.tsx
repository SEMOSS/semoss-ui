//TODO add theme. variables
import { useEffect, useState } from 'react';
import {
    Avatar,
    Button,
    Switch,
    Table,
    Typography,
    Divider,
    TextField,
    InputAdornment,
    styled,
} from '@semoss/ui';

import {
    Person,
    ToggleOff,
    Cached,
    PublishedWithChanges,
    InsertLink,
    Circle,
} from '@mui/icons-material';

import { useNotification } from '@semoss/components';

import { usePixel, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

// Members Table
interface User {
    id: string;
    name: string;
    date: string;
    time: string;
}

const StyledAppSettings = styled('div')({
    width: '100%',
});

const StyledCardContainer = styled('div')({
    width: '100%',
    gap: '16px',
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: '12px',
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTopCardContainer = styled('div')({
    width: '100%',
    gap: '16px',
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: '12px',
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    marginBottom: '10px',
});

const StyledRightSwitch = styled(Switch)({
    marginLeft: 'auto',
    paddingRight: '10px',
});

const StyledRightButton = styled(Button)({
    marginLeft: 'auto',
    paddingRight: '10px',
});

const StyledCardDiv = styled('div')({
    gap: '16px',
    flex: '1 0 0',
    display: 'flex',
    padding: '16px',
    alignItems: 'flex-start',
});

const StyledCardLeft = styled('div')({
    display: 'flex',
    height: '260px',
    width: '50%',
    gap: '1rem',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledListItemHeader = styled('div')({
    display: 'flex',
    width: '628px',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledListItemSubheader = styled('div')({
    display: 'flex',
    width: '628px',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSubColumn = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSubRow = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignContent: 'center',
    width: '100%',
    alignItem: 'center',
    marginBottom: '10px',
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

const StyledActionDivLeft = styled('div')((theme) => ({
    display: 'flex',
    paddingRight: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
}));

const StyledPersonIcon = styled(Person)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledSwitchIcon = styled(ToggleOff)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledRefreshIcon = styled(Cached)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledCircleIcon = styled(Circle)({
    opacity: '.5',
    fontSize: '7px',
});

const StyledCardRight = styled('div')({
    width: '50%',
});

const StyledTableRow = styled(Table.Row)({
    borderLeft: 'solid red',
    borderRight: 'solid red',

    '&:first-child': {
        borderTop: 'solid yellow',
    },
    '&:last-child': {
        borderBottom: 'solid yellow',
    },
});

export const AppSettings = (props) => {
    const { id } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    // const [enablePublishing, setEnablePublishing] = useState(null);

    const [portalLink, setPortalLink] = useState<string>('');
    const [reactors, setReactors] = useState([]);
    const [user, setUser] = useState<User>({});
    const [enablePublish, setEnablePublish] = useState<boolean>(false);

    const getProjectReactors = usePixel(
        `GetProjectAvailableReactors(project=['${id}']);`,
    );

    const getPortalLink = usePixel(
        //pixel fetch link
        //if setPortalLink else display none?
        `GetProjectAvailableReactors(project=['${id}']);`,
    );

    const getLastCompiledPerson = usePixel(
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
        // console.log('test recompile');

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
        // console.log('test publish');

        const pixelString = `PublishProject('${id}');`;

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];
                // console.log('output is publish', output);

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
        // console.log('test enable publishing');
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

                                <StyledCircleIcon />

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
                                    title={`Enable Publishing`}
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
                                {/* <InputAdornment
                                InputProps={{
                                    startAdornment: <InsertLink />,
                                }}
                                focused={false}
                                variant={"outlined"}
                                >
                                </InputAdornment> */}

                                <TextField
                                    focused={false}
                                    label={'Link'}
                                    variant={'outlined'}
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

                        <StyledListItemSubheader>
                            Custom reactors created for the portal.
                        </StyledListItemSubheader>
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
                                    <StyledCircleIcon />
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
                        <Table>
                            <Table.Body>
                                {reactors.map((reactor, i) => {
                                    return (
                                        <StyledTableRow key={reactor + i}>
                                            <Table.Cell>{reactor}</Table.Cell>
                                            <Table.Cell align="right">
                                                <Person fontSize="medium" />
                                            </Table.Cell>
                                        </StyledTableRow>
                                    );
                                })}
                                {/* {getProjectReactors.data.map((reactor, i) => {
                                    return (
                                        <StyledTableRow key={reactor + i}>
                                            <Table.Cell>{reactor}</Table.Cell>
                                            <Table.Cell align="right">
                                                <Person />
                                            </Table.Cell>
                                        </StyledTableRow>
                                    );
                                })} */}
                            </Table.Body>
                        </Table>
                    </StyledCardRight>
                </StyledCardDiv>
            </StyledCardContainer>
        </StyledAppSettings>
    );
};
