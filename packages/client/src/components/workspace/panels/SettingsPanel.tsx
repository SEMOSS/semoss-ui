import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    styled,
    ToggleTabsGroup,
    Container,
    Stack,
    IconButton,
    useNotification,
    Tooltip,
} from '@semoss/ui';

import { useRootStore, useWorkspace } from '@/hooks';
import {
    PendingMembersTable,
    MembersTable,
    SettingsTiles,
} from '@/components/settings';
import { AppSettings } from '@/components/app';
import { SettingsContext } from '@/contexts';
import { GetAppRounded } from '@mui/icons-material';
import { Panel } from './Panel';

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

export const SettingsPanel = () => {
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const { workspace } = useWorkspace();
    const navigate = useNavigate();

    const [view, setView] = useState<VIEW>('CURRENT');

    /**
     * Method that is called to export the app
     */
    const exportApp = async () => {
        // turn on loading
        workspace.setLoading(true);

        try {
            // export  the app
            const response = await monolithStore.runQuery<[string]>(
                `ExportProjectApp(project=["${workspace.appId}"]);`,
            );

            // throw an error if there is no key
            const key = response.pixelReturn[0].output;
            if (!key) {
                throw new Error('Error exporting app');
            }

            await monolithStore.download(configStore.store.insightID, key);

            notification.add({
                color: 'success',
                message: 'Success',
            });
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            workspace.setLoading(false);
        }
    };

    return (
        <Panel>
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
                        {workspace.role === 'EDITOR' ||
                        workspace.role === 'OWNER' ? (
                            <Stack
                                sx={{ width: '100%' }}
                                justifyContent={'flex-end'}
                                direction={'row'}
                            >
                                <div>
                                    <Tooltip title={'Export'}>
                                        <IconButton
                                            color="inherit"
                                            onClick={() => {
                                                exportApp();
                                            }}
                                        >
                                            <GetAppRounded />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            </Stack>
                        ) : null}
                        {workspace.role === 'OWNER' ? (
                            <SettingsTiles
                                type={'APP'}
                                id={workspace.appId}
                                name={workspace.metadata?.project_name || 'app'}
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
                                    type={'APP'}
                                    id={workspace.appId}
                                    onChange={() => console.log('TODO')}
                                />
                            )}
                            {view === 'PENDING' && (
                                <PendingMembersTable
                                    type={'APP'}
                                    id={workspace.appId}
                                />
                            )}
                            {view === 'APP' && (
                                <AppSettings id={workspace.appId} />
                            )}
                        </StyledContent>
                    </StyledContainer>
                </Container>
            </SettingsContext.Provider>
        </Panel>
    );
};
