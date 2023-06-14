/**
 * Enables a list of elements to be verticaly reordered. Doesn't mutate state.
 * Instead, it emits the current and new index of a repositioned element.
 */

export default angular
    .module('smss-style.reorder-list', [])
    .directive('smssReorderList', smssReorderList);

smssReorderList.$inject = ['$timeout'];

function smssReorderList($timeout) {
    return {
        restrict: 'A',
        scope: {
            onReorder: '&',
        },
        link: smssReorderListLink,
    };

    function smssReorderListLink(scope, ele) {
        let dropLine,
            children,
            computedStyle,
            currentIndex,
            currentTarget,
            currentTargetParent,
            draggedRectTop,
            draggingEl,
            loopId,
            marginBottom,
            marginTop,
            newIndex,
            previousLoopId,
            previousRequestId,
            scrollIntervalId,
            shiftX,
            shiftY,
            startParentRect,
            startRect,
            totalHeight,
            translateYs;

        /**
         * Creates clone of dragged element, hides actual element, and stores data used while dragging
         * @param  {MouseEvent} e
         */
        function startDrag(e) {
            // Cancel if target is root
            if (e.target === this) {
                return;
            }

            // Order of variables matters here
            currentTarget = e.target.closest('li');
            currentTargetParent = currentTarget.parentNode;
            children = Array.from(currentTargetParent.children);
            currentIndex = children.indexOf(currentTarget);
            newIndex = currentIndex;
            startRect = currentTarget.getBoundingClientRect();
            startParentRect = currentTargetParent.getBoundingClientRect();
            shiftX = e.clientX - startRect.left;
            shiftY = e.clientY - startRect.top;
            computedStyle = window.getComputedStyle(currentTarget);
            marginTop = parseInt(computedStyle.marginTop, 10);
            marginBottom = parseInt(computedStyle.marginBottom, 10);
            totalHeight = Math.ceil(
                startRect.height + marginTop + marginBottom
            );
            translateYs = children.map(function (node) {
                return [startParentRect.top + node.offsetTop, 0, 0, false];
            });
            loopId = 0;

            // Hide current target
            currentTarget.style.opacity = '0';

            // Prevents highlighting for some browsers
            currentTargetParent.style.userSelect = 'none';
            currentTargetParent.style.zIndex = 1;

            // Create a copy of to be dragged element
            draggingEl = currentTarget.cloneNode(true);
            draggingEl.style.cursor = 'grabbing';
            draggingEl.style.listStyle = 'none';
            draggingEl.style.opacity = '1';
            draggingEl.style.position = 'absolute';
            draggingEl.style.transform = transform(
                startRect.left,
                startRect.top
            );
            draggingEl.style.transition = 'none';
            draggingEl.style.width = startRect.width + 'px';
            draggingEl.style.willChange = 'transform';
            draggingEl.style.zIndex = 1000;

            // Add drop line
            dropLine = document.createElement('div');
            dropLine.style.backgroundColor = 'black';
            dropLine.style.height = '1px';
            dropLine.style.width = startRect.width + 'px';
            dropLine.style.position = 'absolute';
            dropLine.style.zIndex = 1001;

            // Prepare all items to be moved
            requestAnimationFrame(function () {
                for (let i = 0; i < children.length; i += 1) {
                    children[i].style.willChange = 'transform';
                    children[i].style.transform = 'translateZ(0)';
                    children[i].style.transition =
                        '0.3s cubic-bezier(0.2, 1, 0.1, 1)';
                }
            });

            document.body.appendChild(draggingEl);
            document.body.appendChild(dropLine);

            document.addEventListener('mousemove', dragElement);
            document.addEventListener('mouseup', stopDrag);
        }

        /**
         * Creates a translate string used for CSS transform
         * @param  {string | number} x
         * @param  {string | number} y
         * @return {string}
         */
        function transform(x, y) {
            return (
                'translate(' +
                parseFloat(x).toFixed(3) +
                'px,' +
                parseFloat(y).toFixed(3) +
                'px) translateZ(0)'
            );
        }

        /**
         * Animates dragged element to ending position, updates DOM, then emits new position if state needs to be updated
         * @param  {MouseEvent} e
         */
        function stopDrag() {
            const hasIndexChanged = newIndex !== currentIndex;
            const position =
                newIndex < currentIndex ? 'beforebegin' : 'afterend';

            clearScrollInterval();

            document.removeEventListener('mousemove', dragElement);
            document.removeEventListener('mouseup', stopDrag);

            document.body.removeChild(dropLine);

            if (hasIndexChanged) {
                children[newIndex].insertAdjacentElement(
                    position,
                    currentTarget
                );

                requestAnimationFrame(function () {
                    const translateY =
                        translateYs[newIndex][0] -
                        currentTargetParent.scrollTop;

                    draggingEl.style.transition =
                        '0.3s cubic-bezier(0.2, 1, 0.1, 1)';
                    draggingEl.style.transform = transform(
                        startRect.left,
                        translateY
                    );

                    for (let i = 0; i < children.length; i += 1) {
                        if (translateYs[i][1] === 0) continue;

                        children[i].style.transition = 'none';
                        children[i].style.transform = transform(0, 0);
                    }

                    $timeout(function () {
                        draggingEl.style.zIndex = 0;
                        currentTarget.style.opacity = '1';

                        if (document.body.contains(draggingEl)) {
                            document.body.removeChild(draggingEl);
                        }

                        $timeout(function () {
                            scope.onReorder({
                                currentIndex: currentIndex,
                                newIndex: newIndex,
                            });
                        });
                    }, 300);
                });
            } else {
                requestAnimationFrame(function () {
                    draggingEl.style.transition =
                        '0.3s cubic-bezier(0.2, 1, 0.1, 1)';
                    draggingEl.style.transform = transform(
                        startRect.left,
                        startRect.top
                    );

                    for (let i = 0; i < children.length; i += 1) {
                        if (translateYs[i][1] === 0) continue;

                        children[i].style.transition = 'none';
                        children[i].style.transform = transform(0, 0);
                    }

                    $timeout(function () {
                        draggingEl.style.zIndex = 0;
                        currentTarget.style.opacity = '1';

                        if (document.body.contains(draggingEl)) {
                            document.body.removeChild(draggingEl);
                        }
                    }, 300);
                });
            }
        }

        /**
         * Animates dragging of element and moves elements that will shift after dragging
         * @param  {MouseEvent} e
         */
        function dragElement(e) {
            loopId += 1;
            newIndex = currentIndex;
            draggedRectTop = draggingEl.getBoundingClientRect().top;
            previousLoopId = loopId;

            clearScrollInterval();

            if (previousRequestId) {
                cancelAnimationFrame(previousRequestId);
            }

            // Scroll up or down container when holding drag element respective to
            // TODO: Determine scroll speed by distance of item being dragged relative to its container
            if (
                e.pageY - shiftY >
                startParentRect.top + startParentRect.height - startRect.height
            ) {
                scrollIntervalId = setInterval(function () {
                    scroll('down', 2);
                    dragElement(e);
                });
            } else if (
                e.pageY - shiftY <
                startParentRect.top - startRect.height
            ) {
                scrollIntervalId = setInterval(function () {
                    scroll('up', 2);
                    dragElement(e);
                });
            }

            // This keeps the drag target inside the container
            // Note: This isn't working fully as expected
            if (
                draggedRectTop + totalHeight / 2 >
                startParentRect.top + startParentRect.height
            ) {
                draggedRectTop =
                    startParentRect.top +
                    startParentRect.height +
                    currentTargetParent.scrollTop -
                    totalHeight;
            } else if (draggedRectTop + totalHeight / 2 < startParentRect.top) {
                draggedRectTop =
                    startParentRect.top + currentTargetParent.scrollTop;
            } else {
                draggedRectTop += currentTargetParent.scrollTop;
            }

            // Determine which elements have moved relative to dragged element's original position
            for (let i = 0; i < children.length; i += 1) {
                // Kill loop if user is dragging still to prevent unneccessary calculations
                if (previousLoopId !== loopId) {
                    break;
                }

                // Determine if an item will shift up or down, track where new index is
                // if (draggedRectTop + (totalHeight / 2) <= translateYs[i][0]) {
                if (draggedRectTop <= translateYs[i][0]) {
                    translateYs[i][1] = i < currentIndex ? totalHeight : 0;

                    if (i < newIndex) {
                        newIndex = i;
                    }
                } else {
                    translateYs[i][1] = i < currentIndex ? 0 : -totalHeight;

                    if (i > newIndex) {
                        newIndex = i;
                    }
                }

                // Schedule to update elements that have shifted
                if (translateYs[i][1] !== translateYs[i][2]) {
                    translateYs[i][3] = true;
                }
            }

            // We want to prevent jank and maintain a smooth dragging experience
            // See this article for more info:
            // https://developers.google.com/web/fundamentals/performance/rendering
            // Expected performance can be viewed in the performance tab in Chrome DevTools
            previousRequestId = requestAnimationFrame(function () {
                let transformY;

                // Move drag element
                draggingEl.style.transform = transform(
                    e.pageX - shiftX,
                    e.pageY - shiftY
                );

                // Position target drop line
                if (
                    e.pageY - shiftY >
                    startParentRect.top +
                        startParentRect.height -
                        startRect.height
                ) {
                    transformY = startParentRect.top + startParentRect.height;
                } else if (
                    e.pageY - shiftY <
                    startParentRect.top - startRect.height
                ) {
                    transformY = startParentRect.top;
                } else {
                    transformY =
                        translateYs[newIndex][0] -
                        currentTargetParent.scrollTop;
                }

                dropLine.style.transform = transform(
                    startParentRect.left,
                    transformY
                );

                // Move items
                for (let i = 0; i < children.length; i += 1) {
                    if (previousLoopId !== loopId) {
                        break;
                    }

                    if (translateYs[i][3] === false || i === currentIndex) {
                        continue;
                    }

                    children[i].style.transform = transform(
                        0,
                        translateYs[i][1]
                    );

                    translateYs[i][2] = translateYs[i][1];
                    translateYs[i][3] = false;
                }
            });

            // Prevents highlighting in some browsers
            // e.preventDefault()
        }

        /**
         * Clear scroll interval
         */
        function clearScrollInterval() {
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);

                scrollIntervalId = null;
            }
        }

        /**
         * Update scroll top of container
         * @param  {string} direction
         * @param  {number} step
         */
        function scroll(direction, step) {
            if (direction === 'down') {
                currentTargetParent.scrollTop += step;
            } else if (direction === 'up') {
                currentTargetParent.scrollTop += -step;
            }
        }

        function initialize() {
            // Capture element being dragged
            ele.on('mousedown', startDrag);

            scope.$on('$destroy', function () {
                ele.off('mousedown', startDrag);
            });
        }

        initialize();
    }
}
