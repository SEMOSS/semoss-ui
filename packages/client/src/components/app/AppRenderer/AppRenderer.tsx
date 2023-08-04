import { useEffect, useRef, useState } from 'react';

import { runPixel } from '@/api';

import {
    IframeMessage,
    IframeStartMessage,
    IframeEndMessage,
} from '../app.types';

interface AppRendererProps {
    /** Id of the app to render */
    id: string;

    /** Url of the app to render */
    url: string;
}

/**
 * Render an app based on an id
 */
export const AppRenderer = (props: AppRendererProps) => {
    const { id, url } = props;

    // track the iframe
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState('');

    useEffect(() => {
        // update the url based on the app id
        const searchParams = new URLSearchParams({
            'semoss-insight-id': id,
        });

        // set the src
        setSrc(`${url}/?${searchParams.toString()}`);
    }, [url, id]);

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
                messageObject.data.insightId !== id
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
    }, [id]);

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
