import { useState, useMemo } from 'react';
import {
    styled,
    Stack,
    Button,
    Chip,
    EditOutlined,
    Typography,
    Divider,
} from '@semoss/ui';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import Cat from '@/assets/img/cat.jpg';

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
                <>
                    <>
                        <Typography variant="h5">About</Typography>
                        <Markdown content={dbMetaData.markdown} />
                        <Divider />
                    </>
                </>
            )}
            {dbMetaData.tags && (
                <Section>
                    <Section.Header>Tags</Section.Header>
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
                        <Section.Header>{k.metakey}</Section.Header>
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
                <Section.Header>Statistics</Section.Header>
                <div>
                    <p>Total Uses:</p>
                    <p>Total Views:</p>
                </div>
            </Section>
            <Section>
                <Section.Header>Similar</Section.Header>
                <Stack direction={'row'} flexWrap={'nowrap'} overflow={'auto'}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                        (v, idx) => {
                            return (
                                <StyledLink key={idx} to={`/database/${idx}`}>
                                    <DatabaseCard
                                        name={`Database ${idx}`}
                                        description={
                                            'Lorem ipsum dolor sit amet consectetur adipiscing elit'
                                        }
                                        image={Cat}
                                    ></DatabaseCard>
                                </StyledLink>
                            );
                        },
                    )}
                </Stack>
            </Section>
        </StyledPage>
    );
});
