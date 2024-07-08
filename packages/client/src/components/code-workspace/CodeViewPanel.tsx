import { useNotification, styled } from '@semoss/ui';

import { useWorkspace, useRootStore } from '@/hooks';
import { AppEditor } from '@/components/common';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    // height: 'calc(100% - 42px)',
}));

interface CodeViewPanelProps {
    editorView: 'settings' | 'permissions' | 'code-editor';
    width: string;
}

export const CodeViewPanel = (props: CodeViewPanelProps) => {
    const { width } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const { workspace } = useWorkspace();

    /**
     * TODO Reusability
     * but first see if this is the order of operations that is needed to refresh app with new changes
     */
    const reloadAndPublish = async () => {
        // turn on loading
        workspace.setLoading(true);

        try {
            // Load the insight classes
            await monolithStore.runQuery(
                `ReloadInsightClasses('${workspace.appId}');`,
            );

            // set the app portal
            await monolithStore.setProjectPortal(
                false,
                workspace.appId,
                true,
                'public',
            );

            // Publish the app the insight classes
            await monolithStore.runQuery(
                `PublishProject('${workspace.appId}', release=true);`,
            );

            // close it
            // refreshApp();
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
        <StyledContainer>
            <AppEditor
                appId={workspace.appId}
                width={width}
                onSave={(success: boolean) => {
                    // Succesfully Saved Asset, refresh portal
                    if (success) {
                        reloadAndPublish();
                    }
                }}
            />
        </StyledContainer>
    );
};
