'use strict';
export default angular
    .module('app.drag-item.directive', [])
    .directive('dragItem', dragItemDirective);

dragItemDirective.$inject = [];

function dragItemDirective() {
    dragItemLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'A',
        link: dragItemLink,
        scope: {
            dragItem: '=',
        },
    };

    function dragItemLink(scope, ele) {
        ele[0].setAttribute('draggable', true);
        ele[0].addEventListener('dragstart', function (event) {
            event.dataTransfer.setData('text', JSON.stringify(scope.dragItem));
        });
    }
}
