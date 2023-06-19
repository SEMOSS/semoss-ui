import React, { useState, useEffect } from 'react';
import {
    styled,
    Button,
    IconButton,
    Icon,
    Tooltip,
    useNotification,
} from '@semoss/components';
import { mdiPlus, mdiThumbUp, mdiThumbUpOutline } from '@mdi/js';

import { theme } from '@/theme';
import { Image, Page, LoadingScreen } from '@/components/ui';
import { useRootStore, useDatabase, usePixel } from '@/hooks';

import { mdiInformation } from '@mdi/js';

const StyledTitleGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['4'],
});

const StyledTitle = styled('h1', {
    flex: '1',
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.semibold,
});

const StyledInfo = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.space['8'],
    overflow: 'hidden',
    // border: 'solid red',
});

const StyledInfoLeft = styled('div', {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: theme.space['2'],
    // border: 'solid green',
});

const StyledInfoDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.lg,
    maxWidth: '50%',
    overflow: 'hidden',
});

const StyledInfoRight = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    // border: 'solid blue',
});

const StyledImage = styled(Image, {
    paddingBottom: theme.space['2'],
    borderBottomWidth: theme.borderWidths.default,
    borderBottomColor: theme.colors['grey-4'],
});

const StyledInfoFooter = styled('div', {
    color: theme.colors['grey-2'],
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold,
    textTransform: 'uppercase',
    overflow: 'hidden',
});

const StyledVotesDiv = styled(StyledInfoFooter, {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '.5rem',
    marginTop: theme.space['2'],
});

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
                <StyledTitleGroup>
                    <StyledTitle>{data.database_name}</StyledTitle>
                    <Button prepend={<Icon path={mdiPlus}></Icon>}>
                        New Insight
                    </Button>
                </StyledTitleGroup>
            }
        >
            <StyledInfo>
                <StyledInfoLeft>
                    <StyledInfoDescription>
                        {data.description}
                    </StyledInfoDescription>
                    <StyledInfoFooter>
                        Updated {data.last_updated}
                    </StyledInfoFooter>
                </StyledInfoLeft>
                <StyledInfoRight>
                    <StyledImage
                        src={`${process.env.MODULE}/api/app-${id}/appImage/download`}
                    />
                    {votes && (
                        <StyledVotesDiv>
                            <p>
                                {votes.total}{' '}
                                {votes.total === 1
                                    ? 'member likes'
                                    : 'members like'}{' '}
                                this dataset
                            </p>

                            <IconButton
                                size="sm"
                                color={'grey'}
                                onClick={() => {
                                    // if true ? downvote : upvote
                                    voteDatabase(votes.userVote ? false : true);
                                }}
                            >
                                <Icon
                                    path={
                                        votes.userVote
                                            ? mdiThumbUp
                                            : mdiThumbUpOutline
                                    }
                                    size="md"
                                ></Icon>
                            </IconButton>
                        </StyledVotesDiv>
                    )}
                    <StyledVotesDiv>
                        <meter min={0} max={10} value={usabilityData}></meter>{' '}
                        <p>{usabilityData} / 10</p>
                        <Tooltip
                            align="center"
                            side="bottom"
                            content={
                                <div>
                                    <p>
                                        The SEMOSS Usability Score is calculated
                                        by the datasets level of documentation
                                    </p>
                                </div>
                            }
                        >
                            <IconButton size="sm">
                                <Icon path={mdiInformation}></Icon>
                            </IconButton>
                        </Tooltip>
                    </StyledVotesDiv>
                </StyledInfoRight>
            </StyledInfo>
            {children}
        </Page>
    );
};
