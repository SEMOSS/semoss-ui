import axios from 'axios';

import { Env } from '@/env';

export interface PixelResult {
    class: string[];
    opType: string[];
    pixelType: string;
    value: unknown;
}

export interface PixelConsoleResponse {
    messages: string[];
    status: string;
}
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
 * Hits RunPixelAsync endpoint
 * @returns Record<jobId, string>
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
 * Polls runPixelAsync for stdout
 * @param jobId
 */
export const pixelConsole = async (jobId: string) => {
    if (!jobId) {
        throw Error('No job id provded to get pixel response');
    }

    // build the expression
    let postData = '';

    postData += 'jobId=' + encodeURIComponent(jobId);

    let response;
    let stillPolling = true;
    const messages = [];
    // Set up polling in order to get full stdout
    while (stillPolling) {
        try {
            response = await axios.post<PixelConsoleResponse>(
                `${Env.MODULE}/api/engine/console`,
                postData,
                {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            // Append new messages
            response.data.message.forEach((mess) => {
                messages.push(mess);
            });

            // Currently console does not get pass STREAMING
            if (response.data.status === 'Complete') {
                stillPolling = false;
            } else if (response.data.status === 'Streaming') {
                stillPolling = false;
            } else {
                await new Promise((resolve) => setTimeout(resolve, 3000)); // Adjust the delay as needed
            }
        } catch (error) {
            console.error('Error occurred on Pulling:', error.message);
            stillPolling = false;
        }
    }

    return {
        messages: messages,
        status: response.data.status,
    };
};

/**
 * Gets Final result from runPixelAsync
 * @param jobId
 */
export const pixelResult = async (jobId: string) => {
    if (!jobId) {
        throw Error('No job id provided to get pixel response');
    }

    // build the expression
    let postData = '';

    postData += 'jobId=' + encodeURIComponent(jobId);

    const response = await axios
        .post<{
            insight: Record<string, unknown>;
            results: PixelResult[];
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

    return {
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
