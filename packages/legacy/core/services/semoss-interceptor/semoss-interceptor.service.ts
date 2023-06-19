import angular from 'angular';

/**
 * @name smssInterceptor.service.js
 */
export default angular
    .module('app.semoss-interceptor.service', [])
    .factory('semossInterceptorService', semossInterceptorService);

semossInterceptorService.$inject = [
    '$q',
    '$injector',
    'ENDPOINT',
    'CONFIG',
    'optionsService',
];

function semossInterceptorService(
    $q,
    $injector,
    ENDPOINT,
    CONFIG,
    optionsService: OptionsService
) {
    let token = '';

    /**
     * @name requestInterceptor
     * @param {object} config the param passed into requests
     * @desc    interceptors get called with a http config object.
     *          The function is free to modify the config object or create a new one.
     *          The function needs to return the config object directly, or a promise
     *          containing the config or a new config object.
     * @returns {object} the modified config object
     */
    function request(config: any): any {
        if (config.url.indexOf('runPixel') > -1) {
            const additionalParams = optionsService.get('options');
            let postData = config.data;

            if (additionalParams && additionalParams.restParams) {
                for (const key in additionalParams.restParams) {
                    if (additionalParams.restParams.hasOwnProperty(key)) {
                        postData +=
                            '&' + key + '=' + additionalParams.restParams[key];
                    }
                }
            }

            config.data = postData;
        }

        if (CONFIG.csrf && config.method === 'POST') {
            if (token) {
                config.headers['X-CSRF-Token'] = token;
            } else {
                const deferred = $q.defer();

                fetchCsft().then((response) => {
                    // save the token
                    token = response.headers('X-CSRF-Token');

                    // add it
                    config.headers['X-CSRF-Token'] = token;

                    // return the config
                    deferred.resolve(config);
                });
                return deferred.promise;
            }
        }

        // clear it on logout
        if (config.url.indexOf('/logout') != -1) {
            token = '';
        }

        return config;
    }

    /**
     * Create the CSRF Token GET Request
     * @returns
     */
    function fetchCsft(): ng.IPromise<any> {
        const url = ENDPOINT.URL + '/api/config/fetchCsrf',
            method = 'GET',
            headers = {
                'X-CSRF-Token': 'fetch',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            params = '',
            data = '',
            cache = false;

        const $http = $injector.get('$http');

        return $http({
            url,
            data,
            method,
            cache,
            headers,
            params,
        });
    }

    return {
        request: request,
    };
}
