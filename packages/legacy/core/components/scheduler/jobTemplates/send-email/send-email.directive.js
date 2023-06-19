'use strict';

/**
 * @name sendEmail
 * @desc template for send email job
 */

export default angular
    .module('app.scheduler.send-email', [])
    .directive('sendEmail', sendEmail);

sendEmail.$inject = [];

function sendEmail() {
    sendEmailLink.$inject = ['scope'];

    return {
        restrict: 'E',
        scope: {
            job: '=',
        },
        link: sendEmailLink,
        template: require('./send-email.directive.html'),
    };

    function sendEmailLink(scope) {
        scope.newTo = '';

        function initialize() {
            // add in props to jobTypeTemplate
            if (!scope.job.jobTypeTemplate.hasOwnProperty('smtpHost')) {
                scope.job.jobTypeTemplate.smtpHost = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('smtpPort')) {
                scope.job.jobTypeTemplate.smtpPort = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('subject')) {
                scope.job.jobTypeTemplate.subject = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('to')) {
                scope.job.jobTypeTemplate.to = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('from')) {
                scope.job.jobTypeTemplate.from = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('message')) {
                scope.job.jobTypeTemplate.message = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('username')) {
                scope.job.jobTypeTemplate.username = '';
            }
            if (!scope.job.jobTypeTemplate.hasOwnProperty('password')) {
                scope.job.jobTypeTemplate.password = '';
            }
        }

        initialize();

        scope.$watchCollection('job.jobTypeTemplate', function () {
            var query = 'SendEmail(',
                i,
                splitTo = scope.job.jobTypeTemplate.to.split(';');

            query +=
                "smtpHost=['" + scope.job.jobTypeTemplate.smtpHost + "'], ";
            query +=
                "smtpPort=['" + scope.job.jobTypeTemplate.smtpPort + "'], ";
            query += "subject=['" + scope.job.jobTypeTemplate.subject + "'], ";
            query += 'to=[';
            for (i = 0; i < splitTo.length; i++) {
                query += "'" + splitTo[i].trim() + "'";

                if (i !== scope.job.jobTypeTemplate.to.length - 1) {
                    query += ',';
                }
            }

            query += '], ';
            query += "from=['" + scope.job.jobTypeTemplate.from + "'], ";
            query += "message=['" + scope.job.jobTypeTemplate.message + "'], ";
            query +=
                "username=['" + scope.job.jobTypeTemplate.username + "'], ";
            query +=
                "password=['" + scope.job.jobTypeTemplate.password + "']);";

            scope.job.jobTypeTemplate.templatePixelQuery = query;
        });
    }
}
