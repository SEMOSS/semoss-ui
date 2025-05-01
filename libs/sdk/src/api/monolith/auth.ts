import { Env } from '@/env';
import { Role } from '@/types';
import { get, post, interceptors, UnauthorizedError } from "../../utility";


export const config = async () => {
    // get the response
    const response = await get<{
            logins: {
                [key: string]: unknown;
            };
            /**
             * List of available providers (logins) that are available
             */
            availableProviders: {
                provider: string;
                name: string;
                isOauth: boolean;
            }[];
            [key: string]: unknown;
        }>(`${Env.MODULE}/api/config`)
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

export const run = async <O extends unknown[] | []>(
    insightID: string,
    pixel: string,
) => {
    // build the expression
    const postData = {
        'expression': pixel
    };

    if (insightID) {
        postData["insightId"] = insightID;
    }
    const response = await post<{
            insightID: string;
            pixelReturn: {
                isMeta: boolean;
                operationType: string[];
                additionalOutput: {
                    output: string;
                }[];
                output: O[number];
                pixelExpression: string;
                pixelId: string;
            }[];
        }>(`${Env.MODULE}/api/engine/runPixel`, postData)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Pixel Response');
    }
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

export const download = async (insightID: string, fileKey: string) => {
    return new Promise<void>((resolve) => {
        // create the download url
        const url = `${
            Env.MODULE
        }/api/engine/downloadFile?insightId=${insightID}&fileKey=${encodeURIComponent(
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


export const login = async (
    username: string,
    password: string,
): Promise<boolean> => {
    //not encoding these, because the post function has encode URI built in. 
    const postData = {
        'username': username,
        'password': password, 
        'disableRedirect': true
    };    

    await post(`${Env.MODULE}/api/auth/login`, postData)
        .catch((error) => {
            throw Error(error);
        });
    return true;
};

export const loginOTP = async (
    username: string,
    password: string,
): Promise<'success' | 'change-password'> => {

    const postData = {
        'username': username,
        'pin': password,
        'disableRedirect': true
    }

    // track the status
    let status: 'success' | 'change-password' = 'success';
    await post(`${Env.MODULE}/api/auth/loginLinOTP`, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            if (
                error.response &&
                error.response.status === 401 &&
                error.response.data &&
                error.response.data.requirePwdChange
            ) {
                status = 'change-password';
                return;
            }
            // throw the message
            throw Error(error);
        });
    return status;
};


export const confirmOTP = async (otp: string): Promise<boolean> => {
    const postData = {
        'otp': otp,
        'disableRedirect': true}
    await post(`${Env.MODULE}/api/auth/loginLinOTP`, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            // throw the message
            throw Error(error.response.data.errorMessage);
        });
    return true;
};

export const loginLDAP = async (
    username: string,
    password: string,
): Promise<'success' | 'change-password'> => {
    const postData = {
        'username': username,
        'pin': password,
        'disableRedirect': true
    };
    
    // track the status
    let status: 'success' | 'change-password' = 'success';
    await post(`${Env.MODULE}/api/auth/loginLDAP`, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            if (
                error.response &&
                error.response.status === 401 &&
                error.response.data &&
                error.response.data.requirePwdChange
            ) {
                status = 'change-password';
                return;
            }
            // throw the message
            throw Error(error);
        });
    return status;
};

export const registerUser = async (
    name: string,
    username: string,
    email: string,
    password: string,
    phone: string,
    phoneextension: string,
    countrycode: string,
) => {
    const create: Record<string, string> = {
        name: name, 
        username: username,
        email: email,
        password: password,
        phone: phone,
        phoneextension: phoneextension,
        countrycode: countrycode,
    };
    return await post(`${Env.MODULE}/api/auth/createUser`, create, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            if (
                error.response &&
                error.response.status === 401 &&
                error.response.data &&
                error.response.data.requirePwdChange
            ) {
                return;
            }
            // throw the message
            throw Error(error);
        });
};

export const logout = async (): Promise<boolean> => {
    await get(`${Env.MODULE}/api/auth/logout/all`)
        .catch((err) => {
            throw Error(err);
        });
    return true;
};

export const oauth = async (provider: string): Promise<boolean> => {
    // check if the user is logged in
    const response = await get<{
            name: string;
        }>(`${Env.MODULE}/api/auth/userinfo/${provider}`)
        .catch((error) => {
            throw Error(error);
        });
    //check if they are already logged in
    if (response.data && response.data.name) {
        return true;
    }
    return new Promise((resolve) => {
        const url = `${Env.MODULE}/api/auth/login/${provider}`;
        const popUpWindow = window.top.open(
            url,
            '_blank',
            'height=600,width=400,top=300,left=' + 600,
        );
        // setup an interval to see if the popup window is closed or successful
        const interval = setInterval(async () => {
            try {
                if (
                    !popUpWindow ||
                    popUpWindow.closed ||
                    popUpWindow.closed === undefined
                ) {
                    clearInterval(interval);
                } else if (
                    popUpWindow.document.location.href.indexOf(
                        `${window.location.host}`,
                    ) > -1
                ) {
                    clearInterval(interval);
                    // close it
                    popUpWindow.close();
                    // try to get the info again
                    const response = await oauth(provider);
                    // close it
                    resolve(response);
                }
            } catch (err) {
                // do nothing
                // this is to work around the blocked frame error that comes up
            }
        }, 1000);
    });
};

export const getLoginProperties = async () => {
    const url = `${Env.MODULE}/api/auth/loginProperties`;
    const response = await get(url).catch((error) => {
        throw Error(error);
    });
    return response.data;
};

export const modifyLoginProperties = async (provider, properties) => {
    const url = `${Env.MODULE}/api/auth/modifyLoginProperties/` + provider;
    const postData = {
        'modifications': JSON.stringify(properties)
    };
    const response = await post<boolean>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            throw Error(error);
        });
    return response.data;
};

export const createAdminTheme = async (data: {
    name: string;
    json: any;
    isActive: boolean;
}) => {
    const url = `${Env.MODULE}/api/themes/createAdminTheme`;
    const postData = {
        'name': data.name,
        'json': JSON.stringify(data.json),
        'isActive': data.isActive,
    };
    
    const response = await post<boolean>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
    // Sets an Active theme with material ui properties
    // const map = JSON.parse(data['theme']['THEME_MAP']);
    // const material_map = {
    //     ...map,
    //     materialTheme: lightTheme,
    // };
    // console.log(JSON.stringify(material_map));
    // monolithStore.createAdminTheme({
    //     name: 'SEMOSS-TEST-DARK',
    //     isActive: true,
    //     json: material_map,
    // });
};