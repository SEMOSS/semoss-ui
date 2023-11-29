import axios from 'axios';

import { Env } from '@/env';

/**
 * Run a pixel string
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export const runPixel = async <O extends unknown[] | []>(
    pixel: string,
    insightID?: string,
) => {
    if (!pixel) {
        throw Error('No Pixel To Execute');
    }

    // build the expression
    let postData = '';

    postData += 'expression=' + encodeURIComponent(pixel);
    if (insightID) {
        postData += '&insightId=' + encodeURIComponent(insightID);
    }

    const response = await axios
        .post<{
            insightID: string;
            pixelReturn: {
                isMeta: boolean;
                operationType: string[];
                output: O[number];
                pixelExpression: string;
                pixelId: string;
            }[];
        }>(`${Env.MODULE}/api/engine/runPixel`, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            // throw the message
            throw Error(error.response.data.errorMessage);
        });

    // there was no response, that is an error
    if (!response) {
        throw Error('No Pixel Response');
    }

    const errors: string[] = [];

    // collect the errors
    for (const p of response.data.pixelReturn) {
        const { output, operationType } = p;

        if (operationType.indexOf('ERROR') > -1) {
            errors.push(output as string);
        }
    }

    return {
        errors: errors,
        insightId: response.data.insightID,
        pixelReturn: response.data.pixelReturn,
    };
};
