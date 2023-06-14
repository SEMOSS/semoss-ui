import angular from 'angular';
import './widget.scss';

angular.module('app.widget.directive', []).directive('widget', widgetDirective);

widgetDirective.$inject = ['semossCoreService'];

/**
 * @name widget
 * @desc widget directive used for containing visualization components
 */

function widgetDirective(semossCoreService: SemossCoreService) {
    widgetCtrl.$inject = ['$scope'];

    return {
        restrict: 'E',
        scope: {
            widgetId: '@',
            appId: '@',
        },
        controller: widgetCtrl,
        controllerAs: 'widget',
        bindToController: {},
        transclude: true,
        template: require('./widget.directive.html'),
    };

    function widgetCtrl($scope) {
        $scope.widget.layerVizList = ['Area', 'Column', 'Line', 'Pie'];

        $scope.widget.emit = emit;
        $scope.widget.on = on;
        $scope.widget.once = once;
        $scope.widget.getWidget = getWidget;
        $scope.widget.getShared = getShared;
        $scope.widget.getFrame = getFrame;
        $scope.widget.getWidgetTab = getWidgetTab;
        $scope.widget.getHandle = getHandle;
        $scope.widget.getMode = getMode;
        $scope.widget.getSelected = getSelected;
        $scope.widget.getEvent = getEvent;
        $scope.widget.getEventCallbacks = getEventCallbacks;
        $scope.widget.getOptions = getOptions;
        $scope.widget.setOptions = setOptions;
        $scope.widget.setWidgetState = setWidgetState;
        $scope.widget.getState = getState;
        $scope.widget.setState = setState;
        $scope.widget.alert = alert;
        $scope.widget.open = open;
        $scope.widget.execute = execute;
        $scope.widget.meta = meta;
        $scope.widget.query = query;

        /**
         * @name emit
         * @desc emit a message from the widget (wrapper method)
         * @param message - message string
         * @param payload - payload to pass into the callback
         */
        function emit(message: string, payload?: any): void {
            let widgetPayload = payload;

            if (!widgetPayload) {
                widgetPayload = {};
            }

            widgetPayload.widgetId = $scope.widget.widgetId;

            semossCoreService.emit(message, widgetPayload);
        }

        /**
         * @name on
         * @desc listen to a message on the widget (wrapper method)
         * @param message - message string
         * @param callback - function to run when message is called
         * @returns destroy - function returned to remove listener from the center
         */
        function on(
            message: string,
            callback: (...args: any) => void
        ): () => void {
            return semossCoreService.on(message, (payload: any) => {
                if (payload && payload.widgetId === $scope.widget.widgetId) {
                    callback.apply(null, [payload]);
                }
            });
        }

        /**
         * @name once
         * @desc listen to a message on the widget (wrapper method)
         * @param  message - message
         * @param  callback - function to run when message is called
         * @returns destroy - function returned to remove listener from the center
         */
        function once(
            message: string,
            callback: (...args: any) => void
        ): () => void {
            return semossCoreService.once(message, (payload: any) => {
                if (payload && payload.widgetId === $scope.widget.widgetId) {
                    callback.apply(null, [payload]);
                }
            });
        }

        /**
         * @name getWidget
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the widget data object based on the accessor. This is the data across the single $scope.widget.
         * @returns the requested data
         */
        function getWidget(accessor?: string): any {
            return semossCoreService.getWidget(
                $scope.widget.widgetId,
                accessor
            );
        }

        /**
         * @name getShared
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data from the insight. This is the data across the whole insight
         * @returns the requested data
         */
        function getShared(accessor?: string): any {
            return semossCoreService.getShared(
                $scope.widget.insightID,
                accessor
            );
        }

        /**
         * @name getFrame
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the frame object for the $scope.widget.
         * @returns the requested data
         */
        function getFrame(accessor?: string): any {
            let cleanedAccessor = '';

            if (accessor) {
                cleanedAccessor += '.' + accessor;
            }

            return getShared('frames.' + getWidget('frame') + cleanedAccessor);
        }

        /**
         * @name getWidgetTab
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data about the handle
         * @returns the requested data
         */
        function getWidgetTab(accessor?: string): any {
            return semossCoreService.getWidgetTab(
                $scope.widget.widgetId,
                accessor
            );
        }

        /**
         * @name getHandle
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data about the handle
         * @returns the requested data
         */
        function getHandle(accessor?: string): any {
            return semossCoreService.getHandle(
                $scope.widget.widgetId,
                accessor
            );
        }

        /**
         * @name getMode
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data about the mode
         * @returns the requested data
         */
        function getMode(accessor?: string): any {
            return semossCoreService.getMode($scope.widget.widgetId, accessor);
        }

        /**
         * @name getSelected
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data about the selected data
         * @returns the requested data
         */
        function getSelected(accessor?: string): any {
            return semossCoreService.getSelected(
                $scope.widget.widgetId,
                accessor
            );
        }

        /**
         * @name getEvent
         * @param accessor - string to get to the object. In the form of 'a.b.c'
         * @desc returns the requested data about the event data
         * @returns {object} the requested data
         */
        function getEvent(accessor?: string): any {
            return semossCoreService.getEvent($scope.widget.widgetId, accessor);
        }

        /**
         * @name getEventCallbacks
         * @desc returns the requested data about the event data
         * @returns the requested data
         */
        function getEventCallbacks(): any {
            return semossCoreService.getEventCallbacks($scope.widget.widgetId);
        }

        /**
         * @name getOptions
         * @param accessor string to get to the object. In the form of 'a.b.c'
         * @desc returns specific data in the options service
         * @returns the requested data
         */
        function getOptions(accessor?: string): any {
            return semossCoreService.getOptions(
                $scope.widget.widgetId,
                accessor
            );
        }

        /**
         * @name setOptions
         * @param accessor what key to set
         * @param value what value to set to the key
         * @desc set a specific key value pair in the options service
         * @returns {void}
         */
        function setOptions(accessor: string, value: any): void {
            semossCoreService.setOptions(
                $scope.widget.widgetId,
                accessor,
                value
            );
        }

        /**
         * @name setWidgetState
         * @param widgetName the name of the widget
         * @param key the key we want to set
         * @param state the value we want to set
         * @desc sets the widget's json state so we can bring it back later
         */
        function setWidgetState(
            widgetName: string,
            key: string,
            state: string
        ): void {
            if (
                !semossCoreService.getOptions(
                    $scope.widget.widgetId,
                    'widgetOptions.' + widgetName
                )
            ) {
                semossCoreService.setOptions(
                    $scope.widget.widgetId,
                    'widgetOptions.' + widgetName,
                    {}
                );
            }

            semossCoreService.setOptions(
                $scope.widget.widgetId,
                'widgetOptions.' + widgetName + '.' + key,
                state
            );
        }

        /**
         * @name getState
         * @param accessor string to get to the object. In the form of 'a.b.c'
         * @desc returns specific data in the state service
         * @returns the requested data
         */
        function getState(accessor?: string): any {
            return semossCoreService.getState($scope.widget.widgetId, accessor);
        }

        /**
         * @name setState
         * @param accessor what key to set
         * @param value what value to set to the key
         * @desc set a specific key value pair in the options service
         */
        function setState(accessor: string, value: any): void {
            semossCoreService.setState($scope.widget.widgetId, accessor, value);
        }

        /**
         * @name alert
         * @param color - color of the alert
         * @param text - text of the alert
         * @desc emit alert from the widget
         * @returns {void}
         */
        function alert(color: string, text: string): void {
            semossCoreService.emit('alert', {
                color: color,
                text: text,
                insightID: $scope.widget.insightID,
            });
        }

        /**
         * @name open
         * @param type - type of item to open
         * @param value - value of the item to open
         * @desc emit to force something to open based on a type
         */
        function open(type: string, value: string): void {
            let changed = false;

            if (type === 'handle') {
                semossCoreService.emit('change-handle', {
                    widgetId: $scope.widget.widgetId,
                    handle: value,
                });

                changed = true;
            } else if (type === 'widget-tab') {
                semossCoreService.emit('change-widget-tab', {
                    widgetId: $scope.widget.widgetId,
                    tab: value,
                });

                changed = true;
            }

            if (changed) {
                const menu = semossCoreService.workspace.getWorkspace(
                    $scope.widget.insightID,
                    'menu'
                );
                if (menu && !menu.open) {
                    menu.open = true;

                    semossCoreService.emit('change-workspace-menu', {
                        insightID: $scope.widget.insightID,
                        options: menu,
                    });
                }
            }
        }

        /**
         * @name execute
         * @param commandList - components to run
         * @param  callback - callback to trigger when done
         * @param listeners - listeners for the execute-pixel (loading screens)
         * @desc execute a pixel
         */
        function execute(
            commandList: any[],
            callback: () => void,
            listeners: string[]
        ): void {
            const payload: PixelPayload = {
                insightID: $scope.widget.insightID,
                commandList: commandList,
                listeners: listeners,
            };

            if (callback) {
                const message =
                    semossCoreService.utility.random('execute-pixel');
                semossCoreService.once(message, callback);

                payload.responseObject = {
                    response: message,
                    widgetId: $scope.widget.widgetId,
                };
            }

            emit('execute-pixel', payload);
        }

        /**
         * @name meta
         * @param commandList - components to run
         * @param callback - callback to trigger when done
         * @param listeners - listeners for the meta-pixel (loading screens)
         * @desc execute a meta pixel
         */
        function meta(
            commandList: any[],
            callback: () => void,
            listeners: string[],
            insightId?: string
        ): void {
            const payload: PixelPayload = {
                insightID: insightId || $scope.widget.insightID,
                commandList: commandList,
                listeners: listeners,
            };

            if (callback) {
                const message =
                    semossCoreService.utility.random('execute-pixel');
                semossCoreService.once(message, callback);

                payload.responseObject = {
                    response: message,
                    widgetId: $scope.widget.widgetId,
                };
            }

            emit('meta-pixel', payload);
        }

        /**
         * @name query
         * @param commandList - components to run
         * @param  callback - callback to trigger when done
         * @param listeners - listeners for the execute-pixel (loading screens)
         * @desc query a meta pixel
         */
        function query(
            commandList: any[],
            callback: () => void,
            listeners: string[]
        ): void {
            const payload: PixelPayload = {
                insightID: semossCoreService.get('queryInsightID'),
                commandList: commandList,
                listeners: listeners,
            };

            if (callback) {
                const message =
                    semossCoreService.utility.random('execute-pixel');
                semossCoreService.once(message, callback);

                payload.responseObject = {
                    response: message,
                    widgetId: $scope.widget.widgetId,
                };
            }

            emit('query-pixel', payload);
        }

        /**
         * @name initialize
         * @desc called when the controller loads
         */
        function initialize(): void {
            $scope.widget.widgetId = $scope.widgetId;
            $scope.widget.insightID = getWidget('insightID');
            $scope.widget.panelId = getWidget('panelId');
        }

        initialize();
    }
}
