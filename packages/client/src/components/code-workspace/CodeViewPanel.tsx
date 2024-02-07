import React from 'react';
import { useNotification, styled } from '@/component-library';

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

const StyledTopLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    overflowX: 'hidden',
    backgroundColor: theme.palette.secondary.light,
    justifyContent: 'space-between',
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingRight: theme.spacing(2),

    // Take in prop that will resize width of left portion
    height: '100%',
    width: '100%',
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
