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

import { Java } from '@/assets/img/Java';

const StyledAppSettings = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '1rem',
    marginBottom: theme.spacing(10),
}));

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
    paddingRight: theme.spacing(3),
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
}));

const StyledPersonIcon = styled(Person)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
}));

const StyledPublishedIcon = styled(PublishedWithChanges)(() => ({
    marginRight: '5px',
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
    borderRadius: theme.spacing(1),
    borderColor: '#BDBDBD',
    borderStyle: 'solid',
    borderCollapse: 'initial',
    borderWidth: 'thin',
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
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const admin = configStore.store.user.admin;

    //states on initial load
    const [portalLink, setPortalLink] = useState<string>('');
    const [reactors, setReactors] = useState([]);
    const [user, setUser] = useState<User>({});
    const [enablePublish, setEnablePublish] = useState(false);

    const [portalReactors, setPortalReactors] = useState<{
        reactors: string[];
        lastCompiled?: string;
        compiledBy?: string;
    }>({
        lastCompiled: '',
        reactors: [],
        compiledBy: '',
    });

    const [portalDetails, setPortalDetails] = useState<{
        url: string;
        isPublished: boolean;
        hasPortal?: boolean;
        lastCompiled?: string;
        compiledBy?: string;
    }>({
        url: '',
        isPublished: false,
        hasPortal: false,
        lastCompiled: '12/25/2022',
        compiledBy: 'J.Smith',
    });

    const getPortalDetails = usePixel<{
        url: string;
        isPublished: boolean;
        hasPortal?: boolean;
        lastCompiled?: string;
        compiledBy?: string;
    }>(`
        GetProjectPortalDetails('${id}');
    `);

    useEffect(() => {
        if (getPortalDetails.status !== 'SUCCESS') {
            return;
        }

        // Set Details for Portal
        setPortalDetails(getPortalDetails.data);

        // Get the portal reactors if we have a portal
        // if (getPortalDetails.data.isPublished) {
        getPortalReactors();
        // }
    }, [getPortalDetails.status, getPortalDetails.data]);

    /** LOADING */
    if (getPortalDetails.status !== 'SUCCESS') {
        return (
            <LoadingScreen.Trigger description="Getting project portal details" />
        );
    }

    /**
     * @name getPortalReactors
     */
    const getPortalReactors = () => {
        const pixelString = `GetProjectAvailableReactors(project=['${id}']);`;

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

                setPortalReactors({
                    ...portalReactors,
                    reactors: output,
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /**
     * @name recompileReactors
     */
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

    /**
     * @name publish
     * @desc Publishes Portal
     */
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

                setPortalDetails({
                    ...portalDetails,
                    url: output,
                });

                notification.add({
                    color: 'success',
                    content: 'Successfully published',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /**
     * @name enablePublishing
     */
    const enablePublishing = () => {
        monolithStore
            .setProjectPortal(admin, id, !portalDetails.hasPortal)
            .then((resp) => {
                if (resp.data) {
                    setPortalDetails({
                        ...portalDetails,
                        hasPortal: !portalDetails.hasPortal,
                    });
                } else {
                    notification.add({
                        color: 'error',
                        content: `Unsuccessfully ${
                            !portalDetails.hasPortal ? 'disabled' : 'enabled'
                        } portal`,
                    });
                }
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    return (
        <StyledAppSettings>
            <StyledTopCardContainer>
                <StyledCardDiv>
                    <StyledCardLeft>
                        <StyledListItemHeader>
                            <Typography variant="h6">Portals</Typography>
                        </StyledListItemHeader>

                        <StyledLeftActionContainer>
                            {portalDetails.lastCompiled && (
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
                                        {portalDetails.compiledBy}
                                    </Typography>
                                    <Typography variant="body2">on</Typography>
                                    <Typography variant="body2">
                                        {portalDetails.lastCompiled}
                                    </Typography>
                                </StyledLeftActionDiv>
                            )}
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
                                    checked={portalDetails.hasPortal}
                                    value={portalDetails.hasPortal}
                                    onChange={() => {
                                        enablePublishing();
                                    }}
                                ></StyledRightSwitch>
                            </StyledSubRow>
                        </StyledSubColumn>

                        <>
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
                                        Publish the portal to generate a
                                        shareable link.
                                    </Typography>

                                    <StyledRightButton
                                        disabled={!portalDetails.hasPortal}
                                        variant="outlined"
                                        onClick={() => {
                                            publish();
                                        }}
                                    >
                                        <StyledPublishedIcon />
                                        Publish
                                    </StyledRightButton>
                                </StyledSubRow>

                                <StyledSubRow>
                                    <TextField
                                        focused={false}
                                        label={'Link'}
                                        variant={'outlined'}
                                        value={
                                            portalDetails.hasPortal
                                                ? portalDetails.url
                                                : ''
                                        }
                                        sx={{ width: '100%' }}
                                        InputProps={{
                                            startAdornment: <InsertLink />,
                                        }}
                                    >
                                        {portalDetails.hasPortal
                                            ? portalDetails.url
                                            : ''}
                                    </TextField>
                                </StyledSubRow>
                            </StyledSubColumn>
                        </>
                    </StyledCardRight>
                </StyledCardDiv>
            </StyledTopCardContainer>

            {portalReactors.reactors.length ? (
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
                            {portalReactors.lastCompiled && (
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
                                            {portalReactors.compiledBy}
                                        </Typography>
                                        {/* <Typography variant="body2">
                                        {user.time}
                                    </Typography> */}
                                        <Typography variant="body2">
                                            on
                                        </Typography>
                                        <Typography variant="body2">
                                            {portalReactors.lastCompiled}
                                        </Typography>
                                    </StyledLeftActionDiv>{' '}
                                </StyledLeftActionContainer>
                            )}
                        </StyledCardLeft>
                        <StyledCardRight>
                            <StyledTable>
                                <Table.Body>
                                    {portalReactors.reactors.map(
                                        (reactor, i) => {
                                            return (
                                                <Table.Row key={reactor + i}>
                                                    <Table.Cell>
                                                        {reactor}
                                                    </Table.Cell>
                                                    <Table.Cell align="right">
                                                        <Java />
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        },
                                    )}
                                </Table.Body>
                            </StyledTable>
                        </StyledCardRight>
                    </StyledCardDiv>
                </StyledCardContainer>
            ) : null}
        </StyledAppSettings>
    );
};
