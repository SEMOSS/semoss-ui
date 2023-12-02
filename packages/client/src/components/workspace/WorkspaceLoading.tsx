import { observer } from 'mobx-react-lite';

import { useWorkspace } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

/**
 * WorkspaceLoading show the loading screen
 */
export const WorkspaceLoading = observer((): JSX.Element => {
    const { workspace } = useWorkspace();

    if (workspace.isLoading) {
        return <LoadingScreen.Trigger />;
    }

    return null;
});
