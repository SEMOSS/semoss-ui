import type { AppTestStep } from "./app-test.types";

/** Lifecycle of listeners installed in one app iframe and its accessible frames. */
export interface IframeRecorder {
	stop: () => void;
	addCheck: () => void;
}

/** Capture is scoped to the selected app; ignored fields are never serialized. */
const isPrivate = (element: Element): boolean =>
	Boolean(element.closest("[data-private], [data-recording-ignore]")) ||
	Boolean(element.querySelector("[data-private], [data-recording-ignore]")) ||
	(element.tagName === "INPUT" &&
		["password", "hidden", "file"].includes(
			(element as HTMLInputElement).type,
		)) ||
	/password|secret|token|api.?key|credit|card.?number|cc-|one-time-code|cvv|ssn/i.test(
		[
			element.getAttribute("name"),
			element.id,
			element.getAttribute("autocomplete"),
		].join(" "),
	);

/** Identify elements across window realms without instanceof against the host. */
const isElement = (target: unknown): target is Element =>
	typeof target === "object" &&
	target !== null &&
	"nodeType" in target &&
	target.nodeType === 1;

/** Quote an attribute value without depending on the child frame's CSS globals. */
const quoteAttribute = (value: string): string =>
	`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\a ").replace(/\r/g, "\\d ")}"`;

/** Prefer unique authored identities, falling back to a document-relative path. */
export const elementSelector = (element: Element): string => {
	const root = element.getRootNode();
	const scope =
		"querySelectorAll" in root &&
		typeof root.querySelectorAll === "function"
			? (root as Document | ShadowRoot)
			: element.ownerDocument;
	const tag = element.tagName.toLowerCase();
	for (const attribute of [
		"data-testid",
		"data-test",
		"id",
		"aria-label",
		"name",
		"placeholder",
	]) {
		const value = element.getAttribute(attribute);
		if (!value) continue;
		const selector = `${tag}[${attribute}=${quoteAttribute(value)}]`;
		if (scope.querySelectorAll(selector).length === 1) {
			return prefixShadowHost(element, selector);
		}
	}
	const parts: string[] = [];
	let current: Element | null = element;
	while (current) {
		const parent: Element | null = current.parentElement;
		const currentTag = current.tagName.toLowerCase();
		if (!parent) {
			parts.unshift(currentTag);
			break;
		}
		const siblings = Array.from(parent.children).filter(
			(sibling) => sibling.tagName === current?.tagName,
		);
		parts.unshift(
			siblings.length > 1
				? `${currentTag}:nth-of-type(${siblings.indexOf(current) + 1})`
				: currentTag,
		);
		current = parent;
	}
	return prefixShadowHost(element, parts.join(" > "));
};

/** Playwright CSS locators pierce open shadow roots; preserve the host identity. */
const prefixShadowHost = (element: Element, selector: string): string => {
	const root = element.getRootNode();
	return "host" in root && isElement(root.host)
		? `${elementSelector(root.host)} ${selector}`
		: selector;
};

