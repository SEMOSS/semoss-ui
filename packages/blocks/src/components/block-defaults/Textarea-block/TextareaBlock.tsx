import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { TextArea } from '@semoss/ui';

export interface TextareaDef extends BlockDef<'textarea'> {
    widget: 'textarea';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        type: string;
        rows: number;
        multiline: boolean;
    };
}

export const TextareaBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<TextareaDef>(id);

    return (
        <TextArea
            rows={data.rows}
            multiline={data.multiline}
            value={data.value}
            label={data.label}
            sx={{
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
