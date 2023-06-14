import * as angular from 'angular';

import './formula.scss';

import './formula-stem/formula-stem.directive';

export type Root = Stem;

export type Leaf =
    | ValueLeaf
    | ExpressionLeaf
    | FunctionLeaf
    | GroupLeaf
    | ConditionalLeaf;

export interface Stem {
    placeholder: string;
    leaf: Leaf | null;
}

export interface ValueLeaf extends BaseLeaf {
    type: 'value';
    view: string;
}

export interface ExpressionLeaf extends BaseLeaf {
    type: 'expression';
    expression: string;
    left: Stem;
    right: Stem;
}

export interface FunctionLeaf extends BaseLeaf {
    type: 'function';
    function: string;
    children: {
        [child: string]: Stem;
    };
}

export interface GroupLeaf extends BaseLeaf {
    type: 'group';
    selected: string;
    options: string[];
    children: {
        [child: string]: Stem;
    };
}

export interface ConditionalLeaf extends BaseLeaf {
    type: 'conditional';
    condition: Stem;
    truthy: Stem;
    falsey: Stem;
}

interface BaseLeaf {
    id: string;
    type: string;
    name: string;
    color?: 'primary' | 'success' | 'warn' | 'error' | string;
    vertical?: boolean;
    data?: any;
}

export default angular
    .module('app.formula.directive', ['app.formula.formula-stem'])
    .directive('formula', formulaDirective);

formulaDirective.$inject = ['$timeout'];

