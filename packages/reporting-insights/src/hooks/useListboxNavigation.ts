/**
 * useListboxNavigation — shared arrow-key navigation for searchable listbox-style
 * dropdowns (SearchableSelect, VizTypeSelect, QueryPicker, VizConfigDropZones, …).
 * Tracks a single "active" key, moves it with Up/Down/Home/End, and activates it
 * on Enter. Callers wire the returned `onKeyDown` to their trigger/search input.
 */
import { useEffect, useId, useRef, useState } from "react";

interface ListboxKeyboardEvent {
	key: string;
	preventDefault: () => void;
}

interface UseListboxNavigationOptions {
	keys: string[];
	open: boolean;
	selectedKey?: string;
	/** Select the current/first option when the list opens (default true). */
	autoActivate?: boolean;
	onActivate: (key: string) => void;
	onEscape?: () => void;
}

export function useListboxNavigation({
	keys,
	open,
	selectedKey,
	autoActivate = true,
	onActivate,
	onEscape,
}: UseListboxNavigationOptions) {
	const listboxId = useId();
	const [activeKey, setActiveKey] = useState<string | null>(null);
	const optionRefs = useRef(new Map<string, HTMLElement>());
	const previousKeysRef = useRef(keys);

	useEffect(() => {
		if (!open) {
			// The active descendant is transient UI state and must not survive a closed listbox.
			setActiveKey(null);
			previousKeysRef.current = keys;
			return;
		}
		setActiveKey((current) => {
			if (current && keys.includes(current)) return current;
			if (selectedKey && keys.includes(selectedKey)) return selectedKey;
			if (current) {
				const previousIndex = previousKeysRef.current.indexOf(current);
				if (previousIndex >= 0 && keys.length > 0)
					return keys[Math.min(previousIndex, keys.length - 1)];
			}
			return autoActivate ? (keys[0] ?? null) : null;
		});
		previousKeysRef.current = keys;
	}, [autoActivate, keys, open, selectedKey]);

	useEffect(() => {
		if (!open || !activeKey) return;
		optionRefs.current.get(activeKey)?.scrollIntoView({ block: "nearest" });
	}, [activeKey, open]);

	const move = (direction: -1 | 1) => {
		if (keys.length === 0) return;
		setActiveKey((current) => {
			const currentIndex = current ? keys.indexOf(current) : -1;
			if (currentIndex < 0)
				return direction === 1 ? keys[0] : keys[keys.length - 1];
			return keys[
				Math.max(0, Math.min(keys.length - 1, currentIndex + direction))
			];
		});
	};

	const onKeyDown = (event: ListboxKeyboardEvent) => {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				move(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				move(-1);
				break;
			case "Home":
				if (keys.length === 0) return;
				event.preventDefault();
				setActiveKey(keys[0]);
				break;
			case "End":
				if (keys.length === 0) return;
				event.preventDefault();
				setActiveKey(keys[keys.length - 1]);
				break;
			case "Enter":
				if (!activeKey) return;
				event.preventDefault();
				onActivate(activeKey);
				break;
			case "Escape":
				if (!onEscape) return;
				event.preventDefault();
				onEscape();
				break;
		}
	};

	const getOptionId = (key: string) =>
		`${listboxId}-option-${keys.indexOf(key)}`;
	const setOptionRef = (key: string, node: HTMLElement | null) => {
		if (node) optionRefs.current.set(key, node);
		else optionRefs.current.delete(key);
	};

	return {
		activeKey,
		setActiveKey,
		listboxId,
		activeDescendant: activeKey ? getOptionId(activeKey) : undefined,
		getOptionId,
		setOptionRef,
		onKeyDown,
	};
}
