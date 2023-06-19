'use strict';

/**
 * @name form-loader
 * @desc form html builder view
 */
export default angular
    .module('app.form-loader.directive', [])
    .directive('formLoader', formLoaderDirective);

import './form-loader.scss';

formLoaderDirective.$inject = ['$compile', '$timeout', 'semossCoreService'];

function formLoaderDirective($compile, $timeout, semossCoreService) {
    formLoader.$inject = [];
    formLoaderLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./form-loader.directive.html'),
        scope: {},
        controller: formLoader,
        controllerAs: 'formLoader',
        bindToController: {
            json: '=',
        },
        require: ['^formBuilder', '?^widget'],
        link: formLoaderLink,
    };

    function formLoader() {}

    function formLoaderLink(scope, ele, attrs, ctrl) {
        scope.form = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        /**
         * @name initialize
         * @desc function that will initialize
         * @returns {void}
         */
        function initialize() {
            // var formOptions = scope.widgetCtrl.getWidget('view.form-builder.options.json');

            if (scope.formLoader.json) {
                scope.form.setData(scope.formLoader.json);
            }
        }

        initialize();
    }
}
