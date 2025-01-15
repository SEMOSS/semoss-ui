import { useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

import { useBlock, useBlockSettings } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';
import { darkTheme, lightTheme } from '@semoss/ui';

export interface ThemeBlockDef extends BlockDef<'theme'> {
    widget: 'theme';
    data: {
        theme: {};
        themeType: string;
    };
    slots: {
        children: true;
    };
}

export const ThemeBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<ThemeBlockDef>(id);
    const { setData } = useBlockSettings(id);

    useEffect(() => {
        setData('theme', data.themeType === 'light' ? lightTheme : darkTheme);
    }, [data.themeType]);

    const t = useMemo(() => {
        return createTheme({ ...data.theme });
    }, [data.theme]);

    return (
        <MuiThemeProvider theme={t}>
            <div {...attrs}>
                <Slot slot={slots.children}></Slot>
            </div>
        </MuiThemeProvider>
    );
});
