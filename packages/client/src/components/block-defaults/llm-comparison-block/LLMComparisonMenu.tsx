import { BlockComponent } from '@/stores';
import { useBlock } from '@/hooks';
import { styled, ToggleTabsGroup } from '@semoss/ui';
import { useState } from 'react';
import { SettingsSubMenu } from './SettingsSubMenu';
import { ConfigureSubMenu } from './ConfigureSubMenu';

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

            {mode === 'configure' && <ConfigureSubMenu />}

            {mode === 'settings' && <SettingsSubMenu />}
        </StyledMenu>
    );
};
