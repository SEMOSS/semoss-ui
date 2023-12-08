import React, { useState } from 'react';
import {
    styled,
    Breadcrumbs,
    Button,
    Chip,
    Card,
    IconButton,
    Stack,
    Typography,
    Tooltip,
    useNotification,
    CircularProgress,
} from '@semoss/ui';

import { Env } from '@/env';
import { useRootStore, useEngine, usePixel } from '@/hooks';

import { EditDatabaseDetails } from '@/components/database';
import { EditDatabaseImage } from '@/components/database';
import { Page, LoadingScreen } from '@/components/ui';
import { EngineAccessButton } from './';
import {
    EditRounded,
    SimCardDownload,
    ContentCopyOutlined,
} from '@mui/icons-material';
import { formatName } from '@/utils';
import { Link } from 'react-router-dom';

const StyledIconButton = styled(IconButton)(() => ({
    marginTop: '-3px',
    marginLeft: '2px',
}));

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
    width: '288px',
}));

const StyledInfoDescription = styled(Typography)(() => ({
    maxWidth: '699px',
    maxHeight: '174px',
    textOverflow: 'ellipsis',
    color: 'rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
    whiteSpace: 'normal',
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

const StyledDatabaseImage = styled(Card.Media)({
    width: '288px',
    height: '161.723px',
    flexShrink: '0',
    borderRadius: '8.862px',
    aspectRatio: 'auto',
});

const StyledImageOverlay = styled(Typography)({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    paddingTop: '20%',
    color: 'white',
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
    const { id, type, name, role, metaVals, refresh } = useEngine();

    // Service for Axios calls
    const { monolithStore } = useRootStore();

    // notification
    const notification = useNotification();

    // set if it can edit
    const canEdit = role === 'OWNER' || role === 'EDITOR';

    // track the edit state
    const [edit, setEdit] = useState(false);

    // track the image edit state
    const [editImage, setEditImage] = useState(false);

    // export loading state
    const [exportLoading, setExportLoading] = useState(false);

    // Image Hover state
    const [imageHover, setImageHover] = useState(false);

    // get the engine info
    const { status, data } = usePixel<{
        database_name: string;
        database_discoverable: boolean;
        database_created_by?: string;
        database_date_created?: string;
        last_updated?: string;
        description?: string;
    }>(`GetEngineMetadata(engine=["${id}"], metaKeys=[]); `);

    /**
     * @name exportDB
     * @desc export DB pixel
     */
    const exportDB = () => {
        setExportLoading(true);
        const pixel = `META | ExportEngine(engine=["${id}"] );`;

        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output,
                insightID = response.insightID;

            monolithStore.download(insightID, output);
        });
        setExportLoading(false);
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
                        <StyledLink to={`..`}>{name} Catalog</StyledLink>
                        <StyledLink to={`.`}>
                            {formatName(data.database_name)}
                        </StyledLink>
                    </Breadcrumbs>
                    <Stack direction="row" alignItems={'center'} width={'100%'}>
                        <Typography variant="h4">
                            {formatName(data.database_name)}
                        </Typography>
                        <Stack flex={1}> &nbsp;</Stack>
                        <Stack direction="row">
                            <EngineAccessButton />
                            {role === 'OWNER' && (
                                <Button
                                    disabled={exportLoading}
                                    startIcon={
                                        exportLoading ? (
                                            <CircularProgress size="1em" />
                                        ) : (
                                            <SimCardDownload />
                                        )
                                    }
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
                                            type={
                                                type.charAt(0).toUpperCase() +
                                                type.slice(1)
                                            }
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
                                        startIcon={<EditRounded />}
                                        variant={'contained'}
                                    >
                                        Edit
                                    </Button>
                                </>
                            )}
                            {/* image selector modal */}
                            {canEdit && (
                                <>
                                    {editImage && (
                                        <EditDatabaseImage
                                            values={metaVals}
                                            open={editImage}
                                            currentImageSrc={`${Env.MODULE}/api/app-${id}/appImage/download`}
                                            type={
                                                type.charAt(0).toUpperCase() +
                                                type.slice(1)
                                            }
                                            onClose={(success) => {
                                                // reload if successfully submitted
                                                if (success) {
                                                    refresh();
                                                }

                                                setEditImage(false);
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </Stack>
                    </Stack>
                    <Stack>
                        <span>
                            {id}
                            <StyledIconButton
                                aria-label={`copy ${name} ID`}
                                size="small"
                                onClick={(e) => {
                                    // prevent the default action
                                    e.preventDefault();

                                    // copy
                                    try {
                                        navigator.clipboard.writeText(id);

                                        notification.add({
                                            color: 'success',
                                            message: 'Successfully copied id',
                                        });
                                    } catch (e) {
                                        console.error(e);

                                        notification.add({
                                            color: 'error',
                                            message: 'Error copyng id',
                                        });
                                    }
                                }}
                            >
                                <Tooltip title={`Copy ${name} ID`}>
                                    <ContentCopyOutlined fontSize="inherit" />
                                </Tooltip>
                            </StyledIconButton>
                        </span>
                    </Stack>
                </Stack>
            }
        >
            <StyledInfo>
                <StyledInfoLeft>
                    <StyledInfoDescription variant={'subtitle1'}>
                        {metaVals.description
                            ? metaVals.description
                            : canEdit
                            ? `Please use the Edit button to provide a description for this ${name}. A description will help other's find the ${name} and understand how to use it. To include a more details associated to the ${type}, edit the markdown located in the Overview section.`
                            : `This ${name} is currently awaiting a detailed description, which will be provided by the engine editor in the near future. As of now, the ${name} contains valuable and relevant information that pertains to its designated subject matter. Kindly check back later for a comprehensive overview of the contents and scope of this engine, as the editor will be updating it shortly`}
                    </StyledInfoDescription>

                    <StyledChipContainer>
                        {metaVals.tag &&
                            (metaVals.tag as string[]).map((tag, i) => {
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
                    {/* image display */}
                    <Card
                        onMouseEnter={() => setImageHover(true)}
                        onMouseLeave={() => setImageHover(false)}
                    >
                        <Card.ActionsArea>
                            <StyledDatabaseImage
                                image={`${Env.MODULE}/api/e-${id}/image/download`}
                            />

                            {imageHover ? (
                                <StyledImageOverlay
                                    variant="subtitle1"
                                    onClick={() => setEditImage(!editImage)}
                                >
                                    Change Image
                                </StyledImageOverlay>
                            ) : (
                                ''
                            )}
                        </Card.ActionsArea>
                    </Card>
                    <Stack
                        alignItems={'flex-end'}
                        spacing={1}
                        marginBottom={2}
                        sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
                    >
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                flexDirection: 'row',
                                gap: '8px',
                            }}
                        >
                            <Typography
                                variant={'body2'}
                                sx={{
                                    maxWidth: '35%',
                                }}
                            >
                                Published by:{' '}
                            </Typography>
                            <Typography
                                variant={'body2'}
                                sx={{
                                    maxWidth: '65%',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    direction: 'rtl',
                                    textAlign: 'left',
                                }}
                            >
                                {data.database_created_by
                                    ? data.database_created_by
                                    : 'N/A'}
                            </Typography>
                        </div>

                        {/* <Typography variant={'body2'}>
                            Published:{' '}
                            {data.database_date_created
                                ? data.database_date_created
                                : 'N/A'}
                        </Typography> */}
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                flexDirection: 'row',
                                gap: '8px',
                            }}
                        >
                            <Typography
                                variant={'body2'}
                                sx={{
                                    maxWidth: '35%',
                                }}
                            >
                                Updated:{' '}
                            </Typography>
                            <Typography
                                variant={'body2'}
                                sx={{
                                    maxWidth: '65%',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    direction: 'rtl',
                                    textAlign: 'left',
                                }}
                            >
                                {data.last_updated ? data.last_updated : 'N/A'}
                            </Typography>
                        </div>
                    </Stack>
                </StyledInfoRight>
            </StyledInfo>
            {children}
        </Page>
    );
};
