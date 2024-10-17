import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Tooltip, styled } from '@semoss/ui';
// import { Sidebar, SidebarItem, SidebarText } from '@/components/common';
import { SettingsView } from './SettingsView';
// import { SupervisorAccount } from '@mui/icons-material';

const StyledSettings = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledCenterPanel = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
}));

export const Settings = observer(() => {
    const [view, setView] = useState<'access' | 'testing' | ''>('access');

    // const updateView = (v: typeof view) => {
    //     if (!v || v === view) {
    //         setView('');
    //         return;
    //     }

    //     setView(v);
    // };

    return (
        <StyledSettings>
            {/* <Sidebar>
                <SidebarItem
                    selected={view === 'access'}
                    onClick={() => updateView('access')}
                >
                    <Tooltip title="Access" placement="right">
                        <SupervisorAccount color="inherit" />
                    </Tooltip>
                    <SidebarText>Access</SidebarText>
                </SidebarItem>
            </Sidebar> */}

            <StyledCenterPanel>
                {view === 'access' && <SettingsView />}
            </StyledCenterPanel>
        </StyledSettings>
    );
});
