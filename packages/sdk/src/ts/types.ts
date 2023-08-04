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

export interface PixelReturn<O extends unknown[] | [] = unknown[]> {
    isMeta: boolean;
    operationType: string[];
    output: O[number];
    pixelExpression: string;
    pixelId: string;
}
[];
