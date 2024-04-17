import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Tooltip, styled } from '@semoss/ui';
import { Sidebar, SidebarItem, SidebarText } from '@/components/common';
import { ModelTraining, SupervisorAccount } from '@mui/icons-material';
import { SettingsView } from './SettingsView';
import { SettingsMenu } from './SettingsMenu';

const StyledSettings = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledLeftPanel = styled('div')(({ theme }) => ({
    height: '100%',
    width: theme.spacing(45),
    overflow: 'hidden',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
}));

const StyledRightPanel = styled('div')(() => ({
    height: '100%',
    flex: 1,
    overflow: 'hidden',
}));

export const Settings = observer(() => {
    const [view, setView] = useState<'access' | 'testing' | ''>('access');

    const updateView = (v: typeof view) => {
        if (!v || v === view) {
            setView('');
            return;
        }

        setView(v);
    };

    return (
        <StyledSettings>
            <Sidebar>
                <SidebarItem
                    selected={view === 'access'}
                    onClick={() => updateView('access')}
                >
                    <Tooltip title="Access" placement="right">
                        <SupervisorAccount color="inherit" />
                    </Tooltip>
                    <SidebarText>Access</SidebarText>
                </SidebarItem>
                <SidebarItem
                    selected={view === 'testing'}
                    onClick={() => updateView('testing')}
                >
                    <Tooltip title="Testing" placement="right">
                        <ModelTraining color="inherit" />
                    </Tooltip>
                    <SidebarText>Testing</SidebarText>
                </SidebarItem>
            </Sidebar>

            {view === 'testing' && (
                <StyledLeftPanel>
                    <SettingsMenu />
                </StyledLeftPanel>
            )}

            <StyledRightPanel>
                {view === 'access' && <SettingsView />}
            </StyledRightPanel>
        </StyledSettings>
    );
});
