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

export const AppSettingsPanel = () => {
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const { workspace, app } = useWorkspace();
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
                `ExportProjectApp(project=["${app.appId}"]);`,
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
                        {app.role === 'EDITOR' || app.role === 'OWNER' ? (
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
                        {app.role === 'OWNER' ? (
                            <SettingsTiles
                                type={'APP'}
                                id={app.appId}
                                name={app.metadata?.project_name || 'app'}
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
                                    disabled={app.role === 'READ_ONLY'}
                                    value={'PENDING'}
                                />
                                <ToggleTabsGroup.Item
                                    label="Data Apps"
                                    disabled={app.role === 'READ_ONLY'}
                                    value={'APP'}
                                />
                            </ToggleTabsGroup>
                            {view === 'CURRENT' && (
                                <MembersTable
                                    type={'APP'}
                                    id={app.appId}
                                    onChange={() => console.log('TODO')}
                                />
                            )}
                            {view === 'PENDING' && (
                                <PendingMembersTable
                                    type={'APP'}
                                    id={app.appId}
                                />
                            )}
                            {view === 'APP' && <AppSettings id={app.appId} />}
                        </StyledContent>
                    </StyledContainer>
                </Container>
            </SettingsContext.Provider>
        </Panel>
    );
};
