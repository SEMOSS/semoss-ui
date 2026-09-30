import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SearchItem {
	element: HTMLElement;
	text: string;
}
export interface PaneSearch {
	query: string;
	setQuery: (query: string) => void;
	position: number;
	count: number;
	navigate: (direction: number) => void;
	viewportRef: (element: HTMLElement | null) => void;
}

/** Find rendered items without filtering the transcript or changing sanitized email HTML. */
export function usePaneSearch(
	selector = "[data-search-item]",
	/** Reveal indexed content that is isolated from the searchable DOM, such as email HTML. */
	onReveal?: (element: HTMLElement) => void,
): PaneSearch {
	const frame = useRef<number | null>(null);
	useEffect(
		() => () => {
			if (frame.current !== null) cancelAnimationFrame(frame.current);
		},
		[],
	);
	const [root, setRoot] = useState<HTMLElement | null>(null);
	const [query, setQuery] = useState("");
	const [items, setItems] = useState<SearchItem[]>([]);
	const [selected, setSelected] = useState<HTMLElement | null>(null);
	useEffect(() => {
		if (!root) return;
		const read = () => {
			const elements = [...root.querySelectorAll<HTMLElement>(selector)];
			setItems(
				elements.map((element) => {
					if (element.dataset.searchText !== undefined)
						return {
							element,
							text: element.dataset.searchText.toLocaleLowerCase(),
						};
					// Index a section's own text as well as its nested disclosures,
					// without counting the same text twice or altering the rendered DOM.
					const copy = element.cloneNode(true) as HTMLElement;
					for (const child of copy.querySelectorAll(selector))
						child.remove();
					return {
						element,
						text: (
							element.dataset.searchText ??
							copy.textContent ??
							""
						).toLocaleLowerCase(),
					};
				}),
			);
		};
		read();
		const observer = new MutationObserver(read);
		observer.observe(root, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["data-search-text"],
		});
		return () => observer.disconnect();
	}, [root, selector]);
	const matches = useMemo(() => {
		const needle = query.trim().toLocaleLowerCase();
		return needle ? items.filter((item) => item.text.includes(needle)) : [];
	}, [items, query]);
	const index = matches.findIndex((item) => item.element === selected);
	const navigate = useCallback(
		(direction: number) => {
			if (!root || !matches.length) return;
			const next =
				index < 0
					? direction < 0
						? matches.length - 1
						: 0
					: (index + direction + matches.length) % matches.length;
			const element = matches[next].element;
			onReveal?.(element);
			for (const control of element.querySelectorAll<HTMLButtonElement>(
				'button[aria-expanded="false"][aria-controls]',
			)) {
				const target = document.getElementById(
					control.getAttribute("aria-controls") ?? "",
				);
				if (
					target &&
					element.contains(target) &&
					target.textContent
						?.toLocaleLowerCase()
						.includes(query.trim().toLocaleLowerCase())
				)
					control.click();
			}
			for (const detail of element.querySelectorAll("details")) {
				if (
					detail.textContent
						?.toLocaleLowerCase()
						.includes(query.trim().toLocaleLowerCase())
				)
					detail.open = true;
			}
			let parent: HTMLElement | null = element;
			while (parent && parent !== root) {
				if (parent instanceof HTMLDetailsElement) parent.open = true;
				parent = parent.parentElement;
			}
			setSelected(element);
			if (frame.current !== null) cancelAnimationFrame(frame.current);
			frame.current = requestAnimationFrame(() => {
				if (root.contains(element))
					root.scrollTop +=
						element.getBoundingClientRect().top -
						root.getBoundingClientRect().top;
			});
		},
		[root, matches, index, query, onReveal],
	);
	useEffect(() => {
		if (index < 0 || !selected) return;
		selected.dataset.searchCurrent = "true";
		return () => {
			delete selected.dataset.searchCurrent;
		};
	}, [index, selected]);
	return {
		query,
		setQuery: (value) => {
			setQuery(value);
			setSelected(null);
		},
		count: matches.length,
		position: index + 1,
		navigate,
		viewportRef: setRoot,
	};
}

export const PANE_SEARCH_CLASS =
	"[&_[data-search-current=true]]:outline-2 [&_[data-search-current=true]]:outline-primary [&_[data-search-current=true]]:outline-offset-2";
