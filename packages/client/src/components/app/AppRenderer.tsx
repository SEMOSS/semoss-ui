import { useEffect, useRef, useState } from 'react';

import { MODULE } from '@/constants';
import { Refresh, OpenInNew } from '@mui/icons-material';
import { IconButton, Button, styled } from '@semoss/ui';

const StyledAppRendererActions = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.secondary.light,
    boxShadow: '5px 5px 5px -2px rgba(0, 0, 0, 0.04)',
    justifyContent: 'flex-end',
}));

interface AppRendererProps {
    /** appId of the app to render */
    appId: string;

    /**
     * refresh Iframe based on editted changes
     */
    counter: number;

    /**
     * Determine if we allow refresh and pop in new window actions
     */
    editMode?: boolean;

    /**
     * Refresh App (can use from context)
     */
    refreshApp: () => void;
}

/**
 * Render an app based on an id
 */
export const AppRenderer = (props: AppRendererProps) => {
    const { appId, counter, editMode = false, refreshApp } = props;

    // track the iframe
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState('');

    useEffect(() => {
        // Cache Busting:
        // Additionally, you can use cache-busting techniques when serving the content.
        // This involves appending a unique query parameter or a timestamp to the URL of
        // the content each time it is requested. This forces the browser to consider it
        // a new request and fetch the latest version from the server.

        // Anytime the Counter we need to hit a new url to get new version instead of cache

        // set the src
        setSrc(`${MODULE}/public_home/${appId}/portals/?counter=${counter}`);
    }, [appId, counter]);

    if (!src) {
        return null;
    }

    // return the app
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                // justifyContent: 'center',
            }}
        >
            {editMode ? (
                <StyledAppRendererActions>
                    <IconButton
                        onClick={() => {
                            refreshApp();
                        }}
                    >
                        <Refresh />
                    </IconButton>

                    <IconButton disabled={true}>
                        <OpenInNew />
                    </IconButton>
                </StyledAppRendererActions>
            ) : null}

            <iframe
                key={counter}
                ref={iframeRef}
                src={src}
                style={{
                    height: editMode ? '90%' : '95%',
                    width: editMode ? '90%' : '95%',
                    border: 'none',
                }}
            />
            {/* Anytime you move Bottom panel over Iframe there is buggy behavior */}
            <span>&nbsp;</span>
        </div>
    );
};
