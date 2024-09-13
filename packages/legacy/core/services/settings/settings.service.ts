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
                    materialTheme: {
                        palette: {
                            mode: "light",
                            primary: {
                                // SEMOSS BLUE
                                main: "#0471F0",
                                dark: "#1260DD",
                                light: "#22A4FF",
                                // DELOITTE GREEN
                                // main: "#26890D",
                                // light: "#86BC25",
                                // dark: "#046A38",
                                hover: "#F5F9FE",
                                selected: "#EBF4FE",
                                border: "#9FCFFF",
                            },
                            secondary: {
                                main: "#D9D9D9",
                                dark: "#757575",
                                light: "#F2F2F2",
                            },
                            text: {
                                primary: "#000000",
                                main: "#000000",
                                secondary: "#666666",
                                disabled: "#9E9E9E",
                            },
                            error: {
                                main: "#DA291C",
                                light: "#FBE9E8",
                                dark: "#BF0D02",
                            },
                            warning: {
                                main: "#FA9F2C",
                                light: "#FDF0E5",
                                dark: "#EF8326",
                            },
                            info: {
                                main: "#0471F0",
                                light: "#22A4FF",
                                dark: "#1260DD",
                            },
                            success: {
                                main: "#348700",
                                light: "#EAF2EA",
                                dark: "#006500",
                            },
                            background: {
                                paper: "#FFFFFF", // Design references this color as "paper1"
                                default: "#FAFAFA", // Design references this color as "paper2"
                            },
                            primaryContrast: {
                                // SEMOSS BLUE
                                "50": "#E2F2FF",
                                "100": "#BADEFF",
                                "200": "#8BCAFF",
                                "300": "#55B5FF",
                                "400": "#22A4FF",
                                "500": "#0094FF",
                                "600": "#0085FF",
                                "700": "#0471F0",
                                "800": "#1260DD",
                                "900": "#1C3FBE",
                                shadow: "#D6EAFF",
                                // DELOITTE GREEN
                                // "50": "#E7F4E5",
                                // "100": "#C6E4BF",
                                // "200": "#A1D396",
                                // "300": "#7AC36B",
                                // "400": "#5CB649",
                                // "500": "#3EA924",
                                // "600": "#349B1B",
                                // "700": "#26890D",
                                // "800": "#167800",
                                // "900": "#005A00",
                                // "shadow": "#E7F4E5" // Todo
                            },
                            green: {
                                "50": "#DEF4F3",
                                "100": "#ABE4E0",
                                "200": "#6FD4CB",
                                "300": "#07C2B6",
                                "400": "#00B4A4",
                                "500": "#00A593",
                                "600": "#009785",
                                "700": "#008674",
                                "800": "#007664",
                                "900": "#005946",
                            },
                            darkBlue: {
                                "50": "#EAE4F2",
                                "100": "#C9BCE0",
                                "200": "#A690CC",
                                "300": "#8364B8",
                                "400": "#6944AA",
                                "500": "#4F249B",
                                "600": "#471F96",
                                "700": "#3A188E",
                                "800": "#2D1286",
                                "900": "#150578",
                            },
                            pink: {
                                "50": "#FFE6F0",
                                "100": "#FFC0D9",
                                "200": "#FF97C0",
                                "300": "#FF6DA6",
                                "400": "#FF4E90",
                                "500": "#FF337B",
                                "600": "#ED2F77",
                                "700": "#D62C71",
                                "800": "#C0286C",
                                "900": "#992263",
                            },
                            purple: {
                                "50": "#F1E9FB",
                                "100": "#DAC9F5",
                                "200": "#C3A5F0",
                                "300": "#AA7EEA",
                                "400": "#975FE4",
                                "500": "#8340DE",
                                "600": "#783BD7",
                                "700": "#6A32CE",
                                "800": "#5D2BC7",
                                "900": "#481EB8",
                            },
                        },
                        shape: {
                            borderRadiusNone: 0,
                            borderRadius: 12,
                            borderRadiusSm: 4,
                            borderRadiusLg: 20,
                            borderRadiusCircle: 64,
                            borderRadiusChip: 64,
                        },
                        spacing: 8,
                        typography: {
                            fontFamily: '"Inter", sans-serif',
                            body1: {
                                /* Typography/Body 1 */
                                fontSize: "16px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineHeight: "150%",
                                letterSpacing: "0.15px",
                            },
                            body2: {
                                /* Typography/Body 2 */
                                fontSize: "14px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineHeight: "143%",
                                letterSpacing: "0.17px",
                            },
                            subtitle1: {
                                /* Typography/Subtitle 1 */
                                fontSize: "16px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineHeight: "175%",
                                letterSpacing: "0.15px",
                            },
                            subtitle2: {
                                /* Typography/Subtitle 2 */
                                fontSize: "14px",
                                fontStyle: "normal",
                                fontWeight: "500",
                                lineHeight: "157%",
                                letterSpacing: "0.1px",
                            },
                            caption: {
                                /* Typography/Caption */
                                fontSize: "12px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineWeight: "166%",
                                letterSpacing: "0.4px",
                            },
                            overline: {
                                /* Typography/OVERLINE */
                                fontSize: "12px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineHeight: "266%",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                            },
                            h1: {
                                /* Typography/H1 */
                                fontSize: "96px",
                                fontStyle: "normal",
                                fontWeight: "300",
                                lineHeight: "116.7%",
                                letterSpacing: "-1.5px",
                                textTransform: "none",
                            },
                            h2: {
                                /* Typography/H2 */
                                fontSize: "60px",
                                fontStyle: "normal",
                                fontWeight: "300",
                                lineHeight: "120%",
                                letterSpacing: "-0.5px",
                                textTransform: "none",
                            },
                            h3: {
                                /* Typography/H3 */
                                fontSize: "48px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineHeight: "116.7%",
                                textTransform: "none",
                            },
                            h4: {
                                /* Typography/H4 */
                                fontSize: "34px",
                                fontStyle: "normal",
                                fontWeight: "400",
                                lineHeight: "123.5%",
                                letterSpacing: "0.25px",
                                textTransform: "none",
                            },
                            h5: {
                                /* Typography/H5 */
                                fontSize: "24px",
                                fontStyle: "normal",
                                fontWeight: "500",
                                lineHeight: "133.4%",
                                textTransform: "none",
                            },
                            h6: {
                                /* Typography/H6 */
                                fontSize: "20px",
                                fontStyle: "normal",
                                fontWeight: "500",
                                lineHeight: "160%",
                                letterSpacing: "0.15px",
                                textTransform: "none",
                            },
                            button: {
                                textTransform: "none",
                                fontWeight: "600",
                            },
                        },
                        components: {
                            MuiCssBaseline: {
                                styleOverrides: (themeParam) => ({
                                    "*::-webkit-scrollbar": {
                                        width: "8px",
                                        height: "8px",
                                        background: "transparent",
                                    },
                    
                                    "*::-webkit-scrollbar-thumb": {
                                        // -webkit-border-radius: '4px',
                                        borderRadius: "4px",
                                        height: "18px",
                                        background: "#bdbdbd",
                                        backgroundClip: "padding-box",
                                    },
                    
                                    "*::-webkit-scrollbar-thumb:hover": {
                                        background: "#e0e0e0",
                                    },
                    
                                    "*::-webkit-scrollbar-thumb:active": {
                                        background: "#bdbdbd",
                                    },
                    
                                    "*::-webkit-scrollbar-button": {
                                        width: "0",
                                        height: "0",
                                        display: "none",
                                    },
                    
                                    "*::-webkit-scrollbar-corner": {
                                        backgroundColor: "transparent",
                                    },
                                }),
                            },
                            MuiAlertTitle: {
                                styleOverrides: {
                                    root: ({ theme }) => ({
                                        // color: "rgba(0, 0, 0, 0.87)",
                                        /* Components/Alert Title */
                                        fontSize: "16px",
                                        fontStyle: "normal",
                                        fontWeight: "500",
                                        lineHeight: "150%",
                                        letterSpacing: "0.15px",
                                    }),
                                },
                            },
                            MuiContainer: {
                                styleOverrides: {
                                    maxWidthSm: {
                                        maxWidth: 200,
                                    },
                                    maxWidthMd: {
                                        maxWidth: 320,
                                    },
                                    maxWidthLg: {
                                        maxWidth: 500,
                                    },
                                    maxWidthXl: {
                                        maxWidth: 1271,
                                    },
                                },
                            },
                            // https://www.figma.com/file/kZwcxDBSMJbOcFaCin2xbd/MUI-Core-v5.4.0-(Revised)?node-id=454%3A101831&mode=dev
                            MuiCard: {
                                styleOverrides: {
                                    root: ({ theme }) => {
                                        const shape = theme.shape as CustomShapeOptions;
                                        const palette =
                                            theme.palette as unknown as CustomPaletteOptions;
                                        return {
                                            display: "flex",
                                            flexDirection: "column",
                                            boxShadow:
                                                "0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
                                            borderRadius: shape.borderRadiusLg,
                    
                                            "&:hover": {
                                                boxShadow: `0px 5px 22px 0px ${palette.primaryContrast["shadow"]}`,
                                            },
                                        };
                                    },
                                },
                            },
                            MuiCardHeader: {
                                styleOverrides: {
                                    root: ({ theme }) => ({
                                        width: "100%",
                                        margin: "16px 0px 16px 0px",
                                        padding: "0px 16px 0px 16px",
                                    }),
                                    content: ({ theme }) => ({
                                        width: "80%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.spacing(1),
                                    }),
                                    action: ({ theme }) => ({}),
                                    title: ({ theme }) => ({
                                        width: "100%",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                    }),
                                },
                            },
                            MuiCardContent: {
                                styleOverrides: {
                                    root: ({ theme }) => ({
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: theme.spacing(1),
                                        margin: "0px 0px 16px 0px",
                                        padding: "0px 16px 0px 16px",
                                    }),
                                },
                            },
                            MuiCardActions: {
                                styleOverrides: {
                                    root: ({ theme }) => ({
                                        width: "100%",
                                        display: "flex",
                                        gap: theme.spacing(1),
                                        margin: "0px 0px 16px 0px",
                                        padding: "0px 8px 0px 16px",
                                    }),
                                },
                            },
                            MuiPaper: {
                                styleOverrides: {
                                    root: ({ theme }) => {
                                        const shape = theme.shape as CustomShapeOptions;
                                        return {
                                            boxShadow:
                                                "0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
                                            borderRadius: shape.borderRadiusLg,
                                        };
                                    },
                                },
                            },
                            MuiButton: {
                                styleOverrides: {
                                    root: ({ theme }) => ({
                                        boxShadow: "none",
                                    }),
                                },
                            },
                        },
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
