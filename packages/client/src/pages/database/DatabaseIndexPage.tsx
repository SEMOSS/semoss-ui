import { useState, useMemo } from 'react';
import {
    Button,
    Card,
    Chip,
    Grid,
    Stack,
    styled,
    Typography,
} from '@semoss/ui';

import { EditOutlined } from '@mui/icons-material';

import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { Section, LoadingScreen } from '@/components/ui';
import { Markdown } from '@/components/common';
import { DatabaseCard, EditDatabaseDetails } from '@/components/database';
import { usePixel, useDatabase, useRootStore } from '@/hooks';

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
        'tags',
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
            prev[curr] = dbMetaData[curr];
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
                    dbMetaData[k.metakey] === undefined ||
                    !Array.isArray(dbMetaData[k.metakey])
                ) {
                    return null;
                }

                return (
                    <Section key={k.metakey}>
                        <Section.Header>
                            <Typography variant={'h6'}>{k.metakey}</Typography>
                        </Section.Header>
                        {k.display_options === 'multi-checklist' ||
                        k.display_options === 'multi-select' ||
                        k.display_options === 'multi-typeahead' ? (
                            <Stack
                                direction={'row'}
                                spacing={1}
                                flexWrap={'wrap'}
                            >
                                {dbMetaData[k.metakey].map((tag) => {
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
                            <>{dbMetaData[k.metakey]}</>
                        )}
                    </Section>
                );
            })}
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Statistics</Typography>
                </Section.Header>
                <Grid container spacing={3}>
                    <Grid item sm={12} md={6} lg={4} xl={3}>
                        <Card>
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="36"
                                    height="36"
                                    viewBox="0 0 36 36"
                                    fill="none"
                                >
                                    <path
                                        d="M18 9.75C23.685 9.75 28.755 12.945 31.23 18C28.755 23.055 23.7 26.25 18 26.25C12.3 26.25 7.245 23.055 4.77 18C7.245 12.945 12.315 9.75 18 9.75ZM18 6.75C10.5 6.75 4.095 11.415 1.5 18C4.095 24.585 10.5 29.25 18 29.25C25.5 29.25 31.905 24.585 34.5 18C31.905 11.415 25.5 6.75 18 6.75ZM18 14.25C20.07 14.25 21.75 15.93 21.75 18C21.75 20.07 20.07 21.75 18 21.75C15.93 21.75 14.25 20.07 14.25 18C14.25 15.93 15.93 14.25 18 14.25ZM18 11.25C14.28 11.25 11.25 14.28 11.25 18C11.25 21.72 14.28 24.75 18 24.75C21.72 24.75 24.75 21.72 24.75 18C24.75 14.28 21.72 11.25 18 11.25Z"
                                        fill="#0471F0"
                                    />
                                </svg>
                            </div>
                            <Card.Content>
                                <Typography>Views</Typography>
                            </Card.Content>
                        </Card>
                    </Grid>
                    <Grid item sm={12} md={6} lg={4} xl={3}>
                        Total Views:
                    </Grid>
                    <Grid item sm={12} md={6} lg={4} xl={3}>
                        Total Views:
                    </Grid>
                    <Grid item sm={12} md={6} lg={4} xl={3}>
                        Total Views:
                    </Grid>
                </Grid>
            </Section>
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Similar</Typography>
                </Section.Header>
                <Stack direction={'row'} flexWrap={'nowrap'} overflow={'auto'}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                        (v, idx) => {
                            return (
                                <StyledLink key={idx} to={`/database/${idx}`}>
                                    `Database ${idx}`
                                </StyledLink>
                            );
                        },
                    )}
                </Stack>
            </Section>
        </StyledPage>
    );
});
