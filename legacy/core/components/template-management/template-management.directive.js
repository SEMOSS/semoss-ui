'use strict';

/**
 * @name templateManagement
 * @desc TemplateManagement Landing Page to display list of all the templates

 */
export default angular
    .module('app.template-management.directive', [])
    .directive('templateManagement', templateManagementDirective);

import './template-management.scss';

import './create-template/create-template.directive.js';

templateManagementDirective.$inject = [
    '$transitions',
    '$stateParams',
    'semossCoreService',
];

function templateManagementDirective(
    $transitions,
    $stateParams,
    semossCoreService
) {
    templateManagementDirectiveCtrl.$inject = [];
    templateManagementDirectiveLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {},
        controller: templateManagementDirectiveCtrl,
        link: templateManagementDirectiveLink,
        template: require('./template-management.directive.html'),
        bindToController: {
            appId: '=',
        },
        controllerAs: 'templateManagement',
    };

    function templateManagementDirectiveCtrl() {}

    function templateManagementDirectiveLink(scope) {
        scope.templateManagement.queryInsightID =
            semossCoreService.get('queryInsightID');
        scope.templateManagement.activeTemplate = null;
        scope.templateManagement.allTemplates = [];
        scope.templateManagement.showTemplateModal = false;
        scope.templateManagement.showDeleteModal = false;

        scope.templateManagement.onOverlayHide = onOverlayHide;
        scope.templateManagement.newTemplate = newTemplate;
        scope.templateManagement.showEditTemplate = showEditTemplate;
        scope.templateManagement.onEditTemplateClose = onEditTemplateClose;
        scope.templateManagement.showDeleteTemplate = showDeleteTemplate;
        scope.templateManagement.closeDeleteTemplate = closeDeleteTemplate;
        scope.templateManagement.confirmDeleteTemplate = confirmDeleteTemplate;

        /**
         * @name getAllTemplates
         * @desc get all templates
         * @returns {void}
         */
        function getAllTemplates() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;

                // clear the templates list
                scope.templateManagement.allTemplates = [];

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: output,
                    });

                    return;
                }

                // add each template to the template list
                for (let templateName in output) {
                    if (output.hasOwnProperty(templateName)) {
                        scope.templateManagement.allTemplates.push({
                            templateName: templateName,
                            fileName: output[templateName],
                        });
                    }
                }
            });
            // Runs pixel query to get the list of all templates
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'getTemplateList',
                        components: [scope.templateManagement.appId],
                        meta: true,
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name onOverlayHide
         * @desc callback that is called when the overlay is closed
         * @returns {void}
         */
        function onOverlayHide() {
            // clear the active template
            scope.templateManagement.activeTemplate = null;
        }

        /**
         * @name newTemplate
         * @desc create new template
         * @returns {void}
         */
        function newTemplate() {
            // active template to edit, this is intentionally null
            scope.templateManagement.activeTemplate = null;

            // open the correct model
            scope.templateManagement.showDeleteModal = false;
            scope.templateManagement.showTemplateModal = true;
        }

        /**
         * @name showEditTemplate
         * @param {*} template - template to edit
         * @desc allows user to edit a template
         * @return {void}
         */
        function showEditTemplate(template) {
            // active template to edit
            scope.templateManagement.activeTemplate = JSON.parse(
                JSON.stringify(template)
            );

            // open the correct model
            scope.templateManagement.showDeleteModal = false;
            scope.templateManagement.showTemplateModal = true;
        }

        /**
         * @name onEditTemplateClose
         * @param {boolean} isCreated - was a new templated created
         * @desc callback that is fired when the template is dont being created
         * @return {void}
         */
        function onEditTemplateClose(isCreated) {
            if (isCreated) {
                getAllTemplates();
            }

            // close the correct model
            scope.templateManagement.showDeleteModal = false;
            scope.templateManagement.showTemplateModal = false;
        }

        /**
         * @name showDeleteTemplate
         * @param {*} template - template to delete
         * @desc allows user to delete a template
         * @return {void}
         */
        function showDeleteTemplate(template) {
            scope.templateManagement.activeTemplate = template;

            // open the correct model
            scope.templateManagement.showDeleteModal = true;
            scope.templateManagement.showTemplateModal = false;
        }

        /**
         * @name closeDeleteTemplate
         * @desc close the delete
         * @return {void}
         */
        function closeDeleteTemplate() {
            // close the correct model
            scope.templateManagement.showDeleteModal = false;
            scope.templateManagement.showTemplateModal = false;
        }

        /**
         * @name confirmDeleteTemplate
         * @desc allows user to delete a template
         * @return {void}
         */
        function confirmDeleteTemplate() {
            const template = scope.templateManagement.activeTemplate,
                message = semossCoreService.utility.random('query-pixel');

            if (!template) {
                return;
            }

            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;
                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: output,
                    });
                    return;
                }

                semossCoreService.emit('alert', {
                    color: 'success',
                    text: 'Template Deleted',
                });

                // close the model
                closeDeleteTemplate();

                // get the templates again
                getAllTemplates();
            });

            // Runs pixel query to delete the template
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteTemplate',
                        components: [
                            scope.templateManagement.appId,
                            template.templateName,
                            template.fileName,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name initialize
         * @desc intialize function
         * @returns {void}
         */
        function initialize() {
            if (scope.templateManagement.appId) {
                getAllTemplates();
            }
        }

        initialize();
    }
}
