import axios from 'axios';

const URL = 'http://localhost:3000/MonolithDev';

/**
 * Get the System's configuration information
 */
export const getSystemConfig = async (): Promise<{
    security: boolean;
    logins: { [key: string]: unknown };
    loginsAllowed: { [key: string]: boolean };
    [key: string]: unknown;
}> => {
    // get the response
    const response = await axios
        .get<{
            security: boolean;
            logins: { [key: string]: unknown };
            loginsAllowed: { [key: string]: boolean };
            [key: string]: unknown;
        }>(`${URL}/api/config`)
        .catch((error) => {
            throw Error(error);
        });

    // there was an error, no response
    if (!response) {
        throw Error('No Config Response');
    }

    // save the config data
    return response.data;
};

/**
 * Run a pixel in the parent and process the response
 * @param insightId - id of the insight to run
 * @param pixel - pixel
 */
export const runPixel = async <O extends unknown[] | []>(
    pixel: string,
    insightId?: string,
) => {
    if (!pixel) {
        throw new Error('Missing Pixel');
    }

    let postData = '';
    postData += 'expression=' + encodeURIComponent(pixel);
    if (insightId) {
        postData += '&insightId=' + encodeURIComponent(insightId);
    }

    const response = await axios.post<{
        insightID: string;
        pixelReturn: {
            isMeta: boolean;
            operationType: string[];
            output: O[number];
            pixelExpression: string;
            pixelId: string;
        }[];
    }>(`${URL}/api/engine/runPixel`, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });

    // collect the errors
    const errors: string[] = [];
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
 * Allow the user to login
 *
 * @param username - username to login with
 * @param password - password to login with
 * @returns true if successful
 */
export const login = async (
    username: string,
    password: string,
): Promise<boolean> => {
    let postData = '';
    postData += 'username=' + encodeURIComponent(username);
    postData += '&password=' + encodeURIComponent(password);
    postData += '&disableRedirect=true';

    await axios
        .post(`${URL}/api/auth/login`, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            throw Error(error);
        });

    return true;
};

/**
 * Allow the user to login with outh
 *
 * @param provider - provider to login with
 * @returns true if successful
 */
export const oauth = async (provider: string): Promise<boolean> => {
    // try to login via oauth
    await axios
        .get<true>(`${URL}/api/auth/userinfo/${provider}`)
        .catch((error) => {
            throw Error(error);
        });

    return true;
};

/**
 * Allow the user to logout
 *
 * @returns true if successful
 */
export const logout = async (): Promise<boolean> => {
    // try to logout
    await axios.get<true>(`${URL}/api/auth/logout/all`).catch((error) => {
        throw Error(error);
    });

    return true;
};
