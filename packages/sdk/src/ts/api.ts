import axios from 'axios';

import { ENV } from './config';

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
        }>(`${ENV.MODULE}/api/config`)
        .catch((error) => {
            throw Error(error);
        });

    // there was an error, no response
    if (!response) {
        throw Error('No Config Response');
    }

    if (response.data && response.data.csrf) {
        let token = response.data['X-CSRF-Token'];

        axios.interceptors.request.use(
            async (config: any) => {
                if (config.method === 'post') {
                    // use the token if it is there

                    if (!token) {
                        const tokenResponse = await axios.get(
                            `${ENV.MODULE}/api/config/fetchCsrf`,
                            {
                                headers: {
                                    'Content-Type':
                                        'application/x-www-form-urlencoded',
                                    'X-CSRF-Token': 'fetch',
                                },
                            },
                        );

                        // not sure why the proxy server is sending it as lowercase, preserving headers doesn't fix it
                        token =
                            tokenResponse.headers['X-CSRF-Token'] ||
                            tokenResponse.headers['x-csrf-token'];
                    }

                    config.headers['X-CSRF-Token'] = token;
                }

                return config;
            },
            (error) => {
                Promise.reject(error);
            },
        );
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
            additionalOutput?: unknown;
        }[];
    }>(`${ENV.MODULE}/api/engine/runPixel`, postData, {
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
        .post(`${ENV.MODULE}/api/auth/login`, postData, {
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
        .get<true>(`${ENV.MODULE}/api/auth/userinfo/${provider}`)
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
    await axios
        .get<true>(`${ENV.MODULE}/api/auth/logout/all`)
        .catch((error) => {
            throw Error(error);
        });

    return true;
};

/**
 * Upload file(s) to the backend
 * @param files
 * @param insightId
 * @param projectId
 * @param path
 * @returns
 */
export const upload = async (
    files: File | File[],
    insightId: string | null,
    projectId: string | null,
    path: string | null,
): Promise<
    {
        fileName: string;
        fileLocation: string;
    }[]
> => {
    let param = '';

    path = path || '';
    if (insightId || projectId || path) {
        if (insightId) {
            if (param.length > 0) {
                param += '&';
            }
            param += `insightId=${insightId}`;
        }

        if (projectId) {
            if (param.length > 0) {
                param += '&';
            }
            param += `projectId=${projectId}`;
        }

        if (path) {
            if (param.length > 0) {
                param += '&';
            }
            param += `path=${path}`;
        }

        param = `?${param}`;
    }

    const url = `${ENV.MODULE}/api/uploadFile/baseUpload${param}`,
        fd: FormData = new FormData();

    if (Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
            fd.append('file', files[i]);
        }
    } else {
        // pasted data
        fd.append('file', files);
    }

    const response = await axios.post<
        {
            fileName: string;
            fileLocation: string;
        }[]
    >(url, fd, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });

    return response.data;
};

/**
 * Download a file by using a unique key
 *
 * @param insightId - insightId to download the file
 * @param fileKey - id for the file to download
 */
export const download = async (insightId: string, fileKey: string) => {
    return new Promise<void>((resolve) => {
        if (!insightId) {
            throw Error('No Insight ID provided for download.');
        }
        // create the download url
        const url = `${
            ENV.MODULE
        }/api/engine/downloadFile?insightId=${insightId}&fileKey=${encodeURIComponent(
            fileKey,
        )}`;

        // fake clicking a link
        const link: HTMLAnchorElement = document.createElement('a');

        link.href = url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);

        // resolve the promise
        resolve();
    });
};
