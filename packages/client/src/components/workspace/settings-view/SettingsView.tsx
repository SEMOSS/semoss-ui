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
    const { appId, role } = useWorkspace();
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
                sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
                <StyledContainer>
                    {role === 'OWNER' ? (
                        <SettingsTiles
                            mode={'app'}
                            name={'app'}
                            id={appId}
                            onDelete={() => {
                                navigate('/settings/app');
                            }}
                        />
                    ) : null}
                    <StyledContent>
                        <ToggleTabsGroup
                            value={view}
                            onChange={(e, v) => setView(v as VIEW)}
                            aria-label="basic tabs example"
                        >
                            <ToggleTabsGroup.Item
                                label="Member"
                                value={'CURRENT'}
                            />
                            <ToggleTabsGroup.Item
                                label="Pending Requests"
                                disabled={role === 'READ_ONLY'}
                                value={'PENDING'}
                            />
                            <ToggleTabsGroup.Item
                                label="Data Apps"
                                disabled={role === 'READ_ONLY'}
                                value={'APP'}
                            />
                        </ToggleTabsGroup>
                        {view === 'CURRENT' && (
                            <MembersTable
                                id={appId}
                                mode={'app'}
                                name={'app'}
                                refreshPermission={() => console.log('TODO')}
                            />
                        )}
                        {view === 'PENDING' && (
                            <PendingMembersTable mode={'app'} id={appId} />
                        )}
                        {view === 'APP' && <AppSettings id={appId} />}
                    </StyledContent>
                </StyledContainer>
            </Container>
        </SettingsContext.Provider>
    );
};
