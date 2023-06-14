/**
 * @name smss-accordion.directive.js
 * @desc smss-accordion field
 */
export default angular
    .module('smss-style.accordion', [])
    .directive('smssAccordion', smssAccordionDirective)
    .directive('smssAccordionItem', smssAccordionItemDirective);

import './smss-accordion.scss';

smssAccordionDirective.$inject = ['$timeout'];
smssAccordionItemDirective.$inject = [];

function smssAccordionDirective($timeout) {
    smssAccordionController.$inject = [];
    smssAccordionLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: '' + '<div class="smss-accordion" ng-transclude>' + '</div>',
        scope: {
            resizable: '@?',
            resize: '&?',
        },
        bindToController: {
            rotated: '@?',
        },
        transclude: true,
        replace: true,
        controllerAs: 'smssAccordion',
        controller: smssAccordionController,
        link: smssAccordionLink,
    };

    function smssAccordionController() {
        var smssAccordion = this;

        smssAccordion.childScopes = [];

        smssAccordion.register = register;

        /**
         * @name register
         * @param {scope} childScope scope of the newly added accordion item
         * @desc registers the open item
         * @returns {void}
         */
        function register(childScope) {
            smssAccordion.childScopes.push(childScope);

            //TODO: Compile template with attribute
            if (smssAccordion.hasOwnProperty('rotated')) {
                childScope.rotated = true;
            }

            childScope.$on(
                '$destroy',
                function (id) {
                    var i,
                        len,
                        idx = -1;

                    for (
                        i = 0, len = smssAccordion.childScopes.length;
                        i < len;
                        i++
                    ) {
                        if (smssAccordion.childScopes[i].$id === id) {
                            idx = i;
                            break;
                        }
                    }

                    if (idx > -1) {
                        smssAccordion.childScopes.splice(idx, 1);
                    }
                }.bind(null, childScope.$id)
            );
        }
    }

    function smssAccordionLink(scope, ele, attrs) {
        var titleSize = 36,
            accordionRotated,
            accordionResizable,
            accordionEle,
            isResizing,
            selectedIdx,
            previousIdx,
            moved = false;

        scope.smssAccordion.reset = reset;
        scope.smssAccordion.full = full;
        scope.smssAccordion.startResize = startResize;

        /**
         * @name setSize
         * @desc sets the initial size
         * @returns {void}
         */
        function setSize() {
            var i,
                len,
                accordionEleBoundingClientRect =
                    accordionEle.getBoundingClientRect(),
                newSize,
                previousShift = 0;

            if (
                accordionEleBoundingClientRect.width === 0 &&
                accordionEleBoundingClientRect.height === 0
            ) {
                return;
            }

            //size according to the height
            for (
                i = 0, len = scope.smssAccordion.childScopes.length;
                i < len;
                i++
            ) {
                //we add titleSize because it is the minimum size
                if (accordionRotated) {
                    newSize =
                        ((accordionEleBoundingClientRect.width -
                            scope.smssAccordion.childScopes.length *
                                titleSize) *
                            scope.smssAccordion.childScopes[i].size) /
                            100 +
                        titleSize -
                        1;
                    scope.smssAccordion.childScopes[i].style.top = 0;
                    scope.smssAccordion.childScopes[i].style.right =
                        accordionEleBoundingClientRect.width -
                        (previousShift + newSize) +
                        'px';
                    scope.smssAccordion.childScopes[i].style.bottom = 0;
                    scope.smssAccordion.childScopes[i].style.left =
                        previousShift + 'px';
                } else {
                    newSize =
                        ((accordionEleBoundingClientRect.height -
                            scope.smssAccordion.childScopes.length *
                                titleSize) *
                            scope.smssAccordion.childScopes[i].size) /
                            100 +
                        titleSize -
                        1;
                    scope.smssAccordion.childScopes[i].style.top =
                        previousShift + 'px';
                    scope.smssAccordion.childScopes[i].style.right = 0;
                    scope.smssAccordion.childScopes[i].style.bottom =
                        accordionEleBoundingClientRect.height -
                        (previousShift + newSize) +
                        'px';
                    scope.smssAccordion.childScopes[i].style.left = 0;
                }

                previousShift += newSize;
            }

            if (scope.resize) {
                scope.resize();
            }
        }

        /**
         * @name setSizePostDigest
         * @desc called to set size after a digest
         * @returns {void}
         */

        function setSizePostDigest() {
            var sizeTimeout = $timeout(function () {
                setSize();
                $timeout.cancel(sizeTimeout);
            });
        }

        /**
         * @name reset
         * @param {object} size original sizes to reset to
         * @desc reset the accordion to original size
         * @returns {void}
         */
        function reset(size) {
            var i, len;

            if (isResizing) {
                return;
            }

            for (
                i = 0, len = scope.smssAccordion.childScopes.length;
                i < len;
                i++
            ) {
                scope.smssAccordion.childScopes[i].size =
                    scope.smssAccordion.childScopes[i].originalSize;
            }

            setSize();
        }

        /**
         * @name full
         * @param {number} id scope id of the selected accordion item
         * @desc open accordion to be full
         * @returns {void}
         */
        function full(id) {
            var i, len;
            //don't do open if it is resizing, there is some overlap between the events
            if (isResizing) {
                return;
            }

            for (
                i = 0, len = scope.smssAccordion.childScopes.length;
                i < len;
                i++
            ) {
                if (scope.smssAccordion.childScopes[i].$id === id) {
                    scope.smssAccordion.childScopes[i].size = 100;
                    continue;
                }

                scope.smssAccordion.childScopes[i].size = 0;
            }

            setSize();
        }

        /**
         * @name startResize
         * @param {number} id scope id of the selected accordion item
         * @param {event} event - DOM event
         * @desc triggered when the resize event is started
         * @returns {void}
         */
        function startResize(id) {
            var i, len, selectedEle, previousEle, previousId;

            //get selected idx
            selectedIdx = -1;
            selectedEle = ele[0].querySelector('#smss-accordion-item-' + id);
            for (
                i = 0, len = scope.smssAccordion.childScopes.length;
                i < len;
                i++
            ) {
                if (scope.smssAccordion.childScopes[i].$id === id) {
                    selectedIdx = i;
                    break;
                }
            }

            //get previous idx
            previousIdx = -1;
            previousEle = selectedEle.previousElementSibling;

            if (previousEle) {
                previousId = parseInt(
                    previousEle
                        .getAttribute('id')
                        .split('smss-accordion-item-')[1],
                    10
                );

                for (
                    i = 0, len = scope.smssAccordion.childScopes.length;
                    i < len;
                    i++
                ) {
                    if (scope.smssAccordion.childScopes[i].$id === previousId) {
                        previousIdx = i;
                        break;
                    }
                }
            }

            //needs to have a previous sibling element to resize
            if (selectedIdx > -1 && previousIdx > -1) {
                isResizing = true;

                document.addEventListener('mouseup', stopResize);
                document.addEventListener('mousemove', onResize);
                document.addEventListener('touchend', stopResize);
                document.addEventListener('touchmove', onResize);
            }
        }

        /**
         * @name onResize
         * @param {event} event triggered event
         * @desc triggered when the resize event is happening
         * @returns {void}
         */
        function onResize(event) {
            var accordionEleBoundingClientRect =
                    accordionEle.getBoundingClientRect(),
                pos,
                pageX = 0,
                pageY = 0,
                currentBottom,
                previousTop,
                currentRight,
                previousLeft;

            moved = true;

            if (accordionRotated) {
                if (event.type === 'touchmove') {
                    pageX = event.touches[0].pageX;
                } else if (event.type === 'mousemove') {
                    pageX = event.pageX;
                }

                pos =
                    pageX -
                    (window.pageXOffset + accordionEleBoundingClientRect.left);
                currentRight = parseFloat(
                    scope.smssAccordion.childScopes[selectedIdx].style.right
                );
                previousLeft = parseFloat(
                    scope.smssAccordion.childScopes[previousIdx].style.left
                );

                //right bound
                if (
                    accordionEleBoundingClientRect.width -
                        currentRight -
                        titleSize <
                    pos
                ) {
                    pos =
                        accordionEleBoundingClientRect.width -
                        currentRight -
                        titleSize;
                }

                //left bound
                if (pos < previousLeft + titleSize) {
                    pos = previousLeft + titleSize;
                }

                //save positions
                scope.smssAccordion.childScopes[selectedIdx].style.left =
                    pos + 'px';
                scope.smssAccordion.childScopes[previousIdx].style.right =
                    accordionEleBoundingClientRect.width - pos + 'px';
            } else {
                if (event.type === 'touchmove') {
                    pageY = event.touches[0].pageY;
                } else if (event.type === 'mousemove') {
                    pageY = event.pageY;
                }

                pos =
                    pageY -
                    (window.pageYOffset + accordionEleBoundingClientRect.top);
                currentBottom = parseFloat(
                    scope.smssAccordion.childScopes[selectedIdx].style.bottom
                );
                previousTop = parseFloat(
                    scope.smssAccordion.childScopes[previousIdx].style.top
                );

                //bottom bound
                if (
                    accordionEleBoundingClientRect.height -
                        currentBottom -
                        titleSize <
                    pos
                ) {
                    pos =
                        accordionEleBoundingClientRect.height -
                        currentBottom -
                        titleSize;
                }

                //top bound
                if (pos < previousTop + titleSize) {
                    pos = previousTop + titleSize;
                }

                //save positions
                scope.smssAccordion.childScopes[selectedIdx].style.top =
                    pos + 'px';
                scope.smssAccordion.childScopes[previousIdx].style.bottom =
                    accordionEleBoundingClientRect.height - pos + 'px';
            }

            scope.$digest();
        }

        /**
         * @name stopResize
         * @desc triggered when the resize event is stopped
         * @returns {void}
         */
        function stopResize() {
            var accordionEleBoundingClientRect =
                    accordionEle.getBoundingClientRect(),
                availableSize,
                resizeTimeout;

            if (!moved) {
                return;
            }

            moved = false;

            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('touchend', stopResize);
            document.removeEventListener('touchmove', onResize);

            //we need to calculate the new heights in % (and save them in case of resize)
            if (accordionRotated) {
                scope.smssAccordion.childScopes[selectedIdx].size =
                    ((accordionEleBoundingClientRect.width -
                        parseInt(
                            scope.smssAccordion.childScopes[selectedIdx].style
                                .left,
                            10
                        ) -
                        parseInt(
                            scope.smssAccordion.childScopes[selectedIdx].style
                                .right,
                            10
                        ) -
                        titleSize) *
                        100) /
                    (accordionEleBoundingClientRect.width -
                        scope.smssAccordion.childScopes.length * titleSize);
                scope.smssAccordion.childScopes[previousIdx].size =
                    ((accordionEleBoundingClientRect.width -
                        parseInt(
                            scope.smssAccordion.childScopes[previousIdx].style
                                .left,
                            10
                        ) -
                        parseInt(
                            scope.smssAccordion.childScopes[previousIdx].style
                                .right,
                            10
                        ) -
                        titleSize) *
                        100) /
                    (accordionEleBoundingClientRect.width -
                        scope.smssAccordion.childScopes.length * titleSize);
            } else {
                scope.smssAccordion.childScopes[selectedIdx].size =
                    ((accordionEleBoundingClientRect.height -
                        parseInt(
                            scope.smssAccordion.childScopes[selectedIdx].style
                                .top,
                            10
                        ) -
                        parseInt(
                            scope.smssAccordion.childScopes[selectedIdx].style
                                .bottom,
                            10
                        ) -
                        titleSize) *
                        100) /
                    (accordionEleBoundingClientRect.height -
                        scope.smssAccordion.childScopes.length * titleSize);
                scope.smssAccordion.childScopes[previousIdx].size =
                    ((accordionEleBoundingClientRect.height -
                        parseInt(
                            scope.smssAccordion.childScopes[previousIdx].style
                                .top,
                            10
                        ) -
                        parseInt(
                            scope.smssAccordion.childScopes[previousIdx].style
                                .bottom,
                            10
                        ) -
                        titleSize) *
                        100) /
                    (accordionEleBoundingClientRect.height -
                        scope.smssAccordion.childScopes.length * titleSize);
            }

            //auto close
            availableSize =
                scope.smssAccordion.childScopes[selectedIdx].size +
                scope.smssAccordion.childScopes[previousIdx].size;

            //if the previous is less than 5% auto close, and set the selected to the availableHeight;
            //if the selected is less than 5% auto close, and set the previous to the availableHeight;
            if (scope.smssAccordion.childScopes[previousIdx].size < 5) {
                scope.smssAccordion.childScopes[selectedIdx].size =
                    availableSize;
                scope.smssAccordion.childScopes[previousIdx].size = 0;
            } else if (scope.smssAccordion.childScopes[selectedIdx].size < 5) {
                scope.smssAccordion.childScopes[selectedIdx].size = 0;
                scope.smssAccordion.childScopes[previousIdx].size =
                    availableSize;
            }

            //clear
            selectedIdx = -1;
            previousIdx = -1;

            //done resizing
            resizeTimeout = $timeout(function () {
                isResizing = false;
                $timeout.cancel(resizeTimeout);
            });
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('resizable')) {
                accordionResizable = true;
                window.addEventListener('resize', setSizePostDigest);
            }

            if (attrs.hasOwnProperty('rotated')) {
                accordionRotated = true;
            }

            //get the eles
            accordionEle = ele[0];

            var sizeTimeout = $timeout(function () {
                setSize();

                //listener for size changes
                scope.$watch(
                    function () {
                        var i,
                            len,
                            sizeString = '';

                        //get the new ones
                        for (
                            i = 0, len = scope.smssAccordion.childScopes.length;
                            i < len;
                            i++
                        ) {
                            sizeString +=
                                scope.smssAccordion.childScopes[i].size + '-';
                        }

                        return sizeString;
                    },
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            setSizePostDigest();
                        }
                    }
                );

                //listener for container changes
                scope.$watch(
                    function () {
                        return (
                            accordionEle.offsetHeight +
                            '-' +
                            accordionEle.offsetWidth
                        );
                    },
                    function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            setSize();
                        }
                    }
                );

                $timeout.cancel(sizeTimeout);
            });
        }

        initialize();

        scope.$on('$destroy', function () {
            if (accordionResizable) {
                window.removeEventListener('resize', setSizePostDigest);
            }
        });
    }
}

