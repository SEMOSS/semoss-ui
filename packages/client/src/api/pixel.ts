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
    insightId?: string,
) => {
    if (!pixel) {
        throw Error('No Pixel To Execute');
    }

    // build the expression
    let postData = '';

    postData += 'expression=' + encodeURIComponent(pixel);
    if (insightId) {
        postData += '&insightId=' + encodeURIComponent(insightId);
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

/**
 * Asyncronously run a pixel string
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export const runPixelAsync = async (pixel: string, insightId?: string) => {
    if (!pixel) {
        throw Error('No Pixel To Execute');
    }

    // build the expression
    let postData = '';

    postData += 'expression=' + encodeURIComponent(pixel);
    if (insightId) {
        postData += '&insightId=' + encodeURIComponent(insightId);
    }

    const response = await axios
        .post<{ jobId: string }>(
            `${Env.MODULE}/api/engine/runPixelAsync`,
            postData,
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            },
        )
        .catch((error) => {
            // throw the message
            throw Error(error.response.data.errorMessage);
        });

    if (!response) {
        throw Error('No Pixel Response');
    }

    return {
        jobId: response.data.jobId,
    };
};

/**
 * Poll the console to get messages for a job
 *
 * @param jobId - id of the associated job
 */
export const pixelConsole = async (jobId: string) => {
    if (!jobId) {
        throw Error('No job id provded to get pixel response');
    }

    // build the expression
    let postData = '';

    postData += 'jobId=' + encodeURIComponent(jobId);

    const response = await axios.post<{
        message: string[];
        status: string;
    }>(`${Env.MODULE}/api/engine/console`, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });

    return {
        messages: response.data.message,
        status: response.data.status,
    };
};

/**
 * Poll the response
 *
 * @param roomId - id of the room to stream output
 */
export const pixelPartial = async (roomId: string) => {
    if (!roomId) {
        throw Error('No room id provded to get pixel response');
    }

    // build the expression
    let postData = '';

    postData += 'jobId=' + encodeURIComponent(roomId);

    const response = await axios.post<{
        message: { new: string; total: string };
        status: string;
    }>(`${Env.MODULE}/api/engine/partial`, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });

    return {
        message: response.data.message,
        status: response.data.status,
    };
};

/**
 * Gets Final result from runPixelAsync
 * @param jobId
 */
export const pixelResult = async <O extends unknown[] | []>(jobId: string) => {
    if (!jobId) {
        throw Error('No job id provided to get pixel response');
    }

    // build the expression
    let postData = '';

    postData += 'jobId=' + encodeURIComponent(jobId);

    const response = await axios
        .post<{
            insight: Record<string, unknown>;
            results: {
                class: string[];
                opType: string[];
                pixelType: string;
                value: O[number];
            }[];
            returnPixelList: Record<string, unknown>;
        }>(`${Env.MODULE}/api/engine/result`, postData, {
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
    for (const p of response.data.results) {
        const { value, opType } = p;

        if (opType.indexOf('ERROR') > -1) {
            errors.push(value as string);
        }
    }

    return {
        errors: errors,
        insightId: response.data.insight.insightID,
        results: response.data.results,
    };
};

// Long running Python to mimic prints
// Python code that will take time to execute
// import time
// def factorial(n):
//     if n == 0:
//         return 1
//     else:
//         result = 1
//         for i in range(1, n + 1):
//             result *= i
//             print(f"Current partial result for {i}! is {result}")
//             # Introduce a small delay to make it take longer
//             time.sleep(0.1)
//         return result
// number = 10  # You can adjust this to a larger number for longer execution time
// print(f"Calculating {number}!...")
// result = factorial(number)
// print(f"{number}! = {result}")
