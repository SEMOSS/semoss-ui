import { useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Autocomplete } from '@mui/material';

import { styled, TextField, Divider } from '@semoss/ui';
import { ActionMessages, useBlocks } from '@semoss/renderer';

import { useDesigner } from '@/hooks';

const STYLED_FONT_STYLE_INPUT_WIDTH = 232;
const STYLED_FONT_SIZE_INPUT_WIDTH = 168;

const StyledInputContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
    backgroundColor: 'white',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    maxWidth: `${
        STYLED_FONT_STYLE_INPUT_WIDTH + STYLED_FONT_SIZE_INPUT_WIDTH
    }px`,
    minWidth: 'fit-content',
}));

const FontStyleOptions = [
    {
        value: 'Roboto',
        display: 'Roboto',
    },
    {
        value: 'Helvetica',
        display: 'Helvetica',
    },
    {
        value: 'Arial',
        display: 'Arial',
    },
    {
        value: 'Times New Roman',
        display: 'Times New Roman',
    },
    {
        value: 'Georgia',
        display: 'Georgia',
    },
];

export const TextSettingsMask = observer(() => {
    // get the store
    const { registry, state } = useBlocks();
    const { designer } = useDesigner();

    // get the block
    const block = state.getBlock(designer.selected);

    // check if it is visible
    const isVisible =
        block && registry[block.widget] && block.widget !== 'page';

    // track the value
    const [value, setValue] = useState<{
        fontFamily: string;
        fontSize: number;
    }>({
        fontFamily: '',
        fontSize: null,
    });

    // get the current style of the block
    useLayoutEffect(() => {
        if (!isVisible || block.widget !== 'text') {
            return;
        }
        // get the current style of the block
        const blockStyle: any = block.data.style;
        if (blockStyle) {
            const { fontFamily: ff, fontSize: fs } = blockStyle;
            // set the initial value from the block's style
            setValue({
                fontFamily: ff ?? '',
                fontSize: fs ? Number(fs.replace('px', '')) : null,
            });
        }
    }, [designer.selected, isVisible]);

    /**
     * Sync the data on change
     */
    const onChange = (
        path: string,
        newValue: string | number,
        isValid: boolean,
    ) => {
        // validate the path
        if (!path) {
            console.log('Invalid path passed!');
            return;
        }
        // update the value
        setValue({ ...value, [path]: newValue });

        // check if the value is valid
        if (isValid) {
            // update the store
            state.dispatch({
                message: ActionMessages.SET_BLOCK_DATA,
                payload: {
                    id: block.id,
                    path: `style.${path}`,
                    value: path === 'fontSize' ? `${newValue}px` : newValue,
                },
            });
        }
    };

    return (
        <StyledInputContainer>
            <Autocomplete
                disablePortal
                size="small"
                options={FontStyleOptions.map((option) => option.value)}
                sx={{ width: '70%' }}
                renderInput={(params) => (
                    <TextField {...params} label="Fonts Style" />
                )}
                value={value.fontFamily}
                onChange={(e, newValue) =>
                    onChange('fontFamily', newValue, true)
                }
            />
            <Divider
                orientation="vertical"
                variant="middle"
                sx={{ borderBottomWidth: 30 }}
            />
            <TextField
                size="small"
                label="Size"
                sx={{ width: '30%' }}
                type="number"
                inputProps={{
                    min: 8,
                    max: 94,
                }}
                value={value.fontSize ?? ''}
                onChange={(e) => {
                    // sync the data on change
                    const isValid =
                        Number(e.target.value) >= 8 &&
                        Number(e.target.value) <= 94;
                    onChange('fontSize', e.target.value, isValid);
                }}
                error={
                    value.fontSize &&
                    (value.fontSize < 8 || value.fontSize > 94)
                }
            />
        </StyledInputContainer>
    );
});
