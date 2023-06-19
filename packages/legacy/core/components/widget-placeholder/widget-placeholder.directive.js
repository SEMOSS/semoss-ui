export default angular
    .module('app.widget-placeholder.directive', [])
    .directive('widgetPlaceholder', widgetPlaceholderDirective);

widgetPlaceholderDirective.$inject = ['semossCoreService'];

import './widget-placeholder.scss';

/**
 * @name widgetPlaceholderDirective
 * @desc serves as a placeholder for when there is no widget selected
 * @param {function} semossCoreService semoss core service
 * @returns {void}
 */
function widgetPlaceholderDirective() {
    widgetModeCtrl.$inject = [];
    widgetModeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: [],
        scope: {},
        bindToController: {},
        controller: widgetModeCtrl,
        link: widgetModeLink,
        controllerAs: 'widgetPlaceholder',
        template: require('./widget-placeholder.directive.html'),
    };

    function widgetModeCtrl() {}

    function widgetModeLink(scope, ele, attrs, ctrl) {}
}
