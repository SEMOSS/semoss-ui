'use strict';

/**
 * @name backupApp
 * @desc template for what user needs to run this job
 */
export default angular
    .module('app.scheduler.backup-app', [])
    .directive('backupApp', backupApp);

backupApp.$inject = ['ENDPOINT', 'semossCoreService'];

function backupApp(ENDPOINT, semossCoreService) {
    backupAppLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {
            job: '=',
        },
        link: backupAppLink,
        template: require('./backup-app.directive.html'),
    };

    function backupAppLink(scope) {
        scope.allApps = [];
        function initialize() {
            // add in props on jobTypeTemplate
            scope.job.jobTypeTemplate.app = '';

            var message = semossCoreService.utility.random('query-pixel');

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

                if (
                    scope.job.jobGroup === 'defaultGroup' &&
                    scope.allApps.length > 0
                ) {
                    // database has not yet been selected
                    scope.job.jobTypeTemplate.app = scope.allApps[0].value;
                } else {
                    scope.job.jobTypeTemplate.app = scope.job.jobGroup;
                }
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

        scope.$watchCollection('job.jobTypeTemplate', function () {
            var query = 'BackupDatabase("';

            query += scope.job.jobTypeTemplate.app + '");';

            scope.job.jobTypeTemplate.templatePixelQuery = query;
        });

        initialize();
    }
}