/** Record an app's ordinary events without forwarding or re-executing them. */
export const attachIframeRecorder = (
	frame: HTMLIFrameElement,
	onStep: (step: AppTestStep) => void,
	onNotice: (message: string) => void,
	onCheckMode: (isPicking: boolean) => void = () => undefined,
): IframeRecorder => {
	let isStopped = false;
	let isPickingCheck = false;
	let keyboardClickUntil = 0;
	const documents = new WeakSet<Document>();
	const frames = new WeakSet<HTMLIFrameElement>();
	const cleanups = new Set<() => void>();

	const attachFrame = (
		child: HTMLIFrameElement,
		framePath: string[],
	): void => {
		if (frames.has(child)) return;
		frames.add(child);
		let releaseDocument: (() => void) | undefined;
		const attachDocument = (): void => {
			if (isStopped) return;
			try {
				const doc = child.contentDocument;
				if (!doc) {
					releaseDocument?.();
					onNotice(
						"This frame cannot be recorded because its document is inaccessible.",
					);
					return;
				}
				if (documents.has(doc)) return;
				releaseDocument?.();
				if (framePath.length === 0 && child.src) {
					const expected = new URL(child.src, window.location.href);
					const actual = new URL(doc.URL);
					if (
						actual.origin !== expected.origin ||
						!actual.pathname.startsWith(expected.pathname)
					) {
						onNotice(
							"The app navigated outside its portal. Further actions there are not recorded.",
						);
						return;
					}
				}
				documents.add(doc);
				const emit = (step: AppTestStep): void => {
					if (!isStopped) onStep({ ...step, framePath });
				};
				const elementFromEvent = (event: Event): Element | null => {
					const first = event.composedPath()[0] ?? event.target;
					return isElement(first) ? first : null;
				};
				const captureCheck = (target: Element, event: Event): void => {
					event.preventDefault();
					event.stopImmediatePropagation();
					isPickingCheck = false;
					onCheckMode(false);
					const text = (target.textContent ?? "")
						.replace(/\s+/g, " ")
						.trim();
					emit({
						type: text ? "ASSERT_TEXT" : "ASSERT_VISIBLE",
						selector: elementSelector(target),
						...(text ? { text } : {}),
					});
				};
				const click = (event: MouseEvent): void => {
					const original = elementFromEvent(event);
					if (!original) return;
					const target =
						original.closest(
							"button, a, input, select, textarea, [role=button], [role=link], [contenteditable=true]",
						) ?? original;
					if (isPrivate(target)) {
						onNotice(
							"A private field was excluded. Its value will not be saved.",
						);
						return;
					}
					if (isPickingCheck) {
						captureCheck(target, event);
						return;
					}
					if (event.detail === 0 && Date.now() < keyboardClickUntil)
						return;
					if (
						["TEXTAREA", "SELECT"].includes(target.tagName) ||
						(target.tagName === "INPUT" &&
							!["submit", "button", "reset", "image"].includes(
								(target as HTMLInputElement).type,
							))
					)
						return;
					emit({ type: "CLICK", selector: elementSelector(target) });
				};
				const preventCheckActivation = (event: Event): void => {
					if (!isPickingCheck) return;
					event.preventDefault();
					event.stopImmediatePropagation();
				};
				const input = (event: Event): void => {
					const target = elementFromEvent(event);
					if (!target) return;
					if (isPrivate(target)) {
						onNotice(
							"A private field was excluded. Its value will not be saved.",
						);
						return;
					}
					const selector = elementSelector(target);
					if (target.tagName === "SELECT") {
						const select = target as HTMLSelectElement;
						if (select.multiple) {
							onNotice(
								"Multiple selection is not supported by this recorder yet.",
							);
							return;
						}
						emit({ type: "SELECT", selector, value: select.value });
					} else if (
						target.tagName === "INPUT" ||
						target.tagName === "TEXTAREA"
					) {
						const field = target as
							| HTMLInputElement
							| HTMLTextAreaElement;
						if (
							field.type === "checkbox" ||
							field.type === "radio"
						) {
							emit({
								type: "CHECK",
								selector,
								checked: (field as HTMLInputElement).checked,
							});
						} else {
							// Delayed blur/change must not repeat an earlier text input
							// after an intervening app action.
							if (event.type === "change") return;
							emit({
								type: "FILL",
								selector,
								value: field.value,
							});
						}
					} else if (
						target.getAttribute("contenteditable") === "true"
					) {
						emit({
							type: "FILL",
							selector,
							value: target.textContent ?? "",
						});
					}
				};
				const keydown = (event: KeyboardEvent): void => {
					if (
						![
							"Enter",
							"Escape",
							...(isPickingCheck ? [" "] : []),
						].includes(event.key) ||
						event.isComposing
					)
						return;
					const target = elementFromEvent(event);
					if (!target || isPrivate(target)) return;
					keyboardClickUntil = Date.now() + 100;
					if (isPickingCheck) {
						if (event.key === "Escape") {
							event.preventDefault();
							event.stopImmediatePropagation();
							isPickingCheck = false;
							onCheckMode(false);
						} else captureCheck(target, event);
						return;
					}
					emit({
						type: "KEY",
						selector: elementSelector(target),
						key: event.key,
					});
				};
				const scroll = (event: Event): void => {
					const target = elementFromEvent(event);
					if (target && isPrivate(target)) return;
					const scrolling = target ?? doc.scrollingElement;
					if (!scrolling) return;
					emit({
						type: "SCROLL",
						selector: elementSelector(scrolling),
						x: scrolling.scrollLeft,
						y: scrolling.scrollTop,
					});
				};
				doc.addEventListener("click", click, true);
				doc.addEventListener(
					"pointerdown",
					preventCheckActivation,
					true,
				);
				doc.addEventListener("mousedown", preventCheckActivation, true);
				doc.addEventListener("input", input, true);
				doc.addEventListener("change", input, true);
				doc.addEventListener("keydown", keydown, true);
				doc.addEventListener("scroll", scroll, {
					capture: true,
					passive: true,
				});
				const discoverFrames = (root: Document | Element): void => {
					const nestedFrames = Array.from(
						root.querySelectorAll("iframe"),
					);
					if (isElement(root) && root.tagName === "IFRAME")
						nestedFrames.push(root as HTMLIFrameElement);
					for (const nested of nestedFrames) {
						attachFrame(nested, [
							...framePath,
							elementSelector(nested),
						]);
					}
				};
				discoverFrames(doc);
				const observer = new MutationObserver((mutations) => {
					for (const mutation of mutations) {
						for (const node of mutation.addedNodes) {
							if (isElement(node)) discoverFrames(node);
						}
					}
				});
				observer.observe(doc, { childList: true, subtree: true });
				const cleanupDocument = (): void => {
					doc.removeEventListener("click", click, true);
					doc.removeEventListener(
						"pointerdown",
						preventCheckActivation,
						true,
					);
					doc.removeEventListener(
						"mousedown",
						preventCheckActivation,
						true,
					);
					doc.removeEventListener("input", input, true);
					doc.removeEventListener("change", input, true);
					doc.removeEventListener("keydown", keydown, true);
					doc.removeEventListener("scroll", scroll, true);
					observer.disconnect();
					documents.delete(doc);
					cleanups.delete(cleanupDocument);
				};
				releaseDocument = cleanupDocument;
				cleanups.add(cleanupDocument);
			} catch {
				releaseDocument?.();
				onNotice(
					"This frame cannot be recorded because it has a different origin.",
				);
			}
		};
		child.addEventListener("load", attachDocument);
		cleanups.add(() => child.removeEventListener("load", attachDocument));
		attachDocument();
	};

	attachFrame(frame, []);
	return {
		stop: () => {
			isStopped = true;
			for (const cleanup of cleanups) cleanup();
		},
		addCheck: () => {
			isPickingCheck = !isStopped && !isPickingCheck;
			onCheckMode(isPickingCheck);
		},
	};
};

/** Collapse consecutive field/scroll updates while retaining action order. */
export const appendRecordedStep = (
	steps: AppTestStep[],
	step: AppTestStep,
): AppTestStep[] => {
	const previous = steps.at(-1);
	const canReplace =
		previous &&
		["FILL", "SCROLL", "SELECT", "CHECK"].includes(step.type) &&
		previous.type === step.type &&
		previous.selector === step.selector &&
		JSON.stringify(previous.framePath) === JSON.stringify(step.framePath);
	return canReplace ? [...steps.slice(0, -1), step] : [...steps, step];
};
