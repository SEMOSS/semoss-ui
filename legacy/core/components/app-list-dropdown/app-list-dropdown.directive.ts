import angular from 'angular';
import './app-list-dropdown.scss';

export default angular
    .module('app.app-list-dropdown.directive', [])
    .directive('appListDropdown', appListDropdownDirective);

appListDropdownDirective.$inject = [
    '$timeout',
    'ENDPOINT',
    'semossCoreService',
];

function appListDropdownDirective(
    $timeout: ng.ITimeoutService,
    ENDPOINT: EndPoint,
    semossCoreService: SemossCoreService
) {
    appListDropdownCtrl.$inject = [];
    appListDropdownLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./app-list-dropdown.directive.html'),
        scope: {},
        bindToController: {
            model: '=',
            type: '@?',
            change: '&?',
        },
        controller: appListDropdownCtrl,
        controllerAs: 'appListDropdown',
        link: appListDropdownLink,
    };

    function appListDropdownCtrl() {}

    function appListDropdownLink(scope) {
        scope.appListDropdown.options = [];

        scope.appListDropdown.onChange = onChange;

        /**
         * @name onChange
         * @desc called when a new option is selected
         */
        function onChange(): void {
            $timeout(() => {
                if (scope.appListDropdown.change) {
                    scope.appListDropdown.change({
                        list: scope.appListDropdown.options,
                    });
                }
            });
        }

        function initialize(): void {
            const message = semossCoreService.utility.random('message');

            semossCoreService.once(message, (res: PixelReturnPayload) => {
                const output: any = res.pixelReturn[0].output;
                if (res.pixelReturn[0].operationType[0] === 'ERROR') {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Unable to fetch databases.',
                    });

                    return;
                }

                scope.appListDropdown.options = [];
                for (let appIdx = 0; appIdx < output.length; appIdx++) {
                    let id = '',
                        name = '';

                    if (scope.appListDropdown.type === 'database') {
                        id = output[appIdx].database_id;
                        name = output[appIdx].database_name;
                    } else {
                        id = output[appIdx].project_id;
                        name = output[appIdx].project_name;
                    }
                    scope.appListDropdown.options.push({
                        display: String(name).replace(/_/g, ' '),
                        value: id,
                        image:
                            scope.appListDropdown.type === 'database'
                                ? semossCoreService.app.generateDatabaseImageURL(
                                      id
                                  )
                                : semossCoreService.app.generateProjectImageURL(
                                      id
                                  ),
                        type:
                            scope.appListDropdown.type === 'database'
                                ? output[appIdx].app_type
                                : '',
                    });

                    if (
                        scope.appListDropdown.model &&
                        id === scope.appListDropdown.model.value
                    ) {
                        scope.appListDropdown.model =
                            scope.appListDropdown.options[
                                scope.appListDropdown.options.length - 1
                            ];
                    }
                }

                if (!scope.appListDropdown.model) {
                    scope.appListDropdown.model =
                        scope.appListDropdown.options[0];
                    onChange();
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type:
                            scope.appListDropdown.type === 'database'
                                ? 'getDatabaseList'
                                : 'getProjectList',
                        components: [],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        initialize();
    }
}
