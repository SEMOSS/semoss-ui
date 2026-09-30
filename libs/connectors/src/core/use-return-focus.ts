import { type RefObject, useCallback, useEffect, useRef } from "react";

/** What {@link useReturnFocus} returns. */
export interface ReturnFocus {
	/** Attach to the list whose rows open items. */
	listRef: RefObject<HTMLUListElement | null>;
	/** Note the row that opened an item, so focus goes back to it. */
	rememberItem: (itemKey: string) => void;
}

/**
 * Send focus back to the row that opened an item once the item closes, so a
 * keyboard user carries on where they were in the list.
 *
 * @param isItemOpen - Whether an item is open over the list.
 * @return The list's ref and a way to note the opening row.
 */
export const useReturnFocus = (isItemOpen: boolean): ReturnFocus => {
	const listRef = useRef<HTMLUListElement>(null);
	const itemKeyRef = useRef<string | null>(null);

	useEffect(() => {
		const itemKey = itemKeyRef.current;
		if (isItemOpen || !itemKey) {
			return;
		}
		itemKeyRef.current = null;
		const rows =
			listRef.current?.querySelectorAll<HTMLElement>("[data-item-key]");
		const row = rows
			? Array.from(rows).find(
					(candidate) => candidate.dataset.itemKey === itemKey,
				)
			: undefined;
		row?.focus();
	}, [isItemOpen]);

	const rememberItem = useCallback((itemKey: string) => {
		itemKeyRef.current = itemKey;
	}, []);

	return { listRef: listRef, rememberItem: rememberItem };
};
