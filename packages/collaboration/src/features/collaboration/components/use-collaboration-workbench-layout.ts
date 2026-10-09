import {
	type RefObject,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import type { CollaborationWorkbenchLayout } from "./collaboration-workbench-layout.context";

interface WorkbenchLayoutRegistration {
	element: HTMLDivElement;
}

interface CollaborationWorkbenchLayoutResult
	extends CollaborationWorkbenchLayout {
	/** Owns the measured layout properties inherited by the header and room. */
	contentRef: RefObject<HTMLDivElement | null>;
	/** The actual header height includes any wrapped conversation controls. */
	headerRef: RefObject<HTMLElement | null>;
	/** An open room workbench extends beside the conversation header. */
	isWorkbenchLayoutActive: boolean;
}

/** Keep shell geometry in CSS while resizing without rerendering the room. */
export function useCollaborationWorkbenchLayout(): CollaborationWorkbenchLayoutResult {
	const contentRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLElement>(null);
	const [registration, setRegistration] =
		useState<WorkbenchLayoutRegistration | null>(null);
	const registerConversation = useCallback((element: HTMLDivElement) => {
		const nextRegistration = { element };
		setRegistration(nextRegistration);
		return () =>
			setRegistration((current) =>
				current === nextRegistration ? null : current,
			);
	}, []);

	useLayoutEffect(() => {
		const content = contentRef.current;
		const header = headerRef.current;
		if (!registration || !content || !header) return;
		const conversation = registration.element;
		function measureLayout(): void {
			const width = conversation.getBoundingClientRect().width;
			// The chat is hidden below md while its workbench is visible.
			if (width > 0)
				content.style.setProperty(
					"--collaboration-conversation-width",
					`${width}px`,
				);
			// Apply width first so a newly wrapped header reserves its full height.
			const height = header.getBoundingClientRect().height;
			if (height > 0)
				content.style.setProperty(
					"--collaboration-header-height",
					`${height}px`,
				);
		}
		measureLayout();
		const observer = new ResizeObserver(measureLayout);
		observer.observe(conversation, { box: "border-box" });
		observer.observe(header, { box: "border-box" });
		return () => {
			observer.disconnect();
			content.style.removeProperty("--collaboration-conversation-width");
			content.style.removeProperty("--collaboration-header-height");
		};
	}, [registration]);

	return {
		contentRef,
		headerRef,
		registerConversation,
		isWorkbenchLayoutActive: registration !== null,
	};
}
