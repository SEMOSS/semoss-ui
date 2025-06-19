import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

import { customTheme } from '@/theme';

import '@fontsource/arbutus-slab';

export interface ThemeProps {
    /** children to be rendered */
    children?: React.ReactNode;
}

const theme = createTheme(customTheme);

export const Theme = (props: ThemeProps) => {
    const { children } = props;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
