import { observer } from 'mobx-react-lite';

import { Block, WidgetDef } from '@/stores';

import { Renderer } from './Renderer';

export interface SlotProps<W extends WidgetDef> {
    /** Slot to Fill */
    slot: Block<W>['slots'][keyof Block<W>['slots']];
}

export const Slot = observer(<W extends WidgetDef>({ slot }: SlotProps<W>) => {
    // check if the slot is correct
    if (!slot) {
        throw Error(`Slot is invalid`);
    }

    return (
        <>
            {slot.children.length === 0 && (
                <div
                    data-slot={slot.name}
                    style={{
                        fontSize: '.875rem',
                        height: 'fit-content(8px)',
                        width: 'fit-content(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textOverflow: 'hidden',
                    }}
                >
                    Add Content
                </div>
            )}
            {slot.children.map((c) => (
                <Renderer key={c} id={c} />
            ))}
        </>
    );
});
