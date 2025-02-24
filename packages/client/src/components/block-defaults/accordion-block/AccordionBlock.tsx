import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';
import { Accordion } from '@semoss/ui';

export interface AccordionBlockDef extends BlockDef<'accordion'> {
    widget: 'accordion';
    data: {
        style: CSSProperties;
    };
    slots: {
        header: true;
        content: true;
    };
}

export const AccordionBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<AccordionBlockDef>(id);

    return (
        <div
            style={{
                ...data.style,
                overflowWrap: 'anywhere', // text that overflows container
            }}
            {...attrs}
        >
            <Accordion>
                <Accordion.Trigger>
                    <Slot slot={slots.header} />
                </Accordion.Trigger>
                <Accordion.Content>
                    <Slot slot={slots.content} />
                </Accordion.Content>
            </Accordion>
        </div>
    );
});
