import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Breadcrumbs, useNotification } from '@semoss/ui';
import { AppSettings } from '@/components/app';
import { Sidebar, SidebarItem, SidebarText } from '@/components/common';
import { LoadingScreen } from '@/components/ui';
import { useRootStore } from '@/hooks';
import { WorkspaceStore } from '@/stores';

export const AppDetailPage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);

    useEffect(() => {
        // Clear out the old app
        setWorkspace(undefined);

        configStore
            .createWorkspace(appId)
            .then((loadedWorkspace) => {
                setWorkspace(loadedWorkspace);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                navigate('/');
            });
    }, [appId]);

    // Hide the screen while it loads
    if (!workspace) {
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                alignSelf: 'stretch',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
            }}
        >
            <Breadcrumbs>Breadcrumbs</Breadcrumbs>
            <div
                style={{
                    display: 'flex',
                    gap: 2,
                    marginLeft: 'auto',
                }}
            >
                <pre>Change Access Button</pre>
                <pre>Open Button</pre>
            </div>
            <div
                style={{
                    display: 'flex',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontWeight: 'bold',
                    }}
                >
                    <Link to="main-uses">Main Uses</Link>
                    <Link to="tags">Tags</Link>
                    <Link to="videos">Videos</Link>
                    <Link to="dependencies">Dependencies</Link>
                    <Link to="app-access">App Access</Link>
                    <Link to="member-access">Member Access</Link>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontWeight: 'bold',
                    }}
                >
                    <pre>(Title Section)</pre>
                    <pre id="#main-uses">Main uses</pre>
                    <pre id="#tags">Tags</pre>
                    <pre id="#videos">Video</pre>
                    <pre id="#dependencies">Dependencies (reactor call)</pre>
                    <pre id="#member-access">Member Access</pre>
                    <AppSettings id={appId} />
                    <pre id="#app-access">
                        App Access section (components from Settings)
                    </pre>
                </div>
            </div>
        </div>
    );
});

// import { useParams, useNavigate } from 'react-router-dom';
// import { observer } from 'mobx-react-lite';
// import { SettingsTiles } from '@/components/settings';
// import { SettingsContext } from '@/contexts';
// import { useRootStore, useWorkspace } from '@/hooks';
// import {
//     Container,
//     styled,
//     ToggleTabsGroup,
//     useNotification,
// } from '@semoss/ui';

// export const AppDetailPage = observer(() => {
//     // App ID Needed for pixel calls
//     const { appId } = useParams();
//     const { configStore } = useRootStore();
//     const notification = useNotification();
//     const navigate = useNavigate();
//     const { workspace } = useWorkspace();

//     return (
//         <>
//             <SettingsContext.Provider
//                 value={{
//                     adminMode: false,
//                 }}
//             >
//                 <Container
//                     maxWidth={'xl'}
//                     sx={{
//                         height: '100%',
//                         display: 'flex',
//                         flexDirection: 'column',
//                         gap: '16px',
//                         overflowX: 'hidden',
//                         overflowY: 'auto',
//                     }}
//                 >
//                     <div>AppDetailPage</div>
//                     {workspace.role === 'OWNER' ? (
//                         <SettingsTiles
//                             mode={'app'}
//                             name={'app'}
//                             id={workspace.appId}
//                             onDelete={() => {
//                                 navigate('/settings/app');
//                             }}
//                         />
//                     ) : null}
//                 </Container>
//             </SettingsContext.Provider>
//         </>
//     );
// });
