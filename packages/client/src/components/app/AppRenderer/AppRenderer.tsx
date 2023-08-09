import { useEffect, useRef, useState } from 'react';

import { runPixel } from '@/api';

import {
    IframeMessage,
    IframeStartMessage,
    IframeEndMessage,
} from '../app.types';

interface AppRendererProps {
    /** appId of the app to render */
    appId: string;

    /** InsightID of the app to render */
    insightId: string;
}

/**
 * Render an app based on an id
 */
export const AppRenderer = (props: AppRendererProps) => {
    const { insightId, appId } = props;

    // track the iframe
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState('');

    useEffect(() => {
        // update the url based on the app id
        const searchParams = new URLSearchParams({
            'semoss-insight-id': insightId,
        });

        // set the src
        setSrc(
            `${
                process.env.MODULE
            }/public_home/${appId}/public_home/portals/?${searchParams.toString()}`,
        );
    }, [appId, insightId]);

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

            // emit it to the child
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
                messageObject.data.insightId !== insightId
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
    }, [insightId]);

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