function formulaDirective($timeout: ng.ITimeoutService) {
    formulaCtrl.$inject = [];
    formulaLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./formula.directive.html'),
        scope: true, // formula + it's helpers have a prototypical scope, so they can compile correctly
        require: [],
        controller: formulaCtrl,
        controllerAs: 'formula',
        bindToController: {
            menu: '=',
            register: '&?',
        },
        link: formulaLink,
    };

    function formulaCtrl() {}

    function formulaLink(scope, ele, attrs, ctrl) {
        let menuEle: HTMLElement,
            treeEle: HTMLElement,
            dragged: Leaf | null = null,
            active: HTMLElement | null = null,
            counter = 0;

        scope.formula.rendered = {
            options: [],
            search: '',
        };

        scope.formula.root = {
            placeholder: '',
            leaf: null,
        };

        // store the data for each leaf
        scope.formula.data = {};

        scope.formula.searchMenu = searchMenu;
        scope.formula.closeStem = closeStem;

        /** Formula */
        /**
         * @name resetFormula
         * @desc reset the formula directive
         */
        function resetFormula() {
            // set the tree
            updateTree(null);

            // set the menu
            setMenu();
        }

        /** Menu */
        /**
         * @name setMenu
         * @desc set the initial menu
         */
        function setMenu() {
            scope.formula.rendered = {
                raw: scope.formula.menu || [],
                searched: [],
                search: '',
            };

            searchMenu();
        }

        /**
         * @name searchMenu
         * @desc search the menu items
         */
        function searchMenu() {
            const cleaned = String(scope.formula.rendered.search)
                .replace(/ /g, '_')
                .toUpperCase();

            if (!cleaned) {
                scope.formula.rendered.searched = scope.formula.rendered.raw;
                return;
            }

            scope.formula.rendered.searched = [];

            for (
                let groupIdx = 0, groupLen = scope.formula.rendered.raw.length;
                groupIdx < groupLen;
                groupIdx++
            ) {
                const group = scope.formula.rendered.raw[groupIdx],
                    holder: {
                        name: string;
                        options: any[];
                        open: boolean;
                    } = {
                        name: group.name,
                        options: [],
                        open: true,
                    };

                for (
                    let optionIdx = 0, optionLen = group.options.length;
                    optionIdx < optionLen;
                    optionIdx++
                ) {
                    const option = group.options[optionIdx],
                        name = String(option.name)
                            .replace(/ /g, '_')
                            .toUpperCase();

                    if (name && name.indexOf(cleaned) > -1) {
                        holder.options.push(option);
                    }
                }

                if (holder.options.length > 0) {
                    scope.formula.rendered.searched.push(holder);
                }
            }
        }

        /**
         * @name onMenuDragStart
         * @desc start dragging the element
         */
        function onMenuDragStart(event: DragEvent) {
            const target = event.target as HTMLElement;

            if (!target) {
                return;
            }

            // get the id of the dragged node
            const menu = target.getAttribute('menu');
            if (!menu) {
                return;
            }

            const menuIds = menu.split('-');

            let leaf: Leaf | null = null;
            if (
                scope.formula.rendered.searched[menuIds[0]] &&
                scope.formula.rendered.searched[menuIds[0]].options[menuIds[1]]
            ) {
                leaf = JSON.parse(
                    JSON.stringify(
                        scope.formula.rendered.searched[menuIds[0]].options[
                            menuIds[1]
                        ]
                    )
                );
            }

            // nothing to grab
            if (!leaf) {
                return;
            }

            // give the leaf a unique id
            assignLeaf(leaf);

            // set the data
            scope.formula.data[leaf.id] = leaf.data;

            // store the dragged
            dragged = leaf;
        }

        /**
         * @name onMenuDragEnd
         * @desc start dragging the element
         */
        function onMenuDragEnd(event: DragEvent) {
            const target = event.target as HTMLElement;

            if (!target) {
                return;
            }

            // clear the dragged
            dragged = null;

            // clear the active
            clearActive();
        }

        /** Tree */
        /**
         * @name updateTree
         * @desc update the tree data and render a new tree
         */
        function updateTree(root: Root | null) {
            scope.formula.root = {
                placeholder: '',
                leaf: null,
            };

            // assign the root if it is there
            if (root) {
                scope.formula.root = root;
            }

            // reset the counter
            counter = 0;

            // regenerate the unique ID
            const queue = [scope.formula.root];

            while (queue.length) {
                const current = queue.shift();

                if (!current) {
                    continue;
                }

                // try to add the children (if possible)
                const leaf = current.leaf;
                if (!leaf) {
                    continue;
                }

                // give the leaf a unique id
                assignLeaf(leaf);

                // set the data
                scope.formula.data[leaf.id] = leaf.data;

                // assign to the children (if possible)
                if (leaf.type === 'value') {
                    // noop
                } else if (leaf.type === 'expression') {
                    queue.push(leaf.left);
                    queue.push(leaf.right);
                } else if (leaf.type === 'function') {
                    for (const c in leaf.children) {
                        queue.push(leaf.children[c]);
                    }
                } else if (leaf.type === 'group') {
                    for (const c in leaf.children) {
                        queue.push(leaf.children[c]);
                    }
                } else if (leaf.type === 'conditional') {
                    queue.push(leaf.condition);
                    queue.push(leaf.truthy);
                    queue.push(leaf.falsey);
                }
            }
        }

        /**
         * @name getTree
         * @desc get the root from the tree
         * @returns the raw root
         */
        function getTree(): Root {
            // walk through and update the values to match the data
            const queue = [scope.formula.root];

            while (queue.length) {
                const current = queue.shift();

                if (!current) {
                    continue;
                }

                // try to add the children (if possible)
                const leaf = current.leaf;
                if (!leaf) {
                    continue;
                }

                // set the data
                leaf.data = scope.formula.data[leaf.id];

                // assign to the children (if possible)
                if (leaf.type === 'value') {
                    // noop
                } else if (leaf.type === 'expression') {
                    queue.push(leaf.left);
                    queue.push(leaf.right);
                } else if (leaf.type === 'function') {
                    for (const c in leaf.children) {
                        queue.push(leaf.children[c]);
                    }
                } else if (leaf.type === 'group') {
                    for (const c in leaf.children) {
                        queue.push(leaf.children[c]);
                    }
                } else if (leaf.type === 'conditional') {
                    queue.push(leaf.condition);
                    queue.push(leaf.truthy);
                    queue.push(leaf.falsey);
                }
            }

            return scope.formula.root;
        }

        /**
         * @name onTreeDragStart
         * @desc start dragging the element
         */
        function onTreeDragStart(event: DragEvent) {
            const target = event.target as HTMLElement;

            if (!target) {
                return;
            }

            // get the id of the dragged node
            const path = target.getAttribute('path');
            if (!path) {
                return;
            }

            // we need to remove this leaf from this root
            const stem = findStem(path);

            // nothing to grab
            if (!stem) {
                return;
            }

            // save the dragged
            dragged = stem.leaf;

            // clear out the place it came from
            stem.leaf = null;

            // rebalance from the parent
            const parent = path.split('-');

            parent.pop();

            // rebalance the stem
            rebalanceStem(parent.join('-'));

            // delay the rerender, so we can drag the element
            $timeout();
            // setTimeout(function () {
            //     renderTree();
            // });
        }

        /**
         * @name onTreeDragEnd
         * @desc stop dragging the element
         */
        function onTreeDragEnd(event: DragEvent) {
            const target = event.target as HTMLElement;

            if (!target) {
                return;
            }

            // clear the dragged
            dragged = null;

            // clear the active
            clearActive();
        }

        /**
         * @name onTreeDragOver
         * @desc dragged over an element
         */
        function onTreeDragOver(event: DragEvent) {
            event.preventDefault();
        }

        /**
         * @name onTreeDragEnter
         * @desc enter an element
         */
        function onTreeDragEnter(event: DragEvent) {
            let target = event.target as HTMLElement;

            if (!target) {
                return;
            }

            // get the path
            let path = target.getAttribute('path');

            // if not possible, search the parent for the path
            if (!path) {
                while (target && !path) {
                    // set the path if possible
                    path = target.getAttribute('path');

                    target = target.parentElement as HTMLElement;
                }
            }

            if (!path) {
                return;
            }

            const stem = findStem(path);

            if (!stem) {
                return;
            }

            // leaf is filled, we try to add the dragged component as a parent
            if (stem.leaf) {
                let add = false;

                if (!dragged) {
                    return;
                }

                if (dragged.type === 'value') {
                    // noop
                } else if (dragged.type === 'expression') {
                    if (!dragged.left.leaf) {
                        add = true;
                    } else if (!dragged.right.leaf) {
                        add = true;
                    }
                } else if (dragged.type === 'function') {
                    for (const c in dragged.children) {
                        if (!dragged.children[c].leaf) {
                            add = true;
                            break;
                        }
                    }
                } else if (dragged.type === 'group') {
                    for (const c in dragged.children) {
                        if (!dragged.children[c].leaf) {
                            add = true;
                            break;
                        }
                    }
                } else if (dragged.type === 'conditional') {
                    if (!dragged.condition.leaf) {
                        add = true;
                    } else if (!dragged.truthy.leaf) {
                        add = true;
                    } else if (!dragged.falsey.leaf) {
                        add = true;
                    }
                }

                if (!add) {
                    return;
                }
            }

            setActive(target);
        }

        /**
         * @name onTreeDragLeave
         * @desc leave an element
         */
        function onTreeDragLeave(event: DragEvent) {
            const target = event.target as HTMLElement;

            if (!target) {
                return;
            }

            // pointing to the same element
            if (target === active) {
                clearActive();
            }
        }

        /**
         * @name onTreeDragDrop
         * @desc stop dragging the element
         */
        function onTreeDragDrop() {
            if (!active) {
                return;
            }

            // get the path
            const path = active.getAttribute('path');

            // clear the active
            clearActive();

            if (!path) {
                return;
            }

            // find the target stem
            const stem = findStem(path);
            if (!stem) {
                return;
            }

            // leaf is filled, try to add the dragged component as a parent
            if (stem.leaf) {
                if (!dragged) {
                    return;
                }

                if (dragged.type === 'value') {
                    // noop
                    return;
                } else if (dragged.type === 'expression') {
                    if (!dragged.left.leaf) {
                        dragged.left.leaf = stem.leaf;
                    } else if (!dragged.right.leaf) {
                        dragged.right.leaf = stem.leaf;
                    }
                } else if (dragged.type === 'function') {
                    for (const c in dragged.children) {
                        if (!dragged.children[c].leaf) {
                            dragged.children[c].leaf = stem.leaf;
                            break;
                        }
                    }
                } else if (dragged.type === 'group') {
                    for (const c in dragged.children) {
                        if (!dragged.children[c].leaf) {
                            dragged.children[c].leaf = stem.leaf;
                            break;
                        }
                    }
                } else if (dragged.type === 'conditional') {
                    if (!dragged.condition.leaf) {
                        dragged.condition.leaf = stem.leaf;
                    } else if (!dragged.truthy.leaf) {
                        dragged.truthy.leaf = stem.leaf;
                    } else if (!dragged.falsey.leaf) {
                        dragged.falsey.leaf = stem.leaf;
                    }
                }
            }

            // assign the dragged as the current leaf
            stem.leaf = dragged;

            // rebalance from the parent
            const parent = path.split('-');

            parent.pop();

            // rebalance the stem
            rebalanceStem(parent.join('-'));

            // render it
            $timeout();
        }

        /**
         * @name setActive
         * @desc set the active element
         */
        function setActive(ele: HTMLElement) {
            if (active) {
                clearActive();
            }

            active = ele;

            // add the css class
            active.classList.add('formula-stem__leaf--drag');
        }

        /**
         * @name clearActive
         * @desc clear the active element
         */
        function clearActive() {
            if (!active) {
                return;
            }

            // remove the class
            active.classList.remove('formula-stem__leaf--drag');

            active = null;
        }

        /** Stem */
        /**
         * @name closeStem
         * @desc close the associated stem based on a path
         */
        function closeStem(path: string) {
            const stem = findStem(path);

            // nothing to close
            if (!stem) {
                return;
            }

            // clear out the place it came from
            stem.leaf = null;
        }

        /**
         * @name rebalanceStem
         * @desc rebalance items in the stem
         */
        function rebalanceStem(path: string) {
            const stem = findStem(path);

            // nothing to close
            if (!stem) {
                return;
            }

            const queue = [stem];
            while (queue.length) {
                const current = queue.shift();

                if (!current) {
                    continue;
                }

                // look at the leaf to rebalance
                const leaf = current.leaf;
                if (!leaf) {
                    continue;
                }

                // assign to the children (if possible)
                if (leaf.type === 'value') {
                    // noop
                } else if (leaf.type === 'expression') {
                    queue.push(leaf.left);
                    queue.push(leaf.right);
                } else if (leaf.type === 'function') {
                    for (const c in leaf.children) {
                        queue.push(leaf.children[c]);
                    }
                } else if (leaf.type === 'group') {
                    // rebalance
                    const old: Stem[] = [];
                    for (const c in leaf.children) {
                        old.push(leaf.children[c]);
                    }

                    // clear it
                    leaf.children = {};

                    // add the new ones
                    let counter = -1;
                    for (
                        let oldIdx = 0, oldLen = old.length;
                        oldIdx < oldLen;
                        oldIdx++
                    ) {
                        // only keep
                        if (old[oldIdx].leaf) {
                            // increment
                            counter++;

                            // assign it
                            leaf.children[`${counter}`] = old[oldIdx];
                        }
                    }

                    // add an extra one
                    const next = Object.keys(leaf.children).length;

                    leaf.children[`${next}`] = {
                        placeholder: '',
                        leaf: null,
                    };

                    // look at the children
                    for (const c in leaf.children) {
                        queue.push(leaf.children[c]);
                    }
                } else if (leaf.type === 'conditional') {
                    queue.push(leaf.condition);
                    queue.push(leaf.truthy);
                    queue.push(leaf.falsey);
                }
            }
        }

        /**
         * @name findStem
         * @desc find the associated stem based on a path
         */
        function findStem(path: string): Stem | null {
            // get the full path
            const split = path.split('-');

            // go to the first level
            let stem: Stem | null = null;

            while (split.length > 0) {
                const current = split.shift() || '';

                // can't go anymore
                if (!current) {
                    break;
                }

                // we are at the root, continue from here
                if (current === 'root') {
                    stem = scope.formula.root;
                    continue;
                }

                // needs to have a stem + leaf for it to continue
                if (!stem || !stem.leaf) {
                    return null;
                }

                // get the leaf
                const leaf = stem.leaf;

                // check if the current leaf matches. If it is, go to the next one.
                if (leaf.type === 'value') {
                    // noop
                } else if (leaf.type === 'expression') {
                    if (current === 'left') {
                        stem = leaf.left;
                    } else if (current === 'right') {
                        stem = leaf.right;
                    } else {
                        return null;
                    }
                } else if (leaf.type === 'function') {
                    if (leaf.children.hasOwnProperty(current)) {
                        stem = leaf.children[current];
                    } else {
                        return null;
                    }
                } else if (leaf.type === 'group') {
                    if (leaf.children.hasOwnProperty(current)) {
                        stem = leaf.children[current];
                    } else {
                        return null;
                    }
                } else if (leaf.type === 'conditional') {
                    if (current === 'condition') {
                        stem = leaf.condition;
                    } else if (current === 'truthy') {
                        stem = leaf.truthy;
                    } else if (current === 'falsey') {
                        stem = leaf.falsey;
                    } else {
                        return null;
                    }
                }
            }

            return stem;
        }

        /** Leaf */
        /**
         * @name assignLeaf
         * @desc assign a new id to the leaf
         */
        function assignLeaf(leaf: Leaf) {
            leaf.id = String(++counter);
        }

        /** Utility */
        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            $timeout(() => {
                // get the eles
                menuEle = ele[0].querySelector('.formula__menu') as HTMLElement;
                treeEle = ele[0].querySelector('.formula__tree') as HTMLElement;

                // add the listeners
                menuEle.addEventListener('dragstart', onMenuDragStart);
                menuEle.addEventListener('dragend', onMenuDragEnd);
                treeEle.addEventListener('dragstart', onTreeDragStart);
                treeEle.addEventListener('dragend', onTreeDragEnd);
                treeEle.addEventListener('dragover', onTreeDragOver);
                treeEle.addEventListener('dragenter', onTreeDragEnter);
                treeEle.addEventListener('dragleave', onTreeDragLeave);
                treeEle.addEventListener('drop', onTreeDragDrop);
            });

            // remove the listeners
            scope.$on('$destroy', function () {
                // remove the listeners
                if (menuEle) {
                    menuEle.removeEventListener('dragstart', onMenuDragStart);
                    menuEle.removeEventListener('dragend', onMenuDragEnd);
                }

                if (treeEle) {
                    treeEle.removeEventListener('dragstart', onTreeDragStart);
                    treeEle.removeEventListener('dragend', onTreeDragEnd);
                    treeEle.removeEventListener('dragover', onTreeDragOver);
                    treeEle.removeEventListener('dragenter', onTreeDragEnter);
                    treeEle.removeEventListener('dragleave', onTreeDragLeave);
                    treeEle.removeEventListener('drop', onTreeDragDrop);
                }
            });
            // set the view and update after the digest is complete
            // add listeners
            // scope.$watch(function () {
            //     return JSON.stringify(scope.formula.tree);
            // }, function (newValue: string, oldValue: string) {
            //     if (newValue !== oldValue) {
            //         resetFormula();
            //     }
            // });

            scope.$watch(
                function () {
                    return JSON.stringify(scope.formula.menu);
                },
                function () {
                    setMenu();
                }
            );

            // register the newly create scope
            if (scope.formula.hasOwnProperty('register')) {
                scope.formula.register({
                    getTree: getTree,
                    updateTree: updateTree,
                });
            }

            resetFormula();
        }

        initialize();
    }
}
