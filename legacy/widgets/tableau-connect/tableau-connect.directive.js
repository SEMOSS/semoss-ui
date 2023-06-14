'use strict';

export default angular
    .module('app.tableau-connect.directive', [])
    .directive('tableauConnect', tableauConnect);

tableauConnect.$inject = [];

function tableauConnect() {
    tableauConnectCtrl.$inject = [];
    tableauConnectLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        template: require('./tableau-connect.directive.html'),
        controllerAs: 'tableauConnect',
        bindToController: {},
        controller: tableauConnectCtrl,
        link: tableauConnectLink,
    };

    function tableauConnectCtrl() {}

    function tableauConnectLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.tableauConnect.numToCollect = 500;
        scope.tableauConnect.connect = connect;

        /**
         * @name connect
         * @desc initiates tableau connection
         * @returns {void}
         */
        function connect() {
            var callback;

            callback = function (response) {
                var type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output,
                    headers = [],
                    headerTypes = [],
                    i;

                if (type.indexOf('ERROR') > -1) {
                    scope.widgetCtrl.alert(
                        'error',
                        'Could not connect to Tableau'
                    );
                    return;
                }

                for (i = 0; i < output.headerInfo.length; i++) {
                    headers.push(output.headerInfo[i].alias);
                    headerTypes.push(output.headerInfo[i].type);
                }

                // loaded from global;
                tableau.connectionData = JSON.stringify([
                    headers,
                    output.data.values,
                    headerTypes,
                ]);
                tableau.connectionName =
                    'Insight_' + scope.widgetCtrl.insightID;
                tableau.submit();
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'queryAll',
                        components: [],
                    },
                    {
                        type: 'collect',
                        components: [scope.tableauConnect.numToCollect],
                        terminal: true,
                    },
                ],
                callback
            );
        }
    }
}
