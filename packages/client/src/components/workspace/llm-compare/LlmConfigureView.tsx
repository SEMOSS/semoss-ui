import { useMemo, useEffect } from 'react';
import { styled, Container, Grid, Card, Stack } from '@semoss/ui';
import { useLLMComparison, useRootStore } from '@/hooks';
import { LLMConfigureHeader, ModelVariant } from './';

const StyledContainer = styled('section')(({ theme }) => ({
    overflow: 'scroll',
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(4),
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(8),
}));

export const LlmConfigureView = () => {
    const { variants, defaultVariant } = useLLMComparison();
    const { monolithStore } = useRootStore();

    const variantList = useMemo(() => {
        return variants.map((variant, j) => {
            return (
                <ModelVariant
                    key={j}
                    index={j}
                    models={variant}
                    isDefault={false}
                />
            );
        });
    }, [variants.length]);

    return (
        <StyledContainer>
            <LLMConfigureHeader />
            <Grid container spacing={1}>
                <ModelVariant
                    index={-1}
                    models={defaultVariant}
                    isDefault={true}
                />
            </Grid>
            {variantList}
        </StyledContainer>
    );
};
