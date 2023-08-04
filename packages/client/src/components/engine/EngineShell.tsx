import React, { useState, useEffect } from 'react';
import { useNotification } from '@semoss/components';
import {
    Breadcrumbs,
    Button,
    Chip,
    LinearProgress,
    styled,
    Stack,
    Typography,
} from '@semoss/ui';
import { Link } from 'react-router-dom';
import {
    ArrowCircleDown,
    EditOutlined,
    SimCardDownload,
} from '@mui/icons-material';
import { formatName } from '@/utils';
import { EditDatabaseDetails } from '@/components/database';
import defaultDbImage from '../../assets/img/placeholder.png';

import { Page, LoadingScreen } from '@/components/ui';
import { useRootStore, useDatabase, usePixel } from '@/hooks';
import { types } from 'util';

const StyledInfo = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(4),
    overflow: 'hidden',
}));

const StyledInfoLeft = styled('div')(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
}));

const StyledInfoRight = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledInfoDescription = styled(Typography)(() => ({
    maxWidth: '50%',
    textOverflow: 'ellipsis',
}));

const StyledChipContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
}));

const StyledInfoFooter = styled(Typography)(() => ({
    textTransform: 'uppercase',
    textOverflow: 'ellipsis',
}));

const StyledUsabilityProgress = styled(LinearProgress)(({ theme }) => ({
    flex: 1,
    width: theme.spacing(1),
}));

const StyledLink = styled(Link)(({ theme }) => ({
    textDecoration: 'none',
    color: 'inherit',
}));

const StyledDatabaseImage = styled('img')({
    width: '288px',
    height: '161.723px',
    flexShrink: '0',
    borderRadius: '8.862px',
});

interface EngineShellProps {
    /** Children to wrap in the RootStore */
    children: React.ReactNode;
}

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineShell = (props: EngineShellProps) => {
    const { children } = props;

    // get the database information
    const { type, id, role, metaVals, refresh } = useDatabase();

    // Service for Axios calls
    const { monolithStore, configStore } = useRootStore();

    // notification service
    const notification = useNotification();

    // set if it can edit
    const canEdit = role === 'OWNER' || role === 'EDITOR';

    // track the edit state
    const [edit, setEdit] = useState(false);

    // mutible votes object
    const [votes, setVotes] = useState<
        { total: number; userVote: number } | undefined
    >();

    // get the engine info
    const { status, data } = usePixel(
        `GetEngineMetadata(engine=["${id}"], metaKeys=[]); `,
    );

    // const {
    //     status: voteStatus,
    //     data: voteData,
    //     refresh: voteRefresh,
    // } = usePixel<{ total: number; userVote: number }>(
    //     `GetUserDatabaseVotes(database = "${id}");`,
    // );

    // const {
    //     status: usabilityStatus,
    //     data: usabilityData,
    //     refresh: usabilityRefresh,
    // } = usePixel<number>(`UsabilityScore(database = '${id}');`);

    // useEffect(() => {
    //     if (voteStatus !== 'SUCCESS') {
    //         return;
    //     }

    //     // Set total votes and my vote status
    //     setVotes(voteData);
    // }, [voteStatus, voteData]);

    /**
     * @name voteDatabase
     * @desc
     */
    const voteDatabase = async (upVote: boolean) => {
        let pixelString = '';

        if (upVote) {
            pixelString += `VoteDatabase(database="${id}", vote=1)`;
        } else {
            pixelString += `UnvoteDatabase(database="${id}")`;
        }

        monolithStore.runQuery(pixelString).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const pixelResponse = response.pixelReturn[0].output;

            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    content: `Successfully ${
                        upVote ? 'liked' : 'unliked'
                    } database`,
                    color: 'success',
                });
                setVotes(
                    upVote
                        ? { total: (votes.total += 1), userVote: 1 }
                        : { total: (votes.total -= 1), userVote: 0 },
                );
            } else {
                notification.add({
                    content: 'Error voting',
                    color: 'error',
                });
            }
        });
    };

    /**
     * @name exportDB
     * @desc export DB pixel
     */
    const exportDB = () => {
        const pixel = `META|ExportDatabase(database=["${id}"] );`;

        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output,
                insightID = response.insightID;

            monolithStore.download(insightID, output);
        });
    };

    // show a loading screen when it is pending
    if (status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Opening Database" />;
    }

    console.log(data);
    console.log('metavals', metaVals);

    return (
        <Page
            header={
                <Stack>
                    <Breadcrumbs>
                        <StyledLink to={`/catalog?type=${type}`}>
                            {type === 'database'
                                ? 'Data'
                                : type.charAt(0).toUpperCase() +
                                  type.slice(1)}{' '}
                            Catalog
                        </StyledLink>
                        <StyledLink to={`/${type}/${id}`}>
                            {formatName(data.database_name)}
                        </StyledLink>
                    </Breadcrumbs>
                    <Stack
                        direction="row"
                        justifyContent={'space-between'}
                        width={'100%'}
                    >
                        <Typography variant="h4">
                            {type === 'database'
                                ? 'Data'
                                : type.charAt(0).toUpperCase() +
                                  type.slice(1)}{' '}
                            Catalog Overview
                        </Typography>
                        <Stack direction="row">
                            {configStore.store.security &&
                                data.database_discoverable && (
                                    <Button
                                        startIcon={<SimCardDownload />}
                                        variant="outlined"
                                        onClick={() => console.log('here')}
                                    >
                                        Request Access
                                    </Button>
                                )}
                            {role === 'OWNER' && (
                                <Button
                                    startIcon={<SimCardDownload />}
                                    variant="outlined"
                                    onClick={() => exportDB()}
                                >
                                    Export
                                </Button>
                            )}
                            {canEdit && (
                                <>
                                    {edit && (
                                        <EditDatabaseDetails
                                            values={metaVals}
                                            open={edit}
                                            onClose={(success) => {
                                                // reload if successfully submitted
                                                if (success) {
                                                    refresh();
                                                }

                                                setEdit(false);
                                            }}
                                        ></EditDatabaseDetails>
                                    )}
                                    <Button
                                        onClick={() => setEdit(!edit)}
                                        startIcon={<EditOutlined />}
                                        variant={'contained'}
                                    >
                                        Edit
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Stack>
                </Stack>
            }
        >
            <StyledInfo>
                <StyledInfoLeft>
                    <Typography variant={'h6'} fontWeight={'medium'}>
                        {formatName(data.database_name)}
                    </Typography>
                    <StyledInfoDescription variant={'subtitle1'}>
                        {metaVals.description}
                    </StyledInfoDescription>

                    <StyledChipContainer>
                        {metaVals.tag &&
                            metaVals.tag.map((tag, i) => {
                                return (
                                    <Chip
                                        key={i}
                                        variant={'outlined'}
                                        label={tag}
                                    />
                                );
                            })}
                    </StyledChipContainer>
                </StyledInfoLeft>
                <StyledInfoRight>
                    <StyledDatabaseImage
                        // src={defaultDbImage}
                        src={`${process.env.MODULE}/api/app-${id}/appImage/download`}
                    />
                    <Stack alignItems={'flex-end'} spacing={1} marginBottom={2}>
                        <Typography variant={'body2'}>
                            Published by: J. Smith
                        </Typography>
                        <Typography variant={'body2'}>
                            Published: {data.database_date_created}
                        </Typography>
                        <Typography variant={'body2'}>
                            Updated:{' '}
                            {data.last_updated
                                ? data.last_updated
                                : '12/24/1996'}
                        </Typography>
                    </Stack>
                </StyledInfoRight>
            </StyledInfo>
            {children}
        </Page>
    );
};
