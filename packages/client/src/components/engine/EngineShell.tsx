import React, { useState } from 'react';
import {
    styled,
    Breadcrumbs,
    Button,
    Chip,
    Stack,
    Typography,
} from '@semoss/ui';

import { MODULE } from '@/constants';
import { useRootStore, useDatabase, usePixel } from '@/hooks';

import { EditDatabaseDetails } from '@/components/database';
import { Page, LoadingScreen } from '@/components/ui';
import { RequestAccess } from './';
import { Add, EditOutlined, SimCardDownload } from '@mui/icons-material';
import { formatName } from '@/utils';
import { Link } from 'react-router-dom';

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

const StyledLink = styled(Link)(() => ({
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

    // set if it can edit
    const canEdit = role === 'OWNER' || role === 'EDITOR';

    // track the edit state
    const [edit, setEdit] = useState(false);

    const [requestAccess, setRequestAccess] = useState(false);

    // get the engine info
    const { status, data } = usePixel<{
        database_name: string;
        database_discoverable: boolean;
        database_created_by?: string;
        database_date_created?: string;
        last_updated?: string;
    }>(`GetEngineMetadata(engine=["${id}"], metaKeys=[]); `);

    /**
     * @name exportDB
     * @desc export DB pixel
     */
    const exportDB = () => {
        const pixel = `META | ExportEngine(engine=["${id}"] );`;

        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output,
                insightID = response.insightID;

            monolithStore.download(insightID, output);
        });
    };

    // show a loading screen when it is pending
    if (status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Opening Engine" />;
    }

    return (
        <Page
            header={
                <Stack>
                    <Breadcrumbs>
                        <StyledLink to={`/catalog?type=${type}`}>
                            {type === 'database'
                                ? 'Data'
                                : type.charAt(0).toUpperCase() + type.slice(1)}
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
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                            Overview
                        </Typography>
                        <Stack direction="row">
                            {configStore.store.security &&
                                data.database_discoverable &&
                                role !== 'OWNER' && (
                                    <>
                                        {requestAccess && (
                                            <RequestAccess
                                                id={id}
                                                open={requestAccess}
                                                onClose={() => {
                                                    setRequestAccess(false);
                                                }}
                                            />
                                        )}
                                        <Button
                                            startIcon={<Add />}
                                            variant="outlined"
                                            onClick={() =>
                                                setRequestAccess(true)
                                            }
                                        >
                                            Request Access
                                        </Button>
                                    </>
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
                        src={`${MODULE}/api/app-${id}/appImage/download`}
                    />
                    <Stack alignItems={'flex-end'} spacing={1} marginBottom={2}>
                        <Typography variant={'body2'}>
                            Published by:
                            {data.database_created_by
                                ? data.database_created_by
                                : 'N/A'}
                        </Typography>
                        <Typography variant={'body2'}>
                            Published:
                            {data.database_date_created
                                ? data.database_date_created
                                : 'N/A'}
                        </Typography>
                        <Typography variant={'body2'}>
                            Updated:
                            {data.last_updated ? data.last_updated : 'N/A'}
                        </Typography>
                    </Stack>
                </StyledInfoRight>
            </StyledInfo>
            {children}
        </Page>
    );
};
