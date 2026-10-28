import {
	PowerPointViewer,
	type PowerPointViewerHandle,
} from "pptx-react-viewer";
import { translationsEn } from "pptx-react-viewer/i18n";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { getI18n, useTranslation } from "@semoss/i18n";
import {
	decodeBase64Asset,
	getFileOperationErrorMessage,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import { useFilePanel } from "../../hooks/use-file-panel";
import { useFileViewControls } from "../../hooks/use-file-view-controls";
import { useOfficeFileCommands } from "../../hooks/use-office-file-commands";
import { getFilePanelScope } from "../../types/file-panel.types";
import type { FileViewProps } from "../../types/file-view.types";
import { OfficeViewerError } from "./office/office-viewer-error";
import { OfficeViewerFrame } from "./office/office-viewer-frame";
import {
	PPTX_VIEWER_CUSTOMIZATION,
	PPTX_VIEWER_THEME,
} from "./office/pptx-viewer-policy";
import "pptx-react-viewer/styles";

let registered = false;
const registerViewerCopy = (i18n: ReturnType<typeof getI18n>) => {
	if (registered || !i18n) return;
	const ns = Array.isArray(i18n.options.defaultNS)
		? i18n.options.defaultNS[0]
		: (i18n.options.defaultNS ?? "translation");
	i18n.addResourceBundle("en", ns, translationsEn, true, false);
	registered = true;
};

registerViewerCopy(getI18n());

interface PresentationSession {
	scope: string;
	path: string;
	readRevision: number;
	data: string;
}

/** Preview and edit a PowerPoint file from a project, engine, or user resource. */
export const FilePptxView = ({ config, onControls }: FileViewProps) => {
	const { i18n } = useTranslation();
	const panel = useFilePanel(config, { base64: true });
	const panelRef = useRef(panel);
	useLayoutEffect(() => {
		panelRef.current = panel;
	}, [panel]);
	const viewerRef = useRef<PowerPointViewerHandle>(null);
	const [commandTarget, setCommandTarget] = useState<HTMLDivElement | null>(
		null,
	);
	const sessionRef = useRef<PresentationSession | null>(null);
	const scope = getFilePanelScope(config.mode);
	useLayoutEffect(() => {
		// Vendor handles change on ordinary renders; only a source change or
		// unmount invalidates serialization for this mounted document.
		const session = {
			scope,
			path: config.path,
			readRevision: panel.read.revision,
			data: panel.read.data,
		};
		sessionRef.current = session;
		return () => {
			if (sessionRef.current === session) sessionRef.current = null;
		};
	}, [scope, config.path, panel.read.revision, panel.read.data]);
	const serializingRef = useRef(false);
	const [editorError, setEditorError] = useState<Error | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [isSerializing, setIsSerializing] = useState(false);
	const content = useMemo(
		() => decodeBase64Asset(panel.read.data),
		[panel.read.data],
	);

	useEffect(() => registerViewerCopy(i18n), [i18n]);
	useEffect(() => {
		if (panel.read.status === "SUCCESS" && panel.read.revision > 0) {
			setEditorError(null);
			setIsDirty(false);
		}
	}, [panel.read.revision, panel.read.status]);

	const handleDirtyChange = useCallback((dirty: boolean) => {
		// Vendor "clean" means its original load, not the last host save. An
		// undo to that load can still differ from what SEMOSS has persisted.
		if (dirty) setIsDirty(true);
	}, []);

	const save = useCallback(async () => {
		const handle = viewerRef.current;
		const session = sessionRef.current;
		const currentPanel = panelRef.current;
		if (
			!handle ||
			!session ||
			currentPanel.readOnly ||
			currentPanel.read.status !== "SUCCESS" ||
			serializingRef.current
		)
			return;
		const sourceRevision = currentPanel.read.revision;
		const sourceData = currentPanel.read.data;
		serializingRef.current = true;
		setIsSerializing(true);
		try {
			const bytes = await handle.getContent();
			const latestPanel = panelRef.current;
			if (
				sessionRef.current !== session ||
				latestPanel.readOnly ||
				latestPanel.read.status !== "SUCCESS" ||
				latestPanel.read.revision !== sourceRevision ||
				latestPanel.read.data !== sourceData
			)
				return;
			if (bytes.byteLength === 0) {
				throw new Error("Presentation content is not ready to save");
			}
			await latestPanel.save(encodeBytesToBase64(bytes));
			// The public viewer has no markClean or per-edit revision callback.
			// Keep its dirty state after persistence so later edits stay saveable
			// without reloading the document and discarding its undo history.
		} catch (error) {
			if (sessionRef.current !== session) return;
			const normalized =
				error instanceof Error ? error : new Error(String(error));
			toast.error(
				getFileOperationErrorMessage(
					"Failed to save presentation",
					normalized,
				),
			);
			console.error(normalized);
		} finally {
			serializingRef.current = false;
			setIsSerializing(false);
		}
	}, []);

	const requestSave = useCallback(() => void save(), [save]);
	useOfficeFileCommands(commandTarget, requestSave);
	useFileViewControls(onControls, {
		canDownload: panel.access.status === "ready",
		download: panel.download,
		canSave:
			!panel.readOnly &&
			isDirty &&
			panel.read.status === "SUCCESS" &&
			viewerRef.current !== null,
		isDirty,
		isBusy:
			panel.isBusy || panel.access.status === "loading" || isSerializing,
		canRefresh: panel.access.status === "ready",
		refresh: panel.read.refresh,
		save: requestSave,
	});

	if (panel.gate) return panel.gate;
	if (
		panel.read.status === "ERROR" ||
		(panel.read.data && !content) ||
		editorError
	) {
		return (
			<OfficeViewerError
				message={
					panel.read.error?.message ||
					editorError?.message ||
					"Failed to load presentation"
				}
				isDownloading={panel.isDownloading}
				onDownload={() => void panel.download()}
			/>
		);
	}
	if (panel.readGate) return panel.readGate;
	if (!content) return null;

	return (
		<OfficeViewerFrame label={`Presentation: ${config.name}`}>
			<div
				ref={setCommandTarget}
				className="pptx-viewer-scope size-full min-h-0 min-w-0"
			>
				<PowerPointViewer
					key={panel.read.revision}
					ref={viewerRef}
					content={content}
					fileName={config.name}
					theme={PPTX_VIEWER_THEME}
					customization={PPTX_VIEWER_CUSTOMIZATION}
					canEdit={!panel.readOnly}
					autosave={false}
					onDirtyChange={handleDirtyChange}
					onError={(message) => setEditorError(new Error(message))}
				/>
			</div>
		</OfficeViewerFrame>
	);
};
