export default angular
    .module('smss-style.color-picker', [])
    .directive('smssColorPicker', smssColorPickerDirective);

import './smss-color-picker.scss';

/**
 * @name smssColorPicker
 * @desc pick colors
 */
smssColorPickerDirective.$inject = ['$timeout'];

function smssColorPickerDirective($timeout) {
    smssColorpickerCompile.$inject = ['tElement', 'tAttributes'];
    smssColorPickerLink.$inject = ['scope', 'ele', 'attrs'];
    return {
        restrict: 'E',
        template: require('./smss-color-picker.directive.html'),
        scope: {
            name: '@',
            model: '=',
            required: '=',
            disabled: '=?ngDisabled',
            change: '&?',
            colorTheme: '<',
        },
        replace: true,
        transclude: true,
        compile: smssColorpickerCompile,
    };

    function smssColorpickerCompile(tElement, tAttributes) {
        var popoverEle = tElement[0].querySelector('smss-popover-content');
        // att the special attributes
        if (tAttributes.hasOwnProperty('body')) {
            popoverEle.setAttribute('body', !(tAttributes.body === 'false'));
        }

        if (tAttributes.hasOwnProperty('container')) {
            popoverEle.setAttribute('container', tAttributes.container);
        }

        return smssColorPickerLink;
    }

    function smssColorPickerLink(scope, ele, attrs) {
        var toggleEle;
        // black,   red,    blue,  green, yelllow,  orange,    purple,    silver,   brown,    indigo
        scope.newColor = {
            // has to be an object not a primative
            value: '',
        };
        scope.standardColors = [
            'transparent',
            '#000000',
            '#FFFFFF',
            '#FF0000',
            '#0000FF',
            '#00FF00',
            '#FFFF00',
            '#FFA500',
            '#EE82EE',
            '#C0C0C0',
            '#8B4513',
            '#4B0082',
        ];
        scope.themeGrid = [];
        scope.defaultTheme = [];
        scope.recentColors = [];
        scope.open = false;

        scope.selectColor = selectColor;
        scope.showNewColor = showNewColor;
        scope.hideNewColor = hideNewColor;
        scope.acceptNewColor = acceptNewColor;
        scope.cancelNewColor = cancelNewColor;
        scope.showBorder = showBorder;

        /**
         * @name setTheme
         * @desc set the theme colors
         * @return {void}
         */
        function setTheme() {
            scope.themeGrid = scope.defaultTheme.map((color) => {
                const hueChange = [0, -0.3, -0.25, -0.15, 0.15, 0.25, 0.3];

                return hueChange.map((hue) => {
                    return changeHue(color, hue);
                });
            });
        }

        /**
         * @name selectColor
         * @param {string} color - new color to select
         * @return {void}
         */
        function selectColor(color) {
            if (color) {
                scope.newColor.value = color;

                acceptNewColor();
            }
        }

        /**
         * @name setNewColor
         * @desc set the new colors
         * @return {void}
         */
        function setNewColor() {
            if (scope.model && scope.model[0] === '#') {
                scope.newColor.value = scope.model;
            } else if (scope.model) {
                scope.newColor.value = scope.model;
            } else {
                scope.newColor.value = scope.defaultTheme[0];
            }

            if (scope.model && scope.model[0] === '#') {
                scope.view = scope.newColor.value;
            } else if (scope.model) {
                scope.view =
                    scope.newColor.value.charAt(0).toUpperCase() +
                    scope.newColor.value.slice(1);
            } else {
                scope.view = '';
            }

            if (scope.view) {
                scope.showPlaceholder = false;
            } else {
                scope.showPlaceholder = true;
            }
        }

        /**
         * @name showNewColor
         * @desc focus on the search input when the picker is opened
         * @param {ele} contentEle - contentEle
         * @returns {void}
         */
        function showNewColor(contentEle) {
            setNewColor();

            $timeout(function () {
                var input = contentEle.querySelector('input');
                if (input) {
                    input.focus();
                }
            });
        }

        /**
         * @name hideNewColor
         * @desc focus back on the element when closed
         * @returns {void}
         */
        function hideNewColor() {
            if (toggleEle) {
                toggleEle.focus();
            }
        }

        /**
         * @name acceptNewColor
         * @desc accept the new color and close the picker
         * @return {void}
         */
        function acceptNewColor() {
            scope.model = scope.newColor.value;

            // trim if necessary
            if (scope.recentColors.length >= 16) {
                scope.recentColors.length = 15;
            }

            //add it
            scope.recentColors.push(scope.newColor.value);

            $timeout(function () {
                if (scope.change) {
                    scope.change({
                        color: scope.model,
                        model: scope.model,
                    });
                }

                scope.open = false;
            });
        }

        /**
         * @name cancelNewColor
         * @desc cancel the color and close the picker
         * @return {void}
         */
        function cancelNewColor() {
            scope.open = false;
        }

        /**
         * @name showBorder
         * @desc shows border if the color is white or transparent
         * @param {string} color - the color
         * @returns {boolean} - true: shows border, false: no border
         */
        function showBorder(color) {
            let c = (color || '').toLowerCase();

            if (
                c === 'transparent' ||
                c === 'white' ||
                c === '#fff' ||
                c === '#ffffff'
            ) {
                return true;
            }

            return false;
        }

        /** Helpers */
        /**
         *
         */

        /**
         * @name changeHue
         * @param {string} hexString - color hex value
         * @param {number} percentage - percentage to change the hue by
         * @desc changes the hue of a color by a percentage value
         * @return {string} hex value of hue changed color
         */
        function changeHue(hexString, percentage) {
            let cleanHex = hexString,
                decValue = [],
                finalHex; // array of 3 decimal values for the color

            if (cleanHex[0] === '#') {
                cleanHex = cleanHex.substr(1);
            }

            // create array where hex values are split up into three places
            if (cleanHex.length === 3) {
                for (let i = 0; i < 3; i++) {
                    decValue.push(cleanHex[i] + cleanHex[i]);
                }
            } else if (cleanHex.length === 6) {
                for (let i = 0; i < 6; i++) {
                    if (i % 2 === 1) {
                        decValue.push(cleanHex[i - 1] + cleanHex[i]);
                    }
                }
            } else {
                throw 'Invalid Color';
            }

            // go through hex values and convert them to decimal,
            // additionally add the hue change
            // then convert back to hex
            decValue = decValue.map((val) => {
                let parsedAsDecimal = parseInt(val, 16),
                    hueChange = Math.floor(parsedAsDecimal * percentage),
                    final = parsedAsDecimal + hueChange,
                    color;

                if (final > 255) {
                    final = 255;
                } else if (final <= 0) {
                    final = '00';
                }

                color = final.toString(16);
                // If the color is a single digit, must add a 0 to generate the correct hex code
                if (color.length === 1) {
                    return `0${color}`;
                }
                return color;
            });

            finalHex = '#' + decValue.join('');
            finalHex = finalHex.toUpperCase();

            return finalHex;
        }

        /**
         * @name keyupToggle
         * @param {event} $event - DOM event
         * @desc key up event for the toggle
         * @returns {void}
         */
        function keyupToggle($event) {
            if ($event.keyCode === 27) {
                // esc
                scope.newColor.value = '';

                acceptNewColor();
            }
        }

        /**
         * @name getRecentColors
         * @desc get recent colors from local storage
         * @returns {void}
         */
        function getRecentColors() {
            const colors = localStorage.getItem('recentColors');
            if (colors && colors.length) {
                const c = JSON.parse(colors);

                if (c.length > 16) {
                    c.length = 16;
                }

                scope.recentColors = c;
            }
        }

        /**
         * @name setRecentColors
         * @desc store recent colors in local storage
         * @returns {void}
         */
        function setRecentColors() {
            if (scope.recentColors.length) {
                if (scope.recentColors.length > 16) {
                    scope.recentColors.length = 16;
                }

                const colors = JSON.stringify(scope.recentColors);
                localStorage.setItem('recentColors', colors);
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @return {void}
         */
        function initialize() {
            var initializeTimeout;

            // get the toggle
            toggleEle = ele[0].querySelector('#smss-color-picker__toggle');

            toggleEle.addEventListener('keyup', keyupToggle);

            if (attrs.hasOwnProperty('compact')) {
                scope.compact = true;
            }

            if (attrs.hasOwnProperty('placeholder')) {
                scope.placeholder = attrs.placeholder;
            }

            scope.$on('$destroy', function () {
                setRecentColors();
            });

            //set the view and update after the digest is complete
            initializeTimeout = $timeout(function () {
                if (!scope.colorTheme) {
                    scope.defaultTheme = [
                        '#40A0FF',
                        '#9A74B6',
                        '#FBB83A',
                        '#F18630',
                        '#51ACA8',
                        '#187637',
                        '#CD5498',
                        '#364A90',
                    ];
                } else {
                    scope.defaultTheme = scope.colorTheme;
                }

                setTheme();
                setNewColor();
                getRecentColors();

                scope.$watch('model', function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        setNewColor();
                    }
                });

                if (attrs.hasOwnProperty('autofocus')) {
                    if (toggleEle) {
                        toggleEle.focus();
                    }
                }

                $timeout.cancel(initializeTimeout);
            });
        }

        initialize();
    }
}
