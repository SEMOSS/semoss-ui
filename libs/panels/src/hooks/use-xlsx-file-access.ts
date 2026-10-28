import type {
	Workbook,
	XlsxEditorElement,
} from "@christophervr/xlsx-react-viewer";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	getXlsxFileAccess,
	verifyXlsxModifyPassword,
	type XlsxFileAccess,
} from "../components/views/office/xlsx-file-access";

interface XlsxAccessSession {
	key: string;
	element: XlsxEditorElement;
	workbook: Workbook;
	access: XlsxFileAccess;
	isUnlocked: boolean;
}

interface UseXlsxFileAccessOptions {
	element: XlsxEditorElement | null;
	/** Changes when source scope or loaded revision changes, including explicit refresh. */
	sourceKey: string;
	readOnly: boolean;
}

interface XlsxFileAccessState {
	access: XlsxFileAccess | null;
	readOnly: boolean;
	error: string | null;
	enableEditing: () => void;
	unlock: (password: string) => Promise<boolean>;
}

/** Apply author preferences before a loaded workbook can become editable. */
export const useXlsxFileAccess = ({
	element,
	sourceKey,
	readOnly,
}: UseXlsxFileAccessOptions): XlsxFileAccessState => {
	const [session, setSession] = useState<XlsxAccessSession | null>(null);
	const [error, setError] = useState<{
		sourceKey: string;
		message: string;
	} | null>(null);
	const currentRef = useRef<XlsxAccessSession | null>(null);
	const permissionRef = useRef(readOnly);
	useLayoutEffect(() => {
		permissionRef.current = readOnly;
	}, [readOnly]);
	const isCurrent = session?.key === sourceKey && session.element === element;
	const effectiveReadOnly =
		readOnly ||
		!isCurrent ||
		(!session.isUnlocked && session.access.kind !== "editable");

	useLayoutEffect(() => {
		if (!element) return;
		currentRef.current = null;
		element.readOnly = true;
		setError(null);
		const handleWorkbook = () => {
			const workbook = element.workbook;
			const previous = currentRef.current?.workbook;
			if (
				!workbook ||
				previous === workbook ||
				(workbook.source &&
					previous?.source?.parts === workbook.source.parts)
			)
				return;
			try {
				const next = {
					key: sourceKey,
					element,
					workbook,
					access: getXlsxFileAccess(workbook),
					isUnlocked: false,
				};
				currentRef.current = next;
				element.readOnly =
					permissionRef.current || next.access.kind !== "editable";
				setSession(next);
				setError(null);
			} catch (cause) {
				currentRef.current = null;
				element.readOnly = true;
				setSession(null);
				setError({
					sourceKey,
					message:
						cause instanceof Error
							? cause.message
							: "Unable to read workbook protection settings",
				});
			}
		};
		element.addEventListener("workbook-change", handleWorkbook);
		return () => {
			currentRef.current = null;
			element.removeEventListener("workbook-change", handleWorkbook);
		};
	}, [element, sourceKey]);

	useLayoutEffect(() => {
		if (!element) return;
		const enforceReadOnly = () => {
			if (effectiveReadOnly && !element.readOnly) element.readOnly = true;
		};
		element.readOnly = effectiveReadOnly;
		element.addEventListener("readonly-change", enforceReadOnly);
		return () =>
			element.removeEventListener("readonly-change", enforceReadOnly);
	}, [element, effectiveReadOnly]);

	const acknowledge = useCallback(() => {
		const current = currentRef.current;
		if (
			!current ||
			current.key !== sourceKey ||
			current.element !== element ||
			permissionRef.current
		)
			return;
		const next = { ...current, isUnlocked: true };
		currentRef.current = next;
		setSession(next);
	}, [element, sourceKey]);
	const enableEditing = useCallback(() => {
		const kind = currentRef.current?.access.kind;
		if (kind === "recommended" || kind === "unsupported-password")
			acknowledge();
	}, [acknowledge]);
	const unlock = useCallback(
		async (password: string): Promise<boolean> => {
			const current = currentRef.current;
			if (
				!current ||
				permissionRef.current ||
				current.key !== sourceKey ||
				current.element !== element ||
				!verifyXlsxModifyPassword(current.access, password)
			)
				return false;
			acknowledge();
			return true;
		},
		[acknowledge, element, sourceKey],
	);
	return {
		access: isCurrent && !session.isUnlocked ? session.access : null,
		readOnly: effectiveReadOnly,
		error: error?.sourceKey === sourceKey ? error.message : null,
		enableEditing,
		unlock,
	};
};
