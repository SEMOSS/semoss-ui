(function () {
    'use strict';

    /**
     * @name app.config
     * @desc URL route configuration for page locations
     */
    angular.module('app.config', [])
        .config(config)
        .run(pubSubService)
        //REST service config
        .constant('ENDPOINT', (function () {
            var url = window.location.origin;
            if (!url) {
                url = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }
            url += '/';
            url += 'Monolith';
            return url;
        }()))
        //other constants
        //constants of colors that are used to color visualizations
        //viz's that use these colors: c3barchart.js, c3linechart.js, c3piechart.js, scatterplot.js, heatmap.js
        .constant('VIZ_COLORS', {
            COLOR_SEMOSS: ['#0c4ba2', '#15b994', '#F41C3E', '#e8c316', '#8d2ad9', '#ee8620', '#08254d', '#0d6954', '#730911', '#a78c0e', '#3f0d66', '#984f08'],
            COLOR_BLUE: ['#96C5E2', '#679DBE', '#4A81A3', '#265F82', '#083e82', '#0C4BA2', '##0A3A7C', '#062651'],
            COLOR_RED: ['#E8928F', '#CE5D5A', '#BF3936', '#9E201C', '#7E0A07', '#5F0603', '#360201'],
            COLOR_GREEN: ['#96E5BD', '#6ACC9A', '#46C484', '#27BE71', '#149F58', '#07783E', '#024D27'],
            COLOR_ONE: ['#F1433F', '#660066', '#F7E967', '#B3CF8B', '#EB99FF', '#4D6529', '#B3110D', '#0066CC', '#A49508', '#6699FF'],
            COLOR_TWO: ['#CC00CC', '#002060', '#154890', '#660066', '#6699FF', '#B2CDF4', '#EB99FF', '#B2B2B2', '#808080', '#4D4D4D'],
            COLOR_THREE: ['#B2CDF4', '#002060', '#808080', '#51692D', '#154890', '#6699FF', '#7CA244', '#637F6E', '#B3CF8B', '#ABBDB2'],
            COLOR_FOUR: ['#184D68', '#7CA343', '#F9651B', '#0B264D', '#FB9C6C', '#B04700', '#2E95C8', '#4D6529', '#88C5E4', '#B3CF8B'],
            COLOR_FIVE: ['#551813', '#D13D31', '#DEDBA7', '#84251E', '#615E25', '#E38881', '#72B095', '#A7A23F', '#49836A', '#144C48'],
            COLOR_SIX: ['#FFCCCC', '#99CCFF', '#0099CC', '#FF7C80', '#405422', '#5F7D33', '#184D68', '#7030A0', '#99CC00', '#D792F2'],

            //single color shows whenever only one color is shown (ex: one line / one bar)
            //viz's that use the single color: c3barchart.js and c3linechart.js
            COLOR_SINGLE_SEMOSS: ['#0C4BA2'],
            COLOR_SINGLE_BLUE: ['#0c4ba2'],
            COLOR_SINGLE_RED: ['#cd2632'],
            COLOR_SINGLE_GREEN: ['#15b994'],

            //heatmap colors
            //heatmap does some weird things with colors so we'll kept the color structure from the original heatmap
            COLOR_HEATMAP_DEFAULT: ['#fbf2d2', '#fee7a0', '#ffc665', '#fea743', '#fd8c3c', '#fb4b29', '#ea241e', '#d60b20', '#b10026', '#620023'],
            COLOR_HEATMAP_RED: ['#fbf2d2', '#fdedb5', '#fee7a0', '#ffda84', '#ffc665', '#feb44e', '#fea743', '#fd9b3f', '#fd8c3c', '#fd7735', '#fd602f', '#fb4b29', '#f43723', '#ea241e', '#e0161c', '#d60b20', '#c80324', '#b10026', '#870025', '#620023'],
            COLOR_HEATMAP_BLUE: ['#f4f9fe', '#eaf2fb', '#deebf7', '#d8e6f5', '#d1e2f2', '#c1d8ed', '#a1c9e5', '#7cb7db', '#63aad4', '#54a0ce', '#4997c9', '#3d8dc4', '#3182be', '#2676b8', '#1b6bb1', '#1260aa', '#0a56a1', '#084a93', '#083e82', '#083370'],
            COLOR_HEATMAP_GREEN: ['#f5fbf3', '#eef9eb', '#e5f5e0', '#dcf1d6', '#d0edca', '#c4e8bd', '#b7e3b0', '#a9dda3', '#9cd796', '#8fd28b', '#7fca7e', '#69bd6f', '#4ba85d', '#2e934c', '#19843e', '#0c7b36', '#03722f', '#006628', '#005622', '#00481c'],
            COLOR_HEATMAP_TRAFFIC: ['#ae0e06', '#ae0e06', '#ae0e06', '#e92e10', '#e92e10', '#fb741e', '#fb741e', '#fdc63f', '#fdc63f', '#ffff57', '#ffff57', '#ffff57', '#5cba24', '#5cba24', '#1e8b1f', '#1e8b1f', '#1e8b1f', '#1e8b1f', '#1e8b1f', '#005715', '#005715', '#005715']
        })
        .constant('LOGIN_PAGE', true);

    config.$inject = ['$httpProvider', '$windowProvider'];
    pubSubService.$inject = ['pubSubService'];


    /**
     * @name config
     * @desc configuration setup for the application
     */
    function config($httpProvider, $windowProvider) {
        //$httpProvider.useApplyAsync(true);
        //use this for production
        //$compileProvider.debugInfoEnabled(false);

        $httpProvider.interceptors.push('httpInterceptor');

        //set the name of the webpage (for embed)
        $windowProvider.$get().name = 'SemossWebPlaysheet';
    }

    /**
     * @name pubSubService
     * @param pubSubService
     * @desc initialize the pubSubService
     */
    function pubSubService(pubSubService) {
    }
})();
