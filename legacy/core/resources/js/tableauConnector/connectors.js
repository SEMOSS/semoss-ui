/*! Build Number: 2.1.2 */
/******/ (function (modules) {
    // webpackBootstrap
    /******/ // The module cache
    /******/ var installedModules = {};

    /******/ // The require function
    /******/ function __webpack_require__(moduleId) {
        /******/ // Check if module is in cache
        /******/ if (installedModules[moduleId])
            /******/ return installedModules[moduleId].exports;

        /******/ // Create a new module (and put it into the cache)
        /******/ var module = (installedModules[moduleId] = {
            /******/ exports: {},
            /******/ id: moduleId,
            /******/ loaded: false,
            /******/
        });

        /******/ // Execute the module function
        /******/ modules[moduleId].call(
            module.exports,
            module,
            module.exports,
            __webpack_require__,
        );

        /******/ // Flag the module as loaded
        /******/ module.loaded = true;

        /******/ // Return the exports of the module
        /******/ return module.exports;
        /******/
    }

    /******/ // expose the modules object (__webpack_modules__)
    /******/ __webpack_require__.m = modules;

    /******/ // expose the module cache
    /******/ __webpack_require__.c = installedModules;

    /******/ // __webpack_public_path__
    /******/ __webpack_require__.p = '';

    /******/ // Load entry module and return exports
    /******/ return __webpack_require__(0);
    /******/
})(
    /************************************************************************/
    /******/ [
        /* 0 */
        /***/ function (module, exports, __webpack_require__) {
            // Main entry point to pull together everything needed for the WDC shim library
            // This file will be exported as a bundled js file by webpack so it can be included
            // in a <script> tag in an html document. Alernatively, a connector may include
            // this whole package in their code and would need to call init like this
            var tableauwdc = __webpack_require__(19);
            tableauwdc.init();

            /***/
        },
        /* 1 */
        /***/ function (module, exports, __webpack_require__) {
            var APPROVED_ORIGINS_KEY = 'wdc_approved_origins';
            var SEPARATOR = ',';
            var Cookies = __webpack_require__(8);

            function _getApprovedOriginsValue() {
                var result = Cookies.get(APPROVED_ORIGINS_KEY);
                return result;
            }

            function _saveApprovedOrigins(originArray) {
                var newOriginString = originArray.join(SEPARATOR);
                console.log(
                    "Saving approved origins '" + newOriginString + "'",
                );

                // We could potentially make this a longer term cookie instead of just for the current session
                var result = Cookies.set(APPROVED_ORIGINS_KEY, newOriginString);
                return result;
            }

            // Adds an approved origins to the list already saved in a session cookie
            function addApprovedOrigin(origin) {
                if (origin) {
                    var origins = getApprovedOrigins();
                    origins.push(origin);
                    _saveApprovedOrigins(origins);
                }
            }

            // Retrieves the origins which have already been approved by the user
            function getApprovedOrigins() {
                var originsString = _getApprovedOriginsValue();
                if (!originsString || 0 === originsString.length) {
                    return [];
                }

                var origins = originsString.split(SEPARATOR);
                return origins;
            }

            module.exports.addApprovedOrigin = addApprovedOrigin;
            module.exports.getApprovedOrigins = getApprovedOrigins;

            /***/
        },
        /* 2 */
        /***/ function (module, exports) {
            /** This file lists all of the enums which should available for the WDC */
            var allEnums = {
                phaseEnum: {
                    interactivePhase: 'interactive',
                    authPhase: 'auth',
                    gatherDataPhase: 'gatherData',
                },

                authPurposeEnum: {
                    ephemeral: 'ephemeral',
                    enduring: 'enduring',
                },

                authTypeEnum: {
                    none: 'none',
                    basic: 'basic',
                    custom: 'custom',
                },

                dataTypeEnum: {
                    bool: 'bool',
                    date: 'date',
                    datetime: 'datetime',
                    float: 'float',
                    int: 'int',
                    string: 'string',
                },

                columnRoleEnum: {
                    dimension: 'dimension',
                    measure: 'measure',
                },

                columnTypeEnum: {
                    continuous: 'continuous',
                    discrete: 'discrete',
                },

                aggTypeEnum: {
                    sum: 'sum',
                    avg: 'avg',
                    median: 'median',
                    count: 'count',
                    countd: 'count_dist',
                },

                geographicRoleEnum: {
                    area_code: 'area_code',
                    cbsa_msa: 'cbsa_msa',
                    city: 'city',
                    congressional_district: 'congressional_district',
                    country_region: 'country_region',
                    county: 'county',
                    state_province: 'state_province',
                    zip_code_postcode: 'zip_code_postcode',
                    latitude: 'latitude',
                    longitude: 'longitude',
                },

                unitsFormatEnum: {
                    thousands: 'thousands',
                    millions: 'millions',
                    billions_english: 'billions_english',
                    billions_standard: 'billions_standard',
                },

                numberFormatEnum: {
                    number: 'number',
                    currency: 'currency',
                    scientific: 'scientific',
                    percentage: 'percentage',
                },

                localeEnum: {
                    america: 'en-us',
                    brazil: 'pt-br',
                    china: 'zh-cn',
                    france: 'fr-fr',
                    germany: 'de-de',
                    japan: 'ja-jp',
                    korea: 'ko-kr',
                    spain: 'es-es',
                },

                joinEnum: {
                    inner: 'inner',
                    left: 'left',
                },
            };

            // Applies the enums as properties of the target object
            function apply(target) {
                for (var key in allEnums) {
                    target[key] = allEnums[key];
                }
            }

            module.exports.apply = apply;

            /***/
        },
        /* 3 */
        /***/ function (module, exports) {
            /** @class Used for communicating between Tableau desktop/server and the WDC's
             * Javascript. is predominantly a pass-through to the Qt WebBridge methods
             * @param nativeApiRootObj {Object} - The root object where the native Api methods
             * are available. For WebKit, this is window.
             */
            function NativeDispatcher(nativeApiRootObj) {
                this.nativeApiRootObj = nativeApiRootObj;
                this._initPublicInterface();
                this._initPrivateInterface();
            }

            NativeDispatcher.prototype._initPublicInterface = function () {
                console.log(
                    'Initializing public interface for NativeDispatcher',
                );
                this._submitCalled = false;

                var publicInterface = {};
                publicInterface.abortForAuth = this._abortForAuth.bind(this);
                publicInterface.abortWithError =
                    this._abortWithError.bind(this);
                publicInterface.addCrossOriginException =
                    this._addCrossOriginException.bind(this);
                publicInterface.log = this._log.bind(this);
                publicInterface.submit = this._submit.bind(this);
                publicInterface.reportProgress =
                    this._reportProgress.bind(this);

                this.publicInterface = publicInterface;
            };

            NativeDispatcher.prototype._abortForAuth = function (msg) {
                this.nativeApiRootObj.WDCBridge_Api_abortForAuth.api(msg);
            };

            NativeDispatcher.prototype._abortWithError = function (msg) {
                this.nativeApiRootObj.WDCBridge_Api_abortWithError.api(msg);
            };

            NativeDispatcher.prototype._addCrossOriginException = function (
                destOriginList,
            ) {
                this.nativeApiRootObj.WDCBridge_Api_addCrossOriginException.api(
                    destOriginList,
                );
            };

            NativeDispatcher.prototype._log = function (msg) {
                this.nativeApiRootObj.WDCBridge_Api_log.api(msg);
            };

            NativeDispatcher.prototype._submit = function () {
                if (this._submitCalled) {
                    console.log('submit called more than once');
                    return;
                }

                this._submitCalled = true;
                this.nativeApiRootObj.WDCBridge_Api_submit.api();
            };

            NativeDispatcher.prototype._initPrivateInterface = function () {
                console.log(
                    'Initializing private interface for NativeDispatcher',
                );

                this._initCallbackCalled = false;
                this._shutdownCallbackCalled = false;

                var privateInterface = {};
                privateInterface._initCallback = this._initCallback.bind(this);
                privateInterface._shutdownCallback =
                    this._shutdownCallback.bind(this);
                privateInterface._schemaCallback =
                    this._schemaCallback.bind(this);
                privateInterface._tableDataCallback =
                    this._tableDataCallback.bind(this);
                privateInterface._dataDoneCallback =
                    this._dataDoneCallback.bind(this);

                this.privateInterface = privateInterface;
            };

            NativeDispatcher.prototype._initCallback = function () {
                if (this._initCallbackCalled) {
                    console.log('initCallback called more than once');
                    return;
                }

                this._initCallbackCalled = true;
                this.nativeApiRootObj.WDCBridge_Api_initCallback.api();
            };

            NativeDispatcher.prototype._shutdownCallback = function () {
                if (this._shutdownCallbackCalled) {
                    console.log('shutdownCallback called more than once');
                    return;
                }

                this._shutdownCallbackCalled = true;
                this.nativeApiRootObj.WDCBridge_Api_shutdownCallback.api();
            };

            NativeDispatcher.prototype._schemaCallback = function (
                schema,
                standardConnections,
            ) {
                // Check to make sure we are using a version of desktop which has the WDCBridge_Api_schemaCallbackEx defined
                if (!!this.nativeApiRootObj.WDCBridge_Api_schemaCallbackEx) {
                    // Providing standardConnections is optional but we can't pass undefined back because Qt will choke
                    this.nativeApiRootObj.WDCBridge_Api_schemaCallbackEx.api(
                        schema,
                        standardConnections || [],
                    );
                } else {
                    this.nativeApiRootObj.WDCBridge_Api_schemaCallback.api(
                        schema,
                    );
                }
            };

            NativeDispatcher.prototype._tableDataCallback = function (
                tableName,
                data,
            ) {
                this.nativeApiRootObj.WDCBridge_Api_tableDataCallback.api(
                    tableName,
                    data,
                );
            };

            NativeDispatcher.prototype._reportProgress = function (progress) {
                // Report progress was added in 2.1 so it may not be available if Tableau only knows 2.0
                if (!!this.nativeApiRootObj.WDCBridge_Api_reportProgress) {
                    this.nativeApiRootObj.WDCBridge_Api_reportProgress.api(
                        progress,
                    );
                } else {
                    console.log(
                        'reportProgress not available from this Tableau version',
                    );
                }
            };

            NativeDispatcher.prototype._dataDoneCallback = function () {
                this.nativeApiRootObj.WDCBridge_Api_dataDoneCallback.api();
            };

            module.exports = NativeDispatcher;

            /***/
        },
        /* 4 */
        /***/ function (module, exports, __webpack_require__) {
            var Table = __webpack_require__(6);
            var Enums = __webpack_require__(2);

            /** @class This class represents the shared parts of the javascript
             * library which do not have any dependence on whether we are running in
             * the simulator, in Tableau, or anywhere else
             * @param tableauApiObj {Object} - The already created tableau API object (usually window.tableau)
             * @param privateApiObj {Object} - The already created private API object (usually window._tableau)
             * @param globalObj {Object} - The global object to attach things to (usually window)
             */
            function Shared(tableauApiObj, privateApiObj, globalObj) {
                this.privateApiObj = privateApiObj;
                this.globalObj = globalObj;
                this._hasAlreadyThrownErrorSoDontThrowAgain = false;

                this.changeTableauApiObj(tableauApiObj);
            }

            Shared.prototype.init = function () {
                console.log('Initializing shared WDC');
                this.globalObj.onerror = this._errorHandler.bind(this);

                // Initialize the functions which will be invoked by the native code
                this._initTriggerFunctions();

                // Assign the deprecated functions which aren't availible in this version of the API
                this._initDeprecatedFunctions();
            };

            Shared.prototype.changeTableauApiObj = function (tableauApiObj) {
                this.tableauApiObj = tableauApiObj;

                // Assign our make & register functions right away because a connector can use
                // them immediately, even before bootstrapping has completed
                this.tableauApiObj.makeConnector =
                    this._makeConnector.bind(this);
                this.tableauApiObj.registerConnector =
                    this._registerConnector.bind(this);

                Enums.apply(this.tableauApiObj);
            };

            Shared.prototype._errorHandler = function (
                message,
                file,
                line,
                column,
                errorObj,
            ) {
                console.error(errorObj); // print error for debugging in the browser
                if (this._hasAlreadyThrownErrorSoDontThrowAgain) {
                    return true;
                }

                var msg = message;
                if (errorObj) {
                    msg += '   stack:' + errorObj.stack;
                } else {
                    msg += '   file: ' + file;
                    msg += '   line: ' + line;
                }

                if (this.tableauApiObj && this.tableauApiObj.abortWithError) {
                    this.tableauApiObj.abortWithError(msg);
                } else {
                    throw msg;
                }

                this._hasAlreadyThrownErrorSoDontThrowAgain = true;
                return true;
            };

            Shared.prototype._makeConnector = function () {
                var defaultImpls = {
                    init: function (cb) {
                        cb();
                    },
                    shutdown: function (cb) {
                        cb();
                    },
                };

                return defaultImpls;
            };

            Shared.prototype._registerConnector = function (wdc) {
                // do some error checking on the wdc
                var functionNames = [
                    'init',
                    'shutdown',
                    'getSchema',
                    'getData',
                ];
                for (var ii = functionNames.length - 1; ii >= 0; ii--) {
                    if (typeof wdc[functionNames[ii]] !== 'function') {
                        throw (
                            'The connector did not define the required function: ' +
                            functionNames[ii]
                        );
                    }
                }

                console.log('Connector registered');

                this.globalObj._wdc = wdc;
                this._wdc = wdc;
            };

            Shared.prototype._initTriggerFunctions = function () {
                this.privateApiObj.triggerInitialization =
                    this._triggerInitialization.bind(this);
                this.privateApiObj.triggerSchemaGathering =
                    this._triggerSchemaGathering.bind(this);
                this.privateApiObj.triggerDataGathering =
                    this._triggerDataGathering.bind(this);
                this.privateApiObj.triggerShutdown =
                    this._triggerShutdown.bind(this);
            };

            // Starts the WDC
            Shared.prototype._triggerInitialization = function () {
                this._wdc.init(this.privateApiObj._initCallback);
            };

            // Starts the schema gathering process
            Shared.prototype._triggerSchemaGathering = function () {
                this._wdc.getSchema(this.privateApiObj._schemaCallback);
            };

            // Starts the data gathering process
            Shared.prototype._triggerDataGathering = function (
                tablesAndIncrementValues,
            ) {
                if (tablesAndIncrementValues.length != 1) {
                    throw (
                        'Unexpected number of tables specified. Expected 1, actual ' +
                        tablesAndIncrementValues.length.toString()
                    );
                }

                var tableAndIncremntValue = tablesAndIncrementValues[0];
                var table = new Table(
                    tableAndIncremntValue.tableInfo,
                    tableAndIncremntValue.incrementValue,
                    this.privateApiObj._tableDataCallback,
                );
                this._wdc.getData(table, this.privateApiObj._dataDoneCallback);
            };

            // Tells the WDC it's time to shut down
            Shared.prototype._triggerShutdown = function () {
                this._wdc.shutdown(this.privateApiObj._shutdownCallback);
            };

            // Initializes a series of global callbacks which have been deprecated in version 2.0.0
            Shared.prototype._initDeprecatedFunctions = function () {
                this.tableauApiObj.initCallback = this._initCallback.bind(this);
                this.tableauApiObj.headersCallback =
                    this._headersCallback.bind(this);
                this.tableauApiObj.dataCallback = this._dataCallback.bind(this);
                this.tableauApiObj.shutdownCallback =
                    this._shutdownCallback.bind(this);
            };

            Shared.prototype._initCallback = function () {
                this.tableauApiObj.abortWithError(
                    'tableau.initCallback has been deprecated in version 2.0.0. Please use the callback function passed to init',
                );
            };

            Shared.prototype._headersCallback = function (fieldNames, types) {
                this.tableauApiObj.abortWithError(
                    'tableau.headersCallback has been deprecated in version 2.0.0',
                );
            };

            Shared.prototype._dataCallback = function (
                data,
                lastRecordToken,
                moreData,
            ) {
                this.tableauApiObj.abortWithError(
                    'tableau.dataCallback has been deprecated in version 2.0.0',
                );
            };

            Shared.prototype._shutdownCallback = function () {
                this.tableauApiObj.abortWithError(
                    'tableau.shutdownCallback has been deprecated in version 2.0.0. Please use the callback function passed to shutdown',
                );
            };

            module.exports = Shared;

            /***/
        },
        /* 5 */
        /***/ function (module, exports, __webpack_require__) {
            var ApprovedOrigins = __webpack_require__(1);

            /** @class Used for communicating between the simulator and web data connector. It does
             * this by passing messages between the WDC window and its parent window
             * @param globalObj {Object} - the global object to find tableau interfaces as well
             * as register events (usually window)
             */
            function SimulatorDispatcher(globalObj) {
                this.globalObj = globalObj;
                this._initMessageHandling();
                this._initPublicInterface();
                this._initPrivateInterface();
            }

            SimulatorDispatcher.prototype._initMessageHandling = function () {
                console.log('Initializing message handling');
                this.globalObj.addEventListener(
                    'message',
                    this._receiveMessage.bind(this),
                    false,
                );
                this.globalObj.document.addEventListener(
                    'DOMContentLoaded',
                    this._onDomContentLoaded.bind(this),
                );
            };

            SimulatorDispatcher.prototype._onDomContentLoaded = function () {
                // Attempt to notify the simulator window that the WDC has loaded
                if (this.globalObj.parent !== window) {
                    this.globalObj.parent.postMessage(
                        this._buildMessagePayload('loaded'),
                        '*',
                    );
                }

                if (this.globalObj.opener) {
                    try {
                        // Wrap in try/catch for older versions of IE
                        this.globalObj.opener.postMessage(
                            this._buildMessagePayload('loaded'),
                            '*',
                        );
                    } catch (e) {
                        console.warn(
                            'Some versions of IE may not accurately simulate the Web Data Connector. Please retry on a Webkit based browser',
                        );
                    }
                }
            };

            SimulatorDispatcher.prototype._packagePropertyValues = function () {
                var propValues = {
                    connectionName: this.globalObj.tableau.connectionName,
                    connectionData: this.globalObj.tableau.connectionData,
                    password: this.globalObj.tableau.password,
                    username: this.globalObj.tableau.username,
                    usernameAlias: this.globalObj.tableau.usernameAlias,
                    incrementalExtractColumn:
                        this.globalObj.tableau.incrementalExtractColumn,
                    versionNumber: this.globalObj.tableau.versionNumber,
                    locale: this.globalObj.tableau.locale,
                    authPurpose: this.globalObj.tableau.authPurpose,
                    platformOS: this.globalObj.tableau.platformOS,
                    platformVersion: this.globalObj.tableau.platformVersion,
                    platformEdition: this.globalObj.tableau.platformEdition,
                    platformBuildNumber:
                        this.globalObj.tableau.platformBuildNumber,
                };

                return propValues;
            };

            SimulatorDispatcher.prototype._applyPropertyValues = function (
                props,
            ) {
                if (props) {
                    this.globalObj.tableau.connectionName =
                        props.connectionName;
                    this.globalObj.tableau.connectionData =
                        props.connectionData;
                    this.globalObj.tableau.password = props.password;
                    this.globalObj.tableau.username = props.username;
                    this.globalObj.tableau.usernameAlias = props.usernameAlias;
                    this.globalObj.tableau.incrementalExtractColumn =
                        props.incrementalExtractColumn;
                    this.globalObj.tableau.locale = props.locale;
                    this.globalObj.tableau.language = props.locale;
                    this.globalObj.tableau.authPurpose = props.authPurpose;
                    this.globalObj.tableau.platformOS = props.platformOS;
                    this.globalObj.tableau.platformVersion =
                        props.platformVersion;
                    this.globalObj.tableau.platformEdition =
                        props.platformEdition;
                    this.globalObj.tableau.platformBuildNumber =
                        props.platformBuildNumber;
                }
            };

            SimulatorDispatcher.prototype._buildMessagePayload = function (
                msgName,
                msgData,
                props,
            ) {
                var msgObj = {
                    msgName: msgName,
                    msgData: msgData,
                    props: props,
                    version: '2.1.2',
                };
                return JSON.stringify(msgObj);
            };

            SimulatorDispatcher.prototype._sendMessage = function (
                msgName,
                msgData,
            ) {
                var messagePayload = this._buildMessagePayload(
                    msgName,
                    msgData,
                    this._packagePropertyValues(),
                );

                // Check first to see if we have a messageHandler defined to post the message to
                if (
                    typeof this.globalObj.webkit != 'undefined' &&
                    typeof this.globalObj.webkit.messageHandlers !=
                        'undefined' &&
                    typeof this.globalObj.webkit.messageHandlers.wdcHandler !=
                        'undefined'
                ) {
                    this.globalObj.webkit.messageHandlers.wdcHandler.postMessage(
                        messagePayload,
                    );
                } else if (!this._sourceWindow) {
                    console.warn(this.globalObj.webkit);
                    console.warn(this._sourceWindow);
                    throw 'Looks like the WDC is calling a tableau function before tableau.init() has been called.';
                } else {
                    // Make sure we only post this info back to the source origin the user approved in _getWebSecurityWarningConfirm
                    this._sourceWindow.postMessage(
                        messagePayload,
                        this._sourceOrigin,
                    );
                }
            };

            SimulatorDispatcher.prototype._getPayloadObj = function (
                payloadString,
            ) {
                var payload = null;
                try {
                    payload = JSON.parse(payloadString);
                } catch (e) {
                    return null;
                }

                return payload;
            };

            SimulatorDispatcher.prototype._getWebSecurityWarningConfirm =
                function () {
                    // Due to cross-origin security issues over https, we may not be able to retrieve _sourceWindow.
                    // Use sourceOrigin instead.
                    var origin = this._sourceOrigin;

                    var Uri = __webpack_require__(17);
                    var parsedOrigin = new Uri(origin);
                    var hostName = parsedOrigin.host();

                    var supportedHosts = ['localhost', 'tableau.github.io'];
                    if (supportedHosts.indexOf(hostName) >= 0) {
                        return true;
                    }

                    // Whitelist Tableau domains
                    if (hostName && hostName.endsWith('online.tableau.com')) {
                        return true;
                    }

                    var alreadyApprovedOrigins =
                        ApprovedOrigins.getApprovedOrigins();
                    if (alreadyApprovedOrigins.indexOf(origin) >= 0) {
                        // The user has already approved this origin, no need to ask again
                        console.log(
                            "Already approved the origin'" +
                                origin +
                                "', not asking again",
                        );
                        return true;
                    }

                    var localizedWarningTitle =
                        this._getLocalizedString('webSecurityWarning');
                    var completeWarningMsg =
                        localizedWarningTitle + '\n\n' + hostName + '\n';
                    var isConfirmed = confirm(completeWarningMsg);

                    if (isConfirmed) {
                        // Set a session cookie to mark that we've approved this already
                        ApprovedOrigins.addApprovedOrigin(origin);
                    }

                    return isConfirmed;
                };

            SimulatorDispatcher.prototype._getCurrentLocale = function () {
                // Use current browser's locale to get a localized warning message
                var currentBrowserLanguage =
                    navigator.language || navigator.userLanguage;
                var locale = currentBrowserLanguage
                    ? currentBrowserLanguage.substring(0, 2)
                    : 'en';

                var supportedLocales = [
                    'de',
                    'en',
                    'es',
                    'fr',
                    'ja',
                    'ko',
                    'pt',
                    'zh',
                ];
                // Fall back to English for other unsupported lanaguages
                if (supportedLocales.indexOf(locale) < 0) {
                    locale = 'en';
                }

                return locale;
            };

            SimulatorDispatcher.prototype._getLocalizedString = function (
                stringKey,
            ) {
                var locale = this._getCurrentLocale();

                // Use static require here, otherwise webpack would generate a much bigger JS file
                var deStringsMap = __webpack_require__(9);
                var enStringsMap = __webpack_require__(10);
                var esStringsMap = __webpack_require__(11);
                var jaStringsMap = __webpack_require__(13);
                var frStringsMap = __webpack_require__(12);
                var koStringsMap = __webpack_require__(14);
                var ptStringsMap = __webpack_require__(15);
                var zhStringsMap = __webpack_require__(16);

                var stringJsonMapByLocale = {
                    de: deStringsMap,
                    en: enStringsMap,
                    es: esStringsMap,
                    fr: frStringsMap,
                    ja: jaStringsMap,
                    ko: koStringsMap,
                    pt: ptStringsMap,
                    zh: zhStringsMap,
                };

                var localizedStringsJson = stringJsonMapByLocale[locale];
                return localizedStringsJson[stringKey];
            };

            SimulatorDispatcher.prototype._receiveMessage = function (evt) {
                console.log('Received message!');
                var wdc = this.globalObj._wdc;
                if (!wdc) {
                    throw 'No WDC registered. Did you forget to call tableau.registerConnector?';
                }

                var payloadObj = this._getPayloadObj(evt.data);
                if (!payloadObj) return; // This message is not needed for WDC

                if (!this._sourceWindow) {
                    this._sourceWindow = evt.source;
                    this._sourceOrigin = evt.origin;
                }

                var msgData = payloadObj.msgData;
                this._applyPropertyValues(payloadObj.props);

                switch (payloadObj.msgName) {
                    case 'init':
                        // Warn users about possible phinishing attacks
                        var confirmResult =
                            this._getWebSecurityWarningConfirm();
                        if (!confirmResult) {
                            window.close();
                        } else {
                            this.globalObj.tableau.phase = msgData.phase;
                            this.globalObj._tableau.triggerInitialization();
                        }

                        break;
                    case 'shutdown':
                        this.globalObj._tableau.triggerShutdown();
                        break;
                    case 'getSchema':
                        this.globalObj._tableau.triggerSchemaGathering();
                        break;
                    case 'getData':
                        this.globalObj._tableau.triggerDataGathering(
                            msgData.tablesAndIncrementValues,
                        );
                        break;
                    default:
                        break;
                }
            };

            /**** PUBLIC INTERFACE *****/
            SimulatorDispatcher.prototype._initPublicInterface = function () {
                console.log('Initializing public interface');
                this._submitCalled = false;

                var publicInterface = {};
                publicInterface.abortForAuth = this._abortForAuth.bind(this);
                publicInterface.abortWithError =
                    this._abortWithError.bind(this);
                publicInterface.addCrossOriginException =
                    this._addCrossOriginException.bind(this);
                publicInterface.log = this._log.bind(this);
                publicInterface.reportProgress =
                    this._reportProgress.bind(this);
                publicInterface.submit = this._submit.bind(this);

                // Assign the public interface to this
                this.publicInterface = publicInterface;
            };

            SimulatorDispatcher.prototype._abortForAuth = function (msg) {
                this._sendMessage('abortForAuth', { msg: msg });
            };

            SimulatorDispatcher.prototype._abortWithError = function (msg) {
                this._sendMessage('abortWithError', { errorMsg: msg });
            };

            SimulatorDispatcher.prototype._addCrossOriginException = function (
                destOriginList,
            ) {
                // Don't bother passing this back to the simulator since there's nothing it can
                // do. Just call back to the WDC indicating that it worked
                console.log(
                    'Cross Origin Exception requested in the simulator. Pretending to work.',
                );
                setTimeout(
                    function () {
                        this.globalObj._wdc.addCrossOriginExceptionCompleted(
                            destOriginList,
                        );
                    }.bind(this),
                    0,
                );
            };

            SimulatorDispatcher.prototype._log = function (msg) {
                this._sendMessage('log', { logMsg: msg });
            };

            SimulatorDispatcher.prototype._reportProgress = function (msg) {
                this._sendMessage('reportProgress', { progressMsg: msg });
            };

            SimulatorDispatcher.prototype._submit = function () {
                this._sendMessage('submit');
            };

            /**** PRIVATE INTERFACE *****/
            SimulatorDispatcher.prototype._initPrivateInterface = function () {
                console.log('Initializing private interface');

                var privateInterface = {};
                privateInterface._initCallback = this._initCallback.bind(this);
                privateInterface._shutdownCallback =
                    this._shutdownCallback.bind(this);
                privateInterface._schemaCallback =
                    this._schemaCallback.bind(this);
                privateInterface._tableDataCallback =
                    this._tableDataCallback.bind(this);
                privateInterface._dataDoneCallback =
                    this._dataDoneCallback.bind(this);

                // Assign the private interface to this
                this.privateInterface = privateInterface;
            };

            SimulatorDispatcher.prototype._initCallback = function () {
                this._sendMessage('initCallback');
            };

            SimulatorDispatcher.prototype._shutdownCallback = function () {
                this._sendMessage('shutdownCallback');
            };

            SimulatorDispatcher.prototype._schemaCallback = function (
                schema,
                standardConnections,
            ) {
                this._sendMessage('_schemaCallback', {
                    schema: schema,
                    standardConnections: standardConnections || [],
                });
            };

            SimulatorDispatcher.prototype._tableDataCallback = function (
                tableName,
                data,
            ) {
                this._sendMessage('_tableDataCallback', {
                    tableName: tableName,
                    data: data,
                });
            };

            SimulatorDispatcher.prototype._dataDoneCallback = function () {
                this._sendMessage('_dataDoneCallback');
            };

            module.exports = SimulatorDispatcher;

            /***/
        },
        /* 6 */
        /***/ function (module, exports) {
            /**
             * @class Represents a single table which Tableau has requested
             * @param tableInfo {Object} - Information about the table
             * @param incrementValue {string=} - Incremental update value
             */
            function Table(tableInfo, incrementValue, dataCallbackFn) {
                /** @member {Object} Information about the table which has been requested. This is
	  guaranteed to be one of the tables the connector returned in the call to getSchema. */
                this.tableInfo = tableInfo;

                /** @member {string} Defines the incremental update value for this table. Empty string if
	  there is not an incremental update requested. */
                this.incrementValue = incrementValue || '';

                /** @private */
                this._dataCallbackFn = dataCallbackFn;

                // bind the public facing version of this function so it can be passed around
                this.appendRows = this._appendRows.bind(this);
            }

            /**
             * @method appends the given rows to the set of data contained in this table
             * @param data {array} - Either an array of arrays or an array of objects which represent
             * the individual rows of data to append to this table
             */
            Table.prototype._appendRows = function (data) {
                // Do some quick validation that this data is the format we expect
                if (!data) {
                    console.warn('rows data is null or undefined');
                    return;
                }

                if (!Array.isArray(data)) {
                    // Log a warning because the data is not an array like we expected
                    console.warn(
                        'Table.appendRows must take an array of arrays or array of objects',
                    );
                    return;
                }

                // Call back with the rows for this table
                this._dataCallbackFn(this.tableInfo.id, data);
            };

            module.exports = Table;

            /***/
        },
        /* 7 */
        /***/ function (module, exports) {
            function copyFunctions(src, dest) {
                for (var key in src) {
                    if (typeof src[key] === 'function') {
                        dest[key] = src[key];
                    }
                }
            }

            module.exports.copyFunctions = copyFunctions;

            /***/
        },
        /* 8 */
        /***/ function (module, exports, __webpack_require__) {
            var __WEBPACK_AMD_DEFINE_RESULT__;
            /*
             * Cookies.js - 1.2.3
             * https://github.com/ScottHamper/Cookies
             *
             * This is free and unencumbered software released into the public domain.
             */
            (function (global, undefined) {
                'use strict';

                var factory = function (window) {
                    if (typeof window.document !== 'object') {
                        throw new Error(
                            'Cookies.js requires a `window` with a `document` object',
                        );
                    }

                    var Cookies = function (key, value, options) {
                        return arguments.length === 1
                            ? Cookies.get(key)
                            : Cookies.set(key, value, options);
                    };

                    // Allows for setter injection in unit tests
                    Cookies._document = window.document;

                    // Used to ensure cookie keys do not collide with
                    // built-in `Object` properties
                    Cookies._cacheKeyPrefix = 'cookey.'; // Hurr hurr, :)

                    Cookies._maxExpireDate = new Date(
                        'Fri, 31 Dec 9999 23:59:59 UTC',
                    );

                    Cookies.defaults = {
                        path: '/',
                        secure: false,
                    };

                    Cookies.get = function (key) {
                        if (
                            Cookies._cachedDocumentCookie !==
                            Cookies._document.cookie
                        ) {
                            Cookies._renewCache();
                        }

                        var value =
                            Cookies._cache[Cookies._cacheKeyPrefix + key];

                        return value === undefined
                            ? undefined
                            : decodeURIComponent(value);
                    };

                    Cookies.set = function (key, value, options) {
                        options = Cookies._getExtendedOptions(options);
                        options.expires = Cookies._getExpiresDate(
                            value === undefined ? -1 : options.expires,
                        );

                        Cookies._document.cookie =
                            Cookies._generateCookieString(key, value, options);

                        return Cookies;
                    };

                    Cookies.expire = function (key, options) {
                        return Cookies.set(key, undefined, options);
                    };

                    Cookies._getExtendedOptions = function (options) {
                        return {
                            path:
                                (options && options.path) ||
                                Cookies.defaults.path,
                            domain:
                                (options && options.domain) ||
                                Cookies.defaults.domain,
                            expires:
                                (options && options.expires) ||
                                Cookies.defaults.expires,
                            secure:
                                options && options.secure !== undefined
                                    ? options.secure
                                    : Cookies.defaults.secure,
                        };
                    };

                    Cookies._isValidDate = function (date) {
                        return (
                            Object.prototype.toString.call(date) ===
                                '[object Date]' && !isNaN(date.getTime())
                        );
                    };

                    Cookies._getExpiresDate = function (expires, now) {
                        now = now || new Date();

                        if (typeof expires === 'number') {
                            expires =
                                expires === Infinity
                                    ? Cookies._maxExpireDate
                                    : new Date(now.getTime() + expires * 1000);
                        } else if (typeof expires === 'string') {
                            expires = new Date(expires);
                        }

                        if (expires && !Cookies._isValidDate(expires)) {
                            throw new Error(
                                '`expires` parameter cannot be converted to a valid Date instance',
                            );
                        }

                        return expires;
                    };

                    Cookies._generateCookieString = function (
                        key,
                        value,
                        options,
                    ) {
                        key = key.replace(/[^#$&+\^`|]/g, encodeURIComponent);
                        key = key.replace(/\(/g, '%28').replace(/\)/g, '%29');
                        value = (value + '').replace(
                            /[^!#$&-+\--:<-\[\]-~]/g,
                            encodeURIComponent,
                        );
                        options = options || {};

                        var cookieString = key + '=' + value;
                        cookieString += options.path
                            ? ';path=' + options.path
                            : '';
                        cookieString += options.domain
                            ? ';domain=' + options.domain
                            : '';
                        cookieString += options.expires
                            ? ';expires=' + options.expires.toUTCString()
                            : '';
                        cookieString += options.secure ? ';secure' : '';

                        return cookieString;
                    };

                    Cookies._getCacheFromString = function (documentCookie) {
                        var cookieCache = {};
                        var cookiesArray = documentCookie
                            ? documentCookie.split('; ')
                            : [];

                        for (var i = 0; i < cookiesArray.length; i++) {
                            var cookieKvp =
                                Cookies._getKeyValuePairFromCookieString(
                                    cookiesArray[i],
                                );

                            if (
                                cookieCache[
                                    Cookies._cacheKeyPrefix + cookieKvp.key
                                ] === undefined
                            ) {
                                cookieCache[
                                    Cookies._cacheKeyPrefix + cookieKvp.key
                                ] = cookieKvp.value;
                            }
                        }

                        return cookieCache;
                    };

                    Cookies._getKeyValuePairFromCookieString = function (
                        cookieString,
                    ) {
                        // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
                        var separatorIndex = cookieString.indexOf('=');

                        // IE omits the "=" when the cookie value is an empty string
                        separatorIndex =
                            separatorIndex < 0
                                ? cookieString.length
                                : separatorIndex;

                        var key = cookieString.substr(0, separatorIndex);
                        var decodedKey;
                        try {
                            decodedKey = decodeURIComponent(key);
                        } catch (e) {
                            if (
                                console &&
                                typeof console.error === 'function'
                            ) {
                                console.error(
                                    'Could not decode cookie with key "' +
                                        key +
                                        '"',
                                    e,
                                );
                            }
                        }

                        return {
                            key: decodedKey,
                            value: cookieString.substr(separatorIndex + 1), // Defer decoding value until accessed
                        };
                    };

                    Cookies._renewCache = function () {
                        Cookies._cache = Cookies._getCacheFromString(
                            Cookies._document.cookie,
                        );
                        Cookies._cachedDocumentCookie =
                            Cookies._document.cookie;
                    };

                    Cookies._areEnabled = function () {
                        var testKey = 'cookies.js';
                        var areEnabled =
                            Cookies.set(testKey, 1).get(testKey) === '1';
                        Cookies.expire(testKey);
                        return areEnabled;
                    };

                    Cookies.enabled = Cookies._areEnabled();

                    return Cookies;
                };
                var cookiesExport =
                    global && typeof global.document === 'object'
                        ? factory(global)
                        : factory;

                // AMD support
                if (true) {
                    !((__WEBPACK_AMD_DEFINE_RESULT__ = function () {
                        return cookiesExport;
                    }.call(exports, __webpack_require__, exports, module)),
                    __WEBPACK_AMD_DEFINE_RESULT__ !== undefined &&
                        (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
                    // CommonJS/Node.js support
                } else if (typeof exports === 'object') {
                    // Support Node.js specific `module.exports` (which can be a function)
                    if (
                        typeof module === 'object' &&
                        typeof module.exports === 'object'
                    ) {
                        exports = module.exports = cookiesExport;
                    }
                    // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
                    exports.Cookies = cookiesExport;
                } else {
                    global.Cookies = cookiesExport;
                }
            })(typeof window === 'undefined' ? this : window);

            /***/
        },
        /* 9 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 10 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 11 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 12 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 13 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 14 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 15 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 16 */
        /***/ function (module, exports) {
            module.exports = {
                webSecurityWarning:
                    'wwTo help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:',
            };

            /***/
        },
        /* 17 */
        /***/ function (module, exports, __webpack_require__) {
            var __WEBPACK_AMD_DEFINE_RESULT__;
            /*!
             * jsUri
             * https://github.com/derek-watson/jsUri
             *
             * Copyright 2013, Derek Watson
             * Released under the MIT license.
             *
             * Includes parseUri regular expressions
             * http://blog.stevenlevithan.com/archives/parseuri
             * Copyright 2007, Steven Levithan
             * Released under the MIT license.
             */

            /*globals define, module */

            (function (global) {
                var re = {
                    starts_with_slashes: /^\/+/,
                    ends_with_slashes: /\/+$/,
                    pluses: /\+/g,
                    query_separator: /[&;]/,
                    uri_parser:
                        /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@\/]*)(?::([^:@]*))?)?@)?(\[[0-9a-fA-F:.]+\]|[^:\/?#]*)(?::(\d+|(?=:)))?(:)?)((((?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
                };

                /**
                 * Define forEach for older js environments
                 * @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach#Compatibility
                 */
                if (!Array.prototype.forEach) {
                    Array.prototype.forEach = function (callback, thisArg) {
                        var T, k;

                        if (this == null) {
                            throw new TypeError(' this is null or not defined');
                        }

                        var O = Object(this);
                        var len = O.length >>> 0;

                        if (typeof callback !== 'function') {
                            throw new TypeError(
                                callback + ' is not a function',
                            );
                        }

                        if (arguments.length > 1) {
                            T = thisArg;
                        }

                        k = 0;

                        while (k < len) {
                            var kValue;
                            if (k in O) {
                                kValue = O[k];
                                callback.call(T, kValue, k, O);
                            }
                            k++;
                        }
                    };
                }

                /**
                 * unescape a query param value
                 * @param  {string} s encoded value
                 * @return {string}   decoded value
                 */
                function decode(s) {
                    if (s) {
                        s = s.toString().replace(re.pluses, '%20');
                        s = decodeURIComponent(s);
                    }
                    return s;
                }

                /**
                 * Breaks a uri string down into its individual parts
                 * @param  {string} str uri
                 * @return {object}     parts
                 */
                function parseUri(str) {
                    var parser = re.uri_parser;
                    var parserKeys = [
                        'source',
                        'protocol',
                        'authority',
                        'userInfo',
                        'user',
                        'password',
                        'host',
                        'port',
                        'isColonUri',
                        'relative',
                        'path',
                        'directory',
                        'file',
                        'query',
                        'anchor',
                    ];
                    var m = parser.exec(str || '');
                    var parts = {};

                    parserKeys.forEach(function (key, i) {
                        parts[key] = m[i] || '';
                    });

                    return parts;
                }

                /**
                 * Breaks a query string down into an array of key/value pairs
                 * @param  {string} str query
                 * @return {array}      array of arrays (key/value pairs)
                 */
                function parseQuery(str) {
                    var i, ps, p, n, k, v, l;
                    var pairs = [];

                    if (
                        typeof str === 'undefined' ||
                        str === null ||
                        str === ''
                    ) {
                        return pairs;
                    }

                    if (str.indexOf('?') === 0) {
                        str = str.substring(1);
                    }

                    ps = str.toString().split(re.query_separator);

                    for (i = 0, l = ps.length; i < l; i++) {
                        p = ps[i];
                        n = p.indexOf('=');

                        if (n !== 0) {
                            k = decode(p.substring(0, n));
                            v = decode(p.substring(n + 1));
                            pairs.push(n === -1 ? [p, null] : [k, v]);
                        }
                    }
                    return pairs;
                }

                /**
                 * Creates a new Uri object
                 * @constructor
                 * @param {string} str
                 */
                function Uri(str) {
                    this.uriParts = parseUri(str);
                    this.queryPairs = parseQuery(this.uriParts.query);
                    this.hasAuthorityPrefixUserPref = null;
                }

                /**
                 * Define getter/setter methods
                 */
                [
                    'protocol',
                    'userInfo',
                    'host',
                    'port',
                    'path',
                    'anchor',
                ].forEach(function (key) {
                    Uri.prototype[key] = function (val) {
                        if (typeof val !== 'undefined') {
                            this.uriParts[key] = val;
                        }
                        return this.uriParts[key];
                    };
                });

                /**
                 * if there is no protocol, the leading // can be enabled or disabled
                 * @param  {Boolean}  val
                 * @return {Boolean}
                 */
                Uri.prototype.hasAuthorityPrefix = function (val) {
                    if (typeof val !== 'undefined') {
                        this.hasAuthorityPrefixUserPref = val;
                    }

                    if (this.hasAuthorityPrefixUserPref === null) {
                        return this.uriParts.source.indexOf('//') !== -1;
                    } else {
                        return this.hasAuthorityPrefixUserPref;
                    }
                };

                Uri.prototype.isColonUri = function (val) {
                    if (typeof val !== 'undefined') {
                        this.uriParts.isColonUri = !!val;
                    } else {
                        return !!this.uriParts.isColonUri;
                    }
                };

                /**
                 * Serializes the internal state of the query pairs
                 * @param  {string} [val]   set a new query string
                 * @return {string}         query string
                 */
                Uri.prototype.query = function (val) {
                    var s = '',
                        i,
                        param,
                        l;

                    if (typeof val !== 'undefined') {
                        this.queryPairs = parseQuery(val);
                    }

                    for (i = 0, l = this.queryPairs.length; i < l; i++) {
                        param = this.queryPairs[i];
                        if (s.length > 0) {
                            s += '&';
                        }
                        if (param[1] === null) {
                            s += param[0];
                        } else {
                            s += param[0];
                            s += '=';
                            if (typeof param[1] !== 'undefined') {
                                s += encodeURIComponent(param[1]);
                            }
                        }
                    }
                    return s.length > 0 ? '?' + s : s;
                };

                /**
                 * returns the first query param value found for the key
                 * @param  {string} key query key
                 * @return {string}     first value found for key
                 */
                Uri.prototype.getQueryParamValue = function (key) {
                    var param, i, l;
                    for (i = 0, l = this.queryPairs.length; i < l; i++) {
                        param = this.queryPairs[i];
                        if (key === param[0]) {
                            return param[1];
                        }
                    }
                };

                /**
                 * returns an array of query param values for the key
                 * @param  {string} key query key
                 * @return {array}      array of values
                 */
                Uri.prototype.getQueryParamValues = function (key) {
                    var arr = [],
                        i,
                        param,
                        l;
                    for (i = 0, l = this.queryPairs.length; i < l; i++) {
                        param = this.queryPairs[i];
                        if (key === param[0]) {
                            arr.push(param[1]);
                        }
                    }
                    return arr;
                };

                /**
                 * removes query parameters
                 * @param  {string} key     remove values for key
                 * @param  {val}    [val]   remove a specific value, otherwise removes all
                 * @return {Uri}            returns self for fluent chaining
                 */
                Uri.prototype.deleteQueryParam = function (key, val) {
                    var arr = [],
                        i,
                        param,
                        keyMatchesFilter,
                        valMatchesFilter,
                        l;

                    for (i = 0, l = this.queryPairs.length; i < l; i++) {
                        param = this.queryPairs[i];
                        keyMatchesFilter = decode(param[0]) === decode(key);
                        valMatchesFilter = param[1] === val;

                        if (
                            (arguments.length === 1 && !keyMatchesFilter) ||
                            (arguments.length === 2 &&
                                (!keyMatchesFilter || !valMatchesFilter))
                        ) {
                            arr.push(param);
                        }
                    }

                    this.queryPairs = arr;

                    return this;
                };

                /**
                 * adds a query parameter
                 * @param  {string}  key        add values for key
                 * @param  {string}  val        value to add
                 * @param  {integer} [index]    specific index to add the value at
                 * @return {Uri}                returns self for fluent chaining
                 */
                Uri.prototype.addQueryParam = function (key, val, index) {
                    if (arguments.length === 3 && index !== -1) {
                        index = Math.min(index, this.queryPairs.length);
                        this.queryPairs.splice(index, 0, [key, val]);
                    } else if (arguments.length > 0) {
                        this.queryPairs.push([key, val]);
                    }
                    return this;
                };

                /**
                 * test for the existence of a query parameter
                 * @param  {string}  key        add values for key
                 * @param  {string}  val        value to add
                 * @param  {integer} [index]    specific index to add the value at
                 * @return {Uri}                returns self for fluent chaining
                 */
                Uri.prototype.hasQueryParam = function (key) {
                    var i,
                        len = this.queryPairs.length;
                    for (i = 0; i < len; i++) {
                        if (this.queryPairs[i][0] == key) return true;
                    }
                    return false;
                };

                /**
                 * replaces query param values
                 * @param  {string} key         key to replace value for
                 * @param  {string} newVal      new value
                 * @param  {string} [oldVal]    replace only one specific value (otherwise replaces all)
                 * @return {Uri}                returns self for fluent chaining
                 */
                Uri.prototype.replaceQueryParam = function (
                    key,
                    newVal,
                    oldVal,
                ) {
                    var index = -1,
                        len = this.queryPairs.length,
                        i,
                        param;

                    if (arguments.length === 3) {
                        for (i = 0; i < len; i++) {
                            param = this.queryPairs[i];
                            if (
                                decode(param[0]) === decode(key) &&
                                decodeURIComponent(param[1]) === decode(oldVal)
                            ) {
                                index = i;
                                break;
                            }
                        }
                        if (index >= 0) {
                            this.deleteQueryParam(
                                key,
                                decode(oldVal),
                            ).addQueryParam(key, newVal, index);
                        }
                    } else {
                        for (i = 0; i < len; i++) {
                            param = this.queryPairs[i];
                            if (decode(param[0]) === decode(key)) {
                                index = i;
                                break;
                            }
                        }
                        this.deleteQueryParam(key);
                        this.addQueryParam(key, newVal, index);
                    }
                    return this;
                };

                /**
                 * Define fluent setter methods (setProtocol, setHasAuthorityPrefix, etc)
                 */
                [
                    'protocol',
                    'hasAuthorityPrefix',
                    'isColonUri',
                    'userInfo',
                    'host',
                    'port',
                    'path',
                    'query',
                    'anchor',
                ].forEach(function (key) {
                    var method =
                        'set' + key.charAt(0).toUpperCase() + key.slice(1);
                    Uri.prototype[method] = function (val) {
                        this[key](val);
                        return this;
                    };
                });

                /**
                 * Scheme name, colon and doubleslash, as required
                 * @return {string} http:// or possibly just //
                 */
                Uri.prototype.scheme = function () {
                    var s = '';

                    if (this.protocol()) {
                        s += this.protocol();
                        if (
                            this.protocol().indexOf(':') !==
                            this.protocol().length - 1
                        ) {
                            s += ':';
                        }
                        s += '//';
                    } else {
                        if (this.hasAuthorityPrefix() && this.host()) {
                            s += '//';
                        }
                    }

                    return s;
                };

                /**
                 * Same as Mozilla nsIURI.prePath
                 * @return {string} scheme://user:password@host:port
                 * @see  https://developer.mozilla.org/en/nsIURI
                 */
                Uri.prototype.origin = function () {
                    var s = this.scheme();

                    if (this.userInfo() && this.host()) {
                        s += this.userInfo();
                        if (
                            this.userInfo().indexOf('@') !==
                            this.userInfo().length - 1
                        ) {
                            s += '@';
                        }
                    }

                    if (this.host()) {
                        s += this.host();
                        if (
                            this.port() ||
                            (this.path() &&
                                this.path().substr(0, 1).match(/[0-9]/))
                        ) {
                            s += ':' + this.port();
                        }
                    }

                    return s;
                };

                /**
                 * Adds a trailing slash to the path
                 */
                Uri.prototype.addTrailingSlash = function () {
                    var path = this.path() || '';

                    if (path.substr(-1) !== '/') {
                        this.path(path + '/');
                    }

                    return this;
                };

                /**
                 * Serializes the internal state of the Uri object
                 * @return {string}
                 */
                Uri.prototype.toString = function () {
                    var path,
                        s = this.origin();

                    if (this.isColonUri()) {
                        if (this.path()) {
                            s += ':' + this.path();
                        }
                    } else if (this.path()) {
                        path = this.path();
                        if (
                            !(
                                re.ends_with_slashes.test(s) ||
                                re.starts_with_slashes.test(path)
                            )
                        ) {
                            s += '/';
                        } else {
                            if (s) {
                                s.replace(re.ends_with_slashes, '/');
                            }
                            path = path.replace(re.starts_with_slashes, '/');
                        }
                        s += path;
                    } else {
                        if (
                            this.host() &&
                            (this.query().toString() || this.anchor())
                        ) {
                            s += '/';
                        }
                    }
                    if (this.query().toString()) {
                        s += this.query().toString();
                    }

                    if (this.anchor()) {
                        if (this.anchor().indexOf('#') !== 0) {
                            s += '#';
                        }
                        s += this.anchor();
                    }

                    return s;
                };

                /**
                 * Clone a Uri object
                 * @return {Uri} duplicate copy of the Uri
                 */
                Uri.prototype.clone = function () {
                    return new Uri(this.toString());
                };

                /**
                 * export via AMD or CommonJS, otherwise leak a global
                 */
                if (true) {
                    !((__WEBPACK_AMD_DEFINE_RESULT__ = function () {
                        return Uri;
                    }.call(exports, __webpack_require__, exports, module)),
                    __WEBPACK_AMD_DEFINE_RESULT__ !== undefined &&
                        (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
                } else if (
                    typeof module !== 'undefined' &&
                    typeof module.exports !== 'undefined'
                ) {
                    module.exports = Uri;
                } else {
                    global.Uri = Uri;
                }
            })(this);

            /***/
        },
        /* 18 */
        /***/ function (module, exports, __webpack_require__) {
            /****************************************************************************
             **
             ** Copyright (C) 2015 The Qt Company Ltd.
             ** Copyright (C) 2014 KlarÃ¤lvdalens Datakonsult AB, a KDAB Group company, info@kdab.com, author Milian Wolff <milian.wolff@kdab.com>
             ** Contact: http://www.qt.io/licensing/
             **
             ** This file is part of the QtWebChannel module of the Qt Toolkit.
             **
             ** $QT_BEGIN_LICENSE:LGPL21$
             ** Commercial License Usage
             ** Licensees holding valid commercial Qt licenses may use this file in
             ** accordance with the commercial license agreement provided with the
             ** Software or, alternatively, in accordance with the terms contained in
             ** a written agreement between you and The Qt Company. For licensing terms
             ** and conditions see http://www.qt.io/terms-conditions. For further
             ** information use the contact form at http://www.qt.io/contact-us.
             **
             ** GNU Lesser General Public License Usage
             ** Alternatively, this file may be used under the terms of the GNU Lesser
             ** General Public License version 2.1 or version 3 as published by the Free
             ** Software Foundation and appearing in the file LICENSE.LGPLv21 and
             ** LICENSE.LGPLv3 included in the packaging of this file. Please review the
             ** following information to ensure the GNU Lesser General Public License
             ** requirements will be met: https://www.gnu.org/licenses/lgpl.html and
             ** http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html.
             **
             ** As a special exception, The Qt Company gives you certain additional
             ** rights. These rights are described in The Qt Company LGPL Exception
             ** version 1.1, included in the file LGPL_EXCEPTION.txt in this package.
             **
             ** $QT_END_LICENSE$
             **
             ****************************************************************************/

            'use strict';

            var QWebChannelMessageTypes = {
                signal: 1,
                propertyUpdate: 2,
                init: 3,
                idle: 4,
                debug: 5,
                invokeMethod: 6,
                connectToSignal: 7,
                disconnectFromSignal: 8,
                setProperty: 9,
                response: 10,
            };

            var QWebChannel = function (transport, initCallback) {
                if (
                    typeof transport !== 'object' ||
                    typeof transport.send !== 'function'
                ) {
                    console.error(
                        'The QWebChannel expects a transport object with a send function and onmessage callback property.' +
                            ' Given is: transport: ' +
                            typeof transport +
                            ', transport.send: ' +
                            typeof transport.send,
                    );
                    return;
                }

                var channel = this;
                this.transport = transport;

                this.send = function (data) {
                    if (typeof data !== 'string') {
                        data = JSON.stringify(data);
                    }
                    channel.transport.send(data);
                };

                this.transport.onmessage = function (message) {
                    var data = message.data;
                    if (typeof data === 'string') {
                        data = JSON.parse(data);
                    }
                    switch (data.type) {
                        case QWebChannelMessageTypes.signal:
                            channel.handleSignal(data);
                            break;
                        case QWebChannelMessageTypes.response:
                            channel.handleResponse(data);
                            break;
                        case QWebChannelMessageTypes.propertyUpdate:
                            channel.handlePropertyUpdate(data);
                            break;
                        default:
                            console.error(
                                'invalid message received:',
                                message.data,
                            );
                            break;
                    }
                };

                this.execCallbacks = {};
                this.execId = 0;
                this.exec = function (data, callback) {
                    if (!callback) {
                        // if no callback is given, send directly
                        channel.send(data);
                        return;
                    }
                    if (channel.execId === Number.MAX_VALUE) {
                        // wrap
                        channel.execId = Number.MIN_VALUE;
                    }
                    if (data.hasOwnProperty('id')) {
                        console.error(
                            'Cannot exec message with property id: ' +
                                JSON.stringify(data),
                        );
                        return;
                    }
                    data.id = channel.execId++;
                    channel.execCallbacks[data.id] = callback;
                    channel.send(data);
                };

                this.objects = {};

                this.handleSignal = function (message) {
                    var object = channel.objects[message.object];
                    if (object) {
                        object.signalEmitted(message.signal, message.args);
                    } else {
                        console.warn(
                            'Unhandled signal: ' +
                                message.object +
                                '::' +
                                message.signal,
                        );
                    }
                };

                this.handleResponse = function (message) {
                    if (!message.hasOwnProperty('id')) {
                        console.error(
                            'Invalid response message received: ',
                            JSON.stringify(message),
                        );
                        return;
                    }
                    channel.execCallbacks[message.id](message.data);
                    delete channel.execCallbacks[message.id];
                };

                this.handlePropertyUpdate = function (message) {
                    for (var i in message.data) {
                        var data = message.data[i];
                        var object = channel.objects[data.object];
                        if (object) {
                            object.propertyUpdate(
                                data.signals,
                                data.properties,
                            );
                        } else {
                            console.warn(
                                'Unhandled property update: ' +
                                    data.object +
                                    '::' +
                                    data.signal,
                            );
                        }
                    }
                    channel.exec({ type: QWebChannelMessageTypes.idle });
                };

                this.debug = function (message) {
                    channel.send({
                        type: QWebChannelMessageTypes.debug,
                        data: message,
                    });
                };

                channel.exec(
                    { type: QWebChannelMessageTypes.init },
                    function (data) {
                        for (var objectName in data) {
                            var object = new QObject(
                                objectName,
                                data[objectName],
                                channel,
                            );
                        }
                        // now unwrap properties, which might reference other registered objects
                        for (var objectName in channel.objects) {
                            channel.objects[objectName].unwrapProperties();
                        }
                        if (initCallback) {
                            initCallback(channel);
                        }
                        channel.exec({ type: QWebChannelMessageTypes.idle });
                    },
                );
            };

            function QObject(name, data, webChannel) {
                this.__id__ = name;
                webChannel.objects[name] = this;

                // List of callbacks that get invoked upon signal emission
                this.__objectSignals__ = {};

                // Cache of all properties, updated when a notify signal is emitted
                this.__propertyCache__ = {};

                var object = this;

                // ----------------------------------------------------------------------

                this.unwrapQObject = function (response) {
                    if (response instanceof Array) {
                        // support list of objects
                        var ret = new Array(response.length);
                        for (var i = 0; i < response.length; ++i) {
                            ret[i] = object.unwrapQObject(response[i]);
                        }
                        return ret;
                    }
                    if (
                        !response ||
                        !response['__QObject*__'] ||
                        response['id'] === undefined
                    ) {
                        return response;
                    }

                    var objectId = response.id;
                    if (webChannel.objects[objectId])
                        return webChannel.objects[objectId];

                    if (!response.data) {
                        console.error(
                            'Cannot unwrap unknown QObject ' +
                                objectId +
                                ' without data.',
                        );
                        return;
                    }

                    var qObject = new QObject(
                        objectId,
                        response.data,
                        webChannel,
                    );
                    qObject.destroyed.connect(function () {
                        if (webChannel.objects[objectId] === qObject) {
                            delete webChannel.objects[objectId];
                            // reset the now deleted QObject to an empty {} object
                            // just assigning {} though would not have the desired effect, but the
                            // below also ensures all external references will see the empty map
                            // NOTE: this detour is necessary to workaround QTBUG-40021
                            var propertyNames = [];
                            for (var propertyName in qObject) {
                                propertyNames.push(propertyName);
                            }
                            for (var idx in propertyNames) {
                                delete qObject[propertyNames[idx]];
                            }
                        }
                    });
                    // here we are already initialized, and thus must directly unwrap the properties
                    qObject.unwrapProperties();
                    return qObject;
                };

                this.unwrapProperties = function () {
                    for (var propertyIdx in object.__propertyCache__) {
                        object.__propertyCache__[propertyIdx] =
                            object.unwrapQObject(
                                object.__propertyCache__[propertyIdx],
                            );
                    }
                };

                function addSignal(signalData, isPropertyNotifySignal) {
                    var signalName = signalData[0];
                    var signalIndex = signalData[1];
                    object[signalName] = {
                        connect: function (callback) {
                            if (typeof callback !== 'function') {
                                console.error(
                                    'Bad callback given to connect to signal ' +
                                        signalName,
                                );
                                return;
                            }

                            object.__objectSignals__[signalIndex] =
                                object.__objectSignals__[signalIndex] || [];
                            object.__objectSignals__[signalIndex].push(
                                callback,
                            );

                            if (
                                !isPropertyNotifySignal &&
                                signalName !== 'destroyed'
                            ) {
                                // only required for "pure" signals, handled separately for properties in propertyUpdate
                                // also note that we always get notified about the destroyed signal
                                webChannel.exec({
                                    type: QWebChannelMessageTypes.connectToSignal,
                                    object: object.__id__,
                                    signal: signalIndex,
                                });
                            }
                        },
                        disconnect: function (callback) {
                            if (typeof callback !== 'function') {
                                console.error(
                                    'Bad callback given to disconnect from signal ' +
                                        signalName,
                                );
                                return;
                            }
                            object.__objectSignals__[signalIndex] =
                                object.__objectSignals__[signalIndex] || [];
                            var idx =
                                object.__objectSignals__[signalIndex].indexOf(
                                    callback,
                                );
                            if (idx === -1) {
                                console.error(
                                    'Cannot find connection of signal ' +
                                        signalName +
                                        ' to ' +
                                        callback.name,
                                );
                                return;
                            }
                            object.__objectSignals__[signalIndex].splice(
                                idx,
                                1,
                            );
                            if (
                                !isPropertyNotifySignal &&
                                object.__objectSignals__[signalIndex].length ===
                                    0
                            ) {
                                // only required for "pure" signals, handled separately for properties in propertyUpdate
                                webChannel.exec({
                                    type: QWebChannelMessageTypes.disconnectFromSignal,
                                    object: object.__id__,
                                    signal: signalIndex,
                                });
                            }
                        },
                    };
                }

                /**
                 * Invokes all callbacks for the given signalname. Also works for property notify callbacks.
                 */
                function invokeSignalCallbacks(signalName, signalArgs) {
                    var connections = object.__objectSignals__[signalName];
                    if (connections) {
                        connections.forEach(function (callback) {
                            callback.apply(callback, signalArgs);
                        });
                    }
                }

                this.propertyUpdate = function (signals, propertyMap) {
                    // update property cache
                    for (var propertyIndex in propertyMap) {
                        var propertyValue = propertyMap[propertyIndex];
                        object.__propertyCache__[propertyIndex] = propertyValue;
                    }

                    for (var signalName in signals) {
                        // Invoke all callbacks, as signalEmitted() does not. This ensures the
                        // property cache is updated before the callbacks are invoked.
                        invokeSignalCallbacks(signalName, signals[signalName]);
                    }
                };

                this.signalEmitted = function (signalName, signalArgs) {
                    invokeSignalCallbacks(signalName, signalArgs);
                };

                function addMethod(methodData) {
                    var methodName = methodData[0];
                    var methodIdx = methodData[1];
                    object[methodName] = function () {
                        var args = [];
                        var callback;
                        for (var i = 0; i < arguments.length; ++i) {
                            if (typeof arguments[i] === 'function')
                                callback = arguments[i];
                            else args.push(arguments[i]);
                        }

                        webChannel.exec(
                            {
                                type: QWebChannelMessageTypes.invokeMethod,
                                object: object.__id__,
                                method: methodIdx,
                                args: args,
                            },
                            function (response) {
                                if (response !== undefined) {
                                    var result = object.unwrapQObject(response);
                                    if (callback) {
                                        callback(result);
                                    }
                                }
                            },
                        );
                    };
                }

                function bindGetterSetter(propertyInfo) {
                    var propertyIndex = propertyInfo[0];
                    var propertyName = propertyInfo[1];
                    var notifySignalData = propertyInfo[2];
                    // initialize property cache with current value
                    // NOTE: if this is an object, it is not directly unwrapped as it might
                    // reference other QObject that we do not know yet
                    object.__propertyCache__[propertyIndex] = propertyInfo[3];

                    if (notifySignalData) {
                        if (notifySignalData[0] === 1) {
                            // signal name is optimized away, reconstruct the actual name
                            notifySignalData[0] = propertyName + 'Changed';
                        }
                        addSignal(notifySignalData, true);
                    }

                    Object.defineProperty(object, propertyName, {
                        get: function () {
                            var propertyValue =
                                object.__propertyCache__[propertyIndex];
                            if (propertyValue === undefined) {
                                // This shouldn't happen
                                console.warn(
                                    'Undefined value in property cache for property "' +
                                        propertyName +
                                        '" in object ' +
                                        object.__id__,
                                );
                            }

                            return propertyValue;
                        },
                        set: function (value) {
                            if (value === undefined) {
                                console.warn(
                                    'Property setter for ' +
                                        propertyName +
                                        ' called with undefined value!',
                                );
                                return;
                            }
                            object.__propertyCache__[propertyIndex] = value;
                            webChannel.exec({
                                type: QWebChannelMessageTypes.setProperty,
                                object: object.__id__,
                                property: propertyIndex,
                                value: value,
                            });
                        },
                    });
                }

                // ----------------------------------------------------------------------

                data.methods.forEach(addMethod);

                data.properties.forEach(bindGetterSetter);

                data.signals.forEach(function (signal) {
                    addSignal(signal, false);
                });

                for (var name in data.enums) {
                    object[name] = data.enums[name];
                }
            }

            //required for use with nodejs
            if (true) {
                module.exports = {
                    QWebChannel: QWebChannel,
                };
            }

            /***/
        },
        /* 19 */
        /***/ function (module, exports, __webpack_require__) {
            'use strict';

            var Utilities = __webpack_require__(7);
            var Shared = __webpack_require__(4);
            var NativeDispatcher = __webpack_require__(3);
            var SimulatorDispatcher = __webpack_require__(5);
            var qwebchannel = __webpack_require__(18);

            /** @module ShimLibrary - This module defines the WDC's shim library which is used
	to bridge the gap between the javascript code of the WDC and the driving context
	of the WDC (Tableau desktop, the simulator, etc.) */

            // This function should be called once bootstrapping has been completed and the
            // dispatcher and shared WDC objects are both created and available
            function bootstrappingFinished(_dispatcher, _shared) {
                Utilities.copyFunctions(
                    _dispatcher.publicInterface,
                    window.tableau,
                );
                Utilities.copyFunctions(
                    _dispatcher.privateInterface,
                    window._tableau,
                );
                _shared.init();
            }

            // Initializes the wdc shim library. You must call this before doing anything with WDC
            module.exports.init = function () {
                // The initial code here is the only place in our module which should have global
                // knowledge of how all the WDC components are glued together. This is the only place
                // which will know about the window object or other global objects. This code will be run
                // immediately when the shim library loads and is responsible for determining the context
                // which it is running it and setup a communications channel between the js & running code
                var dispatcher = null;
                var shared = null;

                // Always define the private _tableau object at the start
                window._tableau = {};

                // Check to see if the tableauVersionBootstrap is defined as a global object. If so,
                // we are running in the Tableau desktop/server context. If not, we're running in the simulator
                if (!!window.tableauVersionBootstrap) {
                    // We have the tableau object defined
                    console.log(
                        'Initializing NativeDispatcher, Reporting version number',
                    );
                    window.tableauVersionBootstrap.ReportVersionNumber('2.1.2');
                    dispatcher = new NativeDispatcher(window);
                } else if (!!window.qt && !!window.qt.webChannelTransport) {
                    console.log(
                        'Initializing NativeDispatcher for qwebchannel',
                    );
                    window.tableau = {};

                    // We're running in a context where the webChannelTransport is available. This means QWebEngine is in use
                    window.channel = new qwebchannel.QWebChannel(
                        qt.webChannelTransport,
                        function (channel) {
                            console.log('QWebChannel created successfully');

                            // Define the function which tableau will call after it has inserted all the required objects into the javascript frame
                            window._tableau._nativeSetupCompleted =
                                function () {
                                    // Once the native code tells us everything here is done, we should have all the expected objects inserted into js
                                    dispatcher = new NativeDispatcher(
                                        channel.objects,
                                    );
                                    window.tableau = channel.objects.tableau;
                                    shared.changeTableauApiObj(window.tableau);
                                    bootstrappingFinished(dispatcher, shared);
                                };

                            // Actually call into the version bootstrapper to report our version number
                            channel.objects.tableauVersionBootstrap.ReportVersionNumber(
                                '2.1.2',
                            );
                        },
                    );
                } else {
                    console.log(
                        'Version Bootstrap is not defined, Initializing SimulatorDispatcher',
                    );
                    window.tableau = {};
                    dispatcher = new SimulatorDispatcher(window);
                }

                // Initialize the shared WDC object and add in our enum values
                shared = new Shared(window.tableau, window._tableau, window);

                // Check to see if the dispatcher is already defined and immediately call the
                // callback if so
                if (dispatcher) {
                    bootstrappingFinished(dispatcher, shared);
                }
            };

            /***/
        },
        /******/
    ],
);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIGI4N2MwMDc5MzkxNzJiZWJkN2MwIiwid2VicGFjazovLy8uL2luZGV4LmpzIiwid2VicGFjazovLy8uL0FwcHJvdmVkT3JpZ2lucy5qcyIsIndlYnBhY2s6Ly8vLi9FbnVtcy5qcyIsIndlYnBhY2s6Ly8vLi9OYXRpdmVEaXNwYXRjaGVyLmpzIiwid2VicGFjazovLy8uL1NoYXJlZC5qcyIsIndlYnBhY2s6Ly8vLi9TaW11bGF0b3JEaXNwYXRjaGVyLmpzIiwid2VicGFjazovLy8uL1RhYmxlLmpzIiwid2VicGFjazovLy8uL1V0aWxpdGllcy5qcyIsIndlYnBhY2s6Ly8vLi9+L2Nvb2tpZXMtanMvZGlzdC9jb29raWVzLmpzIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfZGUtREUuanNvbiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX2VuLVVTLmpzb24iLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19lcy1FUy5qc29uIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfZnItRlIuanNvbiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX2phLUpQLmpzb24iLCJ3ZWJwYWNrOi8vLy4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19rby1LUi5qc29uIiwid2VicGFjazovLy8uL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfcHQtQlIuanNvbiIsIndlYnBhY2s6Ly8vLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX3poLUNOLmpzb24iLCJ3ZWJwYWNrOi8vLy4vfi9qc3VyaS9VcmkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9xd2ViY2hhbm5lbC9xd2ViY2hhbm5lbC5qcyIsIndlYnBhY2s6Ly8vLi90YWJsZWF1d2RjLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgYjg3YzAwNzkzOTE3MmJlYmQ3YzBcbiAqKi8iLCIvLyBNYWluIGVudHJ5IHBvaW50IHRvIHB1bGwgdG9nZXRoZXIgZXZlcnl0aGluZyBuZWVkZWQgZm9yIHRoZSBXREMgc2hpbSBsaWJyYXJ5XG4vLyBUaGlzIGZpbGUgd2lsbCBiZSBleHBvcnRlZCBhcyBhIGJ1bmRsZWQganMgZmlsZSBieSB3ZWJwYWNrIHNvIGl0IGNhbiBiZSBpbmNsdWRlZFxuLy8gaW4gYSA8c2NyaXB0PiB0YWcgaW4gYW4gaHRtbCBkb2N1bWVudC4gQWxlcm5hdGl2ZWx5LCBhIGNvbm5lY3RvciBtYXkgaW5jbHVkZVxuLy8gdGhpcyB3aG9sZSBwYWNrYWdlIGluIHRoZWlyIGNvZGUgYW5kIHdvdWxkIG5lZWQgdG8gY2FsbCBpbml0IGxpa2UgdGhpc1xudmFyIHRhYmxlYXV3ZGMgPSByZXF1aXJlKCcuL3RhYmxlYXV3ZGMuanMnKTtcbnRhYmxlYXV3ZGMuaW5pdCgpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIEFQUFJPVkVEX09SSUdJTlNfS0VZID0gXCJ3ZGNfYXBwcm92ZWRfb3JpZ2luc1wiO1xudmFyIFNFUEFSQVRPUiA9IFwiLFwiO1xudmFyIENvb2tpZXMgPSByZXF1aXJlKCdjb29raWVzLWpzJyk7XG5cbmZ1bmN0aW9uIF9nZXRBcHByb3ZlZE9yaWdpbnNWYWx1ZSgpIHtcbiAgdmFyIHJlc3VsdCA9IENvb2tpZXMuZ2V0KEFQUFJPVkVEX09SSUdJTlNfS0VZKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gX3NhdmVBcHByb3ZlZE9yaWdpbnMob3JpZ2luQXJyYXkpIHtcbiAgdmFyIG5ld09yaWdpblN0cmluZyA9IG9yaWdpbkFycmF5LmpvaW4oU0VQQVJBVE9SKTtcbiAgY29uc29sZS5sb2coXCJTYXZpbmcgYXBwcm92ZWQgb3JpZ2lucyAnXCIgKyBuZXdPcmlnaW5TdHJpbmcgKyBcIidcIik7XG4gIFxuICAvLyBXZSBjb3VsZCBwb3RlbnRpYWxseSBtYWtlIHRoaXMgYSBsb25nZXIgdGVybSBjb29raWUgaW5zdGVhZCBvZiBqdXN0IGZvciB0aGUgY3VycmVudCBzZXNzaW9uXG4gIHZhciByZXN1bHQgPSBDb29raWVzLnNldChBUFBST1ZFRF9PUklHSU5TX0tFWSwgbmV3T3JpZ2luU3RyaW5nKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gQWRkcyBhbiBhcHByb3ZlZCBvcmlnaW5zIHRvIHRoZSBsaXN0IGFscmVhZHkgc2F2ZWQgaW4gYSBzZXNzaW9uIGNvb2tpZVxuZnVuY3Rpb24gYWRkQXBwcm92ZWRPcmlnaW4ob3JpZ2luKSB7XG4gIGlmIChvcmlnaW4pIHtcbiAgICB2YXIgb3JpZ2lucyA9IGdldEFwcHJvdmVkT3JpZ2lucygpO1xuICAgIG9yaWdpbnMucHVzaChvcmlnaW4pO1xuICAgIF9zYXZlQXBwcm92ZWRPcmlnaW5zKG9yaWdpbnMpO1xuICB9XG59XG5cbi8vIFJldHJpZXZlcyB0aGUgb3JpZ2lucyB3aGljaCBoYXZlIGFscmVhZHkgYmVlbiBhcHByb3ZlZCBieSB0aGUgdXNlclxuZnVuY3Rpb24gZ2V0QXBwcm92ZWRPcmlnaW5zKCkge1xuICB2YXIgb3JpZ2luc1N0cmluZyA9IF9nZXRBcHByb3ZlZE9yaWdpbnNWYWx1ZSgpO1xuICBpZiAoIW9yaWdpbnNTdHJpbmcgfHwgMCA9PT0gb3JpZ2luc1N0cmluZy5sZW5ndGgpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICB2YXIgb3JpZ2lucyA9IG9yaWdpbnNTdHJpbmcuc3BsaXQoU0VQQVJBVE9SKTtcbiAgcmV0dXJuIG9yaWdpbnM7XG59XG5cbm1vZHVsZS5leHBvcnRzLmFkZEFwcHJvdmVkT3JpZ2luID0gYWRkQXBwcm92ZWRPcmlnaW47XG5tb2R1bGUuZXhwb3J0cy5nZXRBcHByb3ZlZE9yaWdpbnMgPSBnZXRBcHByb3ZlZE9yaWdpbnM7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vQXBwcm92ZWRPcmlnaW5zLmpzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIFRoaXMgZmlsZSBsaXN0cyBhbGwgb2YgdGhlIGVudW1zIHdoaWNoIHNob3VsZCBhdmFpbGFibGUgZm9yIHRoZSBXREMgKi9cbnZhciBhbGxFbnVtcyA9IHtcbiAgcGhhc2VFbnVtIDoge1xuICAgIGludGVyYWN0aXZlUGhhc2U6IFwiaW50ZXJhY3RpdmVcIixcbiAgICBhdXRoUGhhc2U6IFwiYXV0aFwiLFxuICAgIGdhdGhlckRhdGFQaGFzZTogXCJnYXRoZXJEYXRhXCJcbiAgfSxcblxuICBhdXRoUHVycG9zZUVudW0gOiB7XG4gICAgZXBoZW1lcmFsOiBcImVwaGVtZXJhbFwiLFxuICAgIGVuZHVyaW5nOiBcImVuZHVyaW5nXCJcbiAgfSxcblxuICBhdXRoVHlwZUVudW0gOiB7XG4gICAgbm9uZTogXCJub25lXCIsXG4gICAgYmFzaWM6IFwiYmFzaWNcIixcbiAgICBjdXN0b206IFwiY3VzdG9tXCJcbiAgfSxcblxuICBkYXRhVHlwZUVudW0gOiB7XG4gICAgYm9vbDogXCJib29sXCIsXG4gICAgZGF0ZTogXCJkYXRlXCIsXG4gICAgZGF0ZXRpbWU6IFwiZGF0ZXRpbWVcIixcbiAgICBmbG9hdDogXCJmbG9hdFwiLFxuICAgIGludDogXCJpbnRcIixcbiAgICBzdHJpbmc6IFwic3RyaW5nXCJcbiAgfSxcblxuICBjb2x1bW5Sb2xlRW51bSA6IHtcbiAgICAgIGRpbWVuc2lvbjogXCJkaW1lbnNpb25cIixcbiAgICAgIG1lYXN1cmU6IFwibWVhc3VyZVwiXG4gIH0sXG5cbiAgY29sdW1uVHlwZUVudW0gOiB7XG4gICAgICBjb250aW51b3VzOiBcImNvbnRpbnVvdXNcIixcbiAgICAgIGRpc2NyZXRlOiBcImRpc2NyZXRlXCJcbiAgfSxcblxuICBhZ2dUeXBlRW51bSA6IHtcbiAgICAgIHN1bTogXCJzdW1cIixcbiAgICAgIGF2ZzogXCJhdmdcIixcbiAgICAgIG1lZGlhbjogXCJtZWRpYW5cIixcbiAgICAgIGNvdW50OiBcImNvdW50XCIsXG4gICAgICBjb3VudGQ6IFwiY291bnRfZGlzdFwiXG4gIH0sXG5cbiAgZ2VvZ3JhcGhpY1JvbGVFbnVtIDoge1xuICAgICAgYXJlYV9jb2RlOiBcImFyZWFfY29kZVwiLFxuICAgICAgY2JzYV9tc2E6IFwiY2JzYV9tc2FcIixcbiAgICAgIGNpdHk6IFwiY2l0eVwiLFxuICAgICAgY29uZ3Jlc3Npb25hbF9kaXN0cmljdDogXCJjb25ncmVzc2lvbmFsX2Rpc3RyaWN0XCIsXG4gICAgICBjb3VudHJ5X3JlZ2lvbjogXCJjb3VudHJ5X3JlZ2lvblwiLFxuICAgICAgY291bnR5OiBcImNvdW50eVwiLFxuICAgICAgc3RhdGVfcHJvdmluY2U6IFwic3RhdGVfcHJvdmluY2VcIixcbiAgICAgIHppcF9jb2RlX3Bvc3Rjb2RlOiBcInppcF9jb2RlX3Bvc3Rjb2RlXCIsXG4gICAgICBsYXRpdHVkZTogXCJsYXRpdHVkZVwiLFxuICAgICAgbG9uZ2l0dWRlOiBcImxvbmdpdHVkZVwiXG4gIH0sXG5cbiAgdW5pdHNGb3JtYXRFbnVtIDoge1xuICAgICAgdGhvdXNhbmRzOiBcInRob3VzYW5kc1wiLFxuICAgICAgbWlsbGlvbnM6IFwibWlsbGlvbnNcIixcbiAgICAgIGJpbGxpb25zX2VuZ2xpc2g6IFwiYmlsbGlvbnNfZW5nbGlzaFwiLFxuICAgICAgYmlsbGlvbnNfc3RhbmRhcmQ6IFwiYmlsbGlvbnNfc3RhbmRhcmRcIlxuICB9LFxuXG4gIG51bWJlckZvcm1hdEVudW0gOiB7XG4gICAgICBudW1iZXI6IFwibnVtYmVyXCIsXG4gICAgICBjdXJyZW5jeTogXCJjdXJyZW5jeVwiLFxuICAgICAgc2NpZW50aWZpYzogXCJzY2llbnRpZmljXCIsXG4gICAgICBwZXJjZW50YWdlOiBcInBlcmNlbnRhZ2VcIlxuICB9LFxuXG4gIGxvY2FsZUVudW0gOiB7XG4gICAgICBhbWVyaWNhOiBcImVuLXVzXCIsXG4gICAgICBicmF6aWw6ICBcInB0LWJyXCIsXG4gICAgICBjaGluYTogICBcInpoLWNuXCIsXG4gICAgICBmcmFuY2U6ICBcImZyLWZyXCIsXG4gICAgICBnZXJtYW55OiBcImRlLWRlXCIsXG4gICAgICBqYXBhbjogICBcImphLWpwXCIsXG4gICAgICBrb3JlYTogICBcImtvLWtyXCIsXG4gICAgICBzcGFpbjogICBcImVzLWVzXCJcbiAgfSxcblxuICBqb2luRW51bSA6IHtcbiAgICAgIGlubmVyOiBcImlubmVyXCIsXG4gICAgICBsZWZ0OiBcImxlZnRcIlxuICB9XG59XG5cbi8vIEFwcGxpZXMgdGhlIGVudW1zIGFzIHByb3BlcnRpZXMgb2YgdGhlIHRhcmdldCBvYmplY3RcbmZ1bmN0aW9uIGFwcGx5KHRhcmdldCkge1xuICBmb3IodmFyIGtleSBpbiBhbGxFbnVtcykge1xuICAgIHRhcmdldFtrZXldID0gYWxsRW51bXNba2V5XTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5hcHBseSA9IGFwcGx5O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL0VudW1zLmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqIEBjbGFzcyBVc2VkIGZvciBjb21tdW5pY2F0aW5nIGJldHdlZW4gVGFibGVhdSBkZXNrdG9wL3NlcnZlciBhbmQgdGhlIFdEQydzXG4qIEphdmFzY3JpcHQuIGlzIHByZWRvbWluYW50bHkgYSBwYXNzLXRocm91Z2ggdG8gdGhlIFF0IFdlYkJyaWRnZSBtZXRob2RzXG4qIEBwYXJhbSBuYXRpdmVBcGlSb290T2JqIHtPYmplY3R9IC0gVGhlIHJvb3Qgb2JqZWN0IHdoZXJlIHRoZSBuYXRpdmUgQXBpIG1ldGhvZHNcbiogYXJlIGF2YWlsYWJsZS4gRm9yIFdlYktpdCwgdGhpcyBpcyB3aW5kb3cuXG4qL1xuZnVuY3Rpb24gTmF0aXZlRGlzcGF0Y2hlciAobmF0aXZlQXBpUm9vdE9iaikge1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmogPSBuYXRpdmVBcGlSb290T2JqO1xuICB0aGlzLl9pbml0UHVibGljSW50ZXJmYWNlKCk7XG4gIHRoaXMuX2luaXRQcml2YXRlSW50ZXJmYWNlKCk7XG59XG5cbk5hdGl2ZURpc3BhdGNoZXIucHJvdG90eXBlLl9pbml0UHVibGljSW50ZXJmYWNlID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6aW5nIHB1YmxpYyBpbnRlcmZhY2UgZm9yIE5hdGl2ZURpc3BhdGNoZXJcIik7XG4gIHRoaXMuX3N1Ym1pdENhbGxlZCA9IGZhbHNlO1xuXG4gIHZhciBwdWJsaWNJbnRlcmZhY2UgPSB7fTtcbiAgcHVibGljSW50ZXJmYWNlLmFib3J0Rm9yQXV0aCA9IHRoaXMuX2Fib3J0Rm9yQXV0aC5iaW5kKHRoaXMpO1xuICBwdWJsaWNJbnRlcmZhY2UuYWJvcnRXaXRoRXJyb3IgPSB0aGlzLl9hYm9ydFdpdGhFcnJvci5iaW5kKHRoaXMpO1xuICBwdWJsaWNJbnRlcmZhY2UuYWRkQ3Jvc3NPcmlnaW5FeGNlcHRpb24gPSB0aGlzLl9hZGRDcm9zc09yaWdpbkV4Y2VwdGlvbi5iaW5kKHRoaXMpO1xuICBwdWJsaWNJbnRlcmZhY2UubG9nID0gdGhpcy5fbG9nLmJpbmQodGhpcyk7XG4gIHB1YmxpY0ludGVyZmFjZS5zdWJtaXQgPSB0aGlzLl9zdWJtaXQuYmluZCh0aGlzKTtcbiAgcHVibGljSW50ZXJmYWNlLnJlcG9ydFByb2dyZXNzID0gdGhpcy5fcmVwb3J0UHJvZ3Jlc3MuYmluZCh0aGlzKTtcblxuICB0aGlzLnB1YmxpY0ludGVyZmFjZSA9IHB1YmxpY0ludGVyZmFjZTtcbn1cblxuTmF0aXZlRGlzcGF0Y2hlci5wcm90b3R5cGUuX2Fib3J0Rm9yQXV0aCA9IGZ1bmN0aW9uKG1zZykge1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9hYm9ydEZvckF1dGguYXBpKG1zZyk7XG59XG5cbk5hdGl2ZURpc3BhdGNoZXIucHJvdG90eXBlLl9hYm9ydFdpdGhFcnJvciA9IGZ1bmN0aW9uKG1zZykge1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9hYm9ydFdpdGhFcnJvci5hcGkobXNnKTtcbn1cblxuTmF0aXZlRGlzcGF0Y2hlci5wcm90b3R5cGUuX2FkZENyb3NzT3JpZ2luRXhjZXB0aW9uID0gZnVuY3Rpb24oZGVzdE9yaWdpbkxpc3QpIHtcbiAgdGhpcy5uYXRpdmVBcGlSb290T2JqLldEQ0JyaWRnZV9BcGlfYWRkQ3Jvc3NPcmlnaW5FeGNlcHRpb24uYXBpKGRlc3RPcmlnaW5MaXN0KTtcbn1cblxuTmF0aXZlRGlzcGF0Y2hlci5wcm90b3R5cGUuX2xvZyA9IGZ1bmN0aW9uKG1zZykge1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9sb2cuYXBpKG1zZyk7XG59XG5cbk5hdGl2ZURpc3BhdGNoZXIucHJvdG90eXBlLl9zdWJtaXQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX3N1Ym1pdENhbGxlZCkge1xuICAgIGNvbnNvbGUubG9nKFwic3VibWl0IGNhbGxlZCBtb3JlIHRoYW4gb25jZVwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9zdWJtaXRDYWxsZWQgPSB0cnVlO1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9zdWJtaXQuYXBpKCk7XG59O1xuXG5OYXRpdmVEaXNwYXRjaGVyLnByb3RvdHlwZS5faW5pdFByaXZhdGVJbnRlcmZhY2UgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coXCJJbml0aWFsaXppbmcgcHJpdmF0ZSBpbnRlcmZhY2UgZm9yIE5hdGl2ZURpc3BhdGNoZXJcIik7XG5cbiAgdGhpcy5faW5pdENhbGxiYWNrQ2FsbGVkID0gZmFsc2U7XG4gIHRoaXMuX3NodXRkb3duQ2FsbGJhY2tDYWxsZWQgPSBmYWxzZTtcblxuICB2YXIgcHJpdmF0ZUludGVyZmFjZSA9IHt9O1xuICBwcml2YXRlSW50ZXJmYWNlLl9pbml0Q2FsbGJhY2sgPSB0aGlzLl9pbml0Q2FsbGJhY2suYmluZCh0aGlzKTtcbiAgcHJpdmF0ZUludGVyZmFjZS5fc2h1dGRvd25DYWxsYmFjayA9IHRoaXMuX3NodXRkb3duQ2FsbGJhY2suYmluZCh0aGlzKTtcbiAgcHJpdmF0ZUludGVyZmFjZS5fc2NoZW1hQ2FsbGJhY2sgPSB0aGlzLl9zY2hlbWFDYWxsYmFjay5iaW5kKHRoaXMpO1xuICBwcml2YXRlSW50ZXJmYWNlLl90YWJsZURhdGFDYWxsYmFjayA9IHRoaXMuX3RhYmxlRGF0YUNhbGxiYWNrLmJpbmQodGhpcyk7XG4gIHByaXZhdGVJbnRlcmZhY2UuX2RhdGFEb25lQ2FsbGJhY2sgPSB0aGlzLl9kYXRhRG9uZUNhbGxiYWNrLmJpbmQodGhpcyk7XG5cbiAgdGhpcy5wcml2YXRlSW50ZXJmYWNlID0gcHJpdmF0ZUludGVyZmFjZTtcbn1cblxuTmF0aXZlRGlzcGF0Y2hlci5wcm90b3R5cGUuX2luaXRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5faW5pdENhbGxiYWNrQ2FsbGVkKSB7XG4gICAgY29uc29sZS5sb2coXCJpbml0Q2FsbGJhY2sgY2FsbGVkIG1vcmUgdGhhbiBvbmNlXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX2luaXRDYWxsYmFja0NhbGxlZCA9IHRydWU7XG4gIHRoaXMubmF0aXZlQXBpUm9vdE9iai5XRENCcmlkZ2VfQXBpX2luaXRDYWxsYmFjay5hcGkoKTtcbn1cblxuTmF0aXZlRGlzcGF0Y2hlci5wcm90b3R5cGUuX3NodXRkb3duQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX3NodXRkb3duQ2FsbGJhY2tDYWxsZWQpIHtcbiAgICBjb25zb2xlLmxvZyhcInNodXRkb3duQ2FsbGJhY2sgY2FsbGVkIG1vcmUgdGhhbiBvbmNlXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX3NodXRkb3duQ2FsbGJhY2tDYWxsZWQgPSB0cnVlO1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9zaHV0ZG93bkNhbGxiYWNrLmFwaSgpO1xufVxuXG5OYXRpdmVEaXNwYXRjaGVyLnByb3RvdHlwZS5fc2NoZW1hQ2FsbGJhY2sgPSBmdW5jdGlvbihzY2hlbWEsIHN0YW5kYXJkQ29ubmVjdGlvbnMpIHtcbiAgLy8gQ2hlY2sgdG8gbWFrZSBzdXJlIHdlIGFyZSB1c2luZyBhIHZlcnNpb24gb2YgZGVza3RvcCB3aGljaCBoYXMgdGhlIFdEQ0JyaWRnZV9BcGlfc2NoZW1hQ2FsbGJhY2tFeCBkZWZpbmVkXG4gIGlmICghIXRoaXMubmF0aXZlQXBpUm9vdE9iai5XRENCcmlkZ2VfQXBpX3NjaGVtYUNhbGxiYWNrRXgpIHtcbiAgICAvLyBQcm92aWRpbmcgc3RhbmRhcmRDb25uZWN0aW9ucyBpcyBvcHRpb25hbCBidXQgd2UgY2FuJ3QgcGFzcyB1bmRlZmluZWQgYmFjayBiZWNhdXNlIFF0IHdpbGwgY2hva2VcbiAgICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9zY2hlbWFDYWxsYmFja0V4LmFwaShzY2hlbWEsIHN0YW5kYXJkQ29ubmVjdGlvbnMgfHwgW10pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubmF0aXZlQXBpUm9vdE9iai5XRENCcmlkZ2VfQXBpX3NjaGVtYUNhbGxiYWNrLmFwaShzY2hlbWEpO1xuICB9XG59XG5cbk5hdGl2ZURpc3BhdGNoZXIucHJvdG90eXBlLl90YWJsZURhdGFDYWxsYmFjayA9IGZ1bmN0aW9uKHRhYmxlTmFtZSwgZGF0YSkge1xuICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV90YWJsZURhdGFDYWxsYmFjay5hcGkodGFibGVOYW1lLCBkYXRhKTtcbn1cblxuTmF0aXZlRGlzcGF0Y2hlci5wcm90b3R5cGUuX3JlcG9ydFByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gIC8vIFJlcG9ydCBwcm9ncmVzcyB3YXMgYWRkZWQgaW4gMi4xIHNvIGl0IG1heSBub3QgYmUgYXZhaWxhYmxlIGlmIFRhYmxlYXUgb25seSBrbm93cyAyLjBcbiAgaWYgKCEhdGhpcy5uYXRpdmVBcGlSb290T2JqLldEQ0JyaWRnZV9BcGlfcmVwb3J0UHJvZ3Jlc3MpIHtcbiAgICB0aGlzLm5hdGl2ZUFwaVJvb3RPYmouV0RDQnJpZGdlX0FwaV9yZXBvcnRQcm9ncmVzcy5hcGkocHJvZ3Jlc3MpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKFwicmVwb3J0UHJvZ3Jlc3Mgbm90IGF2YWlsYWJsZSBmcm9tIHRoaXMgVGFibGVhdSB2ZXJzaW9uXCIpO1xuICB9XG59XG5cbk5hdGl2ZURpc3BhdGNoZXIucHJvdG90eXBlLl9kYXRhRG9uZUNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubmF0aXZlQXBpUm9vdE9iai5XRENCcmlkZ2VfQXBpX2RhdGFEb25lQ2FsbGJhY2suYXBpKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTmF0aXZlRGlzcGF0Y2hlcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9OYXRpdmVEaXNwYXRjaGVyLmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIFRhYmxlID0gcmVxdWlyZSgnLi9UYWJsZS5qcycpO1xudmFyIEVudW1zID0gcmVxdWlyZSgnLi9FbnVtcy5qcycpO1xuXG4vKiogQGNsYXNzIFRoaXMgY2xhc3MgcmVwcmVzZW50cyB0aGUgc2hhcmVkIHBhcnRzIG9mIHRoZSBqYXZhc2NyaXB0XG4qIGxpYnJhcnkgd2hpY2ggZG8gbm90IGhhdmUgYW55IGRlcGVuZGVuY2Ugb24gd2hldGhlciB3ZSBhcmUgcnVubmluZyBpblxuKiB0aGUgc2ltdWxhdG9yLCBpbiBUYWJsZWF1LCBvciBhbnl3aGVyZSBlbHNlXG4qIEBwYXJhbSB0YWJsZWF1QXBpT2JqIHtPYmplY3R9IC0gVGhlIGFscmVhZHkgY3JlYXRlZCB0YWJsZWF1IEFQSSBvYmplY3QgKHVzdWFsbHkgd2luZG93LnRhYmxlYXUpXG4qIEBwYXJhbSBwcml2YXRlQXBpT2JqIHtPYmplY3R9IC0gVGhlIGFscmVhZHkgY3JlYXRlZCBwcml2YXRlIEFQSSBvYmplY3QgKHVzdWFsbHkgd2luZG93Ll90YWJsZWF1KVxuKiBAcGFyYW0gZ2xvYmFsT2JqIHtPYmplY3R9IC0gVGhlIGdsb2JhbCBvYmplY3QgdG8gYXR0YWNoIHRoaW5ncyB0byAodXN1YWxseSB3aW5kb3cpXG4qL1xuZnVuY3Rpb24gU2hhcmVkICh0YWJsZWF1QXBpT2JqLCBwcml2YXRlQXBpT2JqLCBnbG9iYWxPYmopIHtcbiAgdGhpcy5wcml2YXRlQXBpT2JqID0gcHJpdmF0ZUFwaU9iajtcbiAgdGhpcy5nbG9iYWxPYmogPSBnbG9iYWxPYmo7XG4gIHRoaXMuX2hhc0FscmVhZHlUaHJvd25FcnJvclNvRG9udFRocm93QWdhaW4gPSBmYWxzZTtcblxuICB0aGlzLmNoYW5nZVRhYmxlYXVBcGlPYmoodGFibGVhdUFwaU9iaik7XG59XG5cblxuU2hhcmVkLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6aW5nIHNoYXJlZCBXRENcIik7XG4gIHRoaXMuZ2xvYmFsT2JqLm9uZXJyb3IgPSB0aGlzLl9lcnJvckhhbmRsZXIuYmluZCh0aGlzKTtcblxuICAvLyBJbml0aWFsaXplIHRoZSBmdW5jdGlvbnMgd2hpY2ggd2lsbCBiZSBpbnZva2VkIGJ5IHRoZSBuYXRpdmUgY29kZVxuICB0aGlzLl9pbml0VHJpZ2dlckZ1bmN0aW9ucygpO1xuXG4gIC8vIEFzc2lnbiB0aGUgZGVwcmVjYXRlZCBmdW5jdGlvbnMgd2hpY2ggYXJlbid0IGF2YWlsaWJsZSBpbiB0aGlzIHZlcnNpb24gb2YgdGhlIEFQSVxuICB0aGlzLl9pbml0RGVwcmVjYXRlZEZ1bmN0aW9ucygpO1xufVxuXG5TaGFyZWQucHJvdG90eXBlLmNoYW5nZVRhYmxlYXVBcGlPYmogPSBmdW5jdGlvbih0YWJsZWF1QXBpT2JqKSB7XG4gIHRoaXMudGFibGVhdUFwaU9iaiA9IHRhYmxlYXVBcGlPYmo7XG5cbiAgLy8gQXNzaWduIG91ciBtYWtlICYgcmVnaXN0ZXIgZnVuY3Rpb25zIHJpZ2h0IGF3YXkgYmVjYXVzZSBhIGNvbm5lY3RvciBjYW4gdXNlXG4gIC8vIHRoZW0gaW1tZWRpYXRlbHksIGV2ZW4gYmVmb3JlIGJvb3RzdHJhcHBpbmcgaGFzIGNvbXBsZXRlZFxuICB0aGlzLnRhYmxlYXVBcGlPYmoubWFrZUNvbm5lY3RvciA9IHRoaXMuX21ha2VDb25uZWN0b3IuYmluZCh0aGlzKTtcbiAgdGhpcy50YWJsZWF1QXBpT2JqLnJlZ2lzdGVyQ29ubmVjdG9yID0gdGhpcy5fcmVnaXN0ZXJDb25uZWN0b3IuYmluZCh0aGlzKTtcblxuICBFbnVtcy5hcHBseSh0aGlzLnRhYmxlYXVBcGlPYmopO1xufVxuXG5TaGFyZWQucHJvdG90eXBlLl9lcnJvckhhbmRsZXIgPSBmdW5jdGlvbihtZXNzYWdlLCBmaWxlLCBsaW5lLCBjb2x1bW4sIGVycm9yT2JqKSB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3JPYmopOyAvLyBwcmludCBlcnJvciBmb3IgZGVidWdnaW5nIGluIHRoZSBicm93c2VyXG4gIGlmICh0aGlzLl9oYXNBbHJlYWR5VGhyb3duRXJyb3JTb0RvbnRUaHJvd0FnYWluKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICB2YXIgbXNnID0gbWVzc2FnZTtcbiAgaWYoZXJyb3JPYmopIHtcbiAgICBtc2cgKz0gXCIgICBzdGFjazpcIiArIGVycm9yT2JqLnN0YWNrO1xuICB9IGVsc2Uge1xuICAgIG1zZyArPSBcIiAgIGZpbGU6IFwiICsgZmlsZTtcbiAgICBtc2cgKz0gXCIgICBsaW5lOiBcIiArIGxpbmU7XG4gIH1cblxuICBpZiAodGhpcy50YWJsZWF1QXBpT2JqICYmIHRoaXMudGFibGVhdUFwaU9iai5hYm9ydFdpdGhFcnJvcikge1xuICAgIHRoaXMudGFibGVhdUFwaU9iai5hYm9ydFdpdGhFcnJvcihtc2cpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG1zZztcbiAgfVxuXG4gIHRoaXMuX2hhc0FscmVhZHlUaHJvd25FcnJvclNvRG9udFRocm93QWdhaW4gPSB0cnVlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuU2hhcmVkLnByb3RvdHlwZS5fbWFrZUNvbm5lY3RvciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGVmYXVsdEltcGxzID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKGNiKSB7IGNiKCk7IH0sXG4gICAgc2h1dGRvd246IGZ1bmN0aW9uKGNiKSB7IGNiKCk7IH1cbiAgfTtcblxuICByZXR1cm4gZGVmYXVsdEltcGxzO1xufVxuXG5TaGFyZWQucHJvdG90eXBlLl9yZWdpc3RlckNvbm5lY3RvciA9IGZ1bmN0aW9uICh3ZGMpIHtcblxuICAvLyBkbyBzb21lIGVycm9yIGNoZWNraW5nIG9uIHRoZSB3ZGNcbiAgdmFyIGZ1bmN0aW9uTmFtZXMgPSBbXCJpbml0XCIsIFwic2h1dGRvd25cIiwgXCJnZXRTY2hlbWFcIiwgXCJnZXREYXRhXCJdO1xuICBmb3IgKHZhciBpaSA9IGZ1bmN0aW9uTmFtZXMubGVuZ3RoIC0gMTsgaWkgPj0gMDsgaWktLSkge1xuICAgIGlmICh0eXBlb2Yod2RjW2Z1bmN0aW9uTmFtZXNbaWldXSkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdGhyb3cgXCJUaGUgY29ubmVjdG9yIGRpZCBub3QgZGVmaW5lIHRoZSByZXF1aXJlZCBmdW5jdGlvbjogXCIgKyBmdW5jdGlvbk5hbWVzW2lpXTtcbiAgICB9XG4gIH07XG5cbiAgY29uc29sZS5sb2coXCJDb25uZWN0b3IgcmVnaXN0ZXJlZFwiKTtcblxuICB0aGlzLmdsb2JhbE9iai5fd2RjID0gd2RjO1xuICB0aGlzLl93ZGMgPSB3ZGM7XG59XG5cblNoYXJlZC5wcm90b3R5cGUuX2luaXRUcmlnZ2VyRnVuY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJpdmF0ZUFwaU9iai50cmlnZ2VySW5pdGlhbGl6YXRpb24gPSB0aGlzLl90cmlnZ2VySW5pdGlhbGl6YXRpb24uYmluZCh0aGlzKTtcbiAgdGhpcy5wcml2YXRlQXBpT2JqLnRyaWdnZXJTY2hlbWFHYXRoZXJpbmcgPSB0aGlzLl90cmlnZ2VyU2NoZW1hR2F0aGVyaW5nLmJpbmQodGhpcyk7XG4gIHRoaXMucHJpdmF0ZUFwaU9iai50cmlnZ2VyRGF0YUdhdGhlcmluZyA9IHRoaXMuX3RyaWdnZXJEYXRhR2F0aGVyaW5nLmJpbmQodGhpcyk7XG4gIHRoaXMucHJpdmF0ZUFwaU9iai50cmlnZ2VyU2h1dGRvd24gPSB0aGlzLl90cmlnZ2VyU2h1dGRvd24uYmluZCh0aGlzKTtcbn1cblxuLy8gU3RhcnRzIHRoZSBXRENcblNoYXJlZC5wcm90b3R5cGUuX3RyaWdnZXJJbml0aWFsaXphdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl93ZGMuaW5pdCh0aGlzLnByaXZhdGVBcGlPYmouX2luaXRDYWxsYmFjayk7XG59XG5cbi8vIFN0YXJ0cyB0aGUgc2NoZW1hIGdhdGhlcmluZyBwcm9jZXNzXG5TaGFyZWQucHJvdG90eXBlLl90cmlnZ2VyU2NoZW1hR2F0aGVyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3dkYy5nZXRTY2hlbWEodGhpcy5wcml2YXRlQXBpT2JqLl9zY2hlbWFDYWxsYmFjayk7XG59XG5cbi8vIFN0YXJ0cyB0aGUgZGF0YSBnYXRoZXJpbmcgcHJvY2Vzc1xuU2hhcmVkLnByb3RvdHlwZS5fdHJpZ2dlckRhdGFHYXRoZXJpbmcgPSBmdW5jdGlvbih0YWJsZXNBbmRJbmNyZW1lbnRWYWx1ZXMpIHtcbiAgaWYgKHRhYmxlc0FuZEluY3JlbWVudFZhbHVlcy5sZW5ndGggIT0gMSkge1xuICAgIHRocm93IChcIlVuZXhwZWN0ZWQgbnVtYmVyIG9mIHRhYmxlcyBzcGVjaWZpZWQuIEV4cGVjdGVkIDEsIGFjdHVhbCBcIiArIHRhYmxlc0FuZEluY3JlbWVudFZhbHVlcy5sZW5ndGgudG9TdHJpbmcoKSk7XG4gIH1cblxuICB2YXIgdGFibGVBbmRJbmNyZW1udFZhbHVlID0gdGFibGVzQW5kSW5jcmVtZW50VmFsdWVzWzBdO1xuICB2YXIgdGFibGUgPSBuZXcgVGFibGUodGFibGVBbmRJbmNyZW1udFZhbHVlLnRhYmxlSW5mbywgdGFibGVBbmRJbmNyZW1udFZhbHVlLmluY3JlbWVudFZhbHVlLCB0aGlzLnByaXZhdGVBcGlPYmouX3RhYmxlRGF0YUNhbGxiYWNrKTtcbiAgdGhpcy5fd2RjLmdldERhdGEodGFibGUsIHRoaXMucHJpdmF0ZUFwaU9iai5fZGF0YURvbmVDYWxsYmFjayk7XG59XG5cbi8vIFRlbGxzIHRoZSBXREMgaXQncyB0aW1lIHRvIHNodXQgZG93blxuU2hhcmVkLnByb3RvdHlwZS5fdHJpZ2dlclNodXRkb3duID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3dkYy5zaHV0ZG93bih0aGlzLnByaXZhdGVBcGlPYmouX3NodXRkb3duQ2FsbGJhY2spO1xufVxuXG4vLyBJbml0aWFsaXplcyBhIHNlcmllcyBvZiBnbG9iYWwgY2FsbGJhY2tzIHdoaWNoIGhhdmUgYmVlbiBkZXByZWNhdGVkIGluIHZlcnNpb24gMi4wLjBcblNoYXJlZC5wcm90b3R5cGUuX2luaXREZXByZWNhdGVkRnVuY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudGFibGVhdUFwaU9iai5pbml0Q2FsbGJhY2sgPSB0aGlzLl9pbml0Q2FsbGJhY2suYmluZCh0aGlzKTtcbiAgdGhpcy50YWJsZWF1QXBpT2JqLmhlYWRlcnNDYWxsYmFjayA9IHRoaXMuX2hlYWRlcnNDYWxsYmFjay5iaW5kKHRoaXMpO1xuICB0aGlzLnRhYmxlYXVBcGlPYmouZGF0YUNhbGxiYWNrID0gdGhpcy5fZGF0YUNhbGxiYWNrLmJpbmQodGhpcyk7XG4gIHRoaXMudGFibGVhdUFwaU9iai5zaHV0ZG93bkNhbGxiYWNrID0gdGhpcy5fc2h1dGRvd25DYWxsYmFjay5iaW5kKHRoaXMpO1xufVxuXG5TaGFyZWQucHJvdG90eXBlLl9pbml0Q2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMudGFibGVhdUFwaU9iai5hYm9ydFdpdGhFcnJvcihcInRhYmxlYXUuaW5pdENhbGxiYWNrIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gdmVyc2lvbiAyLjAuMC4gUGxlYXNlIHVzZSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gcGFzc2VkIHRvIGluaXRcIik7XG59O1xuXG5TaGFyZWQucHJvdG90eXBlLl9oZWFkZXJzQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZmllbGROYW1lcywgdHlwZXMpIHtcbiAgdGhpcy50YWJsZWF1QXBpT2JqLmFib3J0V2l0aEVycm9yKFwidGFibGVhdS5oZWFkZXJzQ2FsbGJhY2sgaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiB2ZXJzaW9uIDIuMC4wXCIpO1xufTtcblxuU2hhcmVkLnByb3RvdHlwZS5fZGF0YUNhbGxiYWNrID0gZnVuY3Rpb24gKGRhdGEsIGxhc3RSZWNvcmRUb2tlbiwgbW9yZURhdGEpIHtcbiAgdGhpcy50YWJsZWF1QXBpT2JqLmFib3J0V2l0aEVycm9yKFwidGFibGVhdS5kYXRhQ2FsbGJhY2sgaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiB2ZXJzaW9uIDIuMC4wXCIpO1xufTtcblxuU2hhcmVkLnByb3RvdHlwZS5fc2h1dGRvd25DYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy50YWJsZWF1QXBpT2JqLmFib3J0V2l0aEVycm9yKFwidGFibGVhdS5zaHV0ZG93bkNhbGxiYWNrIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gdmVyc2lvbiAyLjAuMC4gUGxlYXNlIHVzZSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gcGFzc2VkIHRvIHNodXRkb3duXCIpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaGFyZWQ7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vU2hhcmVkLmpzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIEFwcHJvdmVkT3JpZ2lucyA9IHJlcXVpcmUoJy4vQXBwcm92ZWRPcmlnaW5zLmpzJyk7XG5cbi8qKiBAY2xhc3MgVXNlZCBmb3IgY29tbXVuaWNhdGluZyBiZXR3ZWVuIHRoZSBzaW11bGF0b3IgYW5kIHdlYiBkYXRhIGNvbm5lY3Rvci4gSXQgZG9lc1xuKiB0aGlzIGJ5IHBhc3NpbmcgbWVzc2FnZXMgYmV0d2VlbiB0aGUgV0RDIHdpbmRvdyBhbmQgaXRzIHBhcmVudCB3aW5kb3dcbiogQHBhcmFtIGdsb2JhbE9iaiB7T2JqZWN0fSAtIHRoZSBnbG9iYWwgb2JqZWN0IHRvIGZpbmQgdGFibGVhdSBpbnRlcmZhY2VzIGFzIHdlbGxcbiogYXMgcmVnaXN0ZXIgZXZlbnRzICh1c3VhbGx5IHdpbmRvdylcbiovXG5mdW5jdGlvbiBTaW11bGF0b3JEaXNwYXRjaGVyIChnbG9iYWxPYmopIHtcbiAgdGhpcy5nbG9iYWxPYmogPSBnbG9iYWxPYmo7XG4gIHRoaXMuX2luaXRNZXNzYWdlSGFuZGxpbmcoKTtcbiAgdGhpcy5faW5pdFB1YmxpY0ludGVyZmFjZSgpO1xuICB0aGlzLl9pbml0UHJpdmF0ZUludGVyZmFjZSgpO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5faW5pdE1lc3NhZ2VIYW5kbGluZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZyhcIkluaXRpYWxpemluZyBtZXNzYWdlIGhhbmRsaW5nXCIpO1xuICB0aGlzLmdsb2JhbE9iai5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5fcmVjZWl2ZU1lc3NhZ2UuYmluZCh0aGlzKSwgZmFsc2UpO1xuICB0aGlzLmdsb2JhbE9iai5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCB0aGlzLl9vbkRvbUNvbnRlbnRMb2FkZWQuYmluZCh0aGlzKSk7XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9vbkRvbUNvbnRlbnRMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgLy8gQXR0ZW1wdCB0byBub3RpZnkgdGhlIHNpbXVsYXRvciB3aW5kb3cgdGhhdCB0aGUgV0RDIGhhcyBsb2FkZWRcbiAgaWYodGhpcy5nbG9iYWxPYmoucGFyZW50ICE9PSB3aW5kb3cpIHtcbiAgICB0aGlzLmdsb2JhbE9iai5wYXJlbnQucG9zdE1lc3NhZ2UodGhpcy5fYnVpbGRNZXNzYWdlUGF5bG9hZCgnbG9hZGVkJyksICcqJyk7XG4gIH1cblxuICBpZih0aGlzLmdsb2JhbE9iai5vcGVuZXIpIHtcbiAgICB0cnkgeyAvLyBXcmFwIGluIHRyeS9jYXRjaCBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgSUVcbiAgICAgIHRoaXMuZ2xvYmFsT2JqLm9wZW5lci5wb3N0TWVzc2FnZSh0aGlzLl9idWlsZE1lc3NhZ2VQYXlsb2FkKCdsb2FkZWQnKSwgJyonKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignU29tZSB2ZXJzaW9ucyBvZiBJRSBtYXkgbm90IGFjY3VyYXRlbHkgc2ltdWxhdGUgdGhlIFdlYiBEYXRhIENvbm5lY3Rvci4gUGxlYXNlIHJldHJ5IG9uIGEgV2Via2l0IGJhc2VkIGJyb3dzZXInKTtcbiAgICB9XG4gIH1cbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX3BhY2thZ2VQcm9wZXJ0eVZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcHJvcFZhbHVlcyA9IHtcbiAgICBcImNvbm5lY3Rpb25OYW1lXCI6IHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUuY29ubmVjdGlvbk5hbWUsXG4gICAgXCJjb25uZWN0aW9uRGF0YVwiOiB0aGlzLmdsb2JhbE9iai50YWJsZWF1LmNvbm5lY3Rpb25EYXRhLFxuICAgIFwicGFzc3dvcmRcIjogdGhpcy5nbG9iYWxPYmoudGFibGVhdS5wYXNzd29yZCxcbiAgICBcInVzZXJuYW1lXCI6IHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUudXNlcm5hbWUsXG4gICAgXCJ1c2VybmFtZUFsaWFzXCI6IHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUudXNlcm5hbWVBbGlhcyxcbiAgICBcImluY3JlbWVudGFsRXh0cmFjdENvbHVtblwiOiB0aGlzLmdsb2JhbE9iai50YWJsZWF1LmluY3JlbWVudGFsRXh0cmFjdENvbHVtbixcbiAgICBcInZlcnNpb25OdW1iZXJcIjogdGhpcy5nbG9iYWxPYmoudGFibGVhdS52ZXJzaW9uTnVtYmVyLFxuICAgIFwibG9jYWxlXCI6IHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUubG9jYWxlLFxuICAgIFwiYXV0aFB1cnBvc2VcIjogdGhpcy5nbG9iYWxPYmoudGFibGVhdS5hdXRoUHVycG9zZSxcbiAgICBcInBsYXRmb3JtT1NcIjogdGhpcy5nbG9iYWxPYmoudGFibGVhdS5wbGF0Zm9ybU9TLFxuICAgIFwicGxhdGZvcm1WZXJzaW9uXCI6IHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUucGxhdGZvcm1WZXJzaW9uLFxuICAgIFwicGxhdGZvcm1FZGl0aW9uXCI6IHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUucGxhdGZvcm1FZGl0aW9uLFxuICAgIFwicGxhdGZvcm1CdWlsZE51bWJlclwiOiB0aGlzLmdsb2JhbE9iai50YWJsZWF1LnBsYXRmb3JtQnVpbGROdW1iZXJcbiAgfTtcblxuICByZXR1cm4gcHJvcFZhbHVlcztcbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX2FwcGx5UHJvcGVydHlWYWx1ZXMgPSBmdW5jdGlvbihwcm9wcykge1xuICBpZiAocHJvcHMpIHtcbiAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1LmNvbm5lY3Rpb25OYW1lID0gcHJvcHMuY29ubmVjdGlvbk5hbWU7XG4gICAgdGhpcy5nbG9iYWxPYmoudGFibGVhdS5jb25uZWN0aW9uRGF0YSA9IHByb3BzLmNvbm5lY3Rpb25EYXRhO1xuICAgIHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUucGFzc3dvcmQgPSBwcm9wcy5wYXNzd29yZDtcbiAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1LnVzZXJuYW1lID0gcHJvcHMudXNlcm5hbWU7XG4gICAgdGhpcy5nbG9iYWxPYmoudGFibGVhdS51c2VybmFtZUFsaWFzID0gcHJvcHMudXNlcm5hbWVBbGlhcztcbiAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1LmluY3JlbWVudGFsRXh0cmFjdENvbHVtbiA9IHByb3BzLmluY3JlbWVudGFsRXh0cmFjdENvbHVtbjtcbiAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1LmxvY2FsZSA9IHByb3BzLmxvY2FsZTtcbiAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1Lmxhbmd1YWdlID0gcHJvcHMubG9jYWxlO1xuICAgIHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUuYXV0aFB1cnBvc2UgPSBwcm9wcy5hdXRoUHVycG9zZTtcbiAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1LnBsYXRmb3JtT1MgPSBwcm9wcy5wbGF0Zm9ybU9TO1xuICAgIHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUucGxhdGZvcm1WZXJzaW9uID0gcHJvcHMucGxhdGZvcm1WZXJzaW9uO1xuICAgIHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUucGxhdGZvcm1FZGl0aW9uID0gcHJvcHMucGxhdGZvcm1FZGl0aW9uO1xuICAgIHRoaXMuZ2xvYmFsT2JqLnRhYmxlYXUucGxhdGZvcm1CdWlsZE51bWJlciA9IHByb3BzLnBsYXRmb3JtQnVpbGROdW1iZXI7XG4gIH1cbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX2J1aWxkTWVzc2FnZVBheWxvYWQgPSBmdW5jdGlvbihtc2dOYW1lLCBtc2dEYXRhLCBwcm9wcykge1xuICB2YXIgbXNnT2JqID0ge1wibXNnTmFtZVwiOiBtc2dOYW1lLCBcIm1zZ0RhdGFcIjogbXNnRGF0YSwgXCJwcm9wc1wiOiBwcm9wcywgXCJ2ZXJzaW9uXCI6IEJVSUxEX05VTUJFUiB9O1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobXNnT2JqKTtcbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX3NlbmRNZXNzYWdlID0gZnVuY3Rpb24obXNnTmFtZSwgbXNnRGF0YSkge1xuICB2YXIgbWVzc2FnZVBheWxvYWQgPSB0aGlzLl9idWlsZE1lc3NhZ2VQYXlsb2FkKG1zZ05hbWUsIG1zZ0RhdGEsIHRoaXMuX3BhY2thZ2VQcm9wZXJ0eVZhbHVlcygpKTtcblxuICAvLyBDaGVjayBmaXJzdCB0byBzZWUgaWYgd2UgaGF2ZSBhIG1lc3NhZ2VIYW5kbGVyIGRlZmluZWQgdG8gcG9zdCB0aGUgbWVzc2FnZSB0b1xuICBpZiAodHlwZW9mIHRoaXMuZ2xvYmFsT2JqLndlYmtpdCAhPSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB0aGlzLmdsb2JhbE9iai53ZWJraXQubWVzc2FnZUhhbmRsZXJzICE9ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIHRoaXMuZ2xvYmFsT2JqLndlYmtpdC5tZXNzYWdlSGFuZGxlcnMud2RjSGFuZGxlciAhPSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMuZ2xvYmFsT2JqLndlYmtpdC5tZXNzYWdlSGFuZGxlcnMud2RjSGFuZGxlci5wb3N0TWVzc2FnZShtZXNzYWdlUGF5bG9hZCk7XG4gIH0gZWxzZSBpZiAoIXRoaXMuX3NvdXJjZVdpbmRvdykge1xuICAgIHRocm93IFwiTG9va3MgbGlrZSB0aGUgV0RDIGlzIGNhbGxpbmcgYSB0YWJsZWF1IGZ1bmN0aW9uIGJlZm9yZSB0YWJsZWF1LmluaXQoKSBoYXMgYmVlbiBjYWxsZWQuXCJcbiAgfSBlbHNlIHtcbiAgICAvLyBNYWtlIHN1cmUgd2Ugb25seSBwb3N0IHRoaXMgaW5mbyBiYWNrIHRvIHRoZSBzb3VyY2Ugb3JpZ2luIHRoZSB1c2VyIGFwcHJvdmVkIGluIF9nZXRXZWJTZWN1cml0eVdhcm5pbmdDb25maXJtXG4gICAgdGhpcy5fc291cmNlV2luZG93LnBvc3RNZXNzYWdlKG1lc3NhZ2VQYXlsb2FkLCB0aGlzLl9zb3VyY2VPcmlnaW4pO1xuICB9XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9nZXRQYXlsb2FkT2JqID0gZnVuY3Rpb24ocGF5bG9hZFN0cmluZykge1xuICB2YXIgcGF5bG9hZCA9IG51bGw7XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IEpTT04ucGFyc2UocGF5bG9hZFN0cmluZyk7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHBheWxvYWQ7XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9nZXRXZWJTZWN1cml0eVdhcm5pbmdDb25maXJtID0gZnVuY3Rpb24oKSB7XG4gIC8vIER1ZSB0byBjcm9zcy1vcmlnaW4gc2VjdXJpdHkgaXNzdWVzIG92ZXIgaHR0cHMsIHdlIG1heSBub3QgYmUgYWJsZSB0byByZXRyaWV2ZSBfc291cmNlV2luZG93LlxuICAvLyBVc2Ugc291cmNlT3JpZ2luIGluc3RlYWQuXG4gIHZhciBvcmlnaW4gPSB0aGlzLl9zb3VyY2VPcmlnaW47XG5cbiAgdmFyIFVyaSA9IHJlcXVpcmUoJ2pzdXJpJyk7XG4gIHZhciBwYXJzZWRPcmlnaW4gPSBuZXcgVXJpKG9yaWdpbik7XG4gIHZhciBob3N0TmFtZSA9IHBhcnNlZE9yaWdpbi5ob3N0KCk7XG5cbiAgdmFyIHN1cHBvcnRlZEhvc3RzID0gW1wibG9jYWxob3N0XCIsIFwidGFibGVhdS5naXRodWIuaW9cIl07XG4gIGlmIChzdXBwb3J0ZWRIb3N0cy5pbmRleE9mKGhvc3ROYW1lKSA+PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIFdoaXRlbGlzdCBUYWJsZWF1IGRvbWFpbnNcbiAgaWYgKGhvc3ROYW1lICYmIGhvc3ROYW1lLmVuZHNXaXRoKFwib25saW5lLnRhYmxlYXUuY29tXCIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHZhciBhbHJlYWR5QXBwcm92ZWRPcmlnaW5zID0gQXBwcm92ZWRPcmlnaW5zLmdldEFwcHJvdmVkT3JpZ2lucygpO1xuICBpZiAoYWxyZWFkeUFwcHJvdmVkT3JpZ2lucy5pbmRleE9mKG9yaWdpbikgPj0gMCkge1xuICAgIC8vIFRoZSB1c2VyIGhhcyBhbHJlYWR5IGFwcHJvdmVkIHRoaXMgb3JpZ2luLCBubyBuZWVkIHRvIGFzayBhZ2FpblxuICAgIGNvbnNvbGUubG9nKFwiQWxyZWFkeSBhcHByb3ZlZCB0aGUgb3JpZ2luJ1wiICsgb3JpZ2luICsgXCInLCBub3QgYXNraW5nIGFnYWluXCIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdmFyIGxvY2FsaXplZFdhcm5pbmdUaXRsZSA9IHRoaXMuX2dldExvY2FsaXplZFN0cmluZyhcIndlYlNlY3VyaXR5V2FybmluZ1wiKTtcbiAgdmFyIGNvbXBsZXRlV2FybmluZ01zZyAgPSBsb2NhbGl6ZWRXYXJuaW5nVGl0bGUgKyBcIlxcblxcblwiICsgaG9zdE5hbWUgKyBcIlxcblwiO1xuICB2YXIgaXNDb25maXJtZWQgPSBjb25maXJtKGNvbXBsZXRlV2FybmluZ01zZyk7XG5cbiAgaWYgKGlzQ29uZmlybWVkKSB7XG4gICAgLy8gU2V0IGEgc2Vzc2lvbiBjb29raWUgdG8gbWFyayB0aGF0IHdlJ3ZlIGFwcHJvdmVkIHRoaXMgYWxyZWFkeVxuICAgIEFwcHJvdmVkT3JpZ2lucy5hZGRBcHByb3ZlZE9yaWdpbihvcmlnaW4pO1xuICB9XG5cbiAgcmV0dXJuIGlzQ29uZmlybWVkO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5fZ2V0Q3VycmVudExvY2FsZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFVzZSBjdXJyZW50IGJyb3dzZXIncyBsb2NhbGUgdG8gZ2V0IGEgbG9jYWxpemVkIHdhcm5pbmcgbWVzc2FnZVxuICAgIHZhciBjdXJyZW50QnJvd3Nlckxhbmd1YWdlID0gKG5hdmlnYXRvci5sYW5ndWFnZSB8fCBuYXZpZ2F0b3IudXNlckxhbmd1YWdlKTtcbiAgICB2YXIgbG9jYWxlID0gY3VycmVudEJyb3dzZXJMYW5ndWFnZT8gY3VycmVudEJyb3dzZXJMYW5ndWFnZS5zdWJzdHJpbmcoMCwgMik6IFwiZW5cIjtcblxuICAgIHZhciBzdXBwb3J0ZWRMb2NhbGVzID0gW1wiZGVcIiwgXCJlblwiLCBcImVzXCIsIFwiZnJcIiwgXCJqYVwiLCBcImtvXCIsIFwicHRcIiwgXCJ6aFwiXTtcbiAgICAvLyBGYWxsIGJhY2sgdG8gRW5nbGlzaCBmb3Igb3RoZXIgdW5zdXBwb3J0ZWQgbGFuYWd1YWdlc1xuICAgIGlmIChzdXBwb3J0ZWRMb2NhbGVzLmluZGV4T2YobG9jYWxlKSA8IDApIHtcbiAgICAgICAgbG9jYWxlID0gJ2VuJztcbiAgICB9XG5cbiAgICByZXR1cm4gbG9jYWxlO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5fZ2V0TG9jYWxpemVkU3RyaW5nID0gZnVuY3Rpb24oc3RyaW5nS2V5KSB7XG4gICAgdmFyIGxvY2FsZSA9IHRoaXMuX2dldEN1cnJlbnRMb2NhbGUoKTtcblxuICAgIC8vIFVzZSBzdGF0aWMgcmVxdWlyZSBoZXJlLCBvdGhlcndpc2Ugd2VicGFjayB3b3VsZCBnZW5lcmF0ZSBhIG11Y2ggYmlnZ2VyIEpTIGZpbGVcbiAgICB2YXIgZGVTdHJpbmdzTWFwID0gcmVxdWlyZSgnanNvbiEuL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfZGUtREUuanNvbicpO1xuICAgIHZhciBlblN0cmluZ3NNYXAgPSByZXF1aXJlKCdqc29uIS4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19lbi1VUy5qc29uJyk7XG4gICAgdmFyIGVzU3RyaW5nc01hcCA9IHJlcXVpcmUoJ2pzb24hLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX2VzLUVTLmpzb24nKTtcbiAgICB2YXIgamFTdHJpbmdzTWFwID0gcmVxdWlyZSgnanNvbiEuL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfamEtSlAuanNvbicpO1xuICAgIHZhciBmclN0cmluZ3NNYXAgPSByZXF1aXJlKCdqc29uIS4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19mci1GUi5qc29uJyk7XG4gICAgdmFyIGtvU3RyaW5nc01hcCA9IHJlcXVpcmUoJ2pzb24hLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX2tvLUtSLmpzb24nKTtcbiAgICB2YXIgcHRTdHJpbmdzTWFwID0gcmVxdWlyZSgnanNvbiEuL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfcHQtQlIuanNvbicpO1xuICAgIHZhciB6aFN0cmluZ3NNYXAgPSByZXF1aXJlKCdqc29uIS4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc196aC1DTi5qc29uJyk7XG5cbiAgICB2YXIgc3RyaW5nSnNvbk1hcEJ5TG9jYWxlID1cbiAgICB7XG4gICAgICAgIFwiZGVcIjogZGVTdHJpbmdzTWFwLFxuICAgICAgICBcImVuXCI6IGVuU3RyaW5nc01hcCxcbiAgICAgICAgXCJlc1wiOiBlc1N0cmluZ3NNYXAsXG4gICAgICAgIFwiZnJcIjogZnJTdHJpbmdzTWFwLFxuICAgICAgICBcImphXCI6IGphU3RyaW5nc01hcCxcbiAgICAgICAgXCJrb1wiOiBrb1N0cmluZ3NNYXAsXG4gICAgICAgIFwicHRcIjogcHRTdHJpbmdzTWFwLFxuICAgICAgICBcInpoXCI6IHpoU3RyaW5nc01hcFxuICAgIH07XG5cbiAgICB2YXIgbG9jYWxpemVkU3RyaW5nc0pzb24gPSBzdHJpbmdKc29uTWFwQnlMb2NhbGVbbG9jYWxlXTtcbiAgICByZXR1cm4gbG9jYWxpemVkU3RyaW5nc0pzb25bc3RyaW5nS2V5XTtcbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX3JlY2VpdmVNZXNzYWdlID0gZnVuY3Rpb24oZXZ0KSB7XG4gIGNvbnNvbGUubG9nKFwiUmVjZWl2ZWQgbWVzc2FnZSFcIik7XG5cbiAgdmFyIHdkYyA9IHRoaXMuZ2xvYmFsT2JqLl93ZGM7XG4gIGlmICghd2RjKSB7XG4gICAgdGhyb3cgXCJObyBXREMgcmVnaXN0ZXJlZC4gRGlkIHlvdSBmb3JnZXQgdG8gY2FsbCB0YWJsZWF1LnJlZ2lzdGVyQ29ubmVjdG9yP1wiO1xuICB9XG5cbiAgdmFyIHBheWxvYWRPYmogPSB0aGlzLl9nZXRQYXlsb2FkT2JqKGV2dC5kYXRhKTtcbiAgaWYoIXBheWxvYWRPYmopIHJldHVybjsgLy8gVGhpcyBtZXNzYWdlIGlzIG5vdCBuZWVkZWQgZm9yIFdEQ1xuXG4gIGlmICghdGhpcy5fc291cmNlV2luZG93KSB7XG4gICAgdGhpcy5fc291cmNlV2luZG93ID0gZXZ0LnNvdXJjZTtcbiAgICB0aGlzLl9zb3VyY2VPcmlnaW4gPSBldnQub3JpZ2luO1xuICB9XG5cbiAgdmFyIG1zZ0RhdGEgPSBwYXlsb2FkT2JqLm1zZ0RhdGE7XG4gIHRoaXMuX2FwcGx5UHJvcGVydHlWYWx1ZXMocGF5bG9hZE9iai5wcm9wcyk7XG5cbiAgc3dpdGNoKHBheWxvYWRPYmoubXNnTmFtZSkge1xuICAgIGNhc2UgXCJpbml0XCI6XG4gICAgICAvLyBXYXJuIHVzZXJzIGFib3V0IHBvc3NpYmxlIHBoaW5pc2hpbmcgYXR0YWNrc1xuICAgICAgdmFyIGNvbmZpcm1SZXN1bHQgPSB0aGlzLl9nZXRXZWJTZWN1cml0eVdhcm5pbmdDb25maXJtKCk7XG4gICAgICBpZiAoIWNvbmZpcm1SZXN1bHQpIHtcbiAgICAgICAgd2luZG93LmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmdsb2JhbE9iai50YWJsZWF1LnBoYXNlID0gbXNnRGF0YS5waGFzZTtcbiAgICAgICAgdGhpcy5nbG9iYWxPYmouX3RhYmxlYXUudHJpZ2dlckluaXRpYWxpemF0aW9uKCk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzaHV0ZG93blwiOlxuICAgICAgdGhpcy5nbG9iYWxPYmouX3RhYmxlYXUudHJpZ2dlclNodXRkb3duKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiZ2V0U2NoZW1hXCI6XG4gICAgICB0aGlzLmdsb2JhbE9iai5fdGFibGVhdS50cmlnZ2VyU2NoZW1hR2F0aGVyaW5nKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiZ2V0RGF0YVwiOlxuICAgICAgdGhpcy5nbG9iYWxPYmouX3RhYmxlYXUudHJpZ2dlckRhdGFHYXRoZXJpbmcobXNnRGF0YS50YWJsZXNBbmRJbmNyZW1lbnRWYWx1ZXMpO1xuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cbi8qKioqIFBVQkxJQyBJTlRFUkZBQ0UgKioqKiovXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5faW5pdFB1YmxpY0ludGVyZmFjZSA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZyhcIkluaXRpYWxpemluZyBwdWJsaWMgaW50ZXJmYWNlXCIpO1xuICB0aGlzLl9zdWJtaXRDYWxsZWQgPSBmYWxzZTtcblxuICB2YXIgcHVibGljSW50ZXJmYWNlID0ge307XG4gIHB1YmxpY0ludGVyZmFjZS5hYm9ydEZvckF1dGggPSB0aGlzLl9hYm9ydEZvckF1dGguYmluZCh0aGlzKTtcbiAgcHVibGljSW50ZXJmYWNlLmFib3J0V2l0aEVycm9yID0gdGhpcy5fYWJvcnRXaXRoRXJyb3IuYmluZCh0aGlzKTtcbiAgcHVibGljSW50ZXJmYWNlLmFkZENyb3NzT3JpZ2luRXhjZXB0aW9uID0gdGhpcy5fYWRkQ3Jvc3NPcmlnaW5FeGNlcHRpb24uYmluZCh0aGlzKTtcbiAgcHVibGljSW50ZXJmYWNlLmxvZyA9IHRoaXMuX2xvZy5iaW5kKHRoaXMpO1xuICBwdWJsaWNJbnRlcmZhY2UucmVwb3J0UHJvZ3Jlc3MgPSB0aGlzLl9yZXBvcnRQcm9ncmVzcy5iaW5kKHRoaXMpO1xuICBwdWJsaWNJbnRlcmZhY2Uuc3VibWl0ID0gdGhpcy5fc3VibWl0LmJpbmQodGhpcyk7XG5cbiAgLy8gQXNzaWduIHRoZSBwdWJsaWMgaW50ZXJmYWNlIHRvIHRoaXNcbiAgdGhpcy5wdWJsaWNJbnRlcmZhY2UgPSBwdWJsaWNJbnRlcmZhY2U7XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9hYm9ydEZvckF1dGggPSBmdW5jdGlvbihtc2cpIHtcbiAgdGhpcy5fc2VuZE1lc3NhZ2UoXCJhYm9ydEZvckF1dGhcIiwge1wibXNnXCI6IG1zZ30pO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5fYWJvcnRXaXRoRXJyb3IgPSBmdW5jdGlvbihtc2cpIHtcbiAgdGhpcy5fc2VuZE1lc3NhZ2UoXCJhYm9ydFdpdGhFcnJvclwiLCB7XCJlcnJvck1zZ1wiOiBtc2d9KTtcbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX2FkZENyb3NzT3JpZ2luRXhjZXB0aW9uID0gZnVuY3Rpb24oZGVzdE9yaWdpbkxpc3QpIHtcbiAgLy8gRG9uJ3QgYm90aGVyIHBhc3NpbmcgdGhpcyBiYWNrIHRvIHRoZSBzaW11bGF0b3Igc2luY2UgdGhlcmUncyBub3RoaW5nIGl0IGNhblxuICAvLyBkby4gSnVzdCBjYWxsIGJhY2sgdG8gdGhlIFdEQyBpbmRpY2F0aW5nIHRoYXQgaXQgd29ya2VkXG4gIGNvbnNvbGUubG9nKFwiQ3Jvc3MgT3JpZ2luIEV4Y2VwdGlvbiByZXF1ZXN0ZWQgaW4gdGhlIHNpbXVsYXRvci4gUHJldGVuZGluZyB0byB3b3JrLlwiKVxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2xvYmFsT2JqLl93ZGMuYWRkQ3Jvc3NPcmlnaW5FeGNlcHRpb25Db21wbGV0ZWQoZGVzdE9yaWdpbkxpc3QpO1xuICB9LmJpbmQodGhpcyksIDApO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5fbG9nID0gZnVuY3Rpb24obXNnKSB7XG4gIHRoaXMuX3NlbmRNZXNzYWdlKFwibG9nXCIsIHtcImxvZ01zZ1wiOiBtc2d9KTtcbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX3JlcG9ydFByb2dyZXNzID0gZnVuY3Rpb24obXNnKSB7XG4gIHRoaXMuX3NlbmRNZXNzYWdlKFwicmVwb3J0UHJvZ3Jlc3NcIiwge1wicHJvZ3Jlc3NNc2dcIjogbXNnfSk7XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9zdWJtaXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fc2VuZE1lc3NhZ2UoXCJzdWJtaXRcIik7XG59O1xuXG4vKioqKiBQUklWQVRFIElOVEVSRkFDRSAqKioqKi9cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9pbml0UHJpdmF0ZUludGVyZmFjZSA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZyhcIkluaXRpYWxpemluZyBwcml2YXRlIGludGVyZmFjZVwiKTtcblxuICB2YXIgcHJpdmF0ZUludGVyZmFjZSA9IHt9O1xuICBwcml2YXRlSW50ZXJmYWNlLl9pbml0Q2FsbGJhY2sgPSB0aGlzLl9pbml0Q2FsbGJhY2suYmluZCh0aGlzKTtcbiAgcHJpdmF0ZUludGVyZmFjZS5fc2h1dGRvd25DYWxsYmFjayA9IHRoaXMuX3NodXRkb3duQ2FsbGJhY2suYmluZCh0aGlzKTtcbiAgcHJpdmF0ZUludGVyZmFjZS5fc2NoZW1hQ2FsbGJhY2sgPSB0aGlzLl9zY2hlbWFDYWxsYmFjay5iaW5kKHRoaXMpO1xuICBwcml2YXRlSW50ZXJmYWNlLl90YWJsZURhdGFDYWxsYmFjayA9IHRoaXMuX3RhYmxlRGF0YUNhbGxiYWNrLmJpbmQodGhpcyk7XG4gIHByaXZhdGVJbnRlcmZhY2UuX2RhdGFEb25lQ2FsbGJhY2sgPSB0aGlzLl9kYXRhRG9uZUNhbGxiYWNrLmJpbmQodGhpcyk7XG5cbiAgLy8gQXNzaWduIHRoZSBwcml2YXRlIGludGVyZmFjZSB0byB0aGlzXG4gIHRoaXMucHJpdmF0ZUludGVyZmFjZSA9IHByaXZhdGVJbnRlcmZhY2U7XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9pbml0Q2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fc2VuZE1lc3NhZ2UoXCJpbml0Q2FsbGJhY2tcIik7XG59XG5cblNpbXVsYXRvckRpc3BhdGNoZXIucHJvdG90eXBlLl9zaHV0ZG93bkNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3NlbmRNZXNzYWdlKFwic2h1dGRvd25DYWxsYmFja1wiKTtcbn1cblxuU2ltdWxhdG9yRGlzcGF0Y2hlci5wcm90b3R5cGUuX3NjaGVtYUNhbGxiYWNrID0gZnVuY3Rpb24oc2NoZW1hLCBzdGFuZGFyZENvbm5lY3Rpb25zKSB7XG4gIHRoaXMuX3NlbmRNZXNzYWdlKFwiX3NjaGVtYUNhbGxiYWNrXCIsIHtcInNjaGVtYVwiOiBzY2hlbWEsIFwic3RhbmRhcmRDb25uZWN0aW9uc1wiIDogc3RhbmRhcmRDb25uZWN0aW9ucyB8fCBbXX0pO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5fdGFibGVEYXRhQ2FsbGJhY2sgPSBmdW5jdGlvbih0YWJsZU5hbWUsIGRhdGEpIHtcbiAgdGhpcy5fc2VuZE1lc3NhZ2UoXCJfdGFibGVEYXRhQ2FsbGJhY2tcIiwgeyBcInRhYmxlTmFtZVwiOiB0YWJsZU5hbWUsIFwiZGF0YVwiOiBkYXRhIH0pO1xufVxuXG5TaW11bGF0b3JEaXNwYXRjaGVyLnByb3RvdHlwZS5fZGF0YURvbmVDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9zZW5kTWVzc2FnZShcIl9kYXRhRG9uZUNhbGxiYWNrXCIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXVsYXRvckRpc3BhdGNoZXI7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vU2ltdWxhdG9yRGlzcGF0Y2hlci5qc1xuICoqIG1vZHVsZSBpZCA9IDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKlxuKiBAY2xhc3MgUmVwcmVzZW50cyBhIHNpbmdsZSB0YWJsZSB3aGljaCBUYWJsZWF1IGhhcyByZXF1ZXN0ZWRcbiogQHBhcmFtIHRhYmxlSW5mbyB7T2JqZWN0fSAtIEluZm9ybWF0aW9uIGFib3V0IHRoZSB0YWJsZVxuKiBAcGFyYW0gaW5jcmVtZW50VmFsdWUge3N0cmluZz19IC0gSW5jcmVtZW50YWwgdXBkYXRlIHZhbHVlXG4qL1xuZnVuY3Rpb24gVGFibGUodGFibGVJbmZvLCBpbmNyZW1lbnRWYWx1ZSwgZGF0YUNhbGxiYWNrRm4pIHtcbiAgLyoqIEBtZW1iZXIge09iamVjdH0gSW5mb3JtYXRpb24gYWJvdXQgdGhlIHRhYmxlIHdoaWNoIGhhcyBiZWVuIHJlcXVlc3RlZC4gVGhpcyBpc1xuICBndWFyYW50ZWVkIHRvIGJlIG9uZSBvZiB0aGUgdGFibGVzIHRoZSBjb25uZWN0b3IgcmV0dXJuZWQgaW4gdGhlIGNhbGwgdG8gZ2V0U2NoZW1hLiAqL1xuICB0aGlzLnRhYmxlSW5mbyA9IHRhYmxlSW5mbztcblxuICAvKiogQG1lbWJlciB7c3RyaW5nfSBEZWZpbmVzIHRoZSBpbmNyZW1lbnRhbCB1cGRhdGUgdmFsdWUgZm9yIHRoaXMgdGFibGUuIEVtcHR5IHN0cmluZyBpZlxuICB0aGVyZSBpcyBub3QgYW4gaW5jcmVtZW50YWwgdXBkYXRlIHJlcXVlc3RlZC4gKi9cbiAgdGhpcy5pbmNyZW1lbnRWYWx1ZSA9IGluY3JlbWVudFZhbHVlIHx8IFwiXCI7XG5cbiAgLyoqIEBwcml2YXRlICovXG4gIHRoaXMuX2RhdGFDYWxsYmFja0ZuID0gZGF0YUNhbGxiYWNrRm47XG5cbiAgLy8gYmluZCB0aGUgcHVibGljIGZhY2luZyB2ZXJzaW9uIG9mIHRoaXMgZnVuY3Rpb24gc28gaXQgY2FuIGJlIHBhc3NlZCBhcm91bmRcbiAgdGhpcy5hcHBlbmRSb3dzID0gdGhpcy5fYXBwZW5kUm93cy5iaW5kKHRoaXMpO1xufVxuXG4vKipcbiogQG1ldGhvZCBhcHBlbmRzIHRoZSBnaXZlbiByb3dzIHRvIHRoZSBzZXQgb2YgZGF0YSBjb250YWluZWQgaW4gdGhpcyB0YWJsZVxuKiBAcGFyYW0gZGF0YSB7YXJyYXl9IC0gRWl0aGVyIGFuIGFycmF5IG9mIGFycmF5cyBvciBhbiBhcnJheSBvZiBvYmplY3RzIHdoaWNoIHJlcHJlc2VudFxuKiB0aGUgaW5kaXZpZHVhbCByb3dzIG9mIGRhdGEgdG8gYXBwZW5kIHRvIHRoaXMgdGFibGVcbiovXG5UYWJsZS5wcm90b3R5cGUuX2FwcGVuZFJvd3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gIC8vIERvIHNvbWUgcXVpY2sgdmFsaWRhdGlvbiB0aGF0IHRoaXMgZGF0YSBpcyB0aGUgZm9ybWF0IHdlIGV4cGVjdFxuICBpZiAoIWRhdGEpIHtcbiAgICBjb25zb2xlLndhcm4oXCJyb3dzIGRhdGEgaXMgbnVsbCBvciB1bmRlZmluZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgLy8gTG9nIGEgd2FybmluZyBiZWNhdXNlIHRoZSBkYXRhIGlzIG5vdCBhbiBhcnJheSBsaWtlIHdlIGV4cGVjdGVkXG4gICAgY29uc29sZS53YXJuKFwiVGFibGUuYXBwZW5kUm93cyBtdXN0IHRha2UgYW4gYXJyYXkgb2YgYXJyYXlzIG9yIGFycmF5IG9mIG9iamVjdHNcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gQ2FsbCBiYWNrIHdpdGggdGhlIHJvd3MgZm9yIHRoaXMgdGFibGVcbiAgdGhpcy5fZGF0YUNhbGxiYWNrRm4odGhpcy50YWJsZUluZm8uaWQsIGRhdGEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYmxlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL1RhYmxlLmpzXG4gKiogbW9kdWxlIGlkID0gNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiZnVuY3Rpb24gY29weUZ1bmN0aW9ucyhzcmMsIGRlc3QpIHtcbiAgZm9yKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgaWYgKHR5cGVvZiBzcmNba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZGVzdFtrZXldID0gc3JjW2tleV07XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLmNvcHlGdW5jdGlvbnMgPSBjb3B5RnVuY3Rpb25zO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL1V0aWxpdGllcy5qc1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qXHJcbiAqIENvb2tpZXMuanMgLSAxLjIuM1xyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vU2NvdHRIYW1wZXIvQ29va2llc1xyXG4gKlxyXG4gKiBUaGlzIGlzIGZyZWUgYW5kIHVuZW5jdW1iZXJlZCBzb2Z0d2FyZSByZWxlYXNlZCBpbnRvIHRoZSBwdWJsaWMgZG9tYWluLlxyXG4gKi9cclxuKGZ1bmN0aW9uIChnbG9iYWwsIHVuZGVmaW5lZCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBmYWN0b3J5ID0gZnVuY3Rpb24gKHdpbmRvdykge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmRvY3VtZW50ICE9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nvb2tpZXMuanMgcmVxdWlyZXMgYSBgd2luZG93YCB3aXRoIGEgYGRvY3VtZW50YCBvYmplY3QnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBDb29raWVzID0gZnVuY3Rpb24gKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgP1xyXG4gICAgICAgICAgICAgICAgQ29va2llcy5nZXQoa2V5KSA6IENvb2tpZXMuc2V0KGtleSwgdmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEFsbG93cyBmb3Igc2V0dGVyIGluamVjdGlvbiBpbiB1bml0IHRlc3RzXHJcbiAgICAgICAgQ29va2llcy5fZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XHJcblxyXG4gICAgICAgIC8vIFVzZWQgdG8gZW5zdXJlIGNvb2tpZSBrZXlzIGRvIG5vdCBjb2xsaWRlIHdpdGhcclxuICAgICAgICAvLyBidWlsdC1pbiBgT2JqZWN0YCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgQ29va2llcy5fY2FjaGVLZXlQcmVmaXggPSAnY29va2V5Lic7IC8vIEh1cnIgaHVyciwgOilcclxuICAgICAgICBcclxuICAgICAgICBDb29raWVzLl9tYXhFeHBpcmVEYXRlID0gbmV3IERhdGUoJ0ZyaSwgMzEgRGVjIDk5OTkgMjM6NTk6NTkgVVRDJyk7XHJcblxyXG4gICAgICAgIENvb2tpZXMuZGVmYXVsdHMgPSB7XHJcbiAgICAgICAgICAgIHBhdGg6ICcvJyxcclxuICAgICAgICAgICAgc2VjdXJlOiBmYWxzZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIENvb2tpZXMuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICBpZiAoQ29va2llcy5fY2FjaGVkRG9jdW1lbnRDb29raWUgIT09IENvb2tpZXMuX2RvY3VtZW50LmNvb2tpZSkge1xyXG4gICAgICAgICAgICAgICAgQ29va2llcy5fcmVuZXdDYWNoZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBDb29raWVzLl9jYWNoZVtDb29raWVzLl9jYWNoZUtleVByZWZpeCArIGtleV07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgQ29va2llcy5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvcHRpb25zID0gQ29va2llcy5fZ2V0RXh0ZW5kZWRPcHRpb25zKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBvcHRpb25zLmV4cGlyZXMgPSBDb29raWVzLl9nZXRFeHBpcmVzRGF0ZSh2YWx1ZSA9PT0gdW5kZWZpbmVkID8gLTEgOiBvcHRpb25zLmV4cGlyZXMpO1xyXG5cclxuICAgICAgICAgICAgQ29va2llcy5fZG9jdW1lbnQuY29va2llID0gQ29va2llcy5fZ2VuZXJhdGVDb29raWVTdHJpbmcoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gQ29va2llcztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBDb29raWVzLmV4cGlyZSA9IGZ1bmN0aW9uIChrZXksIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIENvb2tpZXMuc2V0KGtleSwgdW5kZWZpbmVkLCBvcHRpb25zKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBDb29raWVzLl9nZXRFeHRlbmRlZE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgcGF0aDogb3B0aW9ucyAmJiBvcHRpb25zLnBhdGggfHwgQ29va2llcy5kZWZhdWx0cy5wYXRoLFxyXG4gICAgICAgICAgICAgICAgZG9tYWluOiBvcHRpb25zICYmIG9wdGlvbnMuZG9tYWluIHx8IENvb2tpZXMuZGVmYXVsdHMuZG9tYWluLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJlczogb3B0aW9ucyAmJiBvcHRpb25zLmV4cGlyZXMgfHwgQ29va2llcy5kZWZhdWx0cy5leHBpcmVzLFxyXG4gICAgICAgICAgICAgICAgc2VjdXJlOiBvcHRpb25zICYmIG9wdGlvbnMuc2VjdXJlICE9PSB1bmRlZmluZWQgPyAgb3B0aW9ucy5zZWN1cmUgOiBDb29raWVzLmRlZmF1bHRzLnNlY3VyZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIENvb2tpZXMuX2lzVmFsaWREYXRlID0gZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRlKSA9PT0gJ1tvYmplY3QgRGF0ZV0nICYmICFpc05hTihkYXRlLmdldFRpbWUoKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgQ29va2llcy5fZ2V0RXhwaXJlc0RhdGUgPSBmdW5jdGlvbiAoZXhwaXJlcywgbm93KSB7XHJcbiAgICAgICAgICAgIG5vdyA9IG5vdyB8fCBuZXcgRGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHBpcmVzID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgZXhwaXJlcyA9IGV4cGlyZXMgPT09IEluZmluaXR5ID9cclxuICAgICAgICAgICAgICAgICAgICBDb29raWVzLl9tYXhFeHBpcmVEYXRlIDogbmV3IERhdGUobm93LmdldFRpbWUoKSArIGV4cGlyZXMgKiAxMDAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwaXJlcyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIGV4cGlyZXMgPSBuZXcgRGF0ZShleHBpcmVzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGV4cGlyZXMgJiYgIUNvb2tpZXMuX2lzVmFsaWREYXRlKGV4cGlyZXMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BleHBpcmVzYCBwYXJhbWV0ZXIgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBhIHZhbGlkIERhdGUgaW5zdGFuY2UnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGV4cGlyZXM7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgQ29va2llcy5fZ2VuZXJhdGVDb29raWVTdHJpbmcgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICBrZXkgPSBrZXkucmVwbGFjZSgvW14jJCYrXFxeYHxdL2csIGVuY29kZVVSSUNvbXBvbmVudCk7XHJcbiAgICAgICAgICAgIGtleSA9IGtleS5yZXBsYWNlKC9cXCgvZywgJyUyOCcpLnJlcGxhY2UoL1xcKS9nLCAnJTI5Jyk7XHJcbiAgICAgICAgICAgIHZhbHVlID0gKHZhbHVlICsgJycpLnJlcGxhY2UoL1teISMkJi0rXFwtLTo8LVxcW1xcXS1+XS9nLCBlbmNvZGVVUklDb21wb25lbnQpO1xyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIHZhciBjb29raWVTdHJpbmcgPSBrZXkgKyAnPScgKyB2YWx1ZTtcclxuICAgICAgICAgICAgY29va2llU3RyaW5nICs9IG9wdGlvbnMucGF0aCA/ICc7cGF0aD0nICsgb3B0aW9ucy5wYXRoIDogJyc7XHJcbiAgICAgICAgICAgIGNvb2tpZVN0cmluZyArPSBvcHRpb25zLmRvbWFpbiA/ICc7ZG9tYWluPScgKyBvcHRpb25zLmRvbWFpbiA6ICcnO1xyXG4gICAgICAgICAgICBjb29raWVTdHJpbmcgKz0gb3B0aW9ucy5leHBpcmVzID8gJztleHBpcmVzPScgKyBvcHRpb25zLmV4cGlyZXMudG9VVENTdHJpbmcoKSA6ICcnO1xyXG4gICAgICAgICAgICBjb29raWVTdHJpbmcgKz0gb3B0aW9ucy5zZWN1cmUgPyAnO3NlY3VyZScgOiAnJztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb29raWVTdHJpbmc7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgQ29va2llcy5fZ2V0Q2FjaGVGcm9tU3RyaW5nID0gZnVuY3Rpb24gKGRvY3VtZW50Q29va2llKSB7XHJcbiAgICAgICAgICAgIHZhciBjb29raWVDYWNoZSA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgY29va2llc0FycmF5ID0gZG9jdW1lbnRDb29raWUgPyBkb2N1bWVudENvb2tpZS5zcGxpdCgnOyAnKSA6IFtdO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29raWVzQXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb29raWVLdnAgPSBDb29raWVzLl9nZXRLZXlWYWx1ZVBhaXJGcm9tQ29va2llU3RyaW5nKGNvb2tpZXNBcnJheVtpXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvb2tpZUNhY2hlW0Nvb2tpZXMuX2NhY2hlS2V5UHJlZml4ICsgY29va2llS3ZwLmtleV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvb2tpZUNhY2hlW0Nvb2tpZXMuX2NhY2hlS2V5UHJlZml4ICsgY29va2llS3ZwLmtleV0gPSBjb29raWVLdnAudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb29raWVDYWNoZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBDb29raWVzLl9nZXRLZXlWYWx1ZVBhaXJGcm9tQ29va2llU3RyaW5nID0gZnVuY3Rpb24gKGNvb2tpZVN0cmluZykge1xyXG4gICAgICAgICAgICAvLyBcIj1cIiBpcyBhIHZhbGlkIGNoYXJhY3RlciBpbiBhIGNvb2tpZSB2YWx1ZSBhY2NvcmRpbmcgdG8gUkZDNjI2NSwgc28gY2Fubm90IGBzcGxpdCgnPScpYFxyXG4gICAgICAgICAgICB2YXIgc2VwYXJhdG9ySW5kZXggPSBjb29raWVTdHJpbmcuaW5kZXhPZignPScpO1xyXG5cclxuICAgICAgICAgICAgLy8gSUUgb21pdHMgdGhlIFwiPVwiIHdoZW4gdGhlIGNvb2tpZSB2YWx1ZSBpcyBhbiBlbXB0eSBzdHJpbmdcclxuICAgICAgICAgICAgc2VwYXJhdG9ySW5kZXggPSBzZXBhcmF0b3JJbmRleCA8IDAgPyBjb29raWVTdHJpbmcubGVuZ3RoIDogc2VwYXJhdG9ySW5kZXg7XHJcblxyXG4gICAgICAgICAgICB2YXIga2V5ID0gY29va2llU3RyaW5nLnN1YnN0cigwLCBzZXBhcmF0b3JJbmRleCk7XHJcbiAgICAgICAgICAgIHZhciBkZWNvZGVkS2V5O1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZGVjb2RlZEtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkIG5vdCBkZWNvZGUgY29va2llIHdpdGgga2V5IFwiJyArIGtleSArICdcIicsIGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAga2V5OiBkZWNvZGVkS2V5LFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGNvb2tpZVN0cmluZy5zdWJzdHIoc2VwYXJhdG9ySW5kZXggKyAxKSAvLyBEZWZlciBkZWNvZGluZyB2YWx1ZSB1bnRpbCBhY2Nlc3NlZFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIENvb2tpZXMuX3JlbmV3Q2FjaGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIENvb2tpZXMuX2NhY2hlID0gQ29va2llcy5fZ2V0Q2FjaGVGcm9tU3RyaW5nKENvb2tpZXMuX2RvY3VtZW50LmNvb2tpZSk7XHJcbiAgICAgICAgICAgIENvb2tpZXMuX2NhY2hlZERvY3VtZW50Q29va2llID0gQ29va2llcy5fZG9jdW1lbnQuY29va2llO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIENvb2tpZXMuX2FyZUVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXN0S2V5ID0gJ2Nvb2tpZXMuanMnO1xyXG4gICAgICAgICAgICB2YXIgYXJlRW5hYmxlZCA9IENvb2tpZXMuc2V0KHRlc3RLZXksIDEpLmdldCh0ZXN0S2V5KSA9PT0gJzEnO1xyXG4gICAgICAgICAgICBDb29raWVzLmV4cGlyZSh0ZXN0S2V5KTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZUVuYWJsZWQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgQ29va2llcy5lbmFibGVkID0gQ29va2llcy5fYXJlRW5hYmxlZCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gQ29va2llcztcclxuICAgIH07XHJcbiAgICB2YXIgY29va2llc0V4cG9ydCA9IChnbG9iYWwgJiYgdHlwZW9mIGdsb2JhbC5kb2N1bWVudCA9PT0gJ29iamVjdCcpID8gZmFjdG9yeShnbG9iYWwpIDogZmFjdG9yeTtcclxuXHJcbiAgICAvLyBBTUQgc3VwcG9ydFxyXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBjb29raWVzRXhwb3J0OyB9KTtcclxuICAgIC8vIENvbW1vbkpTL05vZGUuanMgc3VwcG9ydFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAvLyBTdXBwb3J0IE5vZGUuanMgc3BlY2lmaWMgYG1vZHVsZS5leHBvcnRzYCAod2hpY2ggY2FuIGJlIGEgZnVuY3Rpb24pXHJcbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gY29va2llc0V4cG9ydDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQnV0IGFsd2F5cyBzdXBwb3J0IENvbW1vbkpTIG1vZHVsZSAxLjEuMSBzcGVjIChgZXhwb3J0c2AgY2Fubm90IGJlIGEgZnVuY3Rpb24pXHJcbiAgICAgICAgZXhwb3J0cy5Db29raWVzID0gY29va2llc0V4cG9ydDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZ2xvYmFsLkNvb2tpZXMgPSBjb29raWVzRXhwb3J0O1xyXG4gICAgfVxyXG59KSh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IHRoaXMgOiB3aW5kb3cpO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2Nvb2tpZXMtanMvZGlzdC9jb29raWVzLmpzXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFwid2ViU2VjdXJpdHlXYXJuaW5nXCI6IFwiVG8gaGVscCBwcmV2ZW50IG1hbGljaW91cyBzaXRlcyBmcm9tIGdldHRpbmcgYWNjZXNzIHRvIHlvdXIgY29uZmlkZW50aWFsIGRhdGEsIGNvbmZpcm0gdGhhdCB5b3UgdHJ1c3QgdGhlIGZvbGxvd2luZyBzaXRlOlwiXG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2pzb24tbG9hZGVyIS4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19kZS1ERS5qc29uXG4gKiogbW9kdWxlIGlkID0gOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFwid2ViU2VjdXJpdHlXYXJuaW5nXCI6IFwiVG8gaGVscCBwcmV2ZW50IG1hbGljaW91cyBzaXRlcyBmcm9tIGdldHRpbmcgYWNjZXNzIHRvIHlvdXIgY29uZmlkZW50aWFsIGRhdGEsIGNvbmZpcm0gdGhhdCB5b3UgdHJ1c3QgdGhlIGZvbGxvd2luZyBzaXRlOlwiXG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2pzb24tbG9hZGVyIS4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19lbi1VUy5qc29uXG4gKiogbW9kdWxlIGlkID0gMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRcIndlYlNlY3VyaXR5V2FybmluZ1wiOiBcIlRvIGhlbHAgcHJldmVudCBtYWxpY2lvdXMgc2l0ZXMgZnJvbSBnZXR0aW5nIGFjY2VzcyB0byB5b3VyIGNvbmZpZGVudGlhbCBkYXRhLCBjb25maXJtIHRoYXQgeW91IHRydXN0IHRoZSBmb2xsb3dpbmcgc2l0ZTpcIlxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9qc29uLWxvYWRlciEuL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfZXMtRVMuanNvblxuICoqIG1vZHVsZSBpZCA9IDExXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0XCJ3ZWJTZWN1cml0eVdhcm5pbmdcIjogXCJUbyBoZWxwIHByZXZlbnQgbWFsaWNpb3VzIHNpdGVzIGZyb20gZ2V0dGluZyBhY2Nlc3MgdG8geW91ciBjb25maWRlbnRpYWwgZGF0YSwgY29uZmlybSB0aGF0IHlvdSB0cnVzdCB0aGUgZm9sbG93aW5nIHNpdGU6XCJcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vanNvbi1sb2FkZXIhLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX2ZyLUZSLmpzb25cbiAqKiBtb2R1bGUgaWQgPSAxMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFwid2ViU2VjdXJpdHlXYXJuaW5nXCI6IFwiVG8gaGVscCBwcmV2ZW50IG1hbGljaW91cyBzaXRlcyBmcm9tIGdldHRpbmcgYWNjZXNzIHRvIHlvdXIgY29uZmlkZW50aWFsIGRhdGEsIGNvbmZpcm0gdGhhdCB5b3UgdHJ1c3QgdGhlIGZvbGxvd2luZyBzaXRlOlwiXG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2pzb24tbG9hZGVyIS4vcmVzb3VyY2VzL1NoaW1fbGliX3Jlc291cmNlc19qYS1KUC5qc29uXG4gKiogbW9kdWxlIGlkID0gMTNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRcIndlYlNlY3VyaXR5V2FybmluZ1wiOiBcIlRvIGhlbHAgcHJldmVudCBtYWxpY2lvdXMgc2l0ZXMgZnJvbSBnZXR0aW5nIGFjY2VzcyB0byB5b3VyIGNvbmZpZGVudGlhbCBkYXRhLCBjb25maXJtIHRoYXQgeW91IHRydXN0IHRoZSBmb2xsb3dpbmcgc2l0ZTpcIlxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9qc29uLWxvYWRlciEuL3Jlc291cmNlcy9TaGltX2xpYl9yZXNvdXJjZXNfa28tS1IuanNvblxuICoqIG1vZHVsZSBpZCA9IDE0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0XCJ3ZWJTZWN1cml0eVdhcm5pbmdcIjogXCJUbyBoZWxwIHByZXZlbnQgbWFsaWNpb3VzIHNpdGVzIGZyb20gZ2V0dGluZyBhY2Nlc3MgdG8geW91ciBjb25maWRlbnRpYWwgZGF0YSwgY29uZmlybSB0aGF0IHlvdSB0cnVzdCB0aGUgZm9sbG93aW5nIHNpdGU6XCJcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vanNvbi1sb2FkZXIhLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX3B0LUJSLmpzb25cbiAqKiBtb2R1bGUgaWQgPSAxNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFwid2ViU2VjdXJpdHlXYXJuaW5nXCI6IFwid3dUbyBoZWxwIHByZXZlbnQgbWFsaWNpb3VzIHNpdGVzIGZyb20gZ2V0dGluZyBhY2Nlc3MgdG8geW91ciBjb25maWRlbnRpYWwgZGF0YSwgY29uZmlybSB0aGF0IHlvdSB0cnVzdCB0aGUgZm9sbG93aW5nIHNpdGU6XCJcbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vanNvbi1sb2FkZXIhLi9yZXNvdXJjZXMvU2hpbV9saWJfcmVzb3VyY2VzX3poLUNOLmpzb25cbiAqKiBtb2R1bGUgaWQgPSAxNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyohXG4gKiBqc1VyaVxuICogaHR0cHM6Ly9naXRodWIuY29tL2RlcmVrLXdhdHNvbi9qc1VyaVxuICpcbiAqIENvcHlyaWdodCAyMDEzLCBEZXJlayBXYXRzb25cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqXG4gKiBJbmNsdWRlcyBwYXJzZVVyaSByZWd1bGFyIGV4cHJlc3Npb25zXG4gKiBodHRwOi8vYmxvZy5zdGV2ZW5sZXZpdGhhbi5jb20vYXJjaGl2ZXMvcGFyc2V1cmlcbiAqIENvcHlyaWdodCAyMDA3LCBTdGV2ZW4gTGV2aXRoYW5cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4gLypnbG9iYWxzIGRlZmluZSwgbW9kdWxlICovXG5cbihmdW5jdGlvbihnbG9iYWwpIHtcblxuICB2YXIgcmUgPSB7XG4gICAgc3RhcnRzX3dpdGhfc2xhc2hlczogL15cXC8rLyxcbiAgICBlbmRzX3dpdGhfc2xhc2hlczogL1xcLyskLyxcbiAgICBwbHVzZXM6IC9cXCsvZyxcbiAgICBxdWVyeV9zZXBhcmF0b3I6IC9bJjtdLyxcbiAgICB1cmlfcGFyc2VyOiAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBcXC9dKikoPzo6KFteOkBdKikpPyk/QCk/KFxcW1swLTlhLWZBLUY6Ll0rXFxdfFteOlxcLz8jXSopKD86OihcXGQrfCg/PTopKSk/KDopPykoKCgoPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvXG4gIH07XG5cbiAgLyoqXG4gICAqIERlZmluZSBmb3JFYWNoIGZvciBvbGRlciBqcyBlbnZpcm9ubWVudHNcbiAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gjQ29tcGF0aWJpbGl0eVxuICAgKi9cbiAgaWYgKCFBcnJheS5wcm90b3R5cGUuZm9yRWFjaCkge1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHZhciBULCBrO1xuXG4gICAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJyB0aGlzIGlzIG51bGwgb3Igbm90IGRlZmluZWQnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIE8gPSBPYmplY3QodGhpcyk7XG4gICAgICB2YXIgbGVuID0gTy5sZW5ndGggPj4+IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGNhbGxiYWNrICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgVCA9IHRoaXNBcmc7XG4gICAgICB9XG5cbiAgICAgIGsgPSAwO1xuXG4gICAgICB3aGlsZSAoayA8IGxlbikge1xuICAgICAgICB2YXIga1ZhbHVlO1xuICAgICAgICBpZiAoayBpbiBPKSB7XG4gICAgICAgICAga1ZhbHVlID0gT1trXTtcbiAgICAgICAgICBjYWxsYmFjay5jYWxsKFQsIGtWYWx1ZSwgaywgTyk7XG4gICAgICAgIH1cbiAgICAgICAgaysrO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogdW5lc2NhcGUgYSBxdWVyeSBwYXJhbSB2YWx1ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHMgZW5jb2RlZCB2YWx1ZVxuICAgKiBAcmV0dXJuIHtzdHJpbmd9ICAgZGVjb2RlZCB2YWx1ZVxuICAgKi9cbiAgZnVuY3Rpb24gZGVjb2RlKHMpIHtcbiAgICBpZiAocykge1xuICAgICAgICBzID0gcy50b1N0cmluZygpLnJlcGxhY2UocmUucGx1c2VzLCAnJTIwJyk7XG4gICAgICAgIHMgPSBkZWNvZGVVUklDb21wb25lbnQocyk7XG4gICAgfVxuICAgIHJldHVybiBzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJyZWFrcyBhIHVyaSBzdHJpbmcgZG93biBpbnRvIGl0cyBpbmRpdmlkdWFsIHBhcnRzXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc3RyIHVyaVxuICAgKiBAcmV0dXJuIHtvYmplY3R9ICAgICBwYXJ0c1xuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VVcmkoc3RyKSB7XG4gICAgdmFyIHBhcnNlciA9IHJlLnVyaV9wYXJzZXI7XG4gICAgdmFyIHBhcnNlcktleXMgPSBbXCJzb3VyY2VcIiwgXCJwcm90b2NvbFwiLCBcImF1dGhvcml0eVwiLCBcInVzZXJJbmZvXCIsIFwidXNlclwiLCBcInBhc3N3b3JkXCIsIFwiaG9zdFwiLCBcInBvcnRcIiwgXCJpc0NvbG9uVXJpXCIsIFwicmVsYXRpdmVcIiwgXCJwYXRoXCIsIFwiZGlyZWN0b3J5XCIsIFwiZmlsZVwiLCBcInF1ZXJ5XCIsIFwiYW5jaG9yXCJdO1xuICAgIHZhciBtID0gcGFyc2VyLmV4ZWMoc3RyIHx8ICcnKTtcbiAgICB2YXIgcGFydHMgPSB7fTtcblxuICAgIHBhcnNlcktleXMuZm9yRWFjaChmdW5jdGlvbihrZXksIGkpIHtcbiAgICAgIHBhcnRzW2tleV0gPSBtW2ldIHx8ICcnO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJyZWFrcyBhIHF1ZXJ5IHN0cmluZyBkb3duIGludG8gYW4gYXJyYXkgb2Yga2V5L3ZhbHVlIHBhaXJzXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc3RyIHF1ZXJ5XG4gICAqIEByZXR1cm4ge2FycmF5fSAgICAgIGFycmF5IG9mIGFycmF5cyAoa2V5L3ZhbHVlIHBhaXJzKVxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VRdWVyeShzdHIpIHtcbiAgICB2YXIgaSwgcHMsIHAsIG4sIGssIHYsIGw7XG4gICAgdmFyIHBhaXJzID0gW107XG5cbiAgICBpZiAodHlwZW9mKHN0cikgPT09ICd1bmRlZmluZWQnIHx8IHN0ciA9PT0gbnVsbCB8fCBzdHIgPT09ICcnKSB7XG4gICAgICByZXR1cm4gcGFpcnM7XG4gICAgfVxuXG4gICAgaWYgKHN0ci5pbmRleE9mKCc/JykgPT09IDApIHtcbiAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMSk7XG4gICAgfVxuXG4gICAgcHMgPSBzdHIudG9TdHJpbmcoKS5zcGxpdChyZS5xdWVyeV9zZXBhcmF0b3IpO1xuXG4gICAgZm9yIChpID0gMCwgbCA9IHBzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcCA9IHBzW2ldO1xuICAgICAgbiA9IHAuaW5kZXhPZignPScpO1xuXG4gICAgICBpZiAobiAhPT0gMCkge1xuICAgICAgICBrID0gZGVjb2RlKHAuc3Vic3RyaW5nKDAsIG4pKTtcbiAgICAgICAgdiA9IGRlY29kZShwLnN1YnN0cmluZyhuICsgMSkpO1xuICAgICAgICBwYWlycy5wdXNoKG4gPT09IC0xID8gW3AsIG51bGxdIDogW2ssIHZdKTtcbiAgICAgIH1cblxuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBVcmkgb2JqZWN0XG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gICAqL1xuICBmdW5jdGlvbiBVcmkoc3RyKSB7XG4gICAgdGhpcy51cmlQYXJ0cyA9IHBhcnNlVXJpKHN0cik7XG4gICAgdGhpcy5xdWVyeVBhaXJzID0gcGFyc2VRdWVyeSh0aGlzLnVyaVBhcnRzLnF1ZXJ5KTtcbiAgICB0aGlzLmhhc0F1dGhvcml0eVByZWZpeFVzZXJQcmVmID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmUgZ2V0dGVyL3NldHRlciBtZXRob2RzXG4gICAqL1xuICBbJ3Byb3RvY29sJywgJ3VzZXJJbmZvJywgJ2hvc3QnLCAncG9ydCcsICdwYXRoJywgJ2FuY2hvciddLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgVXJpLnByb3RvdHlwZVtrZXldID0gZnVuY3Rpb24odmFsKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy51cmlQYXJ0c1trZXldID0gdmFsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudXJpUGFydHNba2V5XTtcbiAgICB9O1xuICB9KTtcblxuICAvKipcbiAgICogaWYgdGhlcmUgaXMgbm8gcHJvdG9jb2wsIHRoZSBsZWFkaW5nIC8vIGNhbiBiZSBlbmFibGVkIG9yIGRpc2FibGVkXG4gICAqIEBwYXJhbSAge0Jvb2xlYW59ICB2YWxcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIFVyaS5wcm90b3R5cGUuaGFzQXV0aG9yaXR5UHJlZml4ID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmhhc0F1dGhvcml0eVByZWZpeFVzZXJQcmVmID0gdmFsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0F1dGhvcml0eVByZWZpeFVzZXJQcmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gKHRoaXMudXJpUGFydHMuc291cmNlLmluZGV4T2YoJy8vJykgIT09IC0xKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuaGFzQXV0aG9yaXR5UHJlZml4VXNlclByZWY7XG4gICAgfVxuICB9O1xuXG4gIFVyaS5wcm90b3R5cGUuaXNDb2xvblVyaSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMudXJpUGFydHMuaXNDb2xvblVyaSA9ICEhdmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gISF0aGlzLnVyaVBhcnRzLmlzQ29sb25Vcmk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXJpYWxpemVzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgcXVlcnkgcGFpcnNcbiAgICogQHBhcmFtICB7c3RyaW5nfSBbdmFsXSAgIHNldCBhIG5ldyBxdWVyeSBzdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgIHF1ZXJ5IHN0cmluZ1xuICAgKi9cbiAgVXJpLnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uKHZhbCkge1xuICAgIHZhciBzID0gJycsIGksIHBhcmFtLCBsO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLnF1ZXJ5UGFpcnMgPSBwYXJzZVF1ZXJ5KHZhbCk7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMCwgbCA9IHRoaXMucXVlcnlQYWlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHBhcmFtID0gdGhpcy5xdWVyeVBhaXJzW2ldO1xuICAgICAgaWYgKHMubGVuZ3RoID4gMCkge1xuICAgICAgICBzICs9ICcmJztcbiAgICAgIH1cbiAgICAgIGlmIChwYXJhbVsxXSA9PT0gbnVsbCkge1xuICAgICAgICBzICs9IHBhcmFtWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyArPSBwYXJhbVswXTtcbiAgICAgICAgcyArPSAnPSc7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1bMV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcyArPSBlbmNvZGVVUklDb21wb25lbnQocGFyYW1bMV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzLmxlbmd0aCA+IDAgPyAnPycgKyBzIDogcztcbiAgfTtcblxuICAvKipcbiAgICogcmV0dXJucyB0aGUgZmlyc3QgcXVlcnkgcGFyYW0gdmFsdWUgZm91bmQgZm9yIHRoZSBrZXlcbiAgICogQHBhcmFtICB7c3RyaW5nfSBrZXkgcXVlcnkga2V5XG4gICAqIEByZXR1cm4ge3N0cmluZ30gICAgIGZpcnN0IHZhbHVlIGZvdW5kIGZvciBrZXlcbiAgICovXG4gIFVyaS5wcm90b3R5cGUuZ2V0UXVlcnlQYXJhbVZhbHVlID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBwYXJhbSwgaSwgbDtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5xdWVyeVBhaXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcGFyYW0gPSB0aGlzLnF1ZXJ5UGFpcnNbaV07XG4gICAgICBpZiAoa2V5ID09PSBwYXJhbVswXSkge1xuICAgICAgICByZXR1cm4gcGFyYW1bMV07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIHF1ZXJ5IHBhcmFtIHZhbHVlcyBmb3IgdGhlIGtleVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleSBxdWVyeSBrZXlcbiAgICogQHJldHVybiB7YXJyYXl9ICAgICAgYXJyYXkgb2YgdmFsdWVzXG4gICAqL1xuICBVcmkucHJvdG90eXBlLmdldFF1ZXJ5UGFyYW1WYWx1ZXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIGFyciA9IFtdLCBpLCBwYXJhbSwgbDtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5xdWVyeVBhaXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcGFyYW0gPSB0aGlzLnF1ZXJ5UGFpcnNbaV07XG4gICAgICBpZiAoa2V5ID09PSBwYXJhbVswXSkge1xuICAgICAgICBhcnIucHVzaChwYXJhbVsxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnI7XG4gIH07XG5cbiAgLyoqXG4gICAqIHJlbW92ZXMgcXVlcnkgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleSAgICAgcmVtb3ZlIHZhbHVlcyBmb3Iga2V5XG4gICAqIEBwYXJhbSAge3ZhbH0gICAgW3ZhbF0gICByZW1vdmUgYSBzcGVjaWZpYyB2YWx1ZSwgb3RoZXJ3aXNlIHJlbW92ZXMgYWxsXG4gICAqIEByZXR1cm4ge1VyaX0gICAgICAgICAgICByZXR1cm5zIHNlbGYgZm9yIGZsdWVudCBjaGFpbmluZ1xuICAgKi9cbiAgVXJpLnByb3RvdHlwZS5kZWxldGVRdWVyeVBhcmFtID0gZnVuY3Rpb24gKGtleSwgdmFsKSB7XG4gICAgdmFyIGFyciA9IFtdLCBpLCBwYXJhbSwga2V5TWF0Y2hlc0ZpbHRlciwgdmFsTWF0Y2hlc0ZpbHRlciwgbDtcblxuICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLnF1ZXJ5UGFpcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cbiAgICAgIHBhcmFtID0gdGhpcy5xdWVyeVBhaXJzW2ldO1xuICAgICAga2V5TWF0Y2hlc0ZpbHRlciA9IGRlY29kZShwYXJhbVswXSkgPT09IGRlY29kZShrZXkpO1xuICAgICAgdmFsTWF0Y2hlc0ZpbHRlciA9IHBhcmFtWzFdID09PSB2YWw7XG5cbiAgICAgIGlmICgoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiAha2V5TWF0Y2hlc0ZpbHRlcikgfHwgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgKCFrZXlNYXRjaGVzRmlsdGVyIHx8ICF2YWxNYXRjaGVzRmlsdGVyKSkpIHtcbiAgICAgICAgYXJyLnB1c2gocGFyYW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucXVlcnlQYWlycyA9IGFycjtcblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBhZGRzIGEgcXVlcnkgcGFyYW1ldGVyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIGtleSAgICAgICAgYWRkIHZhbHVlcyBmb3Iga2V5XG4gICAqIEBwYXJhbSAge3N0cmluZ30gIHZhbCAgICAgICAgdmFsdWUgdG8gYWRkXG4gICAqIEBwYXJhbSAge2ludGVnZXJ9IFtpbmRleF0gICAgc3BlY2lmaWMgaW5kZXggdG8gYWRkIHRoZSB2YWx1ZSBhdFxuICAgKiBAcmV0dXJuIHtVcml9ICAgICAgICAgICAgICAgIHJldHVybnMgc2VsZiBmb3IgZmx1ZW50IGNoYWluaW5nXG4gICAqL1xuICBVcmkucHJvdG90eXBlLmFkZFF1ZXJ5UGFyYW0gPSBmdW5jdGlvbiAoa2V5LCB2YWwsIGluZGV4KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgaW5kZXggIT09IC0xKSB7XG4gICAgICBpbmRleCA9IE1hdGgubWluKGluZGV4LCB0aGlzLnF1ZXJ5UGFpcnMubGVuZ3RoKTtcbiAgICAgIHRoaXMucXVlcnlQYWlycy5zcGxpY2UoaW5kZXgsIDAsIFtrZXksIHZhbF0pO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMucXVlcnlQYWlycy5wdXNoKFtrZXksIHZhbF0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogdGVzdCBmb3IgdGhlIGV4aXN0ZW5jZSBvZiBhIHF1ZXJ5IHBhcmFtZXRlclxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICBrZXkgICAgICAgIGFkZCB2YWx1ZXMgZm9yIGtleVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICB2YWwgICAgICAgIHZhbHVlIHRvIGFkZFxuICAgKiBAcGFyYW0gIHtpbnRlZ2VyfSBbaW5kZXhdICAgIHNwZWNpZmljIGluZGV4IHRvIGFkZCB0aGUgdmFsdWUgYXRcbiAgICogQHJldHVybiB7VXJpfSAgICAgICAgICAgICAgICByZXR1cm5zIHNlbGYgZm9yIGZsdWVudCBjaGFpbmluZ1xuICAgKi9cbiAgVXJpLnByb3RvdHlwZS5oYXNRdWVyeVBhcmFtID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBpLCBsZW4gPSB0aGlzLnF1ZXJ5UGFpcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKHRoaXMucXVlcnlQYWlyc1tpXVswXSA9PSBrZXkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLyoqXG4gICAqIHJlcGxhY2VzIHF1ZXJ5IHBhcmFtIHZhbHVlc1xuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGtleSAgICAgICAgIGtleSB0byByZXBsYWNlIHZhbHVlIGZvclxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5ld1ZhbCAgICAgIG5ldyB2YWx1ZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IFtvbGRWYWxdICAgIHJlcGxhY2Ugb25seSBvbmUgc3BlY2lmaWMgdmFsdWUgKG90aGVyd2lzZSByZXBsYWNlcyBhbGwpXG4gICAqIEByZXR1cm4ge1VyaX0gICAgICAgICAgICAgICAgcmV0dXJucyBzZWxmIGZvciBmbHVlbnQgY2hhaW5pbmdcbiAgICovXG4gIFVyaS5wcm90b3R5cGUucmVwbGFjZVF1ZXJ5UGFyYW0gPSBmdW5jdGlvbiAoa2V5LCBuZXdWYWwsIG9sZFZhbCkge1xuICAgIHZhciBpbmRleCA9IC0xLCBsZW4gPSB0aGlzLnF1ZXJ5UGFpcnMubGVuZ3RoLCBpLCBwYXJhbTtcblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcGFyYW0gPSB0aGlzLnF1ZXJ5UGFpcnNbaV07XG4gICAgICAgIGlmIChkZWNvZGUocGFyYW1bMF0pID09PSBkZWNvZGUoa2V5KSAmJiBkZWNvZGVVUklDb21wb25lbnQocGFyYW1bMV0pID09PSBkZWNvZGUob2xkVmFsKSkge1xuICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgdGhpcy5kZWxldGVRdWVyeVBhcmFtKGtleSwgZGVjb2RlKG9sZFZhbCkpLmFkZFF1ZXJ5UGFyYW0oa2V5LCBuZXdWYWwsIGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHBhcmFtID0gdGhpcy5xdWVyeVBhaXJzW2ldO1xuICAgICAgICBpZiAoZGVjb2RlKHBhcmFtWzBdKSA9PT0gZGVjb2RlKGtleSkpIHtcbiAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZGVsZXRlUXVlcnlQYXJhbShrZXkpO1xuICAgICAgdGhpcy5hZGRRdWVyeVBhcmFtKGtleSwgbmV3VmFsLCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWZpbmUgZmx1ZW50IHNldHRlciBtZXRob2RzIChzZXRQcm90b2NvbCwgc2V0SGFzQXV0aG9yaXR5UHJlZml4LCBldGMpXG4gICAqL1xuICBbJ3Byb3RvY29sJywgJ2hhc0F1dGhvcml0eVByZWZpeCcsICdpc0NvbG9uVXJpJywgJ3VzZXJJbmZvJywgJ2hvc3QnLCAncG9ydCcsICdwYXRoJywgJ3F1ZXJ5JywgJ2FuY2hvciddLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIG1ldGhvZCA9ICdzZXQnICsga2V5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsga2V5LnNsaWNlKDEpO1xuICAgIFVyaS5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgdGhpc1trZXldKHZhbCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICB9KTtcblxuICAvKipcbiAgICogU2NoZW1lIG5hbWUsIGNvbG9uIGFuZCBkb3VibGVzbGFzaCwgYXMgcmVxdWlyZWRcbiAgICogQHJldHVybiB7c3RyaW5nfSBodHRwOi8vIG9yIHBvc3NpYmx5IGp1c3QgLy9cbiAgICovXG4gIFVyaS5wcm90b3R5cGUuc2NoZW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHMgPSAnJztcblxuICAgIGlmICh0aGlzLnByb3RvY29sKCkpIHtcbiAgICAgIHMgKz0gdGhpcy5wcm90b2NvbCgpO1xuICAgICAgaWYgKHRoaXMucHJvdG9jb2woKS5pbmRleE9mKCc6JykgIT09IHRoaXMucHJvdG9jb2woKS5sZW5ndGggLSAxKSB7XG4gICAgICAgIHMgKz0gJzonO1xuICAgICAgfVxuICAgICAgcyArPSAnLy8nO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5oYXNBdXRob3JpdHlQcmVmaXgoKSAmJiB0aGlzLmhvc3QoKSkge1xuICAgICAgICBzICs9ICcvLyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhbWUgYXMgTW96aWxsYSBuc0lVUkkucHJlUGF0aFxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHNjaGVtZTovL3VzZXI6cGFzc3dvcmRAaG9zdDpwb3J0XG4gICAqIEBzZWUgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL25zSVVSSVxuICAgKi9cbiAgVXJpLnByb3RvdHlwZS5vcmlnaW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcyA9IHRoaXMuc2NoZW1lKCk7XG5cbiAgICBpZiAodGhpcy51c2VySW5mbygpICYmIHRoaXMuaG9zdCgpKSB7XG4gICAgICBzICs9IHRoaXMudXNlckluZm8oKTtcbiAgICAgIGlmICh0aGlzLnVzZXJJbmZvKCkuaW5kZXhPZignQCcpICE9PSB0aGlzLnVzZXJJbmZvKCkubGVuZ3RoIC0gMSkge1xuICAgICAgICBzICs9ICdAJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5ob3N0KCkpIHtcbiAgICAgIHMgKz0gdGhpcy5ob3N0KCk7XG4gICAgICBpZiAodGhpcy5wb3J0KCkgfHwgKHRoaXMucGF0aCgpICYmIHRoaXMucGF0aCgpLnN1YnN0cigwLCAxKS5tYXRjaCgvWzAtOV0vKSkpIHtcbiAgICAgICAgcyArPSAnOicgKyB0aGlzLnBvcnQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcztcbiAgfTtcblxuICAvKipcbiAgICogQWRkcyBhIHRyYWlsaW5nIHNsYXNoIHRvIHRoZSBwYXRoXG4gICAqL1xuICBVcmkucHJvdG90eXBlLmFkZFRyYWlsaW5nU2xhc2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGF0aCA9IHRoaXMucGF0aCgpIHx8ICcnO1xuXG4gICAgaWYgKHBhdGguc3Vic3RyKC0xKSAhPT0gJy8nKSB7XG4gICAgICB0aGlzLnBhdGgocGF0aCArICcvJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNlcmlhbGl6ZXMgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBVcmkgb2JqZWN0XG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIFVyaS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGF0aCwgcyA9IHRoaXMub3JpZ2luKCk7XG5cbiAgICBpZiAodGhpcy5pc0NvbG9uVXJpKCkpIHtcbiAgICAgIGlmICh0aGlzLnBhdGgoKSkge1xuICAgICAgICBzICs9ICc6Jyt0aGlzLnBhdGgoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMucGF0aCgpKSB7XG4gICAgICBwYXRoID0gdGhpcy5wYXRoKCk7XG4gICAgICBpZiAoIShyZS5lbmRzX3dpdGhfc2xhc2hlcy50ZXN0KHMpIHx8IHJlLnN0YXJ0c193aXRoX3NsYXNoZXMudGVzdChwYXRoKSkpIHtcbiAgICAgICAgcyArPSAnLyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocykge1xuICAgICAgICAgIHMucmVwbGFjZShyZS5lbmRzX3dpdGhfc2xhc2hlcywgJy8nKTtcbiAgICAgICAgfVxuICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKHJlLnN0YXJ0c193aXRoX3NsYXNoZXMsICcvJyk7XG4gICAgICB9XG4gICAgICBzICs9IHBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmhvc3QoKSAmJiAodGhpcy5xdWVyeSgpLnRvU3RyaW5nKCkgfHwgdGhpcy5hbmNob3IoKSkpIHtcbiAgICAgICAgcyArPSAnLyc7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnF1ZXJ5KCkudG9TdHJpbmcoKSkge1xuICAgICAgcyArPSB0aGlzLnF1ZXJ5KCkudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hbmNob3IoKSkge1xuICAgICAgaWYgKHRoaXMuYW5jaG9yKCkuaW5kZXhPZignIycpICE9PSAwKSB7XG4gICAgICAgIHMgKz0gJyMnO1xuICAgICAgfVxuICAgICAgcyArPSB0aGlzLmFuY2hvcigpO1xuICAgIH1cblxuICAgIHJldHVybiBzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9uZSBhIFVyaSBvYmplY3RcbiAgICogQHJldHVybiB7VXJpfSBkdXBsaWNhdGUgY29weSBvZiB0aGUgVXJpXG4gICAqL1xuICBVcmkucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBVcmkodGhpcy50b1N0cmluZygpKTtcbiAgfTtcblxuICAvKipcbiAgICogZXhwb3J0IHZpYSBBTUQgb3IgQ29tbW9uSlMsIG90aGVyd2lzZSBsZWFrIGEgZ2xvYmFsXG4gICAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFVyaTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBVcmk7XG4gIH0gZWxzZSB7XG4gICAgZ2xvYmFsLlVyaSA9IFVyaTtcbiAgfVxufSh0aGlzKSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9qc3VyaS9VcmkuanNcbiAqKiBtb2R1bGUgaWQgPSAxN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbioqXG4qKiBDb3B5cmlnaHQgKEMpIDIwMTUgVGhlIFF0IENvbXBhbnkgTHRkLlxuKiogQ29weXJpZ2h0IChDKSAyMDE0IEtsYXLDpGx2ZGFsZW5zIERhdGFrb25zdWx0IEFCLCBhIEtEQUIgR3JvdXAgY29tcGFueSwgaW5mb0BrZGFiLmNvbSwgYXV0aG9yIE1pbGlhbiBXb2xmZiA8bWlsaWFuLndvbGZmQGtkYWIuY29tPlxuKiogQ29udGFjdDogaHR0cDovL3d3dy5xdC5pby9saWNlbnNpbmcvXG4qKlxuKiogVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFF0V2ViQ2hhbm5lbCBtb2R1bGUgb2YgdGhlIFF0IFRvb2xraXQuXG4qKlxuKiogJFFUX0JFR0lOX0xJQ0VOU0U6TEdQTDIxJFxuKiogQ29tbWVyY2lhbCBMaWNlbnNlIFVzYWdlXG4qKiBMaWNlbnNlZXMgaG9sZGluZyB2YWxpZCBjb21tZXJjaWFsIFF0IGxpY2Vuc2VzIG1heSB1c2UgdGhpcyBmaWxlIGluXG4qKiBhY2NvcmRhbmNlIHdpdGggdGhlIGNvbW1lcmNpYWwgbGljZW5zZSBhZ3JlZW1lbnQgcHJvdmlkZWQgd2l0aCB0aGVcbioqIFNvZnR3YXJlIG9yLCBhbHRlcm5hdGl2ZWx5LCBpbiBhY2NvcmRhbmNlIHdpdGggdGhlIHRlcm1zIGNvbnRhaW5lZCBpblxuKiogYSB3cml0dGVuIGFncmVlbWVudCBiZXR3ZWVuIHlvdSBhbmQgVGhlIFF0IENvbXBhbnkuIEZvciBsaWNlbnNpbmcgdGVybXNcbioqIGFuZCBjb25kaXRpb25zIHNlZSBodHRwOi8vd3d3LnF0LmlvL3Rlcm1zLWNvbmRpdGlvbnMuIEZvciBmdXJ0aGVyXG4qKiBpbmZvcm1hdGlvbiB1c2UgdGhlIGNvbnRhY3QgZm9ybSBhdCBodHRwOi8vd3d3LnF0LmlvL2NvbnRhY3QtdXMuXG4qKlxuKiogR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIFVzYWdlXG4qKiBBbHRlcm5hdGl2ZWx5LCB0aGlzIGZpbGUgbWF5IGJlIHVzZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyXG4qKiBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMi4xIG9yIHZlcnNpb24gMyBhcyBwdWJsaXNoZWQgYnkgdGhlIEZyZWVcbioqIFNvZnR3YXJlIEZvdW5kYXRpb24gYW5kIGFwcGVhcmluZyBpbiB0aGUgZmlsZSBMSUNFTlNFLkxHUEx2MjEgYW5kXG4qKiBMSUNFTlNFLkxHUEx2MyBpbmNsdWRlZCBpbiB0aGUgcGFja2FnaW5nIG9mIHRoaXMgZmlsZS4gUGxlYXNlIHJldmlldyB0aGVcbioqIGZvbGxvd2luZyBpbmZvcm1hdGlvbiB0byBlbnN1cmUgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuKiogcmVxdWlyZW1lbnRzIHdpbGwgYmUgbWV0OiBodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2xncGwuaHRtbCBhbmRcbioqIGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9vbGQtbGljZW5zZXMvbGdwbC0yLjEuaHRtbC5cbioqXG4qKiBBcyBhIHNwZWNpYWwgZXhjZXB0aW9uLCBUaGUgUXQgQ29tcGFueSBnaXZlcyB5b3UgY2VydGFpbiBhZGRpdGlvbmFsXG4qKiByaWdodHMuIFRoZXNlIHJpZ2h0cyBhcmUgZGVzY3JpYmVkIGluIFRoZSBRdCBDb21wYW55IExHUEwgRXhjZXB0aW9uXG4qKiB2ZXJzaW9uIDEuMSwgaW5jbHVkZWQgaW4gdGhlIGZpbGUgTEdQTF9FWENFUFRJT04udHh0IGluIHRoaXMgcGFja2FnZS5cbioqXG4qKiAkUVRfRU5EX0xJQ0VOU0UkXG4qKlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBRV2ViQ2hhbm5lbE1lc3NhZ2VUeXBlcyA9IHtcbiAgICBzaWduYWw6IDEsXG4gICAgcHJvcGVydHlVcGRhdGU6IDIsXG4gICAgaW5pdDogMyxcbiAgICBpZGxlOiA0LFxuICAgIGRlYnVnOiA1LFxuICAgIGludm9rZU1ldGhvZDogNixcbiAgICBjb25uZWN0VG9TaWduYWw6IDcsXG4gICAgZGlzY29ubmVjdEZyb21TaWduYWw6IDgsXG4gICAgc2V0UHJvcGVydHk6IDksXG4gICAgcmVzcG9uc2U6IDEwLFxufTtcblxudmFyIFFXZWJDaGFubmVsID0gZnVuY3Rpb24odHJhbnNwb3J0LCBpbml0Q2FsbGJhY2spXG57XG4gICAgaWYgKHR5cGVvZiB0cmFuc3BvcnQgIT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIHRyYW5zcG9ydC5zZW5kICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBRV2ViQ2hhbm5lbCBleHBlY3RzIGEgdHJhbnNwb3J0IG9iamVjdCB3aXRoIGEgc2VuZCBmdW5jdGlvbiBhbmQgb25tZXNzYWdlIGNhbGxiYWNrIHByb3BlcnR5LlwiICtcbiAgICAgICAgICAgICAgICAgICAgICBcIiBHaXZlbiBpczogdHJhbnNwb3J0OiBcIiArIHR5cGVvZih0cmFuc3BvcnQpICsgXCIsIHRyYW5zcG9ydC5zZW5kOiBcIiArIHR5cGVvZih0cmFuc3BvcnQuc2VuZCkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGNoYW5uZWwgPSB0aGlzO1xuICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xuXG4gICAgdGhpcy5zZW5kID0gZnVuY3Rpb24oZGF0YSlcbiAgICB7XG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjaGFubmVsLnRyYW5zcG9ydC5zZW5kKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMudHJhbnNwb3J0Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpXG4gICAge1xuICAgICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBRV2ViQ2hhbm5lbE1lc3NhZ2VUeXBlcy5zaWduYWw6XG4gICAgICAgICAgICAgICAgY2hhbm5lbC5oYW5kbGVTaWduYWwoZGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFFXZWJDaGFubmVsTWVzc2FnZVR5cGVzLnJlc3BvbnNlOlxuICAgICAgICAgICAgICAgIGNoYW5uZWwuaGFuZGxlUmVzcG9uc2UoZGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFFXZWJDaGFubmVsTWVzc2FnZVR5cGVzLnByb3BlcnR5VXBkYXRlOlxuICAgICAgICAgICAgICAgIGNoYW5uZWwuaGFuZGxlUHJvcGVydHlVcGRhdGUoZGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJpbnZhbGlkIG1lc3NhZ2UgcmVjZWl2ZWQ6XCIsIG1lc3NhZ2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4ZWNDYWxsYmFja3MgPSB7fTtcbiAgICB0aGlzLmV4ZWNJZCA9IDA7XG4gICAgdGhpcy5leGVjID0gZnVuY3Rpb24oZGF0YSwgY2FsbGJhY2spXG4gICAge1xuICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBpZiBubyBjYWxsYmFjayBpcyBnaXZlbiwgc2VuZCBkaXJlY3RseVxuICAgICAgICAgICAgY2hhbm5lbC5zZW5kKGRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFubmVsLmV4ZWNJZCA9PT0gTnVtYmVyLk1BWF9WQUxVRSkge1xuICAgICAgICAgICAgLy8gd3JhcFxuICAgICAgICAgICAgY2hhbm5lbC5leGVjSWQgPSBOdW1iZXIuTUlOX1ZBTFVFO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KFwiaWRcIikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDYW5ub3QgZXhlYyBtZXNzYWdlIHdpdGggcHJvcGVydHkgaWQ6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEuaWQgPSBjaGFubmVsLmV4ZWNJZCsrO1xuICAgICAgICBjaGFubmVsLmV4ZWNDYWxsYmFja3NbZGF0YS5pZF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2hhbm5lbC5zZW5kKGRhdGEpO1xuICAgIH07XG5cbiAgICB0aGlzLm9iamVjdHMgPSB7fTtcblxuICAgIHRoaXMuaGFuZGxlU2lnbmFsID0gZnVuY3Rpb24obWVzc2FnZSlcbiAgICB7XG4gICAgICAgIHZhciBvYmplY3QgPSBjaGFubmVsLm9iamVjdHNbbWVzc2FnZS5vYmplY3RdO1xuICAgICAgICBpZiAob2JqZWN0KSB7XG4gICAgICAgICAgICBvYmplY3Quc2lnbmFsRW1pdHRlZChtZXNzYWdlLnNpZ25hbCwgbWVzc2FnZS5hcmdzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuaGFuZGxlZCBzaWduYWw6IFwiICsgbWVzc2FnZS5vYmplY3QgKyBcIjo6XCIgKyBtZXNzYWdlLnNpZ25hbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVJlc3BvbnNlID0gZnVuY3Rpb24obWVzc2FnZSlcbiAgICB7XG4gICAgICAgIGlmICghbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImlkXCIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSW52YWxpZCByZXNwb25zZSBtZXNzYWdlIHJlY2VpdmVkOiBcIiwgSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNoYW5uZWwuZXhlY0NhbGxiYWNrc1ttZXNzYWdlLmlkXShtZXNzYWdlLmRhdGEpO1xuICAgICAgICBkZWxldGUgY2hhbm5lbC5leGVjQ2FsbGJhY2tzW21lc3NhZ2UuaWRdO1xuICAgIH1cblxuICAgIHRoaXMuaGFuZGxlUHJvcGVydHlVcGRhdGUgPSBmdW5jdGlvbihtZXNzYWdlKVxuICAgIHtcbiAgICAgICAgZm9yICh2YXIgaSBpbiBtZXNzYWdlLmRhdGEpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gbWVzc2FnZS5kYXRhW2ldO1xuICAgICAgICAgICAgdmFyIG9iamVjdCA9IGNoYW5uZWwub2JqZWN0c1tkYXRhLm9iamVjdF07XG4gICAgICAgICAgICBpZiAob2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0LnByb3BlcnR5VXBkYXRlKGRhdGEuc2lnbmFscywgZGF0YS5wcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiVW5oYW5kbGVkIHByb3BlcnR5IHVwZGF0ZTogXCIgKyBkYXRhLm9iamVjdCArIFwiOjpcIiArIGRhdGEuc2lnbmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjaGFubmVsLmV4ZWMoe3R5cGU6IFFXZWJDaGFubmVsTWVzc2FnZVR5cGVzLmlkbGV9KTtcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnID0gZnVuY3Rpb24obWVzc2FnZSlcbiAgICB7XG4gICAgICAgIGNoYW5uZWwuc2VuZCh7dHlwZTogUVdlYkNoYW5uZWxNZXNzYWdlVHlwZXMuZGVidWcsIGRhdGE6IG1lc3NhZ2V9KTtcbiAgICB9O1xuXG4gICAgY2hhbm5lbC5leGVjKHt0eXBlOiBRV2ViQ2hhbm5lbE1lc3NhZ2VUeXBlcy5pbml0fSwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBmb3IgKHZhciBvYmplY3ROYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBvYmplY3QgPSBuZXcgUU9iamVjdChvYmplY3ROYW1lLCBkYXRhW29iamVjdE5hbWVdLCBjaGFubmVsKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBub3cgdW53cmFwIHByb3BlcnRpZXMsIHdoaWNoIG1pZ2h0IHJlZmVyZW5jZSBvdGhlciByZWdpc3RlcmVkIG9iamVjdHNcbiAgICAgICAgZm9yICh2YXIgb2JqZWN0TmFtZSBpbiBjaGFubmVsLm9iamVjdHMpIHtcbiAgICAgICAgICAgIGNoYW5uZWwub2JqZWN0c1tvYmplY3ROYW1lXS51bndyYXBQcm9wZXJ0aWVzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluaXRDYWxsYmFjaykge1xuICAgICAgICAgICAgaW5pdENhbGxiYWNrKGNoYW5uZWwpO1xuICAgICAgICB9XG4gICAgICAgIGNoYW5uZWwuZXhlYyh7dHlwZTogUVdlYkNoYW5uZWxNZXNzYWdlVHlwZXMuaWRsZX0pO1xuICAgIH0pO1xufTtcblxuZnVuY3Rpb24gUU9iamVjdChuYW1lLCBkYXRhLCB3ZWJDaGFubmVsKVxue1xuICAgIHRoaXMuX19pZF9fID0gbmFtZTtcbiAgICB3ZWJDaGFubmVsLm9iamVjdHNbbmFtZV0gPSB0aGlzO1xuXG4gICAgLy8gTGlzdCBvZiBjYWxsYmFja3MgdGhhdCBnZXQgaW52b2tlZCB1cG9uIHNpZ25hbCBlbWlzc2lvblxuICAgIHRoaXMuX19vYmplY3RTaWduYWxzX18gPSB7fTtcblxuICAgIC8vIENhY2hlIG9mIGFsbCBwcm9wZXJ0aWVzLCB1cGRhdGVkIHdoZW4gYSBub3RpZnkgc2lnbmFsIGlzIGVtaXR0ZWRcbiAgICB0aGlzLl9fcHJvcGVydHlDYWNoZV9fID0ge307XG5cbiAgICB2YXIgb2JqZWN0ID0gdGhpcztcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIHRoaXMudW53cmFwUU9iamVjdCA9IGZ1bmN0aW9uKHJlc3BvbnNlKVxuICAgIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgbGlzdCBvZiBvYmplY3RzXG4gICAgICAgICAgICB2YXIgcmV0ID0gbmV3IEFycmF5KHJlc3BvbnNlLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3BvbnNlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcmV0W2ldID0gb2JqZWN0LnVud3JhcFFPYmplY3QocmVzcG9uc2VbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJlc3BvbnNlXG4gICAgICAgICAgICB8fCAhcmVzcG9uc2VbXCJfX1FPYmplY3QqX19cIl1cbiAgICAgICAgICAgIHx8IHJlc3BvbnNlW1wiaWRcIl0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9iamVjdElkID0gcmVzcG9uc2UuaWQ7XG4gICAgICAgIGlmICh3ZWJDaGFubmVsLm9iamVjdHNbb2JqZWN0SWRdKVxuICAgICAgICAgICAgcmV0dXJuIHdlYkNoYW5uZWwub2JqZWN0c1tvYmplY3RJZF07XG5cbiAgICAgICAgaWYgKCFyZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2Fubm90IHVud3JhcCB1bmtub3duIFFPYmplY3QgXCIgKyBvYmplY3RJZCArIFwiIHdpdGhvdXQgZGF0YS5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcU9iamVjdCA9IG5ldyBRT2JqZWN0KCBvYmplY3RJZCwgcmVzcG9uc2UuZGF0YSwgd2ViQ2hhbm5lbCApO1xuICAgICAgICBxT2JqZWN0LmRlc3Ryb3llZC5jb25uZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHdlYkNoYW5uZWwub2JqZWN0c1tvYmplY3RJZF0gPT09IHFPYmplY3QpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgd2ViQ2hhbm5lbC5vYmplY3RzW29iamVjdElkXTtcbiAgICAgICAgICAgICAgICAvLyByZXNldCB0aGUgbm93IGRlbGV0ZWQgUU9iamVjdCB0byBhbiBlbXB0eSB7fSBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBqdXN0IGFzc2lnbmluZyB7fSB0aG91Z2ggd291bGQgbm90IGhhdmUgdGhlIGRlc2lyZWQgZWZmZWN0LCBidXQgdGhlXG4gICAgICAgICAgICAgICAgLy8gYmVsb3cgYWxzbyBlbnN1cmVzIGFsbCBleHRlcm5hbCByZWZlcmVuY2VzIHdpbGwgc2VlIHRoZSBlbXB0eSBtYXBcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiB0aGlzIGRldG91ciBpcyBuZWNlc3NhcnkgdG8gd29ya2Fyb3VuZCBRVEJVRy00MDAyMVxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIHFPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lcy5wdXNoKHByb3BlcnR5TmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiBwcm9wZXJ0eU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBxT2JqZWN0W3Byb3BlcnR5TmFtZXNbaWR4XV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaGVyZSB3ZSBhcmUgYWxyZWFkeSBpbml0aWFsaXplZCwgYW5kIHRodXMgbXVzdCBkaXJlY3RseSB1bndyYXAgdGhlIHByb3BlcnRpZXNcbiAgICAgICAgcU9iamVjdC51bndyYXBQcm9wZXJ0aWVzKCk7XG4gICAgICAgIHJldHVybiBxT2JqZWN0O1xuICAgIH1cblxuICAgIHRoaXMudW53cmFwUHJvcGVydGllcyA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5SWR4IGluIG9iamVjdC5fX3Byb3BlcnR5Q2FjaGVfXykge1xuICAgICAgICAgICAgb2JqZWN0Ll9fcHJvcGVydHlDYWNoZV9fW3Byb3BlcnR5SWR4XSA9IG9iamVjdC51bndyYXBRT2JqZWN0KG9iamVjdC5fX3Byb3BlcnR5Q2FjaGVfX1twcm9wZXJ0eUlkeF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkU2lnbmFsKHNpZ25hbERhdGEsIGlzUHJvcGVydHlOb3RpZnlTaWduYWwpXG4gICAge1xuICAgICAgICB2YXIgc2lnbmFsTmFtZSA9IHNpZ25hbERhdGFbMF07XG4gICAgICAgIHZhciBzaWduYWxJbmRleCA9IHNpZ25hbERhdGFbMV07XG4gICAgICAgIG9iamVjdFtzaWduYWxOYW1lXSA9IHtcbiAgICAgICAgICAgIGNvbm5lY3Q6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZihjYWxsYmFjaykgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQmFkIGNhbGxiYWNrIGdpdmVuIHRvIGNvbm5lY3QgdG8gc2lnbmFsIFwiICsgc2lnbmFsTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvYmplY3QuX19vYmplY3RTaWduYWxzX19bc2lnbmFsSW5kZXhdID0gb2JqZWN0Ll9fb2JqZWN0U2lnbmFsc19fW3NpZ25hbEluZGV4XSB8fCBbXTtcbiAgICAgICAgICAgICAgICBvYmplY3QuX19vYmplY3RTaWduYWxzX19bc2lnbmFsSW5kZXhdLnB1c2goY2FsbGJhY2spO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpc1Byb3BlcnR5Tm90aWZ5U2lnbmFsICYmIHNpZ25hbE5hbWUgIT09IFwiZGVzdHJveWVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZXF1aXJlZCBmb3IgXCJwdXJlXCIgc2lnbmFscywgaGFuZGxlZCBzZXBhcmF0ZWx5IGZvciBwcm9wZXJ0aWVzIGluIHByb3BlcnR5VXBkYXRlXG4gICAgICAgICAgICAgICAgICAgIC8vIGFsc28gbm90ZSB0aGF0IHdlIGFsd2F5cyBnZXQgbm90aWZpZWQgYWJvdXQgdGhlIGRlc3Ryb3llZCBzaWduYWxcbiAgICAgICAgICAgICAgICAgICAgd2ViQ2hhbm5lbC5leGVjKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFFXZWJDaGFubmVsTWVzc2FnZVR5cGVzLmNvbm5lY3RUb1NpZ25hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0Ll9faWRfXyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbDogc2lnbmFsSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZihjYWxsYmFjaykgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQmFkIGNhbGxiYWNrIGdpdmVuIHRvIGRpc2Nvbm5lY3QgZnJvbSBzaWduYWwgXCIgKyBzaWduYWxOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3QuX19vYmplY3RTaWduYWxzX19bc2lnbmFsSW5kZXhdID0gb2JqZWN0Ll9fb2JqZWN0U2lnbmFsc19fW3NpZ25hbEluZGV4XSB8fCBbXTtcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gb2JqZWN0Ll9fb2JqZWN0U2lnbmFsc19fW3NpZ25hbEluZGV4XS5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2Fubm90IGZpbmQgY29ubmVjdGlvbiBvZiBzaWduYWwgXCIgKyBzaWduYWxOYW1lICsgXCIgdG8gXCIgKyBjYWxsYmFjay5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3QuX19vYmplY3RTaWduYWxzX19bc2lnbmFsSW5kZXhdLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgICAgIGlmICghaXNQcm9wZXJ0eU5vdGlmeVNpZ25hbCAmJiBvYmplY3QuX19vYmplY3RTaWduYWxzX19bc2lnbmFsSW5kZXhdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlcXVpcmVkIGZvciBcInB1cmVcIiBzaWduYWxzLCBoYW5kbGVkIHNlcGFyYXRlbHkgZm9yIHByb3BlcnRpZXMgaW4gcHJvcGVydHlVcGRhdGVcbiAgICAgICAgICAgICAgICAgICAgd2ViQ2hhbm5lbC5leGVjKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFFXZWJDaGFubmVsTWVzc2FnZVR5cGVzLmRpc2Nvbm5lY3RGcm9tU2lnbmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QuX19pZF9fLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbmFsOiBzaWduYWxJbmRleFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyBhbGwgY2FsbGJhY2tzIGZvciB0aGUgZ2l2ZW4gc2lnbmFsbmFtZS4gQWxzbyB3b3JrcyBmb3IgcHJvcGVydHkgbm90aWZ5IGNhbGxiYWNrcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbnZva2VTaWduYWxDYWxsYmFja3Moc2lnbmFsTmFtZSwgc2lnbmFsQXJncylcbiAgICB7XG4gICAgICAgIHZhciBjb25uZWN0aW9ucyA9IG9iamVjdC5fX29iamVjdFNpZ25hbHNfX1tzaWduYWxOYW1lXTtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25uZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkoY2FsbGJhY2ssIHNpZ25hbEFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnByb3BlcnR5VXBkYXRlID0gZnVuY3Rpb24oc2lnbmFscywgcHJvcGVydHlNYXApXG4gICAge1xuICAgICAgICAvLyB1cGRhdGUgcHJvcGVydHkgY2FjaGVcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHlJbmRleCBpbiBwcm9wZXJ0eU1hcCkge1xuICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSBwcm9wZXJ0eU1hcFtwcm9wZXJ0eUluZGV4XTtcbiAgICAgICAgICAgIG9iamVjdC5fX3Byb3BlcnR5Q2FjaGVfX1twcm9wZXJ0eUluZGV4XSA9IHByb3BlcnR5VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBzaWduYWxOYW1lIGluIHNpZ25hbHMpIHtcbiAgICAgICAgICAgIC8vIEludm9rZSBhbGwgY2FsbGJhY2tzLCBhcyBzaWduYWxFbWl0dGVkKCkgZG9lcyBub3QuIFRoaXMgZW5zdXJlcyB0aGVcbiAgICAgICAgICAgIC8vIHByb3BlcnR5IGNhY2hlIGlzIHVwZGF0ZWQgYmVmb3JlIHRoZSBjYWxsYmFja3MgYXJlIGludm9rZWQuXG4gICAgICAgICAgICBpbnZva2VTaWduYWxDYWxsYmFja3Moc2lnbmFsTmFtZSwgc2lnbmFsc1tzaWduYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNpZ25hbEVtaXR0ZWQgPSBmdW5jdGlvbihzaWduYWxOYW1lLCBzaWduYWxBcmdzKVxuICAgIHtcbiAgICAgICAgaW52b2tlU2lnbmFsQ2FsbGJhY2tzKHNpZ25hbE5hbWUsIHNpZ25hbEFyZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZE1ldGhvZChtZXRob2REYXRhKVxuICAgIHtcbiAgICAgICAgdmFyIG1ldGhvZE5hbWUgPSBtZXRob2REYXRhWzBdO1xuICAgICAgICB2YXIgbWV0aG9kSWR4ID0gbWV0aG9kRGF0YVsxXTtcbiAgICAgICAgb2JqZWN0W21ldGhvZE5hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3ZWJDaGFubmVsLmV4ZWMoe1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBRV2ViQ2hhbm5lbE1lc3NhZ2VUeXBlcy5pbnZva2VNZXRob2QsXG4gICAgICAgICAgICAgICAgXCJvYmplY3RcIjogb2JqZWN0Ll9faWRfXyxcbiAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiBtZXRob2RJZHgsXG4gICAgICAgICAgICAgICAgXCJhcmdzXCI6IGFyZ3NcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG9iamVjdC51bndyYXBRT2JqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY2FsbGJhY2spKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiaW5kR2V0dGVyU2V0dGVyKHByb3BlcnR5SW5mbylcbiAgICB7XG4gICAgICAgIHZhciBwcm9wZXJ0eUluZGV4ID0gcHJvcGVydHlJbmZvWzBdO1xuICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gcHJvcGVydHlJbmZvWzFdO1xuICAgICAgICB2YXIgbm90aWZ5U2lnbmFsRGF0YSA9IHByb3BlcnR5SW5mb1syXTtcbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBwcm9wZXJ0eSBjYWNoZSB3aXRoIGN1cnJlbnQgdmFsdWVcbiAgICAgICAgLy8gTk9URTogaWYgdGhpcyBpcyBhbiBvYmplY3QsIGl0IGlzIG5vdCBkaXJlY3RseSB1bndyYXBwZWQgYXMgaXQgbWlnaHRcbiAgICAgICAgLy8gcmVmZXJlbmNlIG90aGVyIFFPYmplY3QgdGhhdCB3ZSBkbyBub3Qga25vdyB5ZXRcbiAgICAgICAgb2JqZWN0Ll9fcHJvcGVydHlDYWNoZV9fW3Byb3BlcnR5SW5kZXhdID0gcHJvcGVydHlJbmZvWzNdO1xuXG4gICAgICAgIGlmIChub3RpZnlTaWduYWxEYXRhKSB7XG4gICAgICAgICAgICBpZiAobm90aWZ5U2lnbmFsRGF0YVswXSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHNpZ25hbCBuYW1lIGlzIG9wdGltaXplZCBhd2F5LCByZWNvbnN0cnVjdCB0aGUgYWN0dWFsIG5hbWVcbiAgICAgICAgICAgICAgICBub3RpZnlTaWduYWxEYXRhWzBdID0gcHJvcGVydHlOYW1lICsgXCJDaGFuZ2VkXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRTaWduYWwobm90aWZ5U2lnbmFsRGF0YSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eU5hbWUsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlID0gb2JqZWN0Ll9fcHJvcGVydHlDYWNoZV9fW3Byb3BlcnR5SW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBzaG91bGRuJ3QgaGFwcGVuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuZGVmaW5lZCB2YWx1ZSBpbiBwcm9wZXJ0eSBjYWNoZSBmb3IgcHJvcGVydHkgXFxcIlwiICsgcHJvcGVydHlOYW1lICsgXCJcXFwiIGluIG9iamVjdCBcIiArIG9iamVjdC5fX2lkX18pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJQcm9wZXJ0eSBzZXR0ZXIgZm9yIFwiICsgcHJvcGVydHlOYW1lICsgXCIgY2FsbGVkIHdpdGggdW5kZWZpbmVkIHZhbHVlIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3QuX19wcm9wZXJ0eUNhY2hlX19bcHJvcGVydHlJbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB3ZWJDaGFubmVsLmV4ZWMoe1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogUVdlYkNoYW5uZWxNZXNzYWdlVHlwZXMuc2V0UHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgIFwib2JqZWN0XCI6IG9iamVjdC5fX2lkX18sXG4gICAgICAgICAgICAgICAgICAgIFwicHJvcGVydHlcIjogcHJvcGVydHlJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiB2YWx1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGRhdGEubWV0aG9kcy5mb3JFYWNoKGFkZE1ldGhvZCk7XG5cbiAgICBkYXRhLnByb3BlcnRpZXMuZm9yRWFjaChiaW5kR2V0dGVyU2V0dGVyKTtcblxuICAgIGRhdGEuc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHNpZ25hbCkgeyBhZGRTaWduYWwoc2lnbmFsLCBmYWxzZSk7IH0pO1xuXG4gICAgZm9yICh2YXIgbmFtZSBpbiBkYXRhLmVudW1zKSB7XG4gICAgICAgIG9iamVjdFtuYW1lXSA9IGRhdGEuZW51bXNbbmFtZV07XG4gICAgfVxufVxuXG4vL3JlcXVpcmVkIGZvciB1c2Ugd2l0aCBub2RlanNcbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBRV2ViQ2hhbm5lbDogUVdlYkNoYW5uZWxcbiAgICB9O1xufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcXdlYmNoYW5uZWwvcXdlYmNoYW5uZWwuanNcbiAqKiBtb2R1bGUgaWQgPSAxOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuL1V0aWxpdGllcy5qcycpO1xudmFyIFNoYXJlZCA9IHJlcXVpcmUoJy4vU2hhcmVkLmpzJyk7XG52YXIgTmF0aXZlRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vTmF0aXZlRGlzcGF0Y2hlci5qcycpO1xudmFyIFNpbXVsYXRvckRpc3BhdGNoZXIgPSByZXF1aXJlKCcuL1NpbXVsYXRvckRpc3BhdGNoZXIuanMnKTtcbnZhciBxd2ViY2hhbm5lbCA9IHJlcXVpcmUoJ3F3ZWJjaGFubmVsJyk7XG5cbi8qKiBAbW9kdWxlIFNoaW1MaWJyYXJ5IC0gVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgV0RDJ3Mgc2hpbSBsaWJyYXJ5IHdoaWNoIGlzIHVzZWRcbnRvIGJyaWRnZSB0aGUgZ2FwIGJldHdlZW4gdGhlIGphdmFzY3JpcHQgY29kZSBvZiB0aGUgV0RDIGFuZCB0aGUgZHJpdmluZyBjb250ZXh0XG5vZiB0aGUgV0RDIChUYWJsZWF1IGRlc2t0b3AsIHRoZSBzaW11bGF0b3IsIGV0Yy4pICovXG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGJlIGNhbGxlZCBvbmNlIGJvb3RzdHJhcHBpbmcgaGFzIGJlZW4gY29tcGxldGVkIGFuZCB0aGVcbi8vIGRpc3BhdGNoZXIgYW5kIHNoYXJlZCBXREMgb2JqZWN0cyBhcmUgYm90aCBjcmVhdGVkIGFuZCBhdmFpbGFibGVcbmZ1bmN0aW9uIGJvb3RzdHJhcHBpbmdGaW5pc2hlZChfZGlzcGF0Y2hlciwgX3NoYXJlZCkge1xuICBVdGlsaXRpZXMuY29weUZ1bmN0aW9ucyhfZGlzcGF0Y2hlci5wdWJsaWNJbnRlcmZhY2UsIHdpbmRvdy50YWJsZWF1KTtcbiAgVXRpbGl0aWVzLmNvcHlGdW5jdGlvbnMoX2Rpc3BhdGNoZXIucHJpdmF0ZUludGVyZmFjZSwgd2luZG93Ll90YWJsZWF1KTtcbiAgX3NoYXJlZC5pbml0KCk7XG59XG5cbi8vIEluaXRpYWxpemVzIHRoZSB3ZGMgc2hpbSBsaWJyYXJ5LiBZb3UgbXVzdCBjYWxsIHRoaXMgYmVmb3JlIGRvaW5nIGFueXRoaW5nIHdpdGggV0RDXG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgLy8gVGhlIGluaXRpYWwgY29kZSBoZXJlIGlzIHRoZSBvbmx5IHBsYWNlIGluIG91ciBtb2R1bGUgd2hpY2ggc2hvdWxkIGhhdmUgZ2xvYmFsXG4gIC8vIGtub3dsZWRnZSBvZiBob3cgYWxsIHRoZSBXREMgY29tcG9uZW50cyBhcmUgZ2x1ZWQgdG9nZXRoZXIuIFRoaXMgaXMgdGhlIG9ubHkgcGxhY2VcbiAgLy8gd2hpY2ggd2lsbCBrbm93IGFib3V0IHRoZSB3aW5kb3cgb2JqZWN0IG9yIG90aGVyIGdsb2JhbCBvYmplY3RzLiBUaGlzIGNvZGUgd2lsbCBiZSBydW5cbiAgLy8gaW1tZWRpYXRlbHkgd2hlbiB0aGUgc2hpbSBsaWJyYXJ5IGxvYWRzIGFuZCBpcyByZXNwb25zaWJsZSBmb3IgZGV0ZXJtaW5pbmcgdGhlIGNvbnRleHRcbiAgLy8gd2hpY2ggaXQgaXMgcnVubmluZyBpdCBhbmQgc2V0dXAgYSBjb21tdW5pY2F0aW9ucyBjaGFubmVsIGJldHdlZW4gdGhlIGpzICYgcnVubmluZyBjb2RlXG4gIHZhciBkaXNwYXRjaGVyID0gbnVsbDtcbiAgdmFyIHNoYXJlZCA9IG51bGw7XG5cbiAgLy8gQWx3YXlzIGRlZmluZSB0aGUgcHJpdmF0ZSBfdGFibGVhdSBvYmplY3QgYXQgdGhlIHN0YXJ0XG4gIHdpbmRvdy5fdGFibGVhdSA9IHt9O1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdGFibGVhdVZlcnNpb25Cb290c3RyYXAgaXMgZGVmaW5lZCBhcyBhIGdsb2JhbCBvYmplY3QuIElmIHNvLFxuICAvLyB3ZSBhcmUgcnVubmluZyBpbiB0aGUgVGFibGVhdSBkZXNrdG9wL3NlcnZlciBjb250ZXh0LiBJZiBub3QsIHdlJ3JlIHJ1bm5pbmcgaW4gdGhlIHNpbXVsYXRvclxuICBpZiAoISF3aW5kb3cudGFibGVhdVZlcnNpb25Cb290c3RyYXApIHtcbiAgICAvLyBXZSBoYXZlIHRoZSB0YWJsZWF1IG9iamVjdCBkZWZpbmVkXG4gICAgY29uc29sZS5sb2coXCJJbml0aWFsaXppbmcgTmF0aXZlRGlzcGF0Y2hlciwgUmVwb3J0aW5nIHZlcnNpb24gbnVtYmVyXCIpO1xuICAgIHdpbmRvdy50YWJsZWF1VmVyc2lvbkJvb3RzdHJhcC5SZXBvcnRWZXJzaW9uTnVtYmVyKEJVSUxEX05VTUJFUik7XG4gICAgZGlzcGF0Y2hlciA9IG5ldyBOYXRpdmVEaXNwYXRjaGVyKHdpbmRvdyk7XG4gIH0gZWxzZSBpZiAoISF3aW5kb3cucXQgJiYgISF3aW5kb3cucXQud2ViQ2hhbm5lbFRyYW5zcG9ydCkge1xuICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6aW5nIE5hdGl2ZURpc3BhdGNoZXIgZm9yIHF3ZWJjaGFubmVsXCIpO1xuICAgIHdpbmRvdy50YWJsZWF1ID0ge307XG5cbiAgICAvLyBXZSdyZSBydW5uaW5nIGluIGEgY29udGV4dCB3aGVyZSB0aGUgd2ViQ2hhbm5lbFRyYW5zcG9ydCBpcyBhdmFpbGFibGUuIFRoaXMgbWVhbnMgUVdlYkVuZ2luZSBpcyBpbiB1c2VcbiAgICB3aW5kb3cuY2hhbm5lbCA9IG5ldyBxd2ViY2hhbm5lbC5RV2ViQ2hhbm5lbChxdC53ZWJDaGFubmVsVHJhbnNwb3J0LCBmdW5jdGlvbihjaGFubmVsKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlFXZWJDaGFubmVsIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuXG4gICAgICAvLyBEZWZpbmUgdGhlIGZ1bmN0aW9uIHdoaWNoIHRhYmxlYXUgd2lsbCBjYWxsIGFmdGVyIGl0IGhhcyBpbnNlcnRlZCBhbGwgdGhlIHJlcXVpcmVkIG9iamVjdHMgaW50byB0aGUgamF2YXNjcmlwdCBmcmFtZVxuICAgICAgd2luZG93Ll90YWJsZWF1Ll9uYXRpdmVTZXR1cENvbXBsZXRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBPbmNlIHRoZSBuYXRpdmUgY29kZSB0ZWxscyB1cyBldmVyeXRoaW5nIGhlcmUgaXMgZG9uZSwgd2Ugc2hvdWxkIGhhdmUgYWxsIHRoZSBleHBlY3RlZCBvYmplY3RzIGluc2VydGVkIGludG8ganNcbiAgICAgICAgZGlzcGF0Y2hlciA9IG5ldyBOYXRpdmVEaXNwYXRjaGVyKGNoYW5uZWwub2JqZWN0cyk7XG4gICAgICAgIHdpbmRvdy50YWJsZWF1ID0gY2hhbm5lbC5vYmplY3RzLnRhYmxlYXU7XG4gICAgICAgIHNoYXJlZC5jaGFuZ2VUYWJsZWF1QXBpT2JqKHdpbmRvdy50YWJsZWF1KTtcbiAgICAgICAgYm9vdHN0cmFwcGluZ0ZpbmlzaGVkKGRpc3BhdGNoZXIsIHNoYXJlZCk7XG4gICAgICB9O1xuXG4gICAgICAvLyBBY3R1YWxseSBjYWxsIGludG8gdGhlIHZlcnNpb24gYm9vdHN0cmFwcGVyIHRvIHJlcG9ydCBvdXIgdmVyc2lvbiBudW1iZXJcbiAgICAgIGNoYW5uZWwub2JqZWN0cy50YWJsZWF1VmVyc2lvbkJvb3RzdHJhcC5SZXBvcnRWZXJzaW9uTnVtYmVyKEJVSUxEX05VTUJFUik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coXCJWZXJzaW9uIEJvb3RzdHJhcCBpcyBub3QgZGVmaW5lZCwgSW5pdGlhbGl6aW5nIFNpbXVsYXRvckRpc3BhdGNoZXJcIik7XG4gICAgd2luZG93LnRhYmxlYXUgPSB7fTtcbiAgICBkaXNwYXRjaGVyID0gbmV3IFNpbXVsYXRvckRpc3BhdGNoZXIod2luZG93KTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIHNoYXJlZCBXREMgb2JqZWN0IGFuZCBhZGQgaW4gb3VyIGVudW0gdmFsdWVzXG4gIHNoYXJlZCA9IG5ldyBTaGFyZWQod2luZG93LnRhYmxlYXUsIHdpbmRvdy5fdGFibGVhdSwgd2luZG93KTtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGRpc3BhdGNoZXIgaXMgYWxyZWFkeSBkZWZpbmVkIGFuZCBpbW1lZGlhdGVseSBjYWxsIHRoZVxuICAvLyBjYWxsYmFjayBpZiBzb1xuICBpZiAoZGlzcGF0Y2hlcikge1xuICAgIGJvb3RzdHJhcHBpbmdGaW5pc2hlZChkaXNwYXRjaGVyLCBzaGFyZWQpO1xuICB9XG59O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3RhYmxlYXV3ZGMuanNcbiAqKiBtb2R1bGUgaWQgPSAxOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ3RUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUMzS0E7QUFDQTtBQUNBOzs7Ozs7QUNGQTtBQUNBO0FBQ0E7Ozs7OztBQ0ZBO0FBQ0E7QUFDQTs7Ozs7O0FDRkE7QUFDQTtBQUNBOzs7Ozs7QUNGQTtBQUNBO0FBQ0E7Ozs7OztBQ0ZBO0FBQ0E7QUFDQTs7Ozs7O0FDRkE7QUFDQTtBQUNBOzs7Ozs7QUNGQTtBQUNBO0FBQ0E7Ozs7OztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDM1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OyIsInNvdXJjZVJvb3QiOiIifQ==