function smssAccordionItemDirective() {
    smssAccordionItemLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template:
            '' +
            ' <div id="{{\'smss-accordion-item-\' + $id}}" class="smss-accordion-item" ng-class="{\'smss-accordion-item--disabled\': disabled}" ng-style="style">' +
            '    <div id="smss-accordion-item__resizer" class="smss-accordion-item__resizer" ng-class="{\'smss-accordion-item__resizer--rotated\': rotated}"></div>' +
            '    <div class="smss-accordion-item__header" tabindex="-1" ng-click="full($event)" ng-dblclick="reset($event)" ng-class="{\'smss-accordion-item__header--opened\': (size > 0), \'smss-accordion-item__header--rotated\': rotated}">' +
            '        <div id="smss-accordion-item__header__spacer" class="smss-accordion-item__header__spacer" ng-class="{\'smss-accordion-item__header__spacer--rotated\': rotated, \'smss-accordion-item__header__spacer--opened\': (size > 0)}"> </div>' +
            '        <h6 class="smss-accordion-item__header__text" ng-class="{\'smss-accordion-item__header__text--rotated\': rotated}">' +
            '            <span>{{name}}</span>' +
            '        </h6>' +
            '        <i class="smss-accordion-item__header__chevron" ng-class="{\'smss-accordion-item__header__chevron--closed\': size === 0, \'smss-accordion-item__header__chevron--rotated\': rotated}"></i>' +
            '    </div>' +
            '    <div class="smss-accordion-item__content" ng-class="{\'smss-accordion-item__content--rotated\': rotated, \'smss-accordion-item__content--closed\': size === 0}" ng-show="size > 0" ng-transclude> </div>' +
            '</div>',
        scope: {
            name: '=',
            size: '=?',
            disabled: '=?ngDisabled',
        },
        require: '^smssAccordion',
        transclude: true,
        replace: true,
        link: smssAccordionItemLink,
    };

    function smssAccordionItemLink(scope, ele, attrs, ctrl) {
        var resizerEle, headerSpacerEle;

        scope.smssAccordion = ctrl;
        scope.reset = reset;
        scope.full = full;
        scope.startResize = startResize;

        /**
         * @name reset
         * @desc called when a header is dbl clicked
         * @param {event} event - dom event
         * @returns {void}
         */
        function reset(event) {
            event.stopPropagation();

            scope.smssAccordion.reset();
        }

        /**
         * @name full
         * @desc called when a header is clicked
         * @param {event} event - dom event
         * @returns {void}
         */
        function full(event) {
            event.stopPropagation();

            //send message to open as full
            scope.smssAccordion.full(scope.$id);
        }

        /**
         * @name startResize
         * @desc called when a header is resized
         * @param {event} event - dom event
         * @returns {void}
         */
        function startResize(event) {
            event.stopPropagation();
            event.preventDefault();

            //send message to open
            scope.smssAccordion.startResize(scope.$id);
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            //if style is not defined, define an empty object (this will be filled in later)
            if (!scope.style) {
                scope.style = {};
            }

            //if size is not defined, set it to zero (closed)
            if (!scope.size) {
                scope.size = 0;
            }

            scope.originalSize = scope.size;

            // add events
            resizerEle = ele[0].querySelector('#smss-accordion-item__resizer');
            headerSpacerEle = ele[0].querySelector(
                '#smss-accordion-item__header__spacer'
            );

            resizerEle.addEventListener('mousedown', startResize);
            headerSpacerEle.addEventListener('mousedown', startResize);
            resizerEle.addEventListener('touchstart', startResize);
            headerSpacerEle.addEventListener('touchstart', startResize);

            scope.$on('$destroy', function () {
                resizerEle.removeEventListener('mousedown', startResize);
                headerSpacerEle.removeEventListener('mousedown', startResize);
                resizerEle.removeEventListener('touchstart', startResize);
                headerSpacerEle.removeEventListener('touchstart', startResize);
            });

            scope.smssAccordion.register(scope);
        }

        initialize();
    }
}
