import { useEffect, useRef, useState } from 'react';

import { MODULE } from '@/constants';

interface AppRendererProps {
    /** appId of the app to render */
    appId: string;
}

/**
 * Render an app based on an id
 */
export const AppRenderer = (props: AppRendererProps) => {
    const { appId } = props;

    // track the iframe
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState('');

    useEffect(() => {
        // set the src
        setSrc(`${MODULE}/public_home/${appId}/portals/`);
    }, [appId]);

    if (!src) {
        return null;
    }

    // return the app
    return (
        <iframe
            ref={iframeRef}
            src={src}
            style={{
                border: 'none',
                height: '100%',
                width: '100%',
            }}
        />
    );
};
