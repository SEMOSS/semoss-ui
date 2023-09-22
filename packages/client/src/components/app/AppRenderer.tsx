import { useEffect, useRef, useState } from 'react';

import { Env } from '@/env';

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
        setSrc(`${Env.MODULE}/public_home/${appId}/portals/`);
    }, [appId]);

    if (!src) {
        return null;
    }

    // return the app
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
            }}
        >
            <iframe
                ref={iframeRef}
                src={src}
                style={{
                    height: '95%',
                    width: '95%',
                    border: 'none',
                }}
            />
            {/* Anytime you move Bottom panel over Iframe there is buggy behavior */}
            <span>&nbsp;</span>
        </div>
    );
};
