(function () {
    'use strict';

    /**
     * @name analytics.service.js
     * @desc sets up and configures analytic routines
     */
    angular.module('app.analytics.service', [])
        .factory('analyticsService', analyticsService);

    analyticsService.$inject = [];


    function analyticsService() {

        var routines = {
            "AssociationLearning": {
                title: "Associated Learning",
                description: 'Generate inference relationships that exist within the dataset',
                directiveName: "associated-learning",
                directiveFiles: [
                    {
                        files: [
                            'custom/associated-learning/associated-learning.directive.js'
                        ]
                    }
                ],
                routineName: "AssociationLearning",
                restrictToNumerical: false,
                targetInstance: true,
                filterInstance: true,
                options: {
                    'learningRules': 100,
                    'minSupport': 10,
                    'maxSupport': 90,
                    'learningConfidence': 90
                }
            },
            "Classify": {
                title: "Classification",
                description: "Generate a mapping to approximate the input variable",
                directiveName: "",
                directiveFiles: [],
                routineName: "Classify",
                restrictToNumerical: false,
                targetInstance: true,
                filterInstance: true,
                options: {}
            },
            "Clustering": {
                title: "Clustering",
                description: 'Divides the dataset into partitions (clusters) so that the items inside each cluster are similar to each other',
                directiveName: "clustering",
                directiveFiles: [
                    {
                        files: [
                            'custom/clustering/clustering.directive.js'
                        ]
                    }
                ],
                routineName: "Clustering",
                restrictToNumerical: false,
                targetInstance: true,
                filterInstance: true,
                options: {
                    'subsetSize': null
                }
            },
            "FastOutliers": {
                title: "Fast Outliers",
                description: "Determines which items in the dataset are considered anomalies compared to the other items",
                directiveName: "fast-outliers",
                directiveFiles: [
                    {
                        files: [
                            'custom/fast-outliers/fast-outliers.directive.js'
                        ]
                    }
                ],
                routineName: "FastOutliers",
                restrictToNumerical: false,
                targetInstance: true,
                filterInstance: true,
                options: {
                    'subsetSize': 20,
                    'runNumber': 10
                }
            },
            "MatrixRegression": {
                title: "Matrix Regression",
                description: "Calculate the line of best fit to approximate the input variable",
                directiveName: "matrix-regression",
                directiveFiles: [
                    {
                        files: [
                            'custom/matrix-regression/matrix-regression.directive.js'
                        ]
                    }
                ],
                routineName: "MatrixRegression",
                restrictToNumerical: true,
                targetInstance: true,
                filterInstance: true,
                options: {}
            },
            "NumericalCorrelation": {
                title: "Numerical Correlation",
                description: 'Determine the degree that each combination of columns is related',
                directiveName: "",
                routineName: "NumericalCorrelation",
                restrictToNumerical: true,
                targetInstance: false,
                filterInstance: true,
                options: {}
            },
            "Outliers": {
                title: "Outliers",
                description: "Determines which items in the dataset are considered anomalies compared to the other items",
                directiveName: "outliers",
                directiveFiles: [
                    {
                        files: [
                            'custom/outliers/outliers.directive.js'
                        ]
                    }
                ],
                routineName: "Outliers",
                restrictToNumerical: false,
                targetInstance: true,
                filterInstance: true,
                options: {
                    kValue: 25
                }
            },
            "Similarity": {
                title: "Similarity",
                description: "Determines how similar each item is compared to the overall dataset.",
                directiveName: "",
                routineName: "Similarity",
                restrictToNumerical: false,
                targetInstance: true,
                filterInstance: true,
                options: {}
            }


        };

        return {
            //sheet functions
            /**
             * @name getRoutineDirectiveElement
             * @desc returns the un-compiled html string of the current routine
             * @params routineName {string} layout of selected routine
             * @returns {string} html of string
             */
            getRoutineDirectiveElement: function (routineName) {
                var html = '';
                if (routineName && routines[routineName].directiveName && !_.isEmpty(routines[routineName].directiveName)) {
                    html = "<div oc-lazy-load="
                        + JSON.stringify(routines[routineName].directiveFiles)
                        + ">"
                        + "<div "
                        + routines[routineName].directiveName
                        + " analytics-panel-form='analyticsPanelsForm' >"
                        + "</div>" +
                        "</div>";
                }

                return html

            },
            /**
             * @name getRoutineObj
             * @desc function returns the full routine object
             * @returns {object} routine object
             */
            getRoutineObj: function () {
                return routines;
            }
        };
    }
})();