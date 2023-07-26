import React, { useState, useMemo } from 'react';
import {
    Button,
    Card,
    Chip,
    Grid,
    Icon,
    Stack,
    styled,
    Typography,
} from '@semoss/ui';

import {
    EditOutlined,
    Star,
    DownloadForOffline,
    RemoveRedEyeOutlined,
} from '@mui/icons-material';
import { SEMOSS } from '@/assets/img/SEMOSS';

import { formatName } from '@/utils';

import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { Section, LoadingScreen } from '@/components/ui';
import { Markdown } from '@/components/common';
import { DatabaseCard, EditDatabaseDetails } from '@/components/database';
import { usePixel, useDatabase, useRootStore } from '@/hooks';
import { theme } from '@semoss/components';
import { SimilarDatabases } from '@/components/database/SimilarDatabases';
import { DatabaseStatistics } from '@/components/database/DatabaseStatistics';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    zIndex: '0',
}));

const StyledEditorHolder = styled('div')(() => ({
    position: 'absolute',
    top: '0',
    right: '0',
}));

const StyledLink = styled(Link)(() => ({
    display: 'inline-block',
}));

const StyledCardImageContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.spacing(7.5),
    height: theme.spacing(7.5),
    borderRadius: theme.spacing(0.75),
    backgroundColor: theme.palette.semossBlue['50'],
}));

const StyledCardContent = styled('div')(({ theme }) => ({
    gap: '10px',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: theme.spacing(2),
}));

const StyledCardDetailsContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flex: '1 0 0',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
}));

export const DatabaseIndexPage = observer(() => {
    const { id, role } = useDatabase();
    const { configStore } = useRootStore();

    // set if it can edit
    const canEdit = role === 'OWNER' || role === 'EDITOR';

    // track the edit state
    const [edit, setEdit] = useState(false);

    // filter metakeys to the ones we want
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            return (
                k.metakey !== 'description' &&
                k.metakey !== 'markdown' &&
                k.metakey !== 'tags'
            );
        },
    );

    // kets to get dbMetaData for
    const metaKeys = [
        'markdown',
        'description',
        // 'tags',  // Comes in as 'tag' either a string or string[]
        ...databaseMetaKeys.map((k) => k.metakey),
    ];

    // get the metadata
    const {
        status: dbMetaStatus,
        data: dbMetaData,
        refresh: dbMetaRefresh,
    } = usePixel<{
        markdown?: string;
        tags?: string[];
    }>(
        `GetDatabaseMetadata(database=["${id}"], metaKeys=${JSON.stringify([
            metaKeys,
        ])}); `,
    );

    // convert the data into an object
    const values = useMemo(() => {
        if (dbMetaStatus !== 'SUCCESS') {
            return {};
        }

        return metaKeys.reduce((prev, curr) => {
            // tag and domain either come in as a string or a string[]
            // format these as string[] for autocomplete if comes in as string
            if (curr === 'domain' || curr === 'tag') {
                if (typeof dbMetaData[curr] === 'string') {
                    prev[curr] = [dbMetaData[curr]];
                } else {
                    prev[curr] = dbMetaData[curr];
                }
            } else {
                prev[curr] = dbMetaData[curr];
            }
            return prev;
        }, {});
    }, [dbMetaStatus, dbMetaData, JSON.stringify(metaKeys)]);

    if (dbMetaStatus !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Getting Database Details" />;
    }

    return (
        <StyledPage>
            {canEdit && (
                <StyledEditorHolder>
                    {edit && (
                        <EditDatabaseDetails
                            values={values}
                            open={edit}
                            onClose={(success) => {
                                // reload if successfully submitted
                                if (success) {
                                    dbMetaRefresh();
                                }

                                setEdit(false);
                            }}
                        ></EditDatabaseDetails>
                    )}
                    <Button
                        onClick={() => setEdit(!edit)}
                        startIcon={<EditOutlined />}
                        size={'small'}
                        variant={'outlined'}
                    >
                        Edit
                    </Button>
                </StyledEditorHolder>
            )}
            {dbMetaData.markdown && (
                <Section>
                    <Section.Header>
                        <Typography variant={'h6'}>Details</Typography>
                    </Section.Header>
                    <Markdown content={dbMetaData.markdown} />
                </Section>
            )}

            {dbMetaData.tags && (
                <Section>
                    <Section.Header>
                        <Typography variant={'h6'}>Tags</Typography>
                    </Section.Header>
                    <Stack direction={'row'} spacing={1} flexWrap={'wrap'}>
                        {dbMetaData.tags.map((tag) => {
                            return (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    color={'primary'}
                                    variant={'outlined'}
                                    size={'small'}
                                ></Chip>
                            );
                        })}
                    </Stack>
                </Section>
            )}
            {databaseMetaKeys.map((k) => {
                if (
                    values[k.metakey] === undefined ||
                    !Array.isArray(values[k.metakey])
                ) {
                    return null;
                }

                return (
                    <Section key={k.metakey}>
                        <Section.Header>
                            <Typography variant={'h6'}>
                                {formatName(k.metakey)}
                            </Typography>
                        </Section.Header>
                        {k.display_options === 'multi-checklist' ||
                        k.display_options === 'multi-select' ||
                        k.display_options === 'multi-typeahead' ? (
                            <Stack
                                direction={'row'}
                                spacing={1}
                                flexWrap={'wrap'}
                            >
                                {values[k.metakey].map((tag) => {
                                    return (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            color={'primary'}
                                            variant={'outlined'}
                                            size={'small'}
                                        ></Chip>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <>{values[k.metakey]}</>
                        )}
                    </Section>
                );
            })}
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Statistics</Typography>
                </Section.Header>
                <DatabaseStatistics id={id} />
            </Section>
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Similar</Typography>
                </Section.Header>
                <SimilarDatabases id={id} />
            </Section>
        </StyledPage>
    );
});
