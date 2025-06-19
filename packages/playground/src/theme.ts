import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Theme {
        shape: {
            borderRadiusNone: number;
            borderRadiusSm: number;
            borderRadiusLg: number;
            borderRadiusCircle: number;
            borderRadiusChip: number;
            borderRadius: number;
        };
    }

    interface ThemeOptions {
        shape?: {
            borderRadiusNone?: number;
            borderRadiusSm?: number;
            borderRadiusLg?: number;
            borderRadiusCircle?: number;
            borderRadiusChip?: number;
            borderRadius?: number;
        };
    }

    interface PaletteColor {
        hover?: string;
        selected?: string;
        border?: string;
        text?: string;
        divider?: string;
        disabled?: string;
        [key: string]: string | undefined;
    }

    interface SimplePaletteColorOptions {
        hover?: string;
        selected?: string;
        border?: string;
        text?: string;
        divider?: string;
        disabled?: string;
        main: string;
        [key: string]: string | undefined;
    }

    interface TypeBackground {
        backdropOverlay?: string;
    }

    interface TypeText {
        white?: string;
    }

    interface Palette {
        primaryContrast: PaletteColor;
        green: PaletteColor;
        darkBlue: PaletteColor;
        pink: PaletteColor;
        purple: PaletteColor;
    }

    interface PaletteOptions {
        primaryContrast?: SimplePaletteColorOptions;
        green?: SimplePaletteColorOptions;
        darkBlue?: SimplePaletteColorOptions;
        pink?: SimplePaletteColorOptions;
        purple?: SimplePaletteColorOptions;
    }
}

export const customTheme = createTheme({
    palette: {
        primary: {
            main: '#0471F0',
            dark: '#1260DD',
            light: '#0390D8',
            hover: '#F5F9FB',
            selected: '#EBF4FE',
            border: '#9FCFFF',
        },
        secondary: {
            main: '#D9D9D9',
            dark: '#757575',
            light: '#F2F2F2',
            hover: 'F5F5F5',
            selected: '#EBEBEB',
            disabled: '#BDBDBD',
            border: '#C4C4C4',
            divider: '#E6E6E6',
        },
        background: {
            paper: '#FFFFFF',
            default: '#FAFAFA',
            backdropOverlay: '#7F7F7F',
        },
        text: {
            primary: '#212121',
            secondary: '#666666',
            disabled: '#9E9E9E',
            white: '#FFFFFF',
        },
        error: {
            main: '#da291c',
            dark: '#BF0D02',
            light: '#FBE9E8',
            text: '#57100B',
        },
        warning: {
            main: '#FA9F2C',
            dark: '#EF8326',
            light: '#FDF0E5',
            text: '#5F2B01',
        },
        success: {
            main: '#348700',
            dark: '#006500',
            light: '#4CAF50',
            selected: '#e6EFE6',
            text: '#123214',
        },
        primaryContrast: {
            main: '#0094FF',
            '50': '#C6E3FF',
            '100': '#BADEFF',
            '200': '#8BCAFF',
            '300': '#55B5FF',
            '400': '#22A4FF',
            '500': '#0094FF',
            '600': '#0085FF',
            '700': '#0471F0',
            '800': '#1260DD',
            '900': '#1C3FBE',
            shadow: '#D6EAFF',
        },
        green: {
            main: '#00A593',
            '50': '#DEF4F3',
            '100': '#ABE4E0',
            '200': '#6FD4CB',
            '300': '#07C2B6',
            '400': '#00B4A4',
            '500': '#00A593',
            '600': '#009785',
            '700': '#008674',
            '800': '#007664',
            '900': '#005946',
        },
        darkBlue: {
            main: '#4F249B',
            '50': '#EAE4F2',
            '100': '#C9BCE0',
            '200': '#A690CC',
            '300': '#8364B8',
            '400': '#6944AA',
            '500': '#4F249B',
            '600': '#471F96',
            '700': '#3A188E',
            '800': '#2D1286',
            '900': '#150578',
        },
        pink: {
            main: '#FF337B',
            '50': '#FFE6F0',
            '100': '#FFC0D9',
            '200': '#FF97C0',
            '300': '#FF6DA6',
            '400': '#FF4E90',
            '500': '#FF337B',
            '600': '#ED2F77',
            '700': '#D62C71',
            '800': '#C0286C',
            '900': '#992263',
        },
        purple: {
            main: '#8340DE',
            '50': '#F1E9FB',
            '100': '#DAC9F5',
            '200': '#C3A5F0',
            '300': '#AA7EEA',
            '400': '#975FE4',
            '500': '#8340DE',
            '600': '#783BD7',
            '700': '#6A32CE',
            '800': '#5D2BC7',
            '900': '#481EB8',
        },
    },
    shape: {
        borderRadiusNone: 0,
        borderRadius: 12,
        borderRadiusSm: 4,
        borderRadiusLg: 12,
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
            fontWeight: '500',
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
