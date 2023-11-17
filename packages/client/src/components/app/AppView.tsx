import { useApp } from '@/hooks';

import { CustomAppRenderer, CustomAppEditor } from './custom-app';
import { BlocksAppRenderer, BlocksAppEditor } from './blocks-app';

/**
 * Renders the content of an app
 */
export const AppView = () => {
    const { editorMode, type } = useApp();

    // TODO: Lazy load edit mode
    if (editorMode) {
        if (type === 'blocks') {
            return <BlocksAppEditor />;
        } else if (type === 'custom') {
            return <CustomAppEditor />;
        }
    } else {
        if (type === 'blocks') {
            return <BlocksAppRenderer />;
        } else if (type === 'custom') {
            return <CustomAppRenderer />;
        }
    }

    return <>Error</>;
};
