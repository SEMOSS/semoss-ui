import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate } from 'react-router-dom';
import { styled } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { runPixel } from '@/api';

/**
 * All of the Iframe Messages
 */
export type IframeMessage = IframeStartMessage | IframeEndMessage;

/**
 * Start message sent from the child iframe to execute a pixel
 */
export interface IframeStartMessage {
    message: 'semoss-run-pixel--start';
    data: {
        key: string;
        insightId: string;
        pixel: string;
    };
}

/**
 * End message sent to the child iframe from executing a pixel
 */
export interface IframeEndMessage {
    message: 'semoss-run-pixel--end';
    data: {
        key: string;
        insightId: string;
        response: {
            insightID: string;
            errors: unknown;
            pixelReturn: {
                isMeta: boolean;
                operationType: string[];
                output: unknown;
                pixelExpression: string;
                pixelId: string;
            }[];
        };
    };
}

const StyledIframe = styled('iframe')(() => ({
    height: '100%',
    width: '100%',
    border: 'none',
}));

/**
 * Page to load a specific app
 */
export const AppPage = observer(() => {
    const { workspaceStore } = useRootStore();

    // track the iframe
    const iframeRef = useRef<HTMLIFrameElement>();
    const [src, setSrc] = useState('');

    // if there is no app don't render
    if (!workspaceStore.selectedApp) {
        return <Navigate to={`/`} replace />;
    }

    useEffect(() => {
        // update the url based on the app id
        const searchParams = new URLSearchParams({
            'semoss-insight-id': workspaceStore.selectedApp.id,
        });

        // set the src
        setSrc(`../../sdk/example/?${searchParams.toString()}`);
    }, [workspaceStore.selectedApp.id]);

    // listen to messages on the parent
    useEffect(() => {
        if (!window) {
            return;
        }

        /**
         * Handle the response of a pixel run in the parent
         * @param {object} data - data associated with the message
         */
        const handleRunPixel = async (data: IframeStartMessage['data']) => {
            const { insightId, pixel, key } = data;

            // get the response
            const response = await runPixel(insightId, pixel);
            console.log('response');

            emitMessage({
                message: 'semoss-run-pixel--end',
                data: {
                    key: key,
                    insightId: insightId,
                    response: response,
                },
            });
        };

        /**
         * Dispatch Messages from the IframeWidget to the child
         * @param message
         */
        function emitMessage(message: IframeEndMessage) {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                console.log('emmiting');
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify(message),
                );
            }
        }

        /**
         * Process messages from an iframe
         * @param message - message to process
         * @returns the message
         */
        const processMessage = (message) => {
            let messageObject: IframeMessage;

            try {
                messageObject = JSON.parse(message.data) as IframeMessage;
            } catch (e) {
                // not a valid message we're expecting so don't process it
                return;
            }

            // ignore if it is not the correct one or the insightId is missing
            if (
                typeof messageObject !== 'object' ||
                !messageObject.data ||
                messageObject.data.insightId !== workspaceStore.selectedApp.id
            ) {
                return;
            }

            if (messageObject.message === 'semoss-run-pixel--start') {
                handleRunPixel(messageObject.data);
            }
        };

        // add the listener
        window.addEventListener('message', processMessage);

        return () => {
            // remove the listener
            window.removeEventListener('message', processMessage);
        };
    }, [workspaceStore.selectedApp.id]);

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
});
