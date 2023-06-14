import { createTheme, config } from '@semoss/components';

export const theme = createTheme({
    borderWidths: {
        ...config.theme.borderWidths,
    },
    radii: {
        ...config.theme.radii,
    },
    colors: {
        ...config.theme.colors,
        background: '#FBFBFB',
    },
    fontSizes: {
        ...config.theme.fontSizes,
    },
    fontWeights: {
        ...config.theme.fontWeights,
    },
    lineHeights: {
        ...config.theme.lineHeights,
    },
    shadows: {
        ...config.theme.shadows,
    },
    space: {
        ...config.theme.space,
    },
});
