import { Chip, Stack, styled, Typography } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { Section } from '@/components/ui';
import { Markdown } from '@/components/common';
import { useEngine, useRootStore } from '@/hooks';
import { DatabaseStatistics } from '@/components/database/DatabaseStatistics';
import { removeUnderscores } from '@/utility';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    zIndex: '0',
}));

export const EngineIndexPage = observer(() => {
    const { type, id, metaVals } = useEngine();
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

    console.log('engine meta keys', engineMetaKeys);
    return (
        <StyledPage>
            <Section>
                <Section.Header>
                    <Typography variant={'h6'}>Details</Typography>
                </Section.Header>
                {metaVals.markdown ? (
                    <Markdown content={metaVals.markdown as string} />
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
                                {removeUnderscores(k.metakey)}
                            </Typography>
                        </Section.Header>
                        {k.display_options === 'multi-checklist' ||
                        k.display_options === 'multi-select' ||
                        k.display_options === 'multi-typeahead' ||
                        k.display_options === 'select-box' ? (
                            <Stack
                                direction={'row'}
                                spacing={1}
                                flexWrap={'wrap'}
                            >
                                {(metaVals[k.metakey] as string[]).map(
                                    (tag) => {
                                        return (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                color={'primary'}
                                            ></Chip>
                                        );
                                    },
                                )}
                            </Stack>
                        ) : (
                            <>{metaVals[k.metakey]}</>
                        )}
                    </Section>
                );
            })}
            {type === 'DATABASE' && (
                <Section>
                    <Section.Header>
                        <Typography variant={'h6'}>Statistics</Typography>
                    </Section.Header>
                    <DatabaseStatistics id={id} />
                </Section>
            )}
        </StyledPage>
    );
});
