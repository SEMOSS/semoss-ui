'use strict';

export default angular
    .module('app.settings.settings-theme', [])
    .directive('settingsTheme', settingsThemeDirective);

import './settings-theme.scss';

settingsThemeDirective.$inject = ['semossCoreService', 'VIZ_COLORS'];

function settingsThemeDirective(semossCoreService, VIZ_COLORS) {
    settingsThemeCtrl.$inject = [];
    settingsThemeLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./settings-theme.directive.html'),
        controller: settingsThemeCtrl,
        link: settingsThemeLink,
        scope: {},
        bindToController: {},
        controllerAs: 'settingsTheme',
    };

    function settingsThemeCtrl() {}

    function settingsThemeLink(scope) {
        scope.settingsTheme.color = {
            selected: VIZ_COLORS.COLOR_SEMOSS,
            options: [
                {
                    value: 'Semoss',
                    display: 'Semoss',
                    colors: VIZ_COLORS.COLOR_SEMOSS,
                },
                {
                    value: 'One',
                    display: 'Option 1',
                    colors: VIZ_COLORS.COLOR_ONE,
                },
                {
                    value: 'Two',
                    display: 'Option 2',
                    colors: VIZ_COLORS.COLOR_TWO,
                },
                {
                    value: 'Three',
                    display: 'Option 3',
                    colors: VIZ_COLORS.COLOR_THREE,
                },
                {
                    value: 'Four',
                    display: 'Option 4',
                    colors: VIZ_COLORS.COLOR_FOUR,
                },
                {
                    value: 'Five',
                    display: 'Option 5',
                    colors: VIZ_COLORS.COLOR_FIVE,
                },
                {
                    value: 'Six',
                    display: 'Option 6',
                    colors: VIZ_COLORS.COLOR_SIX,
                },
                {
                    value: 'Seven',
                    display: 'Option 7',
                    colors: VIZ_COLORS.COLOR_SEVEN,
                },
                {
                    value: 'Eight',
                    display: 'Option 8',
                    colors: VIZ_COLORS.COLOR_EIGHT,
                },
                {
                    value: 'Nine',
                    display: 'Option 9',
                    colors: VIZ_COLORS.COLOR_NINE,
                },
                {
                    value: 'Ten',
                    display: 'Option 10',
                    colors: VIZ_COLORS.COLOR_TEN,
                },
                {
                    value: 'Eleven',
                    display: 'Option 11',
                    colors: VIZ_COLORS.COLOR_ELEVEN,
                },
            ],
        };

        scope.settingsTheme.themes = {
            list: [],
            active: undefined,
        };

        scope.settingsTheme.form = {
            open: false,
            type: undefined,
            id: undefined,
            name: '',
            theme: {},
        };

        scope.settingsTheme.openThemeForm = openThemeForm;
        scope.settingsTheme.closeThemeForm = closeThemeForm;
        scope.settingsTheme.createTheme = createTheme;
        scope.settingsTheme.editTheme = editTheme;
        scope.settingsTheme.deleteTheme = deleteTheme;
        scope.settingsTheme.selectTheme = selectTheme;

        /**
         * @name hslToHex
         * @desc converts hsl code array ([180, 100, 20]) to hex code
         * @param {array} hsl - hsl array [h, s, l]
         * @returns {string} returns hex code (#ffffff)
         */
        function hslToHex(hsl) {
            let h = hsl[0],
                s = hsl[1],
                l = hsl[2],
                r = 0,
                g = 0,
                b = 0,
                c,
                x,
                m;
            s /= 100;
            l /= 100;

            c = (1 - Math.abs(2 * l - 1)) * s;
            x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            m = l - c / 2;

            if (h >= 0 && h < 60) {
                r = c;
                g = x;
                b = 0;
            } else if (h >= 60 && h < 120) {
                r = x;
                g = c;
                b = 0;
            } else if (h >= 120 && h < 180) {
                r = 0;
                g = c;
                b = x;
            } else if (h >= 180 && h < 240) {
                r = 0;
                g = x;
                b = c;
            } else if (h >= 240 && h < 300) {
                r = x;
                g = 0;
                b = c;
            } else if (h >= 300 && h < 360) {
                r = c;
                g = 0;
                b = x;
            }
            // Having obtained RGB, convert channels to hex
            r = Math.round((r + m) * 255).toString(16);
            g = Math.round((g + m) * 255).toString(16);
            b = Math.round((b + m) * 255).toString(16);

            // Prepend 0s, if necessary
            if (r.length === 1) {
                r = '0' + r;
            }
            if (g.length === 1) {
                g = '0' + g;
            }
            if (b.length === 1) {
                b = '0' + b;
            }

            return '#' + r + g + b;
        }

        /**
         * @name hexToHsl
         * @desc converts hex code (#ffffff) to hsl array
         * @param {string} hex - hex code string
         * @returns {array} returns hsl code as an array [h, s, l]
         */
        function hexToHsl(hex) {
            // Convert hex to RGB first
            let r = 0,
                g = 0,
                b = 0,
                cmin,
                cmax,
                delta,
                h,
                s,
                l;
            if (hex.length === 4) {
                r = '0x' + hex[1] + hex[1];
                g = '0x' + hex[2] + hex[2];
                b = '0x' + hex[3] + hex[3];
            } else if (hex.length === 7) {
                r = '0x' + hex[1] + hex[2];
                g = '0x' + hex[3] + hex[4];
                b = '0x' + hex[5] + hex[6];
            }
            // Then to HSL
            r /= 255;
            g /= 255;
            b /= 255;
            cmin = Math.min(r, g, b);
            cmax = Math.max(r, g, b);
            delta = cmax - cmin;
            h = 0;
            s = 0;
            l = 0;

            if (delta === 0) {
                h = 0;
            } else if (cmax === r) {
                h = ((g - b) / delta) % 6;
            } else if (cmax === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }

            h = Math.round(h * 60);

            if (h < 0) {
                h += 360;
            }

            l = (cmax + cmin) / 2;
            s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
            s = +(s * 100).toFixed(1);
            l = +(l * 100).toFixed(1);

            return [h, s, l];
        }

        /**
         * @name updateColor
         * @desc Takes the current color and will lighten/darken it by changing the color's lightness
         * @param {string} current - the current color in hex format
         * @param {number} change - how much to increase (+) or decrease (-) the lightness
         * @returns {string} returns new color as hex code
         */
        function updateColor(current, change) {
            let hsl = hexToHsl(current),
                lightness = hsl[2],
                newLightness;
            if (change > 0) {
                let increase = change / 100;
                newLightness = Math.floor(
                    (100 - lightness) * increase + lightness
                );
            } else if (change < 0) {
                let decrease = (change / 100) * -1;
                newLightness = Math.floor(lightness - lightness * decrease);
            } else {
                newLightness = lightness;
            }
            hsl[2] = newLightness;
            return hslToHex(hsl);
        }

        /**
         * @name getThemes
         * @desc grab the list of available themes
         * @param {bool} update whether or not to update the front end theme
         * @returns {void}
         */
        function getThemes() {
            semossCoreService.emit('get-theme');
        }

        /**
         * @name openThemeForm
         * @desc open a theme form
         * @param {string} type - type of form
         * @param {object} options - options to pass to the form
         * @returns {void}
         */
        function openThemeForm(type, options) {
            let updated,
                base = semossCoreService.utility.freeze(
                    scope.settingsTheme.base
                );

            // merge with the base (defaults)
            updated = angular.merge({}, base, options || {});

            scope.settingsTheme.form = {
                open: true,
                type: type,
                id: updated.id,
                name: updated.name,
                theme: updated.theme,
            };
        }

        /**
         * @name validateThemeForm
         * @desc validate the theme form
         * @returns {boolean} is the form valid or not?
         */
        function validateThemeForm() {
            if (!scope.settingsTheme.form.name) {
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'Theme must have a name',
                });

                return false;
            }

            return true;
        }

        /**
         * @name closeThemeForm
         * @desc close a theme form
         * @returns {void}
         */
        function closeThemeForm() {
            scope.settingsTheme.form = {
                open: false,
                type: undefined,
                id: undefined,
                name: '',
                theme: {},
            };
        }

        /**
         * @name createTheme
         * @desc create a new theme
         * @returns {void}
         */
        function createTheme() {
            let theme = {};
            if (!validateThemeForm()) {
                return;
            }

            // clean out things that aren't defined
            for (let item in scope.settingsTheme.form.theme) {
                if (
                    scope.settingsTheme.form.theme.hasOwnProperty(item) &&
                    typeof scope.settingsTheme.form.theme[item] !== 'undefined'
                ) {
                    theme[item] = scope.settingsTheme.form.theme[item];
                }
            }

            semossCoreService.emit('create-theme', {
                theme: theme,
                name: scope.settingsTheme.form.name,
            });

            closeThemeForm();
        }

        /**
         * @name editTheme
         * @desc edit the theme
         * @param {string} type - type of save
         * @returns {void}
         */
        function editTheme(type) {
            let theme = {};
            if (!validateThemeForm()) {
                return;
            }

            // clean out things that aren't defined
            for (let item in scope.settingsTheme.form.theme) {
                if (
                    scope.settingsTheme.form.theme.hasOwnProperty(item) &&
                    typeof scope.settingsTheme.form.theme[item] !== 'undefined'
                ) {
                    theme[item] = scope.settingsTheme.form.theme[item];
                }
            }

            if (type === 'update') {
                semossCoreService.emit('edit-theme', {
                    theme: theme,
                    name: scope.settingsTheme.form.name,
                    id: scope.settingsTheme.form.id,
                });
            } else if (type === 'new') {
                semossCoreService.emit('create-theme', {
                    theme: theme,
                    name: scope.settingsTheme.form.name,
                });
            }

            closeThemeForm();
        }

        /**
         * @name deleteTheme
         * @desc delete the theme
         * @param {object} option - option to delete
         * @returns {void}
         */
        function deleteTheme(option) {
            semossCoreService.emit('delete-theme', {
                id: option.id,
            });
        }

        /**
         * @name selectTheme
         * @desc select the theme
         * @param {object} option - option to select
         * @returns {void}
         */
        function selectTheme(option) {
            if (option.id === scope.settingsTheme.base.id) {
                semossCoreService.emit('reset-theme');
                return;
            }

            semossCoreService.emit('select-theme', {
                id: option.id,
            });
        }

        /** Updates */
        /**
         * @name updateTheme
         * @desc update the active theme
         * @returns {void}
         */
        function updateTheme() {
            // both update with one call
            scope.settingsTheme.themes.list =
                semossCoreService.settings.get('list');
            scope.settingsTheme.themes.active =
                semossCoreService.settings.get('active');
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateThemeListener;

            updateThemeListener = semossCoreService.on(
                'updated-theme',
                updateTheme
            );

            scope.settingsTheme.base = semossCoreService.settings.get('base');

            getThemes();

            // update from the store
            updateTheme();

            // cleanup
            scope.$on('$destroy', function () {
                updateThemeListener();
            });
        }

        initialize();
    }
}
