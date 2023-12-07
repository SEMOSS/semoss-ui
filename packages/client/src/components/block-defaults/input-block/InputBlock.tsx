import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

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

    // if data.disabled is a string go look for query in store
    // and see if it's still loading

    return (
        <input
            value={data.value}
            disabled={data.disabled}
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
    );
});
