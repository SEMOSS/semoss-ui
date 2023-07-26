import axios from 'axios';

const BACKEND = `${process.env.ENDPOINT}${process.env.MODULE}`;

/**
 * Run a pixel string
 *
 * @param insightID - insightID to execute the pixel against
 * @param pixel - pixel to execute
 */
export const runPixel = async <O extends unknown[] | []>(
    insightID: string,
    pixel: string,
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
        }>(`${BACKEND}/api/engine/runPixel`, postData, {
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
        ...response.data,
        errors: errors,
    };
};
