'use strict';

import './view-loader.scss';
import angular from 'angular';

export default angular
    .module('app.view-loader.directive', [])
    .directive('viewLoader', viewLoader);

viewLoader.$inject = ['$compile', 'semossCoreService'];

function viewLoader($compile: any, semossCoreService: SemossCoreService) {
    viewLoaderLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: viewLoaderLink,
        controller: viewLoaderCtrl,
        template: require('./view-loader.directive.html'),
        controllerAs: 'viewLoader',
    };

    function viewLoaderCtrl() {}

    function viewLoaderLink(scope: any, ele: any, attrs: any, ctrl: any) {
        let updateTaskListener: any,
            updateOrnamentsListener: any,
            compiledEle: any;

        scope.widgetCtrl = ctrl[0];

        /**
         * @name paint
         * @desc paints the visualization
         */
        function paint(): void {
            let tasks = scope.widgetCtrl.getWidget('view.visualization.tasks'),
                output = tasks[0].data.values[0],
                html = '';

            if (compiledEle) {
                compiledEle.parentNode.removeChild(compiledEle);
                compiledEle = undefined;
            }

            // try to parse the result, if it cannot be parsed, then we assume its html
            try {
                // change it to a valid json and then parse..
                output = JSON.parse(output);
            } catch {
                console.log('Cannot parse output.');
            }

            // if html string is being passed back
            if (typeof output === 'string') {
                html = output;
                if (html.indexOf('<img') > -1) {
                    html = html.replace(
                        '<img',
                        '<img style="width: 100%; height: 100%; object-fit: scale-down;"'
                    );
                }

                compiledEle = $compile(
                    '<div id="viewLoader" class="view-loader__container">' +
                        html +
                        '</div>'
                )(scope)[0];
                if (html && html.indexOf('<table') > -1) {
                    compiledEle.firstElementChild.style.width = 'auto';
                    compiledEle.firstElementChild.classList.add('smss--sticky');
                }

                ele[0].appendChild(compiledEle);
            }
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         */
        function initialize(): void {
            updateTaskListener = scope.widgetCtrl.on('update-task', paint);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                paint
            );

            paint();
        }

        initialize();

        scope.$on('$destroy', function () {
            updateTaskListener();
            updateOrnamentsListener();
        });
    }
}
