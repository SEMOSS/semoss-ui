import { Env } from '@/env';
import { get, post, interceptors, UnauthorizedError } from '@/utility';

const CSRF = {
    isEnabled: false,
    token: '',
};

// set up the request interceptor
interceptors.request = async (options) => {
    if (Env.ACCESS_KEY && Env.SECRET_KEY) {
        // create the headeres
        if (!options.headers) {
            options.headers = {};
        }

        // add the authorization tokens
        options.headers = {
            ...options.headers,
            authorization: `Basic ${btoa(
                `${Env.ACCESS_KEY}:${Env.SECRET_KEY}`,
            )}`,
        };
    }

    // only set if enabled
    if (CSRF.isEnabled) {
        if (options.method === 'POST') {
            // use the token if it is there
            if (!CSRF.token) {
                const { response } = await get(
                    `${Env.MODULE}/api/config/fetchCsrf`,
                    {
                        headers: {
                            'X-CSRF-Token': 'fetch',
                        },
                    },
                );

                // not sure why the proxy server is sending it as lowercase, preserving headers doesn't fix it
                CSRF.token =
                    response.headers.get('X-CSRF-Token') ||
                    response.headers.get('x-csrf-token') ||
                    '';
            }

            // add the token
            if (options.headers) {
                options.headers = {
                    ...options.headers,
                    'X-CSRF-Token': CSRF.token,
                };
            }
        }
    }

    return options;
};

// setup the reseponse interceptor
interceptors.response = async ({ response }) => {
    if (response.status === 302) {
        throw new UnauthorizedError('Unauthorized');
    }
};

/**
 * Get the System's configuration information
 */
export const getSystemConfig = async (): Promise<{
    logins: { [key: string]: unknown };
    loginsAllowed: { [key: string]: boolean };
    [key: string]: unknown;
}> => {
    // get the response
    const response = await get<{
        logins: { [key: string]: unknown };
        loginsAllowed: { [key: string]: boolean };
        [key: string]: unknown;
    }>(`${Env.MODULE}/api/config`);

    if (response.data && response.data.csrf) {
        const token = response.data['X-CSRF-Token'] as string;

        // enable and store the token
        CSRF.isEnabled = true;
        CSRF.token = token;
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

    const body: Record<string, unknown> = {
        expression: pixel,
    };

    if (insightId) {
        body.insightId = insightId;
    }

    const response = await post<{
        insightID: string;
        pixelReturn: {
            isMeta: boolean;
            operationType: string[];
            output: O[number];
            pixelExpression: string;
            pixelId: string;
            additionalOutput?: unknown;
        }[];
    }>(`${Env.MODULE}/api/engine/runPixel`, body, {});

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
    await post(`${Env.MODULE}/api/auth/login`, {
        username: username,
        password: password,
        disableRedirect: true,
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
    await get(`${Env.MODULE}/api/auth/userinfo/${provider}`);

    return true;
};

/**
 * Allow the user to logout
 *
 * @returns true if successful
 */
export const logout = async (): Promise<boolean> => {
    // try to logout
    await get(`${Env.MODULE}/api/auth/logout/all`);

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
    path: string,
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

    const url = `${Env.MODULE}/api/uploadFile/baseUpload${param}`;

    const fd: FormData = new FormData();
    if (Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
            fd.append('file', files[i]);
        }
    } else {
        // pasted data
        fd.append('file', files);
    }

    const response = await post<
        {
            fileName: string;
            fileLocation: string;
        }[]
    >(url, fd, {});

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
            Env.MODULE
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

/**
 * Get a partial result from the insight
 * @param insightId - id of the insight to run
 */
export const partial = async (insightId: string) => {
    const response = await post<{
        message: {
            new: string;
            total: string;
        };
        status: string;
    }>(`${Env.MODULE}/api/engine/partial`, {
        jobId: insightId,
    });

    return response.data;
};

/**
 * Get the console message from an insight
 * @param insightId - id of the insight to run
 */
export const console = async (insightId: string) => {
    const response = await post<{
        message: string[];
    }>(`${Env.MODULE}/api/engine/console`, {
        jobId: insightId,
    });

    return response.data;
};
