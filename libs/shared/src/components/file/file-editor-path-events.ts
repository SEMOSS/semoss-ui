import { useEffect, useRef } from "react";
import type { FileMode } from "./file.types";

const FILE_EDITOR_PATH_MOVED_EVENT = "semoss:file-editor-path-moved";

interface FileEditorPathMovedDetail {
	oldPath: string;
	newPath: string;
	scope?: string;
}

export const getFileEditorPathScope = (
	mode: FileMode,
	fallbackInsightId?: string,
) => {
	if (mode.type === "APP") {
		return `APP:${mode.app}`;
	}

	if (mode.type === "ENGINE") {
		return `ENGINE:${mode.engine}`;
	}

	if (mode.type === "STORAGE") {
		return `STORAGE:${mode.storage}`;
	}

	if (mode.type === "USER") {
		return "USER";
	}

	return `INSIGHT:${mode.insightId || fallbackInsightId || ""}`;
};

export const notifyFileEditorPathMoved = (
	oldPath: string,
	newPath: string,
	scope?: string,
) => {
	if (typeof window === "undefined") {
		return;
	}

	window.dispatchEvent(
		new CustomEvent<FileEditorPathMovedDetail>(
			FILE_EDITOR_PATH_MOVED_EVENT,
			{
				detail: {
					oldPath,
					newPath,
					scope,
				},
			},
		),
	);
};

export const useFileEditorPathRef = (path: string, scope: string) => {
	const currentPathRef = useRef(path);

	useEffect(() => {
		currentPathRef.current = path;
	}, [path]);

	useEffect(() => {
		const handlePathMoved = (event: Event) => {
			const detail = (event as CustomEvent<FileEditorPathMovedDetail>)
				.detail;

			if (!detail || (detail.scope && detail.scope !== scope)) {
				return;
			}

			if (currentPathRef.current === detail.oldPath) {
				currentPathRef.current = detail.newPath;
			}
		};

		window.addEventListener(FILE_EDITOR_PATH_MOVED_EVENT, handlePathMoved);

		return () => {
			window.removeEventListener(
				FILE_EDITOR_PATH_MOVED_EVENT,
				handlePathMoved,
			);
		};
	}, [scope]);

	return currentPathRef;
};
