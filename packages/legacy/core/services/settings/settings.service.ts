import Utility from '../../utility/utility.js';
import angular from 'angular';
import GetThemesReturn from './GetThemesReturn.js';
import Theme from './Theme.js';

// inject customization
import { CUSTOMIZATION } from '@/custom/theme';

export default angular
    .module('app.settings.service', [])
    .factory('settingsService', settingsService);

settingsService.$inject = ['messageService', 'monolithService', 'SHARED_TOOLS'];

function settingsService(
    messageService: MessageService,
    monolithService: MonolithService,
    SHARED_TOOLS: any
) {
    const /** Public */
        /** Private */
        BASE_THEME: Theme = {
            id: 'BASE',
            name: 'Default',
            isActive: true,
            theme: customMerge(
                {
                    name: 'SEMOSS',
                    logo: '',
                    isLogoUrl: false,
                    includeNameWithLogo: true,
                    loginAndSignupTextCustomHtml: '',
                    loginCenterHTML: '',
                    loginImage: '',
                    isLoginImageUrl: true,
                    backgroundImage: '',
                    homeIntroImage: '',
                    isHomeIntroImageUrl: false,
                    homeIntroObj: {
                        infoCards: [
                            {
                                title: '%theme.name% 101',
                                description:
                                    'What %theme.name% is and how to leverage it for intelligent business',
                                image: 'logo',
                                click: '101',
                                color: 'blue',
                            },
                            {
                                title: 'Use Cases',
                                description:
                                    'Explore how %theme.name% helps solve real-world business problems',
                                image: 'briefcase',
                                click: 'uses',
                                color: 'purple',
                            },
                        ],
                        homeIntroHtml: '',
                    },
                    backgroundImageOpacity: 0.95,
                    visualizationBackgroundColor: '#FFFFFF',
                    visualizationColorPalette: 'Semoss',
                    helpDropdown: {
                        showUserGuideSection: true,
                        showContactUsHeading: true,
                        showContactUsSection: true,
                        contactUsIcon: '',
                        contactUsLink: 'semoss@semoss.org',
                        isContactUsLinkUrl: false,
                        contactUsTitle: 'Email Us',
                        contactUsDescription: '',
                        descriptionFontSize: 'regular',
                    },
                    homeLeftNavItems: {
                        preLeftMenuBtnOptions: [],
                        postLeftMenuBtnOptions: [],
                    },
                },
                CUSTOMIZATION.theme
            ),
        },
        _state = {
            base: BASE_THEME,
            active: BASE_THEME,
            list: [BASE_THEME],
        },
        _actions = {
            /**
             * @name updated-theme
             * @desc set the view based on the active them
             */
            'updated-theme': (): void => {
                if (
                    _state.active.theme.hasOwnProperty(
                        'visualizationColorPalette'
                    )
                ) {
                    SHARED_TOOLS.colorName =
                        _state.active.theme.visualizationColorPalette;
                }
            },
            /**
             * @name set-theme
             * @param payload
             * @desc get a list of all of the available themes (as well as set the active)
             */
            'set-theme': (payload: {
                id: string;
                name: string;
                theme?: any;
            }): void => {
                _state.active = {
                    id: payload.id,
                    name: payload.name,
                    theme: customMerge(_state.base.theme, payload.theme || {}),
                };

                messageService.emit('updated-theme');
            },
            /**
             * @name get-theme
             * @desc get a list of all of the available themes (as well as set the active)
             */
            'get-theme': (): void => {
                monolithService
                    .getAdminThemes()
                    .then((output: GetThemesReturn[]): void => {
                        // use the base if it is not present
                        _state.list = [BASE_THEME];
                        _state.active = BASE_THEME;

                        for (
                            let outputIdx = 0, outputLen = output.length;
                            outputIdx < outputLen;
                            outputIdx++
                        ) {
                            _state.list.push({
                                id: output[outputIdx].ID,
                                theme: JSON.parse(output[outputIdx].THEME_MAP),
                                name: output[outputIdx].THEME_NAME,
                            });

                            if (output[outputIdx].IS_ACTIVE) {
                                _state.active =
                                    _state.list[_state.list.length - 1];
                            }
                        }

                        messageService.emit('updated-theme');
                    });
            },
            /**
             * @name create-theme
             * @param payload - info to create theme
             * @desc create a new theme
             */
            'create-theme': (payload: { name: string; theme: Theme }): void => {
                monolithService
                    .createAdminTheme({
                        name: payload.name,
                        json: payload.theme,
                        isActive: true,
                    })
                    .then(
                        (response: any): void => {
                            if (response) {
                                messageService.emit('get-theme');
                            } else {
                                messageService.emit('alert', {
                                    color: 'error',
                                    text: 'Error saving theme',
                                });
                            }
                        },
                        (error: string): void => {
                            messageService.emit('alert', {
                                color: 'error',
                                text: error,
                            });
                        }
                    );
            },
            /**
             * @name edit-theme
             * @param payload- theme data
             * @desc modify an existing theme
             */
            'edit-theme': (payload: {
                id: string;
                name: string;
                theme: Theme;
            }): void => {
                monolithService
                    .editAdminTheme({
                        name: payload.name,
                        json: payload.theme,
                        id: payload.id,
                        isActive: true,
                    })
                    .then(
                        (response: any): void => {
                            if (response) {
                                messageService.emit('get-theme');
                            } else {
                                messageService.emit('alert', {
                                    color: 'error',
                                    text: 'Error saving theme',
                                });
                            }
                        },
                        (error: string): void => {
                            messageService.emit('alert', {
                                color: 'error',
                                text: error,
                            });
                        }
                    );
            },
            /**
             * @name delete-theme
             * @param payload - theme data
             * @desc delete an existing theme
             */
            'delete-theme': (payload: Theme): void => {
                monolithService
                    .deleteAdminTheme({
                        id: payload.id,
                    })
                    .then(
                        function (response) {
                            if (response) {
                                messageService.emit('get-theme');
                            } else {
                                messageService.emit('alert', {
                                    color: 'error',
                                    text: 'Error saving theme',
                                });
                            }
                        },
                        function (error) {
                            messageService.emit('alert', {
                                color: 'error',
                                text: error,
                            });
                        }
                    );
            },
            /**
             * @name select-theme
             * @param  payload - theme data
             * @desc select an existing theme
             */
            'select-theme': (payload: Theme): void => {
                monolithService
                    .setActiveAdminTheme({
                        id: payload.id,
                    })
                    .then(
                        (response: any): void => {
                            if (response) {
                                let option;
                                for (
                                    let listIdx = 0,
                                        listLen = _state.list.length;
                                    listIdx < listLen;
                                    listIdx++
                                ) {
                                    if (
                                        _state.list[listIdx].id === payload.id
                                    ) {
                                        option = _state.list[listIdx];
                                        break;
                                    }
                                }

                                if (!option) {
                                    messageService.emit('get-theme');
                                    return;
                                }

                                messageService.emit('set-theme', option);
                            } else {
                                messageService.emit('alert', {
                                    color: 'error',
                                    text: 'Error saving theme',
                                });
                            }
                        },
                        (error: string): void => {
                            messageService.emit('alert', {
                                color: 'error',
                                text: error,
                            });
                        }
                    );
            },
            /**
             * @name reset-theme
             * @param payload - theme data
             * @desc reset the themes
             */
            'reset-theme': (payload: Theme): void => {
                monolithService.setAllAdminThemesInactive().then(
                    (response: any): void => {
                        if (response) {
                            messageService.emit('set-theme', _state.base);
                        } else {
                            messageService.emit('alert', {
                                color: 'error',
                                text: 'Error saving theme',
                            });
                        }
                    },
                    (error: string): void => {
                        messageService.emit('alert', {
                            color: 'error',
                            text: error,
                        });
                    }
                );
            },
        };

    /**
     * @name get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    function customMerge(destination, source) {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                Object.assign(
                    source[key],
                    customMerge(destination[key], source[key])
                );
            }
        }
        Object.assign(destination || {}, source);

        return destination;
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     * @return {void}
     */
    function initialize(): void {
        // register the store to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    return {
        initialize: initialize,
        get: get,
    };
}
