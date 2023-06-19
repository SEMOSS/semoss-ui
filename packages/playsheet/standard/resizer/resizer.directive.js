(function () {
    'use strict';

    /**
     * @name Resizer
     * @desc Create a draggable bar to resize html elements
     */
    angular.module('app.resizer.directive', [])
        .directive('resizer', resizer);

    resizer.$inject = ['$document'];

    function resizer($document) {

        resizerLink.$inject = ["scope", "ele", "attrs"];

        return {
            restrict: 'A',
            scope: {
                resizer: "=",
                resizerLeft: "=",
                resizerRight: "=",
                resizerTop: "=",
                resizerBottom: "=",
                maxHeight: "=",
                minHeight: "=",
                resizerHeight: "=",
                resizerWidth: "=",
                widthToggle: "=",
                rightOffset: "=",
                rightLimit: "=",
                afterResize: "&"
            },
            link: resizerLink
        };

        function resizerLink(scope, ele, attrs) {
            ele.on('mousedown', function (event) {
                event.preventDefault();
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            function mousemove(event) {
                if (scope.resizer === 'vertical') {
                    // Handle vertical resizer
                    var parentWidth = ele[0].offsetParent.offsetWidth;
                    var resizerWidth = ele[0].clientWidth;
                    var width = parentWidth - resizerWidth;

                    var offsetLeft = ele.parent()[0].getBoundingClientRect().left;
                    var offsetRight = ele.parent()[0].getBoundingClientRect().right;
                    var x = event.pageX - offsetLeft;

                    if (x < 0) {
                        x = 0;
                    }

                    if (width && x > width) {
                        x = parseInt(width);
                    }

                    if (scope.rightLimit && event.pageX > (width - scope.rightLimit)) {
                        //do nothing
                    } else {
                        if (scope.widthToggle === 'true') {
                            if (x < scope.resizerWidth) {
                                x = scope.resizerWidth;
                            }
                            /*ele.css({
                                right: parentWidth - x + 'px'
                            });*/
                            ele.css({
                                right: (parentWidth - x) * 100 / parentWidth + '%'
                            });
                        } else {
                            ele.css({
                                left: x + 'px'
                            });
                        }

                        if (scope.resizerLeft) {
                            document.getElementById(scope.resizerLeft).style.width = x + 'px';
                        }

                        if (scope.resizerRight) {
                            if (scope.widthToggle === 'true') {
                                //document.getElementById(scope.resizerRight).style.width = parentWidth - x - scope.rightOffset + 'px';
                                document.getElementById(scope.resizerRight).style.width = (parentWidth - x - scope.rightOffset) * 100 / parentWidth + '%';
                            } else {
                                document.getElementById(scope.resizerRight).style.left = (x + parseInt(scope.resizerWidth)) + 'px';                            
                            }
                        }
                    }

                } else if (scope.resizer === 'horizontal') {
                    // Handle horizontal resizer
                    var parentHeight = ele[0].offsetParent.offsetHeight;
                    var resizerHeight = ele[0].clientHeight;
                    var height = parentHeight - resizerHeight;
                    var offset = ele.parent()[0].getBoundingClientRect().top;
                    var y = offset + height - event.pageY;

                    if (y < 0) {
                        y = 0;
                    }

                    if (height && y > height) {
                        y = height;
                    }

                    if (scope.maxHeight && y > scope.maxHeight) {
                        y = parseInt(scope.maxHeight);
                    }

                    if (scope.minHeight && y < scope.minHeight) {
                        y = parseInt(scope.minHeight);
                    }

                    ele.css({
                        bottom: y + 'px'
                    });

                    if (scope.resizerTop) {
                        document.getElementById(scope.resizerTop).style.bottom = (y + parseInt(scope.resizerHeight)) + 'px';
                    }

                    if (scope.resizerBottom) {
                        document.getElementById(scope.resizerBottom).style.height = y + 'px';
                    }
                }

                //execute callback
                if (scope.afterResize) {
                    scope.afterResize();
                }
            }

            function mouseup() {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
            }

        }

    }

})();