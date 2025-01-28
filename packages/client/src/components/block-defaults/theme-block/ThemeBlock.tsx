import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface ThemeBlockDef extends BlockDef<'theme'> {
    widget: 'theme';
    data: {
        theme: {};
    };
    slots: {
        children: true;
    };
}

export const ThemeBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<ThemeBlockDef>(id);

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
