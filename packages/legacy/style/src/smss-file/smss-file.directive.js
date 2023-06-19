import './smss-file.scss';

export default angular
    .module('smss-style.file', [])
    .directive('smssFile', smssFile);

function smssFile() {
    smssFileLink.$inject = ['scope', 'el'];

    return {
        controller: smssFileCtrl,
        controllerAs: 'smssFile',
        link: smssFileLink,
        restrict: 'E',
        scope: {
            file: '<',
            onChange: '&',
        },
        template: require('./smss-file.directive.html'),
    };

    function smssFileCtrl() {}

    function smssFileLink(scope, el) {
        initialize();

        /**
         * Remove file from element
         */
        function removeFile() {
            el[0].querySelector('input').value = '';
        }

        /**
         * Display file name in UI
         *
         * @param {string} name
         */
        function setFileName(name) {
            const container = el[0].querySelector('.smss-file__name');
            const text = name.length > 0 ? `(${name})` : '';

            container.textContent = text;
            container.title = text;
        }

        function initialize() {
            // Emit file on change
            el[0]
                .querySelector('input')
                .addEventListener('change', function () {
                    const file = this.files[0];

                    if (file) {
                        setFileName(file.name);

                        scope.onChange({ file });
                    }
                });

            scope.$watch('file', function (file) {
                if (Boolean(file) === false) {
                    removeFile();
                    setFileName('');
                }
            });
        }
    }
}
