import { ToggleTabsGroup, Typography } from '@semoss/ui';
import { useState } from 'react';

type Mode = 'variants' | 'abTesting';

export const ABTestingPanel = () => {
    const [mode, setMode] = useState<Mode>('variants');

    return (
        <div>
            <Typography variant="h6">Evaluate</Typography>

            <ToggleTabsGroup
                value={mode}
                onChange={(e, val) => setMode(val as Mode)}
            >
                <ToggleTabsGroup.Item label="Variants" value="variants" />
                <ToggleTabsGroup.Item label="A/B Testing" value="abTesting" />
            </ToggleTabsGroup>

            {mode === 'variants' && <div>{/* Variants */}</div>}

            {mode === 'abTesting' && (
                <div>
                    <Typography variant="body1">Select Variants</Typography>
                </div>
            )}
        </div>
    );
};
