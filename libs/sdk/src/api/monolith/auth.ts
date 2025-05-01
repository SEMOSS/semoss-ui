<<<<<<< HEAD
import { Env } from '../../env';
import { Insight } from "../../";
=======
import { Env } from '@/env';
import { Role } from '@/types';
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
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

<<<<<<< HEAD
export const runQuery = async <O extends any[] | []>(
    pixel: string,
    insightId?: string,
) => {
    return run<O>(insightId ?? Insight["insightId"], pixel);
};


export const fileDownload = async (insightID: string, fileKey: string) => {
=======
export const download = async (insightID: string, fileKey: string) => {
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
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


<<<<<<< HEAD
export const monolithLogin = async (
=======
export const login = async (
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
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

<<<<<<< HEAD
export const monolithLogout = async (): Promise<boolean> => {
=======
export const logout = async (): Promise<boolean> => {
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
    await get(`${Env.MODULE}/api/auth/logout/all`)
        .catch((err) => {
            throw Error(err);
        });
    return true;
};

<<<<<<< HEAD
export const monolithOauth = async (provider: string): Promise<boolean> => {
=======
export const oauth = async (provider: string): Promise<boolean> => {
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
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
<<<<<<< HEAD
                    const response = await monolithOauth(provider);
=======
                    const response = await oauth(provider);
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
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
<<<<<<< HEAD
};

export const getInsights = async () => {
    console.error('needs to be added on BE');
};
export const getInsightUsers = async (
    admin: boolean,
    id: string,
    user: string,
    permission: string,
    offset?: number,
    limit?: number,
    projectid?: string,
) => {
    // /api/auth/insight/getInsightUsers?
    // insightId=feb4c485-0aa8-4ff6-b355-e894dc74589a&projectId=2e2534db-fffa-4054-b9e9-dbf44183ab3b
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += `insight/getInsightUsers$insightId=${id}&projectId=${projectid}&userId=${user}&limit=${limit}&offset=${offset}`;
    if (!projectid) {
        throw Error('no project id');
    }
    // get the response
    const response = await get<
            {
                id: string;
                name: string;
                permission: string;
            }[]
        >(url)
        .catch((error) => {
            throw Error(error);
        });
    if (!response) {
        throw Error('Unsuccessful attempt at retrieving Insight Users');
    }
    return response.data;
};

export const getInsightUsersNoCredentials = async (
    admin: boolean,
    insightId: string,
    projectId: string,
) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += `insight/getInsightUsersNoCredentials&projectId=${projectId}&insightId=${insightId}`;
    // get the response
    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get non credentialed users');
    }
    return response.data;
};

export const addInsightUserPermissions = async (
    admin: boolean,
    id: string,
    users: any[],
    projectId: string,
) => {
    let url = `${Env.MODULE}/api/auth/`

    const postData = {
        'projectId': projectId,
        'insightId': id,
        'userpermissions': JSON.stringify(users),
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'insight/addInsightUserPermissions';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const removeInsightUserPermissions = async (
    admin: boolean,
    id: string,
    users: any[],
    projectId,
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'projectId': projectId,
        'insightId': id,
        'ids': JSON.stringify(users),
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'project/removeProjectUserPermissions';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const editInsightUserPermissions = async (
    admin: boolean,
    id: string,
    users: any[],
    projectId: string,
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'projectId': projectId,
        'insightId': id,
        'userpermissions': JSON.stringify(users),
        };
    if (admin) {
        url += 'admin/';
    }
    url += 'insight/editInsightUserPermissions';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const editProjectUserPermission = async (
    admin: boolean,
    projectId: string,
    id: string,
    permission: string,
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'projectId': projectId,
        'id': id,
        'permission': permission,
    };

    if (admin) {
        url += 'admin/';
    }
    url += 'project/editProjectUserPermission';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const editAppUserPermission = async (
    admin: boolean,
    appId: string,
    id: string,
    permission: string,
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'appId': appId,
        'id': id,
        'permission': permission,
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'app/editAppUserPermission';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const uploadFile = async (
    files: File[],
    insightId: string | null,
    projectId?: string | null,
    path?: string | null,
) => {
    let param = '';
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
    const url = `${Env.MODULE}/api/uploadFile/baseUpload${param}`,
        fd: FormData = new FormData();
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
    >(url, fd, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const getApps = async (databaseId: string) => {
    const url = `${Env.MODULE}/api/auth/admin/app/getApps?databaseId=${databaseId}`;
    const response = await get(url).catch((error) => {
        throw Error(error);
    });
    return response.data;
};

export const getDBUsers = async (admin: boolean, appId: string) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) url += 'admin/';
    url += 'app/getAppUsers?appId=' + appId;
    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get non credentialed users');
    }
    return response;
};

export const removeAppUserPermissions = async (
    admin: boolean,
    appId: string,
    id: string,
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'appId': appId,
        'id': id,
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'app/removeAppUserPermission';

    const response = await post<{
            success: boolean;
        }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            throw Error(error);
        });
    return response;
};

export const getAllUsers = async (
    admin: boolean,
    searchTerm?: string,
    offset?: number,
    limit?: number,
) => {
    let getAllUsersURL = `${Env.MODULE}/api/auth/`;
    let getNumUsersURL = `${Env.MODULE}/api/auth/`;
    if (admin) {
        getAllUsersURL += 'admin/';
        getNumUsersURL += 'admin/';
    } else {
        return;
    }
    getAllUsersURL += `user/getAllUsers?filterWord=${searchTerm}&offset=${offset}&limit=${limit}`;
    // get the response
    const response = await get<
            {
                id: string;
                type: string;
                name?: string;
                admin?: boolean;
                publisher?: boolean;
                exporter?: boolean;
                email?: string;
                phone?: string;
                phoneextension?: string;
                countrycode?: string;
                username?: string;
                model_usage_restriction?: string;
                model_usage_frequency?: string;
                model_max_tokens?: number;
                model_max_response_time?: number;
            }[]
        >(getAllUsersURL)
        .catch((error) => {
            throw Error(error);
        });
    getNumUsersURL += 'user/getNumUsers';
    const count = await get<number>(getNumUsersURL).catch((error) => {
        throw Error(error);
    });
    // there was no response, that is an error
    if (!response || !count) {
        throw Error('No Response to get Members');
    }
    const finalResponse = {
        users: response.data,
        totalUsers: searchTerm !== '' ? response.data.length : count.data,
    };
    return finalResponse;
};

export const deleteMember = async (
    admin: boolean,
    userId: string,
    userType: string,
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'userId': userId,
        'type': userType,
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'user/deleteUser';

    const response = await post<boolean>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const editMemberInfo = async (admin: boolean, user: any) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'user': JSON.stringify(user)
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'user/editUser';
    const response = await post<boolean>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((e) => {
            throw Error(e);
        });
    return response;
};

export const createUser = async (admin: boolean, user: any) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += 'user/registerUser';
    const newUserInfo = {};
    if (user.id) {
        newUserInfo['userId'] = user.id ;
    }
    if (user.type) {
        newUserInfo['type'] = user.type;
    }
    if (user.type === 'NATIVE') {
        newUserInfo['username']  =user.id;
    } else if (user.username) {
        newUserInfo['username']=user.username;
    }
    if (user.password) {
        newUserInfo['password'] = user.password;
    }
    if (user.admin) {
        newUserInfo['admin'] = user.admin;
    }
    if (user.publisher) {
        newUserInfo['publisher'] = user.publisher;
    }
    if (user.exporter) {
        newUserInfo['exporter'] = user.exporter;
    }
    if (user.name) {
        newUserInfo['name'] = user.name;
    }
    if (user.email) {
        newUserInfo['email'] = user.email;
    }
    if (user.phone) {
        newUserInfo['phone'] = user.phone;
    }
    if (user.phoneextension) {
        newUserInfo['phoneextension'] = user.phoneextension;
    }
    if (user.model_usage_restriction) {
        if (user.model_usage_restriction === 'null') {
            user.model_usage_restriction = null;
        }
        newUserInfo['modelUsageRestriction'] = user.model_usage_restriction;
    }
    if (user.model_usage_frequency) {
        newUserInfo['modelUsageFrequency'] = user.model_usage_frequency;
    }
    if (user.model_max_tokens) {
        newUserInfo['modelMaxTokens'] = user.model_max_tokens;
    }
    if (user.model_max_response_time) {
        newUserInfo['modelMaxResponseTime'] = user.model_max_response_time;
    }
    const response = await post<boolean>(url, newUserInfo, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const getUserAccessKeys = async () => {
    const url = `${Env.MODULE}/api/auth/user/getUserAccessKeys`;
    const response = await get<
            {
                ACCESSKEY: string;
                DATECREATED: string;
                TOKENNAME: string;
                LASTUSED?: string;
                TOKENDESCRIPTION?: string;
            }[]
        >(url)
        .catch((error) => {
            throw Error(error);
        });
    return response.data;
};

export const createUserAccessKey = async (
    tokenName: string,
    tokenDescription = '',
) => {
    const url = `${Env.MODULE}/api/auth/user/createUserAccessKey`;
    const body = {
        'tokenName': tokenName}
    if (tokenDescription) {
        body['tokenDescription'] = tokenDescription;
    }
    const response = await post<{
            ACCESSKEY: string;
            SECRETKEY: string;
            DATECREATED: string;
            LASTUSED: string;
            TOKENNAME: string;
            TOKENDESCRIPTION?: string;
        }>(url, body, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            throw Error(error);
        });
    return response.data;
};

export const deleteUserAccessKeys = async (accessKey: string) => {
    const url = `${Env.MODULE}/api/auth/user/deleteUserAccessKey`;
    const body = {
        'accessKey': accessKey
    };
    const response = await post<boolean>(url, body, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
        .catch((error) => {
            throw Error(error);
        });
    return response.data;
=======
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
>>>>>>> 6841458ef (refactor(sdk): migrate Monolith to sdk)
};