import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Textarea } from '@semoss/ui';

export interface TextFieldBlockDef extends BlockDef<'text-field'> {
    widget: 'text-field';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        type: string;
    };
}

export const TextFieldBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<TextFieldBlockDef>(id);

    return (
        <Textarea
            rows={rows}
            minRows={minRows}
            maxRows={maxRows}
            multiline={multiline}
            placeholder={placeholder}
            value={data.value}
            label={data.label}
            style={{
                ...data.style,
                margin: '8px',
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
