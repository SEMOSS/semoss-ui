'use strict';

/**
 * @name extract-transform-load.directive.js
 * @desc ETL Job
 */
export default angular
    .module('app.scheduler.extract-transform-load', [])
    .directive('extractTransformLoad', extractTransformLoad);

extractTransformLoad.$inject = ['ENDPOINT', 'semossCoreService'];

function extractTransformLoad(ENDPOINT, semossCoreService) {
    extractTransformLoadLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {
            job: '=',
        },
        link: extractTransformLoadLink,
        template: require('./extract-transform-load.directive.html'),
    };

    function extractTransformLoadLink(scope) {
        scope.allApps = [];

        scope.getDBMetamodel = getDBMetamodel;

        function initialize() {
            var message = semossCoreService.utility.random('query-pixel');

            // add in props on jobTypeTemplate
            if (!scope.job.jobTypeTemplate.hasOwnProperty('sourceApp')) {
                scope.job.jobTypeTemplate.sourceApp =
                    semossCoreService.app.get('selectedApp');
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('targetApp')) {
                scope.job.jobTypeTemplate.targetApp = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('field')) {
                scope.job.jobTypeTemplate.field = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('query')) {
                scope.job.jobTypeTemplate.query = '';
            }

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len;

                scope.allApps = [];

                for (i = 0, len = output.length; i < len; i++) {
                    scope.allApps.push({
                        display: String(output[i].database_name).replace(
                            /_/g,
                            ' '
                        ),
                        value: output[i].database_id,
                        image: semossCoreService.app.generateDatabaseImageURL(
                            output[i].database_id
                        ),
                    });
                }

                getDBMetamodel();
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        function getDBMetamodel() {
            var message = semossCoreService.utility.random('query-pixel');
            if (scope.job.jobTypeTemplate.targetApp) {
                semossCoreService.once(message, function (response) {
                    var nodes = [],
                        props = [];
                    response.pixelReturn[0].output.nodes.forEach(function (
                        node
                    ) {
                        var i;
                        nodes.push(node.conceptualName);
                        for (i = 0; i < node.propSet.length; i++) {
                            props.push(node.propSet[i]);
                        }
                    });

                    nodes = nodes.concat(props);

                    // javascript sorts by unicode
                    // doing this for alphabetical order
                    scope.allFields = nodes.sort(function (a, b) {
                        if (a.toLowerCase() < b.toLowerCase()) {
                            return -1;
                        } else if (a.toLowerCase() > b.toLowerCase()) {
                            return 1;
                        }

                        return 0;
                    });
                });

                semossCoreService.emit('query-pixel', {
                    commandList: [
                        {
                            meta: true,
                            type: 'getDatabaseMetamodel',
                            components: [
                                scope.job.jobTypeTemplate.targetApp,
                                [],
                            ],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
            }
        }

        scope.$watchCollection('job.jobTypeTemplate', function () {
            var query = 'Database(database=["';

            query +=
                scope.job.jobTypeTemplate.sourceApp +
                '"]) | Query("' +
                scope.job.jobTypeTemplate.query +
                '") | ToDatabase(targetDatabase=["' +
                scope.job.jobTypeTemplate.targetApp +
                '"] , targetTable=["' +
                scope.job.jobTypeTemplate.field +
                '"], overwrite=[true]);';

            scope.job.jobTypeTemplate.templatePixelQuery = query;
        });

        initialize();
    }
}
