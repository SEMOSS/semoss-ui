'use strict';

import angular from 'angular';

import './implied-insights.scss';
import './implied-insights.service';

export default angular
    .module('app.implied-insights.directive', ['app.implied-insights.service'])
    .directive('impliedInsights', impliedInsightsDirective);

impliedInsightsDirective.$inject = ['impliedInsightsService'];

function impliedInsightsDirective(impliedInsightsService) {
    impliedInsightsLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./implied-insights.directive.html'),
        scope: {},
        require: ['^insight', '^widget'],
        controllerAs: 'impliedInsights',
        bindToController: {},
        link: impliedInsightsLink,
        controller: impliedInsightsCtrl,
    };

    function impliedInsightsCtrl() {}

    function impliedInsightsLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];
        scope.widgetCtrl = ctrl[1];

        scope.impliedInsights.selectedFrame = '';
        scope.impliedInsights.frameList = [];
        scope.impliedInsights.showHelpOverlay = false;

        scope.impliedInsights.runImpliedInsights = runImpliedInsights;

        /**
         * @name runImpliedInsights
         * @desc calls the implied insights pixel
         */
        function runImpliedInsights(): void {
            let mainFrame = scope.widgetCtrl.getFrame(),
                sheetId = scope.insightCtrl.getWorkbook('worksheetCounter'),
                callback = function (response) {
                    const output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType[0],
                        frames: string[] = [];
                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }
                    for (let i = 0; i < output.length; i++) {
                        const frameName = output[i]
                            ? output[i].value[0].name
                            : output[i];
                        frames.push(frameName);
                    }
                    const commands = impliedInsightsService.createDashboard(
                        true,
                        mainFrame,
                        frames,
                        sheetId
                    );
                    if (commands.length) {
                        scope.widgetCtrl.execute(commands);
                    }
                };
            sheetId++;
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            `${scope.impliedInsights.selectedFrame} | RunImpliedInsights()`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getFrames
         * @desc
         */
        function getFrames(): void {
            const frames = scope.widgetCtrl.getShared('frames') || {},
                current = scope.widgetCtrl.getFrame();
            scope.impliedInsights.frameList = [];
            for (const frame in frames) {
                if (frames.hasOwnProperty(frame)) {
                    scope.impliedInsights.frameList.push(frames[frame].name);
                }
            }
            scope.impliedInsights.selectedFrame = current ? current.name : '';
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            getFrames();

            scope.impliedInsights.helpHtml =
                impliedInsightsService.getHelpHtml() || '';

            scope.$on('$destroy', function () {
                console.log('destroying implied-insights...');
            });
        }

        initialize();
    }
}
