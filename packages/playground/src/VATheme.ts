import { createTheme } from '@mui/material/styles';

// declare module '@mui/material/styles' {
//     interface Shape {
//         borderRadiusNone: number;
//         borderRadiusSm: number;
//         borderRadiusLg: number;
//         borderRadiusCircle: number;
//         borderRadiusChip: number;
//     }

//     interface ShapeOptions {
//         borderRadiusNone?: number;
//         borderRadiusSm?: number;
//         borderRadiusLg?: number;
//         borderRadiusCircle?: number;
//         borderRadiusChip?: number;
//     }

//     interface PaletteColor {
//         hover?: string;
//         selected?: string;
//         border?: string;
//         disabled?: string;
//         divider?: string;
//         text?: string;
//         white?: string;
//         backdropOverlay?: string;
//     }

//     interface Palette {
//         pageBackground: PaletteColorOptions;
//         sidebarToggle: PaletteColorOptions;
//         LLMSelect: PaletteColorOptions;
//         fileUploadButton: PaletteColorOptions;
//         sendMessageButton: PaletteColorOptions;
//         conversationMessage: PaletteColorOptions;
//         tempMessage: PaletteColorOptions;
//         sidebarContainer: PaletteColorOptions;
//         newChatButton: PaletteColorOptions;
//         sidebarFooter: PaletteColorOptions;
//         sidebarSectionTitles: PaletteColorOptions;
//         sidebarConvoTile: PaletteColorOptions;
//         uploadModal: PaletteColorOptions;
//         fileDropzoneButtons: PaletteColorOptions;
//         fileDropzone: PaletteColorOptions;
//         section: PaletteColorOptions;
//         promptLibrary: PaletteColorOptions;
//     }

//     interface PaletteOptions {
//         pageBackground?: PaletteColorOptions;
//         sidebarToggle?: PaletteColorOptions;
//         LLMSelect?: PaletteColorOptions;
//         fileUploadButton?: PaletteColorOptions;
//         sendMessageButton?: PaletteColorOptions;
//         conversationMessage?: PaletteColorOptions;
//         tempMessage?: PaletteColorOptions;
//         sidebarContainer?: PaletteColorOptions;
//         newChatButton?: PaletteColorOptions;
//         sidebarFooter?: PaletteColorOptions;
//         sidebarSectionTitles?: PaletteColorOptions;
//         sidebarConvoTile?: PaletteColorOptions;
//         uploadModal?: PaletteColorOptions;
//         fileDropzoneButtons?: PaletteColorOptions;
//         fileDropzone?: PaletteColorOptions;
//         section?: PaletteColorOptions;
//         promptLibrary?: PaletteColorOptions;
//     }
// }

// interface PaletteColorOptions {
//     main?: string;
//     background?: string;
//     backgroundSelected?: string;
//     border?: string;
//     borderSelected?: string;
//     color?: string;
//     colorSelected?: string;
//     backgroundImage?: string;
//     outline?: string;
//     outlineDisabled?: string;
//     backgroundAgent?: string;
//     backgroundUser?: string;
//     backgroundText?: string;
//     colorIcons?: string;
//     backgroundOuter?: string;
//     backgroundInner?: string;
//     backgroundHover?: string;
//     buttonBackground?: string;
//     borderDisabled?: string;
//     borderDragging?: string;
//     borderInvalid?: string;
//     colorDisabled?: string;
//     backgroundTop?: string;
//     backgroundBottom?: string;
//     colorButtons?: string;
//     borderDivider?: string;
//     colorDragging?: string;
//     colorLink?: string;
//     promptChip: '#EBEBEB',
// }

