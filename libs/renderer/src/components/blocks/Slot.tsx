import { observer } from "mobx-react-lite";

import { Block, BlockDef } from "../../store";

import { RendererEngine } from "./RendererEngine";

export interface SlotProps<W extends BlockDef> {
    /** Slot to Fill */
    slot: Block<W>["slots"][keyof Block<W>["slots"]];
}

export const Slot = observer(<W extends BlockDef>({ slot }: SlotProps<W>) => {
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
                        fontSize: ".875rem",
                        height: "fit-content(8px)",
                        width: "fit-content(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textOverflow: "hidden",
                    }}
                >
                    Add Content
                </div>
            )}
            {slot.children.map((c) => (
                <RendererEngine key={c} id={c} />
            ))}
        </>
    );
});
