import angular from 'angular';
import './insight.scss';

export default angular
    .module('app.insight.directive', [])
    .directive('insight', insightDirective);

insightDirective.$inject = ['semossCoreService'];

function insightDirective(semossCoreService) {
    insightCtrl.$inject = ['$scope'];
    insightLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {
            insightID: '@',
        },
        controller: insightCtrl,
        controllerAs: 'insight',
        bindToController: {},
        link: insightLink,
        template: require('./insight.directive.html'),
        transclude: true,
    };

    function insightCtrl($scope) {
        const insight = $scope.insight;

        insight.emit = emit;
        insight.on = on;
        insight.once = once;
        insight.getWidget = getWidget;
        insight.getFrame = getFrame;
        insight.getShared = getShared;
        insight.getWorkspace = getWorkspace;
        insight.getWorkbook = getWorkbook;
        insight.getWorksheet = getWorksheet;
        insight.setWorksheetOrder = setWorksheetOrder;
        insight.getPanel = getPanel;
        insight.getOptions = getOptions;
        insight.setOptions = setOptions;
        insight.alert = alert;
        insight.execute = execute;
        insight.meta = meta;
        insight.query = query;

        /**
         * @name emit
         * @desc emit a message from the insight (wrapper method)
         * @param message - message string
         * @param payload - payload to pass into the callback
         */
        function emit(message: string, payload?: object): void {
            let insightPayload = {
                insightID: insight.insightID,
            };

            if (payload) {
                insightPayload = { ...payload, ...insightPayload };
            }

            semossCoreService.emit(message, insightPayload);
        }

        /**
         * @name on
         * @desc listen to a message on the insight (wrapper method)
         * @param message - message string
         * @param callback - function to run when message is called
         * @returns destroy - function returned to remove listener from the center
         */
        function on(message: string, callback: (payload) => {}): () => void {
            return semossCoreService.on(message, function (payload) {
                if (payload && payload.insightID === insight.insightID) {
                    callback.apply(null, [payload]);
                }
            });
        }

        /**
         * @name once
         * @desc listen to a message on the widget (wrapper method)
         * @param message - message string
         * @param callback - function to run when message is called
         * @returns destroy - function returned to remove listener from the center
         */
        function once(message: string, callback: (payload) => {}): () => void {
            return semossCoreService.once(message, function (payload) {
                if (payload && payload.insightID === insight.insightID) {
                    callback.apply(null, [payload]);
                }
            });
        }

        /**
         * @name getWidget
         * @param widgetId - widgetId to get
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the widget data object based on the accessor. This is the data across the single $scope.widget.
         * @returns the requested data
         */
        function getWidget(widgetId: string, accessor?: string): any {
            return semossCoreService.getWidget(widgetId, accessor);
        }

        /**
         * @name getFrame
         * @param widgetId - widgetId to get
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the frame object for the widget
         * @returns the requested data
         */
        function getFrame(widgetId: string, accessor?: string): any {
            let cleanedAccessor = '';

            if (accessor) {
                cleanedAccessor += '.' + accessor;
            }

            return getShared(
                'frames.' + getWidget(widgetId, 'frame') + cleanedAccessor
            );
        }

        /**
         * @name getShared
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data from the insight. This is the data across the whole insight
         * @returns the requested data
         */
        function getShared(accessor?: string): any {
            return semossCoreService.getShared(insight.insightID, accessor);
        }

        /**
         * @name getWorkspace
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data from the insight. This is the data across the whole insight
         * @returns the requested data
         */
        function getWorkspace(accessor?: string): any {
            return semossCoreService.workspace.getWorkspace(
                insight.insightID,
                accessor
            );
        }

        /**
         * @name getWorkbook
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data from the insight. This is the data across the whole insight
         * @returns the requested data
         */
        function getWorkbook(accessor?: string): any {
            return semossCoreService.workbook.getWorkbook(
                insight.insightID,
                accessor
            );
        }

        /**
         * @name getWorksheet
         * @param sheetId - sheetId to get the data for
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data from the insight. This is the data across the whole insight
         * @returns the requested data
         */
        function getWorksheet(sheetId: string, accessor?: string): any {
            return semossCoreService.workbook.getWorksheet(
                insight.insightID,
                sheetId,
                accessor
            );
        }

        /**
         * @name setWorksheetOrder
         * @param sheetId - sheetI to set
         * @param order - index to set
         * @desc sets the order for a worksheet
         */
        function setWorksheetOrder(sheetId: string, order: number): any {
            semossCoreService.workbook.setWorksheetOrder(
                insight.insightID,
                sheetId,
                order
            );
        }

        /**
         * @name getPanel
         * @param sheetId - sheetId to get the data for
         * @param panelId - panelId to get the data for
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data from the insight. This is the data across the whole insight
         * @returns the requested data
         */
        function getPanel(
            sheetId: string,
            panelId: string,
            accessor?: string
        ): any {
            return semossCoreService.workbook.getPanel(
                insight.insightID,
                sheetId,
                panelId,
                accessor
            );
        }

        /**
         * @name getOptions
         * @param accessor string to get to the object. In the form of 'a.b.c'
         * @desc returns specific data in the options service
         * @returns the requested data
         */
        function getOptions(accessor?: string): any {
            return semossCoreService.getOptions(insight.insightID, accessor);
        }

        /**
         * @name setOptions
         * @param accessor what key to set
         * @param value what value to set to the key
         * @desc set a specific key value pair in the options service
         * @returns {void}
         */
        function setOptions(accessor: string, value: any): void {
            semossCoreService.setOptions(insight.insightID, accessor, value);
        }

        /**
         * @name alert
         * @param color - color of the alert
         * @param text - text of the alert
         * @desc emit alert from the insight
         */
        function alert(color: string, text: string): void {
            semossCoreService.emit('alert', {
                color: color,
                text: text,
                insightID: insight.insightID,
            });
        }

        /**
         * @name execute
         * @param commandList - components to run
         * @param callback - callback to trigger when done
         * @param  listeners - listeners for the execute-pixel (loading screens)
         * @desc execute a pixel
         */
        function execute(
            commandList: PixelCommand[],
            callback: () => void,
            listeners: string[]
        ): void {
            let payload;

            payload = {
                insightID: insight.insightID,
                commandList: commandList,
                listeners: listeners, // this can be undefined
            };

            if (callback) {
                const message =
                    semossCoreService.utility.random('execute-pixel');
                semossCoreService.once(message, callback);

                payload.responseObject = {
                    response: message,
                    payload: {},
                };
            }

            emit('execute-pixel', payload);
        }

        /**
         * @name meta
         * @param components - components to run
         * @param callback - callback to trigger when done
         * @param listeners - listeners for the meta-pixel (loading screens)
         * @desc execute a meta pixel
         */
        function meta(
            commandList: PixelCommand[],
            callback: () => void,
            listeners: string[]
        ): void {
            let payload;

            payload = {
                insightID: insight.insightID,
                commandList: commandList,
                listeners: listeners, // this can be undefined
            };

            if (callback) {
                const message = semossCoreService.utility.random('meta-pixel');
                semossCoreService.once(message, callback);

                payload.response = message;
            }

            emit('meta-pixel', payload);
        }

        /**
         * @name query
         * @param components - components to run
         * @param callback - callback to trigger when done
         * @param listeners - listeners for the quey-pixel (loading screens)
         * @desc query a meta pixel
         */
        function query(
            commandList: PixelCommand[],
            callback: () => void,
            listeners: string[]
        ): void {
            let payload;

            payload = {
                commandList: commandList,
                listeners: listeners, // this can be undefined
            };

            if (callback) {
                const message = semossCoreService.utility.random('query-pixel');
                semossCoreService.once(message, callback);

                payload.response = message;
            }

            emit('query-pixel', payload);
        }

        /**
         * @name initialize
         * @desc called when the controller loads
         */
        function initialize(): void {
            insight.insightID = $scope.insightID;
            insight.appendToRecipe = {};
        }

        initialize();
    }

    function insightLink(scope) {
        scope.loading = {
            active: false,
            messageList: [],
        };

        /**
         * @name updateLoading
         * @param {object} payload - {id, messageList, visible}
         * @desc called to update when the loading changes
         */
        function updateLoading(payload: {
            id: string;
            active: boolean;
            messageList: string[];
        }): void {
            if (scope.insight.insightID === payload.id) {
                scope.loading.active = payload.active;
                scope.loading.messageList = payload.messageList;
            }
        }

        /**
         * @name initialize
         * @desc called when the directive loads
         */
        function initialize(): void {
            const updateLoadingListener = semossCoreService.on(
                'update-loading',
                updateLoading
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateLoadingListener();
            });
        }

        initialize();
    }
}
