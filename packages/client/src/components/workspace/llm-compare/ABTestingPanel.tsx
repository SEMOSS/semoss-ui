import { useLLMComparison } from '@/hooks';
import { Fragment } from 'react';
import { PlayArrow } from '@mui/icons-material';
import { styled, ToggleTabsGroup, Typography, Button } from '@semoss/ui';
import { useState } from 'react';
import { ModelVariant } from './ModelVariant';

const StyledABTestingPanel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

type Mode = 'variants' | 'abTesting';

export const ABTestingPanel = () => {
    const [mode, setMode] = useState<Mode>('variants');
    const { defaultVariant, variants } = useLLMComparison();

    const handleRerunVariants = () => {
        // TODO: reruns and saves the selected variants/edits to generated the report
    };

    return (
        <StyledABTestingPanel>
            <Typography variant="h6">Evaluate</Typography>

            <ToggleTabsGroup
                value={mode}
                onChange={(e, val) => setMode(val as Mode)}
            >
                <ToggleTabsGroup.Item label="Variants" value="variants" />
                <ToggleTabsGroup.Item label="A/B Testing" value="abTesting" />
            </ToggleTabsGroup>

            {mode === 'variants' && (
                <Fragment>
                    <Button
                        startIcon={<PlayArrow />}
                        color="primary"
                        variant="outlined"
                        onClick={handleRerunVariants}
                    >
                        Rerun
                    </Button>

                    <ModelVariant
                        index={-1}
                        isDefault={true}
                        variant={defaultVariant}
                        orientation="column"
                        hideVariantActions={true}
                        cardProps={{ size: 'small' }}
                    />

                    {variants.map((value, idx) => {
                        return (
                            <ModelVariant
                                index={idx}
                                variant={value}
                                orientation="column"
                                hideVariantActions={true}
                                key={idx}
                                cardProps={{ size: 'small' }}
                            />
                        );
                    })}
                </Fragment>
            )}

            {mode === 'abTesting' && (
                <div>
                    <Typography variant="body1">Select Variants</Typography>
                </div>
            )}
        </StyledABTestingPanel>
    );
};
