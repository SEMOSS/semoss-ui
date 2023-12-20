import { useMemo } from 'react';
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { TextField, CircularProgress } from '@semoss/ui';

export interface InputBlockDef extends BlockDef<'input'> {
    widget: 'input';
    data: {
        style: CSSProperties;
        disabled: boolean | string;
        required: boolean | string;
        value: string;
    };
    slots: never;
}

export const InputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<InputBlockDef>(id);

    return (
        <>
            <input
                value={data.value}
                style={{
                    ...data.style,
                }}
                onChange={(e) => {
                    const value = e.target.value;

                    // update the value
                    setData('value', value);
                }}
                {...attrs}
            />
        </>
    );
});
