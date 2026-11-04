import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { getFileOperationErrorMessage } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";

/** The public save/load surface shared by the Word and Excel elements. */
export interface OfficeEditorElement extends HTMLElement {
	fileName: string;
	readonly dirty: boolean;
	load(bytes: Uint8Array | ArrayBuffer, fileName?: string): Promise<void>;
	saveBytes(): Promise<Uint8Array>;
	markClean(): void;
	/** Excel validates its active cell before serializing. */
	commitEdit?: () => boolean;
}

interface OfficeEditorSessionOptions {
	/** The concrete element, rather than a wrapper that can retarget on remount. */
	element: OfficeEditorElement | null;
	content: Uint8Array | null;
	fileName: string;
	readRevision: number;
	readStatus: string;
	resourceScope: string;
	readOnly: boolean;
	changeEvent: "document-change" | "workbook-change";
	onSave: (content: string) => Promise<boolean>;
	saveErrorMessage: string;
}

interface LoadedOfficeSession {
	element: OfficeEditorElement;
	resourceScope: string;
	readRevision: number;
	revision: number;
	isLoaded: boolean;
}

interface OfficeEditorSession {
	error: Error | null;
	isDirty: boolean;
	isLoading: boolean;
	isSaving: boolean;
	save: () => Promise<void>;
}

/**
 * Own a source-backed editor load and acknowledge only the snapshot that was
 * persisted. Content-change events count every edit, unlike dirty transitions.
 */
export const useOfficeEditorSession = ({
	element,
	content,
	fileName,
	readRevision,
	readStatus,
	resourceScope,
	readOnly,
	changeEvent,
	onSave,
	saveErrorMessage,
}: OfficeEditorSessionOptions): OfficeEditorSession => {
	const [error, setError] = useState<Error | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const sessionRef = useRef<LoadedOfficeSession | null>(null);
	const savingRef = useRef(false);
	const canWriteRef = useRef(!readOnly);

	useLayoutEffect(() => {
		// Publish committed permission changes before an in-flight save resumes.
		canWriteRef.current = !readOnly;
	}, [readOnly]);

	useEffect(() => {
		if (element) element.fileName = fileName;
	}, [element, fileName]);

	useEffect(() => {
		if (readStatus === "SUCCESS" && readRevision > 0) setError(null);
	}, [readRevision, readStatus]);

	useEffect(() => {
		if (!element || !content || readStatus !== "SUCCESS") return;
		const session: LoadedOfficeSession = {
			element,
			resourceScope,
			readRevision,
			revision: 0,
			isLoaded: false,
		};
		sessionRef.current = session;
		setIsLoading(true);
		setIsDirty(false);
		const handleDirtyChange = () => {
			if (sessionRef.current === session) setIsDirty(element.dirty);
		};
		const handleChange = () => {
			session.revision += 1;
			handleDirtyChange();
		};
		const errorEvent =
			changeEvent === "workbook-change"
				? "workbook-error"
				: "document-error";
		const handleError = (event: Event) => {
			if (
				sessionRef.current !== session ||
				!session.isLoaded ||
				!(event instanceof CustomEvent)
			)
				return;
			const detail: unknown = event.detail;
			const cause =
				typeof detail === "object" &&
				detail !== null &&
				"error" in detail
					? detail.error
					: detail;
			// An editing failure must not unmount a document with unsaved work.
			toast.error(
				getFileOperationErrorMessage(
					"Failed to update Office file",
					cause,
				),
			);
		};
		element.addEventListener(changeEvent, handleChange);
		element.addEventListener("dirty-change", handleDirtyChange);
		element.addEventListener(errorEvent, handleError);
		void element.load(content, element.fileName).then(
			() => {
				if (sessionRef.current !== session) return;
				session.isLoaded = true;
				setIsLoading(false);
				handleDirtyChange();
			},
			(cause: unknown) => {
				if (sessionRef.current !== session) return;
				setIsLoading(false);
				setError(
					cause instanceof Error ? cause : new Error(String(cause)),
				);
			},
		);
		return () => {
			if (sessionRef.current === session) sessionRef.current = null;
			setIsLoading(false);
			element.removeEventListener(changeEvent, handleChange);
			element.removeEventListener("dirty-change", handleDirtyChange);
			element.removeEventListener(errorEvent, handleError);
		};
	}, [
		changeEvent,
		content,
		element,
		readRevision,
		readStatus,
		resourceScope,
	]);

	const save = useCallback(async (): Promise<void> => {
		const session = sessionRef.current;
		if (
			!session?.isLoaded ||
			readOnly ||
			!canWriteRef.current ||
			savingRef.current ||
			readStatus !== "SUCCESS"
		) {
			return;
		}
		savingRef.current = true;
		setIsSaving(true);
		try {
			if (session.element.commitEdit?.() === false) return;
			const revision = session.revision;
			const bytes = await session.element.saveBytes();
			if (sessionRef.current !== session || !canWriteRef.current) return;
			if (
				(await onSave(encodeBytesToBase64(bytes))) &&
				sessionRef.current === session &&
				session.revision === revision &&
				canWriteRef.current
			) {
				session.element.markClean();
				setIsDirty(false);
			}
		} catch (cause) {
			if (sessionRef.current !== session) return;
			toast.error(getFileOperationErrorMessage(saveErrorMessage, cause));
			console.error(cause);
		} finally {
			savingRef.current = false;
			setIsSaving(false);
		}
	}, [onSave, readOnly, readStatus, saveErrorMessage]);

	return { error, isDirty, isLoading, isSaving, save };
};