export const customTheme = createTheme({
    // palette: {
    //     primary: {
    //         main: '#162E51',
    //     },
    //     pageBackground: {
    //         background: 'transparent',
    //     },
    //     sidebarToggle: {
    //         background: undefined,
    //         backgroundSelected: '#003777',
    //         border: '#162E51',
    //         borderSelected: undefined,
    //         color: '#162E51',
    //         colorSelected: '#FFFFFF',
    //     },
    //     LLMSelect: {
    //         background: '#FFFFFF',
    //     },
    //     fileUploadButton: {
    //         background: '#FFFFFF',
    //         color: '#162E51',
    //         outline: '#162E51',
    //         outlineDisabled: '#9E9E9E',
    //     },
    //     sendMessageButton: {
    //         background: '#FFFFFF',
    //         color: '#162E51',
    //         outline: '#162E51',
    //         outlineDisabled: '#9E9E9E',
    //     },
    //     conversationMessage: {
    //         backgroundAgent:
    //             'linear-gradient(180deg, #F2F2F2 0%, #FBFBFB 65.9%)',
    //         backgroundUser: 'transparent',
    //         backgroundText:
    //             'linear-gradient(180deg, #F2F2F2 0%, #FBFBFB 65.9%)',
    //         colorIcons: '#9E9E9E', // like and dislike response icons
    //     },
    //     tempMessage: {
    //         color: '#212121',
    //     },
    //     sidebarContainer: {
    //         backgroundOuter: 'transparent',
    //         backgroundInner: '#b9c9d4',
    //     },
    //     newChatButton: {
    //         background: '#162E51',
    //         backgroundHover: '#EBF4FE',
    //         color: '#FFFFFF',
    //     },
    //     sidebarFooter: {
    //         background: '#b9c9d4',
    //         border: '#162E51',
    //     },
    //     sidebarSectionTitles: {
    //         color: '#212121',
    //     },
    //     sidebarConvoTile: {
    //         background: 'transparent',
    //         backgroundSelected: '#FFFFFF',
    //         color: '#212121',
    //         colorSelected: '#212121',
    //     },
    //     uploadModal: {
    //         color: '#212121',
    //         buttonBackground: '#152E51',
    //     },
    //     fileDropzoneButtons: {
    //         background: '#162E51' + '1D',
    //         color: '#162E51',
    //     },
    //     fileDropzone: {
    //         border: '#D9D9D9',
    //         borderDisabled: '#D9D9D9',
    //         borderDragging: '#1777d6',
    //         borderInvalid: '#DA291C',
    //         color: '#BDBDBD',
    //         colorDisabled: '#BDBDBD',
    //         colorDragging: '#1777d6',
    //     },
    //     section: {
    //         border: '#162E51',
    //         backgroundTop: '#b9c9d4',
    //         backgroundBottom: '#FFFFFF',
    //     },
    //     promptLibrary: {
    //         colorButtons: '#162E51',
    //         border: 'rgba(64, 160, 255, 0.50)',
    //         borderDivider: '#9FCFFF',
    //         background: '#FFFFFF',
    //         colorLink: '#162E51',
    //     },
    // },
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
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '150%',
            letterSpacing: '0.15px',
        },
        body2: {
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '143%',
            letterSpacing: '0.17px',
        },
        subtitle1: {
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '175%',
            letterSpacing: '0.15px',
        },
        subtitle2: {
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '157%',
            letterSpacing: '0.1px',
        },
        caption: {
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '166%',
            letterSpacing: '0.4px',
        },
        overline: {
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '266%',
            letterSpacing: '1px',
            textTransform: 'uppercase',
        },
        h1: {
            fontSize: '96px',
            fontStyle: 'normal',
            fontWeight: '300',
            lineHeight: '116.7%',
            letterSpacing: '-1.5px',
            textTransform: 'none',
        },
        h2: {
            fontSize: '60px',
            fontStyle: 'normal',
            fontWeight: '300',
            lineHeight: '120%',
            letterSpacing: '-0.5px',
            textTransform: 'none',
        },
        h3: {
            fontSize: '48px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '116.7%',
            textTransform: 'none',
        },
        h4: {
            fontSize: '34px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '123.5%',
            letterSpacing: '0.25px',
            textTransform: 'none',
        },
        h5: {
            fontSize: '24px',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '133.4%',
            textTransform: 'none',
        },
        h6: {
            fontSize: '20px',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '160%',
            letterSpacing: '0.15px',
            textTransform: 'none',
        },
        button: {
            textTransform: 'none',
            fontWeight: '600',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '*::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                    background: 'transparent',
                },
                '*::-webkit-scrollbar-thumb': {
                    borderRadius: '4px',
                    height: '18px',
                    background: '#bdbdbd',
                    backgroundClip: 'padding-box',
                },
                '*::-webkit-scrollbar-thumb:hover': {
                    background: '#e0e0e0',
                },
                '*::-webkit-scrollbar-thumb:active': {
                    background: '#bdbdbd',
                },
                '*::-webkit-scrollbar-button': {
                    width: '0',
                    height: '0',
                    display: 'none',
                },
                '*::-webkit-scrollbar-corner': {
                    backgroundColor: 'transparent',
                },
            },
        },
        MuiAlertTitle: {
            styleOverrides: {
                root: {
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: '500',
                    lineHeight: '150%',
                    letterSpacing: '0.15px',
                },
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
        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => {
                    const shape = theme.shape;
                    const palette = theme.palette;
                    return {
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow:
                            '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
                        borderRadius: shape.borderRadiusLg,
                        '&:hover': {
                            boxShadow: `0px 5px 22px 0px ${palette.primary?.main}`,
                        },
                    };
                },
            },
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    width: '100%',
                    margin: '16px 0px 16px 0px',
                    padding: '0px 16px 0px 16px',
                },
                content: {
                    width: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                },
                action: {},
                title: {
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    margin: '0px 0px 16px 0px',
                    padding: '0px 16px 0px 16px',
                },
            },
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    width: '100%',
                    display: 'flex',
                    gap: 1,
                    margin: '0px 0px 16px 0px',
                    padding: '0px 8px 0px 16px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: ({ theme }) => {
                    const shape = theme.shape;
                    return {
                        boxShadow:
                            '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
                        borderRadius: shape.borderRadiusLg,
                    };
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                },
            },
        },
    },
});
