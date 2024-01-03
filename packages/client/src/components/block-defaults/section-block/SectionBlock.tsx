import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface SectionBlockDef extends BlockDef<'section'> {
    widget: 'section';
    data: {
        style: CSSProperties;
        grid: {
            value: string;
            config: { rows: number; cols: number };
        };
    };
    slots: 'children';
}

export const SectionBlock: BlockComponent = observer(({ id }) => {
    const {
        attrs,
        data: {
            style = { margin: '12px', gap: '8px' },
            grid = {
                value: '',
                label: '',
                config: { rows: 1, cols: 2 },
            },
        },
        slots,
    } = useBlock<SectionBlockDef>(id);

    // Set the grid style dynamically based on the configuration
    const gridStyle = {
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${grid.config.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.config.rows}, 1fr)`,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    ...gridStyle,
                }}
                {...attrs}
            >
                <Slot slot={slots.children}></Slot>
            </div>
        </div>
    );
});
