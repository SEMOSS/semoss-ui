(function () {
    'use strict';

    /**
     * @name traverse-panel
     * @desc Visual Panel Directive used to switch between traverseizations
     */
    angular.module('app.traverse-panel.directive', [])
        .directive('traversePanel', traversePanel);

    traversePanel.$inject = ['$rootScope', '_', '$filter', 'dataService', 'pkqlService'];

    function traversePanel($rootScope, _, $filter, dataService, pkqlService) {

        traversePanelCtrl.$inject = [];
        traversePanelLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            scope: {},
            restrict: 'EA',
            require: [],
            controllerAs: 'traversePanel',
            bindToController: {},
            templateUrl: 'custom/traverse-panel/traverse-panel.directive.html',
            controller: traversePanelCtrl,
            link: traversePanelLink
        };

        function traversePanelCtrl() {
            var traversePanel = this;

            //variables
            traversePanel.message = false; //nothing is selected bool
            traversePanel.toggleTraverseEngines = false;// shows engines
            traversePanel.traverseObj = {list: {}, selectedEngine: ''};//all the traverseOptions
            traversePanel.nodeFilter = {
                name: ""
            };

            //functions
            traversePanel.getExternalTraverseOptions = getExternalTraverseOptions;
            traversePanel.setTraversal = setTraversal;
            traversePanel.resetPanel = resetPanel;


            /**
             * @name getExternalTraverseOptions
             * @desc function gets external options (non-db)
             */
            function getExternalTraverseOptions() {
                traversePanel.toggleTraverseEngines = !traversePanel.toggleTraverseEngines;
                if (traversePanel.toggleTraverseEngines) {
                    dataService.dataPointSelected(traversePanel.currentInsight.selected.data)
                }
            }

            /**
             * @name setTraversal
             * @desc function sets the new node to traverse to
             * @param node {Object} selected Node to traverse to
             */
            function setTraversal(node) {
                var tripleObj = {relTriples: [], filter: {}};

                //create the filter
                for (var i = 0; i < traversePanel.currentInsight.selected.data.length; i++) {
                    if (!tripleObj.filter[traversePanel.currentInsight.selected.data[i]['concept']]) {
                        tripleObj.filter[traversePanel.currentInsight.selected.data[i]['concept']] = [];
                    }
                    tripleObj.filter[traversePanel.currentInsight.selected.data[i]['concept']].push($filter("shortenValueFilter")(traversePanel.currentInsight.selected.data[i]['uri']))
                }

                //concept
                if (node.direction === "downstream") {
                    tripleObj.relTriples.push([node.conceptualName, node.relation, node.equivalent]);
                } else if (node.direction === "upstream") {
                    tripleObj.relTriples.push([node.equivalent, node.relation, node.conceptualName]);
                }

                var pkqlObject = {};
                if (node.parentName) {//handles property as a concept
                    pkqlObject = {
                        engineName: node.db[0].name,
                        selectors: [],
                        filters: tripleObj.filter,
                        joinType: ["inner"],
                        triples: tripleObj.relTriples,
                        existingConcept: node.equivalent,
                        joinConcept: node.equivalent ? node.equivalent : undefined
                    };

                    if (tripleObj.relTriples[0].length === 1) {
                        pkqlObject.triples[0][0] = node.parentName + "__" + node.conceptualName;
                        pkqlObject.selectors.push(node.parentName + "__" + node.conceptualName);
                    } else {
                        if (node.conceptualName === tripleObj.relTriples[0][0]) {
                            pkqlObject.triples[0][0] = node.parentName + "__" + tripleObj.relTriples[0][0];
                        } else if (node.conceptualName === tripleObj.relTriples[0][2]) {
                            pkqlObject.triples[0][2] = node.parentName + "__" + tripleObj.relTriples[0][2];
                        }
                        pkqlObject.selectors.push(node.parentName);
                        pkqlObject.selectors.push(node.parentName + "__" + node.conceptualName);
                    }
                } else { //handles normal concepts
                    pkqlObject = {
                        engineName: node.db[0].name,
                        selectors: [],
                        filters: tripleObj.filter,
                        joinType: ["inner"],
                        triples: tripleObj.relTriples,
                        existingConcept: [node.equivalent],
                        joinConcept: [node.equivalent ? node.equivalent : undefined]
                    };

                    if (tripleObj.relTriples[0].length === 1) {
                        pkqlObject.selectors.push(tripleObj.relTriples[0][0]);
                    } else {
                        pkqlObject.selectors.push(tripleObj.relTriples[0][0]);
                        pkqlObject.selectors.push(tripleObj.relTriples[0][2]);
                    }
                }

                var pkqlQuery = pkqlService.generateDBImportPKQLQuery(pkqlObject);
                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, pkqlQuery);
            }

            /**
             * @name resetPanel
             * @desc function that is resets panel when selected Widget Changes
             */
            function resetPanel() {
                traversePanel.nodeFilter.name = "";
                traversePanel.showTraverseMessage = true;
                traversePanel.traverseObj = {list: {}, selectedEngine: ''};
                if (traversePanel.currentInsight && traversePanel.currentInsight.selected && traversePanel.currentInsight.selected.traverse) {
                    traversePanel.traverseObj = traversePanel.currentInsight.selected.traverse;
                }

                //we have things to traverse to!
                if (!_.isEmpty(traversePanel.currentInsight.selected.data)) {
                    traversePanel.showTraverseMessage = false;
                }
            }
        }

        function traversePanelLink(scope, ele, attrs, ctrl) {
            //listeners
            var traversePanelSelectedNodeListener = $rootScope.$on('data-selected', function (event, data) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'data-selected', data);
                scope.traversePanel.currentWidget = dataService.getWidgetData();
                scope.traversePanel.currentInsight = dataService.getInsightData();
                scope.traversePanel.resetPanel();
            });

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                scope.traversePanel.currentWidget = dataService.getWidgetData();
                scope.traversePanel.currentInsight = dataService.getInsightData();
                scope.traversePanel.resetPanel();
            }

            initialize();


            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying traversePanel....');
                traversePanelSelectedNodeListener();
            });
        }

    }
})();