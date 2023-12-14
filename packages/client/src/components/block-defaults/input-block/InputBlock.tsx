import { useMemo } from 'react';
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { CircularProgress } from '@semoss/ui';

export interface InputBlockDef extends BlockDef<'input'> {
    widget: 'input';
    data: {
        style: CSSProperties;
        disabled: boolean | string; // Why is this a string?
        required: boolean | string;
        value: string;
    };
    slots: never;
}

export const InputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<InputBlockDef>(id);
    const { state } = useBlocks();

    const isDisabled = () => {
        const { disabled } = data;
        // disabled - 'true' | 'false' | true | false | undefined |'random string'
        if (typeof disabled === 'string') {
            const val = state.flattenParameter(disabled, true);

            return val === 'true';
        }

        return Boolean(disabled);
    };

    return (
        <>
            <input
                value={data.value}
                disabled={isDisabled()}
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
