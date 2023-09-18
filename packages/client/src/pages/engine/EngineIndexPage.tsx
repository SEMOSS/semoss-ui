import { Chip, Stack, styled, Typography } from '@semoss/ui';

import { formatName } from '@/utils';

import { observer } from 'mobx-react-lite';

import { Section } from '@/components/ui';
import { Markdown } from '@/components/common';
import { useDatabase, useRootStore } from '@/hooks';
import { SimilarDatabases } from '@/components/database/SimilarDatabases';
import { DatabaseStatistics } from '@/components/database/DatabaseStatistics';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    zIndex: '0',
}));

export const EngineIndexPage = observer(() => {
    const { type, id, metaVals } = useDatabase();
    const { configStore } = useRootStore();

    // filter metakeys to the ones we want
    const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            return (
                k.metakey !== 'description' &&
                k.metakey !== 'markdown' &&
                k.metakey !== 'tags'
            );
        },
    );

    return (
        <StyledPage>
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Details</Typography>
                </Section.Header>
                {metaVals.markdown ? (
                    <Markdown content={metaVals.markdown} />
                ) : (
                    <div> No Markdown available</div>
                )}
            </Section>
            {engineMetaKeys.map((k) => {
                if (
                    metaVals[k.metakey] === undefined ||
                    !Array.isArray(metaVals[k.metakey])
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
                                {metaVals[k.metakey].map((tag) => {
                                    return (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            color={'primary'}
                                            variant={'outlined'}
                                            // size={'small'}
                                        ></Chip>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <>{metaVals[k.metakey]}</>
                        )}
                    </Section>
                );
            })}
            {type === 'database' && (
                <Section>
                    <Section.Header>
                        <Typography variant={'h6'}>Statistics</Typography>
                    </Section.Header>
                    <DatabaseStatistics id={id} />
                </Section>
            )}
            {/* {type === 'database' && (
                <Section>
                    <Section.Header>
                        <Typography variant={'h6'}>Similar</Typography>
                    </Section.Header>
                    <SimilarDatabases id={id} />
                </Section>
            )} */}
        </StyledPage>
    );
});
