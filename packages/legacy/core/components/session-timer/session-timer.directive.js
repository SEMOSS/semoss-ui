'use strict';

/**
 * @name session-timer.directive.js
 * @desc session-timer directive that serves to control the session timer
 */

export default angular
    .module('app.session-timer.directive', [])
    .directive('sessionTimer', sessionTimer);

sessionTimer.$inject = [
    '$timeout',
    '$interval',
    '$state',
    'semossCoreService',
    'monolithService',
    'CONFIG',
];

function sessionTimer(
    $timeout,
    $interval,
    $state,
    semossCoreService,
    monolithService,
    CONFIG
) {
    sessionTimerLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./session-timer.directive.html'),
        link: sessionTimerLink,
        scope: {},
    };

    function sessionTimerLink(scope) {
        var sessionResetListener, configInitListener;

        scope.sessionTimer = {};
        // scope.sessionTimer.sessionLength = 1790000; // 30 minutes minus 10 seconds
        scope.sessionTimer.session = {};

        scope.sessionTimer.endSession = endSession;
        scope.sessionTimer.continueSession = continueSession;

        /**
         * @name endSession
         * @desc ends the session
         * @returns {void}
         */
        function endSession() {
            if (scope.sessionTimer.session.interval) {
                $interval.cancel(scope.sessionTimer.session.interval);
            }

            if (scope.sessionTimer.session.redirectInterval) {
                $interval.cancel(scope.sessionTimer.session.redirectInterval);
            }

            monolithService.logout('all');
            semossCoreService.emit('close-all-apps');
            monolithService.invalidateSession();
            initializeVariables();
            configureTimeout();
        }

        /**
         * @name continueSession
         * @desc continue the session by making a BE call
         * @returns {void}
         */
        function continueSession() {
            scope.sessionTimer.session.open = false;

            setSession();
            // make a backend call to reset timer
            monolithService.runPixel('', 'true;');
        }

        // initialize the timer
        /**
         * @name setSession
         * @desc set the session timer
         * @returns {void}
         */
        function setSession() {
            scope.sessionTimer.session.timer =
                scope.sessionTimer.session.timeout;
            scope.sessionTimer.session.startTime = new Date().getTime();
            if (scope.sessionTimer.session.interval) {
                $interval.cancel(scope.sessionTimer.session.interval);
            }

            if (scope.sessionTimer.session.redirectInterval) {
                $interval.cancel(scope.sessionTimer.session.redirectInterval);
            }

            // set the interval to check the session time left
            scope.sessionTimer.session.interval = $interval(function () {
                // this is the time that has elapsed since last check
                let idleTime =
                    new Date().getTime() - scope.sessionTimer.session.startTime;
                // set the new start time
                scope.sessionTimer.session.startTime = new Date().getTime();
                // this is the accurate timer left on the clock before session end
                scope.sessionTimer.session.timer -= idleTime;
                scope.sessionTimer.session.timerDisplay = Math.ceil(
                    scope.sessionTimer.session.timer / 1000
                );
                // if 2 minutes or less left we will turn on the popup
                if (scope.sessionTimer.session.timer < 120000) {
                    scope.sessionTimer.session.open = true;
                    // if timer hits 0. session has ended.
                    if (scope.sessionTimer.session.timer <= 0) {
                        // count down to redirec user to login page
                        scope.sessionTimer.session.redirectStartTime =
                            new Date().getTime();
                        if (scope.sessionTimer.session.interval) {
                            $interval.cancel(
                                scope.sessionTimer.session.interval
                            );
                        }
                        scope.sessionTimer.session.redirectInterval = $interval(
                            function () {
                                let redirectIdleTime =
                                    new Date().getTime() -
                                    scope.sessionTimer.session
                                        .redirectStartTime;
                                scope.sessionTimer.session.redirectStartTime =
                                    new Date().getTime();
                                scope.sessionTimer.session.redirectTimer -=
                                    redirectIdleTime;
                                scope.sessionTimer.session.redirectTimerDisplay =
                                    Math.ceil(
                                        scope.sessionTimer.session
                                            .redirectTimer / 1000
                                    );

                                // redirect timer hits 0, so we will officially end session and make sure session is invalidated
                                if (
                                    scope.sessionTimer.session.redirectTimer <=
                                    0
                                ) {
                                    endSession();
                                }
                            },
                            scope.sessionTimer.session.redirectIntervalDelay
                        );
                    }
                }
            }, scope.sessionTimer.session.intervalDelay);
        }

        /**
         * @name configureTimeout
         * @desc sets timeout then session
         * @return {void}
         */
        function configureTimeout() {
            if (CONFIG.timeout) {
                scope.sessionTimer.session.timeout = CONFIG.timeout * 60 * 1000;
                scope.sessionTimer.session.timer =
                    scope.sessionTimer.session.timeout;
                scope.sessionTimer.session.timerDisplay = Math.ceil(
                    scope.sessionTimer.session.timer / 1000
                );
                setSession();
            }
        }

        /**
         * @name initializeVariables
         * @desc set the initial state of the variables
         * @returns {void}
         */
        function initializeVariables() {
            scope.sessionTimer.session = {
                open: false,
                timeout: 1800000,
                timer: 1800000, // 30 minutes
                timerDisplay: 1800,
                interval: undefined,
                redirectInterval: undefined,
                redirectTimer: 10000,
                redirectTimerDisplay: 10,
                intervalDelay: 1000,
                redirectIntervalDelay: 1000,
                startTime: undefined,
                redirectStartTime: undefined,
            };
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            initializeVariables();
            sessionResetListener = semossCoreService.on(
                'session-reset',
                function () {
                    setSession();
                }
            );
            configInitListener = semossCoreService.on(
                'initialize-config',
                function () {
                    configureTimeout();
                }
            );
        }

        initialize();

        scope.$on('$destroy', function () {
            sessionResetListener();
            configInitListener();
        });
    }
}
