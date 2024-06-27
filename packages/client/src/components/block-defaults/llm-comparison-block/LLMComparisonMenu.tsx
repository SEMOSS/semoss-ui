import { BlockComponent } from '@/stores';
import { useBlock } from '@/hooks';
import { styled, ToggleTabsGroup, Stack } from '@semoss/ui';
import { useState } from 'react';

const StyledMenu = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

type Mode = 'configure' | 'settings';

export const LLMComparisonMenu: BlockComponent = ({ id }) => {
    const [mode, setMode] = useState<Mode>('configure');

    return (
        <StyledMenu>
            <ToggleTabsGroup
                value={mode}
                onChange={(e, val) => setMode(val as Mode)}
            >
                <ToggleTabsGroup.Item label="Configure" value="configure" />
                <ToggleTabsGroup.Item label="Settings" value="settings" />
            </ToggleTabsGroup>

            {mode === 'configure' && (
                <Stack direction="column">
                    <div>Configure Menu</div>
                </Stack>
            )}

            {mode === 'settings' && (
                <Stack direction="column">
                    <div>Settings Menu</div>
                </Stack>
            )}
        </StyledMenu>
    );
};
