import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Refresh, OpenInNew } from '@mui/icons-material';
import { IconButton, Button, styled } from '@semoss/ui';
import { Env } from '@/env';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
}));

const StyledAppRendererActions = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: '50px',
    // marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.secondary.light,
    // boxShadow: '5px 5px 5px -2px rgba(0, 0, 0, 0.04)',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    color: '#0000008A',
    height: '50px',
    width: '50px',
    fontSize: 'inherit',
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
    /**
     * opens iframe in new window
     */
    open: () => void;
}

/**
 * Render an app based on an id
 */
export const AppRenderer = (props: AppRendererProps) => {
    const { appId, counter, editMode = false, open, refreshApp } = props;

    // track the iframe
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState('');

    useEffect(() => {
        // set the src
        // setSrc(`${Env.MODULE}/public_home/${appId}/portals/`);
        // Cache Busting:
        // Additionally, you can use cache-busting techniques when serving the content.
        // This involves appending a unique query parameter or a timestamp to the URL of
        // the content each time it is requested. This forces the browser to consider it
        // a new request and fetch the latest version from the server.
        // Anytime the counter changes we need to hit a new url to get new version instead of cache

        setSrc(
            `${
                Env.MODULE
            }/public_home/${appId}/portals/?timestamp=${Date.now()}`,
        );
        // [appId, counter]
    }, [appId, counter]);

    if (!src) {
        return null;
    }

    // return the app
    return (
        <StyledContainer>
            {editMode ? (
                <StyledAppRendererActions>
                    <StyledIconButton
                        size={'small'}
                        color={'secondary'}
                        title={'Refresh'}
                        onClick={() => {
                            refreshApp();
                        }}
                    >
                        <Refresh />
                    </StyledIconButton>
                    <StyledIconButton
                        size={'small'}
                        color={'secondary'}
                        title={'Open in new window'}
                        onClick={() => {
                            open();
                        }}
                    >
                        <OpenInNew />
                    </StyledIconButton>
                </StyledAppRendererActions>
            ) : null}

            <iframe
                key={counter}
                ref={iframeRef}
                src={src}
                style={{
                    height: editMode ? '100%' : '95%',
                    width: editMode ? '100%' : '95%',
                    border: 'none',
                }}
            />
        </StyledContainer>
    );
};

/**
 * Portal in new window
 * @param props
 * @returns
 */
export const AppPortal = (props) => {
    const { appId, counter, close } = props;

    const [container, setContainer] = useState(null);
    const [src, setSrc] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const newWindow = useRef(null);

    useEffect(() => {
        // Create container element on client-side
        setContainer(document.createElement('div'));
    }, []);

    useEffect(() => {
        // When container is ready
        if (container) {
            // Create window
            newWindow.current = window.open(
                '',
                '',
                'width=800,height=400,left=200,top=200,',
            );
            // Append container
            newWindow.current.document.body.appendChild(container);

            // Closing of portal in parent
            newWindow.current.addEventListener('beforeunload', close);
        }
    }, [container]);

    useEffect(() => {
        setSrc(
            `${
                Env.MODULE
            }/public_home/${appId}/portals/?timestamp=${Date.now()}`,
        );
    }, [appId, counter]);

    if (!src) {
        return null;
    }

    return (
        container &&
        createPortal(
            <iframe
                key={counter}
                ref={iframeRef}
                src={src}
                style={{
                    height: '100%',
                    width: '100%',
                    border: 'none',
                }}
            />,
            container,
        )
    );
};
