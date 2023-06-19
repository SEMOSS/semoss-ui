'use strict';

import angular from 'angular';
import './out-of-memory.scss';

export default angular
    .module('app.out-of-memory.directive', [])
    .directive('outOfMemory', outOfMemoryDirective);

outOfMemoryDirective.$inject = [];

function outOfMemoryDirective() {
    outOfMemoryCtrl.$inject = [];

    return {
        restrict: 'E',
        require: [],
        template: require('./out-of-memory.directive.html'),
        controller: outOfMemoryCtrl,
        link: outOfMemoryLink,
        bindToController: {},
        controllerAs: 'outOfMemory',
    };

    function outOfMemoryCtrl() {}

    function outOfMemoryLink(scope, ele) {}
}
