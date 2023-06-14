(function () {
    "use strict";

    /**
     * @name jv-viz
     * @desc sub class of chart to encapsulate visualizations using jv-charts
     */
    angular.module("app.jv-viz.directive", [])
        .directive("jvViz", jvViz);

    jvViz.$inject = ['dataService', 'pkqlService'];

    function jvViz(dataService, pkqlService) {

        jvVizLink.$inject = ["scope", "ele", "attrs", 'ctrl'];
        jvVizCtrl.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ["^chart"],
            priority: 400,
            link: jvVizLink,
            controller: jvVizCtrl
        };

        function jvVizLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            scope.chartCtrl.initializeBrushMode = initializeBrushMode;
            scope.chartCtrl.initializeCommentMode = initializeCommentMode;
            scope.chartCtrl.initializeEditMode = initializeEditMode; 
            scope.chartCtrl.initializeModes = initializeModes;            
            scope.chartCtrl.addJvChartToToolBar = addJvChartToToolBar;

            /**
             * @name initializeBrushMode
             * @description initialize brush mode
             */
            function initializeBrushMode(jvChart) {
                this.toolbar.jvChart = jvChart;

                //add brush mode -- only for jv visualizations
                this.brushMode = new jvBrush({
                    chartDiv: this.chartDiv,
                    jvChart: jvChart
                });

                this.brushMode.localCallbackUpdateChartForBrush = this.filterOnBrushMode;
                this.toolbar.brushObj = this.brushMode;
            }

            /**
             * @name initializeCommentMode
             * @param {Object} comments contains all the comments for a viz
             * @desc function that initializes comment mode
             */
            function initializeCommentMode(comments) {
                this.chartDiv = d3.select("#" + this.chartName); //grab chart div

                this.commentMode = new jvComment({
                    chartDiv: this.chartDiv,
                    comments: comments ? comments : [] //empty array for now until we determine how to make pkql call from backend to get existing comments
                });

                /**
                 * @name localCallbackSaveComment
                 * @desc: function that updated the backend through pkql whenever a comment is added / also adds the comment to uiOptions
                 * @params: comment - object that contains string and location of comment, action - add, edit, or remove string
                 */
                this.commentMode.localCallbackSaveComment = function (comment, commentId, action) {
                    var currentWidget = dataService.getWidgetData();
                    //create location object
                    //point of this is to remove current x and current y
                    comment.location = {
                        x: comment.binding.x,
                        y: comment.binding.y,
                        xChartArea: comment.binding.xChartArea,
                        yChartArea: comment.binding.yChartArea
                    };

                    var commentQuery = pkqlService.generateCommentQuery(currentWidget.panelId, comment, commentId, action);
                    pkqlService.executePKQL(currentWidget.insightId, commentQuery);
                };

                var parent = this;

                /**
                 * @name localCallbackGetMode
                 * @desc gets the name of the mode
                 */
                this.commentMode.localCallbackGetMode = function () {
                    return parent.toolbar.mode.toLowerCase();
                };
            }

            /**
             * @name initializeEditMode
             * @param {Object} lookandfeel describes the look and feel of the viz
             * @desc function that initializes comment mode
             */
            function initializeEditMode(lookandfeel) {
                this.chartDiv = d3.select("#" + this.chartName); //grab chart div

                this.editMode = new jvEdit({
                    chartDiv: this.chartDiv,
                    vizOptions: lookandfeel ? lookandfeel : {} //empty object for now until we determine how to populate these from
                });

                this.editMode.localCallbackSaveVizOptions = function (vizOptions) {
                    var currentWidget = dataService.getWidgetData();
                    var commentQuery = pkqlService.generateLookAndFeelQuery(currentWidget.panelId, vizOptions);
                    pkqlService.executePKQL(currentWidget.insightId, commentQuery);
                };
            }

            /**
             * @name initializeModes
             * @desc function that initializes and creates the chart toolbar
             */
            function initializeModes(comments, lookandfeel) {
                this.initializeCommentMode(comments);
                this.initializeEditMode(lookandfeel);

                var config = {};
                config.comment = this.commentMode;
                config.edit = this.editMode;
                config.brush = this.brushMode;
                config.chartDiv = this.chartDiv;
                config.name = this.chartName;

                //create toolbar which calls the initialize toolbar function
                this.toolbar = new jvToolbar(config);

                this.toolbar.localCallbackRelatedInsights = function () {
                    //do nothing unless this is defined in each directive}
                };

                if (comments && this.commentMode) {
                    this.commentMode.drawCommentNodes();
                }
            }

            /**
             * @name addJvChartToToolBar
             * @param jvChart
             * @desc adds the jvChart and uiOptions from any jv refactored chart directives that do
             *       not make this call will have generic comment and edit mode and no brush mode
             */
            function addJvChartToToolBar(jvChart) {
                this.initializeBrushMode(jvChart);

                //apply edits from uiOptions
                if (this.editMode) {
                    this.editMode.applyAllEdits();
                    //add generic function to getVizOptions
                    jvChart.localCallbackGetVizOption = function (option) {
                        return chart.editMode.vizOptions[option] ? chart.editMode.vizOptions[option] : 'default';
                    };
                    jvChart.localCallbackApplyEdits = function () {
                        return chart.editMode.applyAllEdits();
                    }
                }

                //redraw comment nodes, because the jvChart overwrote the original svg that they were on
                if (this.commentMode) {
                    this.commentMode.drawCommentNodes();
                }

                //recall addtoolbar to update listeners with new objects
                if (this.toolbar) {
                    this.toolbar.addToolBarListener();
                }
            }

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {

            });

        }
    }

    function jvVizCtrl($scope) {
        var jvViz = this;        
    }

})();