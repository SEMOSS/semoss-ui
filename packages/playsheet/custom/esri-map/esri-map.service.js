(function () {
    'use strict';

    /**
     * @name esrimap.service.js
     * @desc sets up all components needed for the esri map directive
     */
    angular.module('app.esrimap.service', [])
        .factory('esriMapService', esriMapService);

    esriMapService.$inject = ['$q'];

    function esriMapService($q) {
        var isEsriLoaded = false;

        function bootstrap(options) {
            var deferred = $q.defer();

            // Default options object to empty hash
            var opts = options || {};

            // Don't reload API if it is already loaded
            if (isEsriLoaded) {
                deferred.reject('ESRI API is already loaded.');
                return deferred.promise;
            }

            // Create Script Object to be loaded
            var script    = document.createElement('script');
            script.type   = 'text/javascript';
            script.src    = opts.url || window.location.protocol + '//js.arcgis.com/3.16';

            // Set onload callback to resolve promise
            script.onload = function() { deferred.resolve( window.require ); };

            document.body.appendChild(script);

            isEsriLoaded = true;

            return deferred.promise;
        }

        function isLoaded() {
            return typeof window.require !== 'undefined';
        }

        function requireModule(moduleName, callback){
            var deferred = $q.defer();

            // Throw Error if Esri is not loaded yet
            if (!isLoaded()) {
                deferred.reject('Trying to call esriLoader.require(), but Esri ArcGIS API has not been loaded yet. Run esriLoader.bootstrap() if you are lazy loading Esri ArcGIS API.');
                return deferred.promise;
            }
            
            if (typeof moduleName === 'string') {
                require([moduleName], function (module) {
                    // grab the single module passed back from require callback and send to promise
                    deferred.resolve(module);
                });

                // return a chained promise that calls the callback function
                //  to ensure it occurs within the digest cycle
                return deferred.promise.then(function(module) {
                    if (callback && typeof callback === 'function') {
                        callback(module);
                    }
                    return module;
                });
            } else if (moduleName instanceof Array) {
                require(moduleName, function () {
                    var modules = Array.prototype.slice.call(arguments);
                    // grab all of the modules passed back from require callback and send as array to promise
                    deferred.resolve(modules);
                });

                // return a chained promise that calls the callback function
                //  to ensure it occurs within the digest cycle
                return deferred.promise.then(function(modules) {
                    if (callback && typeof callback === 'function') {
                        callback.apply(this, modules);
                    }
                    return modules;
                });
            } else {
                deferred.reject('An Array<String> or String is required to load modules.');
                return deferred.promise;
            }
        }

        function getIsLoaded() {
            return isEsriLoaded;
        }

        return {
            bootstrap:       bootstrap,
            isLoaded:        isLoaded,
            requireModule:   requireModule,
            getIsLoaded:     getIsLoaded
        };
    }
})();