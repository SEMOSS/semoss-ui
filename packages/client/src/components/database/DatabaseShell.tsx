import React, { useState, useEffect } from 'react';
import { useNotification } from '@semoss/components';
import {
    styled,
    Stack,
    Typography,
    Button,
    Breadcrumbs,
    LinearProgress,
} from '@semoss/ui';
import { Link } from 'react-router-dom';
import { AddCircle } from '@mui/icons-material';

import { Page, LoadingScreen } from '@/components/ui';
import { useRootStore, useDatabase, usePixel } from '@/hooks';

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
interface DatabaseShellProps {
    /** Children to wrap in the RootStore */
    children: React.ReactNode;
}

/**
 * Wrap the Database routes and provide styling/functionality
 */
export const DatabaseShell = (props: DatabaseShellProps) => {
    const { children } = props;

    // get the database information
    const { id } = useDatabase();

    // Service for Axios calls
    const { monolithStore } = useRootStore();

    // notification service
    const notification = useNotification();

    // mutible votes object
    const [votes, setVotes] = useState<
        { total: number; userVote: number } | undefined
    >();

    // get the database info
    const { status, data } = usePixel<{
        database_name: string;
        description: string;
        last_updated: string;
    }>(
        `GetDatabaseMetadata(database=["${id}"], metaKeys=["database_name", "description"]); `,
    );

    const {
        status: voteStatus,
        data: voteData,
        refresh: voteRefresh,
    } = usePixel<{ total: number; userVote: number }>(
        `GetUserDatabaseVotes(database = "${id}");`,
    );

    const {
        status: usabilityStatus,
        data: usabilityData,
        refresh: usabilityRefresh,
    } = usePixel<number>(`UsabilityScore(database = '${id}');`);

    useEffect(() => {
        if (voteStatus !== 'SUCCESS') {
            return;
        }

        // Set total votes and my vote status
        setVotes(voteData);
    }, [voteStatus, voteData]);

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

    // show a loading screen when it is pending
    if (status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Opening Database" />;
    }

    // show a loading screen when it is pending
    if (voteStatus !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Getting Social Stats" />;
    }

    // show a loading screen when it is pending
    if (usabilityStatus !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Getting Usability Score" />;
    }

    console.log(usabilityData);

    return (
        <Page
            header={
                <Stack>
                    <Breadcrumbs>
                        <StyledLink to="/catalog">Data Catalog</StyledLink>
                        <StyledLink to={`/database/${id}`}>
                            {data.database_name}
                        </StyledLink>
                    </Breadcrumbs>
                    <Stack
                        direction="row"
                        justifyContent={'space-between'}
                        width={'100%'}
                    >
                        <Typography variant="h4">
                            Data Catalog Overview
                        </Typography>
                        <Stack direction="row">
                            <Button>Print Metadata</Button>
                            <Button>Print Metadata</Button>

                            <Button
                                startIcon={<AddCircle />}
                                variant={'contained'}
                            >
                                New Insight
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            }
        >
            <StyledInfo>
                <StyledInfoLeft>
                    <Typography variant={'h6'} fontWeight={'medium'}>
                        {data.database_name}
                    </Typography>
                    <StyledInfoDescription variant={'subtitle1'}>
                        {data.description}
                    </StyledInfoDescription>

                    <StyledInfoFooter variant={'caption'}>
                        Updated {data.last_updated}
                    </StyledInfoFooter>
                </StyledInfoLeft>
                <StyledInfoRight>
                    <img
                        src={`${process.env.MODULE}/api/app-${id}/appImage/download`}
                    />
                    {votes && (
                        <></>
                        // <Stack direction="row" spacing={1} marginBottom={2}>
                        //     <p>
                        //         {votes.total}{' '}
                        //         {votes.total === 1
                        //             ? 'member likes'
                        //             : 'members like'}{' '}
                        //         this dataset
                        //     </p>

                        //     <IconButton
                        //         size="sm"
                        //         color={'grey'}
                        //         onClick={() => {
                        //             // if true ? downvote : upvote
                        //             voteDatabase(votes.userVote ? false : true);
                        //         }}
                        //     >
                        //         <Icon
                        //             path={
                        //                 votes.userVote
                        //                     ? mdiThumbUp
                        //                     : mdiThumbUpOutline
                        //             }
                        //             size="md"
                        //         ></Icon>
                        //     </IconButton>
                        // </Stack>
                    )}
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        spacing={1}
                        marginBottom={2}
                    >
                        <StyledUsabilityProgress
                            value={usabilityData * 10}
                            variant={'determinate'}
                        />
                        <Typography variant="body2">
                            {usabilityData * 10}%
                        </Typography>

                        {/* <Tooltip title="The SEMOSS Usability Score is calculated by the datasets level of documentation">
                            <IconButton size="small">
                                <InfoOutlined />
                            </IconButton>
                        </Tooltip> */}
                    </Stack>
                </StyledInfoRight>
            </StyledInfo>
            {children}
        </Page>
    );
};
