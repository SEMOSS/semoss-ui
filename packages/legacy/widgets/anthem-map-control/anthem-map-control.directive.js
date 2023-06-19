(function () {
    'use strict';

    /**
     * @name anthem-map-control.directive.js
     * @desc select columns from the table for clustering & blocking
     */

    angular
        .module('app.anthem-map-control.directive', [])
        .directive('anthemMapControl', anthemMapControl);

    anthemMapControl.$inject = [];

    function anthemMapControl() {
        anthemMapControlCtrl.$inject = [];
        anthemMapControlLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

        return {
            restrict: 'E',
            templateUrl:
                'widgets/anthem-map-control/anthem-map-control.directive.html' +
                '?' +
                Date.now(),
            controller: anthemMapControlCtrl,
            link: anthemMapControlLink,
            scope: {},
            require: ['^widget'],
            bindToController: {},
            controllerAs: 'anthemMapControl',
        };

        function anthemMapControlCtrl() {}

        function anthemMapControlLink(scope, ele, attrs, ctrl) {
            scope.widgetCtrl = ctrl[0];

            const FRAME = 'FRAME',
                HEADERS = {
                    GENDER: 'Gender',
                    AGE: 'Age_Bucket',
                    DIAGNOSIS: 'RX_Event',
                };

            scope.anthemMapControl.gender = {
                selected: '',
                options: [],
            };

            scope.anthemMapControl.age = {
                selected: '',
                options: [],
            };

            scope.anthemMapControl.diagnosis = {
                selected: '',
                options: [],
            };

            scope.anthemMapControl.resetState = resetState;
            scope.anthemMapControl.changeGender = changeGender;
            scope.anthemMapControl.changeAge = changeAge;
            scope.anthemMapControl.changeDiagnosis = changeDiagnosis;

            /**
             * @name resetPanel
             * @desc function that is called to reset the panel
             * @returns {void}
             */
            function resetPanel() {
                scope.anthemMapControl.gender.selected = [];
                scope.anthemMapControl.age.selected = [];
                scope.anthemMapControl.diagnosis.selected = [];

                let callback = (response) => {
                    let output, type;

                    type = response.pixelReturn[0].operationType;
                    output = response.pixelReturn[0].output;
                    if (type.indexOf('ERROR') === -1) {
                        scope.anthemMapControl.gender.options =
                            output.data.values.map((item) => {
                                return item[0];
                            });
                    }

                    type = response.pixelReturn[1].operationType;
                    output = response.pixelReturn[1].output;
                    if (type.indexOf('ERROR') === -1) {
                        scope.anthemMapControl.age.options =
                            output.data.values.map((item) => {
                                return item[0];
                            });
                    }

                    type = response.pixelReturn[2].operationType;
                    output = response.pixelReturn[2].output;
                    if (type.indexOf('ERROR') === -1) {
                        scope.anthemMapControl.diagnosis.options =
                            output.data.values.map((item) => {
                                return item[0];
                            });
                    }

                    resetFilter();
                };

                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'Pixel',
                            components: ['GENDER'],
                            terminal: true,
                        },
                        {
                            meta: true,
                            type: 'Pixel',
                            components: ['AGE'],
                            terminal: true,
                        },
                        {
                            meta: true,
                            type: 'Pixel',
                            components: ['DIAGNOSIS'],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }

            /**
             * @name resetFilter
             * @desc function that is called to reset the panel
             * @returns {void}
             */
            function resetFilter() {
                let callback = (response) => {
                    let output, type;

                    type = response.pixelReturn[0].operationType;
                    output = response.pixelReturn[0].output;
                    if (type.indexOf('ERROR') === -1) {
                        scope.anthemMapControl.gender.selected =
                            output.unfilterValues;
                    }

                    type = response.pixelReturn[1].operationType;
                    output = response.pixelReturn[1].output;
                    if (type.indexOf('ERROR') === -1) {
                        scope.anthemMapControl.age.selected =
                            output.unfilterValues;
                    }

                    type = response.pixelReturn[2].operationType;
                    output = response.pixelReturn[2].output;
                    if (type.indexOf('ERROR') === -1) {
                        scope.anthemMapControl.diagnosis.selected =
                            output.unfilterValues;
                    }
                };

                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'Pixel',
                            components: [
                                `${FRAME} | FrameFilterModelVisibleValues(column=["${HEADERS.GENDER}"], limit=[-1], offset=[0]);`,
                            ],
                            terminal: true,
                        },
                        {
                            meta: true,
                            type: 'Pixel',
                            components: [
                                `${FRAME} | FrameFilterModelVisibleValues(column=["${HEADERS.AGE}"], limit=[-1], offset=[0]);`,
                            ],
                            terminal: true,
                        },
                        {
                            meta: true,
                            type: 'Pixel',
                            components: [
                                `${FRAME} | FrameFilterModelVisibleValues(column=["${HEADERS.DIAGNOSIS}"], limit=[-1], offset=[0]);`,
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }

            /**
             * @name resetState
             * @desc function that is called to reset the state
             * @returns {void}
             */
            function resetState() {
                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: [
                            `${FRAME} | SetFrameFilter(${
                                HEADERS.GENDER
                            }== ${JSON.stringify(
                                scope.anthemMapControl.gender.options
                            )});`,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            `${FRAME} | SetFrameFilter(${
                                HEADERS.AGE
                            }== ${JSON.stringify(
                                scope.anthemMapControl.age.options
                            )});`,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            `${FRAME} | SetFrameFilter(${
                                HEADERS.DIAGNOSIS
                            }== ${JSON.stringify(
                                scope.anthemMapControl.diagnosis.options
                            )});`,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( Zip_Code , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ Zip_Code , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( Zip_Code ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "Zip_Code" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : { "base" : true , "zoomRange": [7,20], "type": "zipcodes" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( State , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ State , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( State ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "State" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : {  "id" : 1 , "zoomRange": [0,7], "type": "states" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                ]);
            }

            /**
             * @name changeGender
             * @desc function that is called to change the gender
             * @returns {void}
             */
            function changeGender() {
                let selected = scope.anthemMapControl.gender.selected;
                if (selected.length === 0) {
                    selected = ['SEMOSS_NULL'];
                }
                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: [
                            `${FRAME} | SetFrameFilter(${
                                HEADERS.GENDER
                            }== ${JSON.stringify(selected)});`,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( Zip_Code , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ Zip_Code , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( Zip_Code ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "Zip_Code" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : { "base" : true , "zoomRange": [7,20], "type": "zipcodes" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( State , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ State , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( State ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "State" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : {  "id" : 1 , "zoomRange": [0,7], "type": "states" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                ]);
            }

            /**
             * @name changeAge
             * @desc function that is called to change the age
             * @returns {void}
             */
            function changeAge() {
                let selected = scope.anthemMapControl.age.selected;
                if (selected.length === 0) {
                    selected = ['SEMOSS_NULL'];
                }
                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: [
                            `${FRAME} | SetFrameFilter(${
                                HEADERS.AGE
                            }== ${JSON.stringify(selected)});`,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( Zip_Code , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ Zip_Code , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( Zip_Code ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "Zip_Code" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : { "base" : true , "zoomRange": [7,20], "type": "zipcodes" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( State , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ State , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( State ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "State" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : {  "id" : 1 , "zoomRange": [0,7], "type": "states" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                ]);
            }

            /**
             * @name changeDiagnosis
             * @desc function that is called to change the diagnosis
             * @returns {void}
             */
            function changeDiagnosis() {
                let selected = scope.anthemMapControl.diagnosis.selected;
                if (selected.length === 0) {
                    selected = ['SEMOSS_NULL'];
                }
                scope.widgetCtrl.execute([
                    {
                        type: 'Pixel',
                        components: [
                            `${FRAME} | SetFrameFilter(${
                                HEADERS.DIAGNOSIS
                            }== ${JSON.stringify(selected)});`,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( Zip_Code , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ Zip_Code , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( Zip_Code ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "Zip_Code" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : { "base" : true , "zoomRange": [7,20], "type": "zipcodes" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Frame ( frame = [ FRAME ] ) | Select ( State , Min ( Paid_Amount ), Average ( Paid_Amount ), Max ( Paid_Amount ), Sum ( Paid_Amount ), Count ( Paid_Amount ) ) .as ( [ State , Min_of_Paid_Amount, Average_of_Paid_Amount, Max_of_Paid_Amount, Sum_of_Paid_Amount, Count_of_Paid_Amount ] ) | Group ( State ) | With ( Panel ( 0 ) ) | Format ( type = [ \'table\' ] ) | TaskOptions ( { "0" : { "layout" : "Choropleth" , "alignment" : { "label" : [ "State" ] , "value" : [ "Sum_of_Paid_Amount" ] , "tooltip" : [ "Min_of_Paid_Amount", "Max_of_Paid_Amount", "Average_of_Paid_Amount", "Count_of_Paid_Amount"] , "facet" : [ ] }, "layer" : {  "id" : 1 , "zoomRange": [0,7], "type": "states" } } } ) | Collect ( -1 );',
                        ],
                        terminal: true,
                    },
                ]);
            }

            /**
             * @name initialize
             * @desc function that is called on directive load
             * @returns {void}
             */
            function initialize() {
                let updateFrame = scope.widgetCtrl.on(
                        'update-frame',
                        resetFilter
                    ),
                    updateOrnaments = scope.widgetCtrl.on(
                        'update-ornaments',
                        resetFilter
                    );

                scope.$on('$destroy', function () {
                    updateFrame();
                    updateOrnaments();
                });

                resetPanel();
            }

            initialize();
        }
    }
})();
