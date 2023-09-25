import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent, ActionMessages } from '@/stores';

export interface InputBlockDef extends BlockDef<'input'> {
    widget: 'input';
    data: {
        style: CSSProperties;
        disabled: boolean | string;
        required: boolean | string;
        value: string;
    };
    listeners: {
        onChange: true;
    };
    slots: never;
}

export const InputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<InputBlockDef>(id);

    return (
        <input
            value={data.value}
            style={{
                ...data.style,
            }}
            onChange={(e) => {
                const value = e.target.value;

                // update the value
                setData('value', value);

                // trigger the listeners
                listeners.onChange((action) => {
                    if (action.message === ActionMessages.SET_BLOCK_DATA) {
                        // update the value
                        action.payload.value = e.target.value;
                    }

                    return action;
                });
            }}
            {...attrs}
        />
    );
});
