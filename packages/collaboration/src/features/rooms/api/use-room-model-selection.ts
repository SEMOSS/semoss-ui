import { useCallback, useRef, useState } from "react";
import type { RoomStore } from "@semoss/sdk";
import type { Engine } from "@semoss/shared";

/** Persist and expose one room's model without optimistic selection drift. */
export function useRoomModelSelection(
	roomId: string,
	room: RoomStore | null,
	fallbackModelId = "",
) {
	const [selection, setSelection] = useState<{
		roomId: string;
		engine: Engine;
	} | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const savingRef = useRef(false);
	const selectedEngine =
		selection?.roomId === roomId ? selection.engine : null;
	const modelId =
		selectedEngine?.engine_id || room?.options.modelId || fallbackModelId;

	const selectModel = useCallback(
		async (engine: Engine) => {
			if (!room || savingRef.current) return;
			savingRef.current = true;
			setIsSaving(true);
			try {
				await room.updateOptions({ modelId: engine.engine_id });
				setSelection({ roomId: room.roomId, engine });
			} finally {
				savingRef.current = false;
				setIsSaving(false);
			}
		},
		[room],
	);

	return { modelId, selectedEngine, isSaving, selectModel };
}
