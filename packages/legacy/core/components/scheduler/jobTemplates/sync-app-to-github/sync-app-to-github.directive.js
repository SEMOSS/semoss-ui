'use strict';

/**
 * @name SyncAppToGithub
 * @desc template for what user needs to run this job
 */
export default angular
    .module('app.scheduler.sync-app-to-github', [])
    .directive('syncAppToGithub', syncAppToGithub);

syncAppToGithub.$inject = ['ENDPOINT', 'semossCoreService'];

function syncAppToGithub(ENDPOINT, semossCoreService) {
    syncAppToGithubLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {
            job: '=',
        },
        link: syncAppToGithubLink,
        template: require('./sync-app-to-github.directive.html'),
    };

    function syncAppToGithubLink(scope) {
        scope.allApps = [];
        function initialize() {
            // add in props on jobTypeTemplate
            if (!scope.job.jobTypeTemplate.hasOwnProperty('dual')) {
                scope.job.jobTypeTemplate.dual = true;
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('syncDatabase')) {
                scope.job.jobTypeTemplate.syncDatabase = true;
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('app')) {
                scope.job.jobTypeTemplate.app = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('repository')) {
                scope.job.jobTypeTemplate.repository = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('password')) {
                scope.job.jobTypeTemplate.password = '';
            }
            var message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len;

                scope.allApps = [];

                for (i = 0, len = output.length; i < len; i++) {
                    scope.allApps.push({
                        display: String(output[i].project_name).replace(
                            /_/g,
                            ' '
                        ),
                        value: output[i].project_id,
                        image: semossCoreService.app.generateProjectImageURL(
                            output[i].project_id
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
                        type: 'getProjectList',
                        components: [],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        // update job as user changes values
        scope.$watchCollection('job.jobTypeTemplate', function () {
            var query = 'SyncApp(',
                template = scope.job.jobTypeTemplate;

            query += "app=['" + template.app + "'], ";
            query += "repository=['" + template.repository + "'], ";
            query += "username=['" + template.username + "'], ";
            query += "password=['" + template.password + "'], ";
            query += "dual=['" + template.dual + "'], ";
            query += "syncDatabase=['" + template.syncDatabase + "']);";

            scope.job.jobTypeTemplate.templatePixelQuery = query;
        });

        initialize();
    }
}
