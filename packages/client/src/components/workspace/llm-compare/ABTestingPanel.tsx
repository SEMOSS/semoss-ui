import { useLLMComparison } from '@/hooks';
import { Fragment, useState } from 'react';
import { Check, PlayArrow } from '@mui/icons-material';
import {
    styled,
    ToggleTabsGroup,
    Typography,
    Button,
    Checkbox,
} from '@semoss/ui';
import { ModelVariant } from './ModelVariant';
import { TypeVariant } from '../workspace.types';

const StyledABTestingPanel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    height: '100%',
    overflowY: 'auto',
}));

type Mode = 'variants' | 'abTesting';

export const ABTestingPanel = () => {
    const [mode, setMode] = useState<Mode>('variants');
    const { defaultVariant, variants, editVariant } = useLLMComparison();

    const handleRerunVariants = () => {
        // TODO: reruns and saves the selected variants/edits to generated the report
    };

    const handleToggleSelected = (idx: number) => {
        if (idx === -1) {
            const newDefault = {
                ...defaultVariant,
                selected: !defaultVariant.selected,
            };
            editVariant(idx, newDefault);
        } else {
            const newVariant = {
                ...variants[idx],
                selected: !variants[idx].selected,
            };
            editVariant(idx, newVariant);
        }
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
                <Fragment>
                    <Typography variant="body1" fontWeight="bold">
                        Select Variants
                    </Typography>

                    <Checkbox
                        label="Defaul Variant"
                        checked={defaultVariant.selected}
                        onChange={() => handleToggleSelected(-1)}
                    />

                    {variants.map((value: TypeVariant, idx: number) => {
                        return (
                            <Checkbox
                                key={`${value.name}-${idx}`}
                                label={value.name}
                                checked={value.selected}
                                onChange={() => handleToggleSelected(idx)}
                            />
                        );
                    })}
                </Fragment>
            )}
        </StyledABTestingPanel>
    );
};
