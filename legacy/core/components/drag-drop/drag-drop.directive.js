'use strict';

export default angular
    .module('app.drag-drop.directive', [])
    .directive('dragDrop', dragDropDirective);

dragDropDirective.$inject = ['$timeout'];

function dragDropDirective($timeout) {
    dragDropLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'A',
        link: dragDropLink,
        scope: {
            dragDrop: '&',
        },
    };

    function dragDropLink(scope, ele) {
        ele[0].addEventListener('dragover', function (event) {
            event.preventDefault();
        });

        ele[0].addEventListener('drop', function (event) {
            event.preventDefault();
            event.stopPropagation();

            var dropData = event.dataTransfer.getData('text'),
                boundingClientRect = ele[0].getBoundingClientRect();

            $timeout(
                function (d) {
                    if (scope.dragDrop) {
                        scope.dragDrop({
                            data: JSON.parse(d),
                            pos: {
                                top:
                                    event.clientY -
                                    boundingClientRect.top -
                                    window.scrollY +
                                    ele[0].scrollTop,
                                left:
                                    event.clientX -
                                    boundingClientRect.left -
                                    window.scrollX +
                                    ele[0].scrollLeft,
                            },
                        });
                    }
                }.bind(null, dropData)
            );
        });
    }
}
