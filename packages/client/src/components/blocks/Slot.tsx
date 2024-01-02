import { observer } from 'mobx-react-lite';

import { Block, BlockDef } from '@/stores';

import { Renderer } from './Renderer';

export interface SlotProps<W extends BlockDef> {
    /** Slot to Fill */
    slot: Block<W>['slots'][keyof Block<W>['slots']];

    /** The following are passed down from the rendered root */
    /** Id of selected block (if exists) */
    selectedId?: string;

    /** Whether or not workspace is in edit mode */
    isEditMode?: boolean;
}

export const Slot = observer(
    <W extends BlockDef>({ slot, selectedId, isEditMode }: SlotProps<W>) => {
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
                    <Renderer
                        key={c}
                        id={c}
                        selectedId={selectedId}
                        isEditMode={isEditMode}
                    />
                ))}
            </>
        );
    },
);
