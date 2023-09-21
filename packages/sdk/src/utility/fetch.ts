// store the interceptors
export const interceptors: {
    request: ((options: RequestInit) => Promise<RequestInit>) | null;
    response:
        | ((output: { response: Response; data: unknown }) => Promise<void>)
        | null;
} = {
    request: null,
    response: null,
};

/**
 * Make a get call to the backend
 * @param path - path
 * @param options - options to pass into the fetch
 */
export const get = async <O>(path: string, options: RequestInit = {}) => {
    options = {
        method: 'GET',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        ...options,
    };

    // intercept
    if (interceptors.request) {
        options = await interceptors.request(options);
    }

    // get the data
    const response = await fetch(`${path}`, options);

    // get the data
    const data = await response.json();

    // handle the response
    if (interceptors.response) {
        await interceptors.response({
            response: response,
            data: data,
        });
    }

    // return the json
    return {
        response: response,
        data: data as O,
    };
};

/**
 * Make a post call to the backend
 * @param path - path
 * @param body - body to pass in
 * @param options - options to pass into the fetch
 */
export const post = async <O>(
    path: string,
    body: FormData | Record<string, unknown>,
    options: RequestInit = {},
) => {
    const isFormData = body instanceof FormData;

    options = {
        method: 'POST',
        headers: {
            'content-type': isFormData
                ? 'multipart/form-data'
                : 'application/x-www-form-urlencoded',
        },
        body: isFormData
            ? body
            : Object.keys(body)
                  .map((k) => {
                      let val = body[k];
                      if (typeof val !== 'string') {
                          val = JSON.stringify(body[k]);
                      }

                      return `${encodeURIComponent(k)}=${encodeURIComponent(
                          val as string,
                      )}`;
                  })
                  .join('&'),
        ...options,
    };

    // intercept
    if (interceptors.request) {
        options = await interceptors.request(options);
    }

    // get the data
    const response = await fetch(`${path}`, options);

    // get the data
    const data = await response.json();

    // handle the response
    if (interceptors.response) {
        await interceptors.response({
            response: response,
            data: data,
        });
    }

    // return the json
    return {
        response: response,
        data: data as O,
    };
};
