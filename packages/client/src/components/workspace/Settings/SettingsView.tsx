import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, ToggleTabsGroup, Container } from '@semoss/ui';

import { useWorkspace } from '@/hooks';
import {
    PendingMembersTable,
    MembersTable,
    SettingsTiles,
} from '@/components/settings';
import { AppSettings } from '@/components/app';
import { SettingsContext } from '@/contexts';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(5),
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexShrink: '0',
}));

type VIEW = 'CURRENT' | 'PENDING' | 'APP';

export const SettingsView = () => {
    const { workspace } = useWorkspace();
    const navigate = useNavigate();

    const [view, setView] = useState<VIEW>('CURRENT');

    return (
        <SettingsContext.Provider
            value={{
                adminMode: false,
            }}
        >
            <Container
                maxWidth={'xl'}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                }}
            >
                <StyledContainer>
                    {workspace.role === 'OWNER' ? (
                        <SettingsTiles
                            mode={'app'}
                            name={'app'}
                            id={workspace.appId}
                            direction="row"
                            onDelete={() => {
                                navigate('/settings/app');
                            }}
                        />
                    ) : null}
                    <StyledContent>
                        <ToggleTabsGroup
                            value={view}
                            onChange={(e, v) => setView(v as VIEW)}
                        >
                            <ToggleTabsGroup.Item
                                label="Member"
                                value={'CURRENT'}
                            />
                            <ToggleTabsGroup.Item
                                label="Pending Requests"
                                disabled={workspace.role === 'READ_ONLY'}
                                value={'PENDING'}
                            />
                            <ToggleTabsGroup.Item
                                label="Data Apps"
                                disabled={workspace.role === 'READ_ONLY'}
                                value={'APP'}
                            />
                        </ToggleTabsGroup>
                        {view === 'CURRENT' && (
                            <MembersTable
                                id={workspace.appId}
                                mode={'app'}
                                name={'app'}
                                refreshPermission={() => console.log('TODO')}
                            />
                        )}
                        {view === 'PENDING' && (
                            <PendingMembersTable
                                mode={'app'}
                                id={workspace.appId}
                            />
                        )}
                        {view === 'APP' && <AppSettings id={workspace.appId} />}
                    </StyledContent>
                </StyledContainer>
            </Container>
        </SettingsContext.Provider>
    );
};
