'use strict';
import angular from 'angular';

export default angular
    .module('app.project.project-smss', [])
    .directive('projectSmss', projectSmssDirective);

import './project-smss.scss';

projectSmssDirective.$inject = [
    'semossCoreService',
    'monolithService',
    '$state',
];

function projectSmssDirective(semossCoreService, monolithService, $state) {
    projectSmssCtrl.$inject = [];
    projectSmssLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./project-smss.directive.html'),
        bindToController: {
            project: '=',
        },
        controller: projectSmssCtrl,
        controllerAs: 'projectSmss',
        scope: {},
        link: projectSmssLink,
    };

    function projectSmssCtrl() {}

    function projectSmssLink(scope, ele) {
        scope.projectSmss.text = '';

        scope.projectSmss.updateSmssFile = updateSmssFile;

        /**
         * @name updateSmssFile
         * @desc executes the query that updates the Smss file
         * @returns {void}
         */
        function updateSmssFile() {
            monolithService
                .updateProjectSmssFile(
                    scope.projectSmss.project,
                    scope.projectSmss.text
                )
                .then(function () {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Project SMSS File has been updated.',
                    });
                });
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {}

        initialize();
    }
}
