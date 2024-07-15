import { BlockComponent } from '@/stores';
import { useBlock } from '@/hooks';
import { styled, ToggleTabsGroup } from '@semoss/ui';
import { useState } from 'react';
import { SettingsSubMenu } from './SettingsSubMenu';
import { ConfigureSubMenu } from './ConfigureSubMenu';
import { LLMCompareWrapper } from './LLMCompareWrapper';

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    height: '36px',
    alignItems: 'center',
    width: '306px',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '32px',
    width: '50%',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(2),
}));

type Mode = 'configure' | 'settings';

export const LLMComparisonMenu: BlockComponent = ({ id }) => {
    const [mode, setMode] = useState<Mode>('configure');

    return (
        <LLMCompareWrapper>
            <StyledMenu>
                <StyledToggleTabsGroup
                    value={mode}
                    onChange={(e, val) => setMode(val as Mode)}
                >
                    <StyledToggleTabsGroupItem
                        label="Configure"
                        value="configure"
                    />
                    <StyledToggleTabsGroupItem
                        label="Settings"
                        value="settings"
                    />
                </StyledToggleTabsGroup>

                {mode === 'configure' && <ConfigureSubMenu />}

                {mode === 'settings' && <SettingsSubMenu />}
            </StyledMenu>
        </LLMCompareWrapper>
    );
};
