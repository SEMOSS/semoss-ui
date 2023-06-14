export default angular
    .module('smss-style.speech-recognition', [])
    .directive('smssSpeechRecognition', smssSpeechRecognitionDirective);

// import './smss-speech-recognition.scss';

smssSpeechRecognitionDirective.$inject = ['$compile'];

function smssSpeechRecognitionDirective($compile) {
    smssSpeechRecognitionLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: `
        <i 
            ng-keydown="smssSpeechRecognition.listening = false;"
            ng-click="$event.stopPropogation(); smssSpeechRecognition.startRecognition();"
            class="fa fa-microphone"
            ng-class="{'smss-color--error': (smssSpeechRecognition.listening)}"
        ></i>
        `,
        scope: {},
        bindToController: {
            change: '&',
        },
        replace: true,
        controllerAs: 'smssSpeechRecognition',
        controller: smssSpeechRecognitionController,
        transclude: true,
        link: smssSpeechRecognitionLink,
    };

    function smssSpeechRecognitionController() {}

    function smssSpeechRecognitionLink(scope) {
        const SpeechRecognition =
            window.speechRecognition || window.webkitSpeechRecognition;

        scope.smssSpeechRecognition.startRecognition = startRecognition;
        scope.smssSpeechRecognition.listening = false;

        function startRecognition() {
            const recognition = new SpeechRecognition();

            // turn listening styles on
            scope.smssSpeechRecognition.listening = true;

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;

                // if onChange is passed to component
                if (scope.smssSpeechRecognition.change) {
                    scope.smssSpeechRecognition.change({
                        value: text,
                    });
                }

                // switch styles back
                scope.smssSpeechRecognition.listening = false;
            };

            recognition.start();
        }

        /**
         * @name initialize
         * @desc Called when the directive is loaded
         * @returns {void}
         */
        function initialize() {}

        initialize();
    }
}
