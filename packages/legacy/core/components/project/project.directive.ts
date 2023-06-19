'use strict';

import angular from 'angular';
import './project-user/project-user.directive';
import './project-admin/project-admin.directive';
import './project-smss/project-smss.directive';

export default angular
    .module('app.project.directive', [
        'app.project.project-user',
        'app.project.project-admin',
        'app.project.project-smss',
    ])
    .directive('project', projectDirective);

import './project.scss';

projectDirective.$inject = [
    '$state',
    '$stateParams',
    'semossCoreService',
    'monolithService',
];

function projectDirective(
    $state,
    $stateParams,
    semossCoreService,
    monolithService
) {
    projectCtrl.$inject = [];
    projectLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: [],
        restrict: 'E',
        template: require('./project.directive.html'),
        controller: projectCtrl,
        link: projectLink,
        scope: {},
        bindToController: {},
        controllerAs: 'project',
    };

    function projectCtrl() {}

    function projectLink(scope, ele, attrs, ctrl) {
        scope.project.page = {
            // default to all but this gets overriden if security is enabled
            options: [
                {
                    display: 'Access',
                    value: 'MEMBER',
                    tourId: 'project__semoss-tour-access',
                },
                {
                    display: 'Insights',
                    value: 'INSIGHT',
                    tourId: 'project__semoss-tour-insights',
                },
                {
                    display: 'Templates',
                    value: 'TEMPLATE',
                    tourId: 'project__semoss-tour-templates',
                },
                {
                    display: 'Update SMSS',
                    value: 'SMSS',
                },
            ],
            selected: 'MEMBER',
        };

        scope.project.tags = {
            options: [
                'blue',
                'orange',
                'teal',
                'purple',
                'yellow',
                'pink',
                'violet',
                'olive',
            ],
            mapping: {},
        };

        scope.project.projectId = '';
        scope.project.projectInfo = {};
        scope.project.isEditOpen = false;

        scope.project.changePage = changePage;
        scope.project.exportProject = exportProject;
        scope.project.currentUserPermission = currentUserPermission;
        scope.project.userPermission = '';

        /**
         * @name changePage
         * @desc changes the page
         * @param page the page to change to
         */
        function changePage(page: string): void {
            scope.project.page.selected = page;
        }

        /**
         * @name getProjectId
         * @desc gets the project id from the url
         */
        function getProjectId(): void {
            scope.project.projectId = $stateParams.projectId;
            if (scope.project.projectId.length) {
                currentUserPermission();
                getProjectInfo();
            }
        }

        /**
         * @name shouldRedirect
         * @param shouldRedirect
         */
        function currentUserPermission(shouldRedirect = true) {
            monolithService
                .getUserProjectPermission(scope.project.projectId)
                .then(function (response) {
                    if (response.data.permission) {
                        if (
                            response.data.permission === 'READ_ONLY' &&
                            shouldRedirect
                        ) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: 'User does not have permission to view this page.',
                            });
                            $state.go('home.landing');
                        }
                        scope.project.userPermission = response.data.permission;
                    }

                    scope.project.page.options = [
                        {
                            display: 'Access',
                            value: 'MEMBER',
                            tourId: 'project__semoss-tour-access',
                        },
                        {
                            display: 'Insights',
                            value: 'INSIGHT',
                            tourId: 'project__semoss-tour-insights',
                        },
                        {
                            display: 'Templates',
                            value: 'TEMPLATE',
                            tourId: 'project__semoss-tour-templates',
                        },
                    ];
                    if (response.data.permission === 'OWNER') {
                        scope.project.page.options.push({
                            display: 'Update SMSS',
                            value: 'SMSS',
                        });
                    }
                });
        }

        /**
         * @name getProjectImage
         * @desc gets the url for the project's image
         * @returns the image's url
         */
        function getProjectImage(): string {
            const imageUpdates = semossCoreService.getOptions('imageUpdates');

            if (imageUpdates[scope.project.projectId]) {
                return imageUpdates[scope.project.projectId];
            }

            return semossCoreService.app.generateProjectImageURL(
                scope.project.projectId
            );
        }

        /**
         * @name getProjectInfo
         * @desc gets information about the project
         */
        function getProjectInfo(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    if (output.tag) {
                        // if single tag - setup as an array
                        if (!Array.isArray(output.tag)) {
                            output.tag = [output.tag];
                        }
                        for (let i = 0; i < output.tag.length; i++) {
                            setTagColor(output.tag[i]);
                        }
                    }

                    scope.project.projectInfo = output;
                    scope.project.projectInfo.image = getProjectImage();
                }
            );
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'projectInfo',
                        components: [scope.project.projectId],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }
        /**
         * @name exportProject
         * @desc Generates a ZIP file containing the project
         */
        function exportProject(): void {
            const message = semossCoreService.utility.random('export');

            // register message to come back to
            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType,
                        insightID = response.insightID;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    monolithService.downloadFile(insightID, output);

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully exported project: ' +
                            scope.project.projectId,
                    });
                }
            );

            semossCoreService.emit('meta-pixel', {
                insightID: 'new',
                commandList: [
                    {
                        meta: true,
                        type: 'exportProject',
                        components: [scope.project.projectId],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name setTagColor
         * @desc sets the tag color pseudo-randomly
         * @param tag - name of tag
         */
        function setTagColor(tag: string): void {
            if (!scope.project.tags.mapping.hasOwnProperty(tag)) {
                const charCode = tag
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b);
                const color = scope.project.tags.options[charCode % 8];
                scope.project.tags.mapping[tag] = color;
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            const projectListener = semossCoreService.on(
                'update-app',
                function () {
                    scope.project.projectInfo.image = getProjectImage();
                }
            );
            getProjectId();

            scope.$watch(
                'project.projectInfo.tag',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        for (let i = 0; i < newValue.length; i++) {
                            setTagColor(newValue[i]);
                        }
                    }
                }
            );

            scope.$on('destroy', function () {
                projectListener();
            });
        }

        initialize();
    }
}
