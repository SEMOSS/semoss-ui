import BpmnModeler from "bpmn-js/lib/Modeler";
import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import {
	type Ref,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";
import { automationToBpmnXml } from "./automation-to-bpmn";

/** Imperative handle exposed to the parent via ref. */
export interface BpmnEditorHandle {
	/** Saves and downloads the current diagram as a .bpmn file. */
	exportBpmn(): Promise<void>;
	/** Returns the current diagram XML (for convert-to-automation flows). */
	getXml(): Promise<string | null>;
}

interface AutomationBpmnEditorProps {
	nodes: AutomationNode[];
	edges: AutomationEdge[];
	processName: string;
	sourceXml?: string;
	sourceName?: string;
	/** Called with the editor's current XML when the user confirms import. */
	onConvertToAutomation?: (xml: string) => void;
	onCancelImport?: () => void;
	isConverting?: boolean;
	/** Fires true when the diagram is first edited, false when a fresh diagram loads. */
	onDirtyChange?: (isDirty: boolean) => void;
	ref?: Ref<BpmnEditorHandle>;
}

function fitDiagram(modeler: BpmnModeler): void {
	const canvas = modeler.get("canvas");
	const { outer } = canvas.viewbox();
	canvas.zoom("fit-viewport", {
		x: outer.width / 2,
		y: outer.height / 2,
	});
}

function triggerDownload(xml: string, fileName: string): void {
	const blob = new Blob([xml], { type: "application/xml" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

/** Renders the Automation workflow as a full BPMN editor with export support. */
export function AutomationBpmnEditor({
	nodes,
	edges,
	processName,
	sourceXml,
	sourceName,
	onDirtyChange,
	ref,
}: AutomationBpmnEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<BpmnModeler | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	// Stable ref so the effect doesn't re-run when the callback identity changes.
	const onDirtyChangeRef = useRef(onDirtyChange);
	useEffect(() => {
		onDirtyChangeRef.current = onDirtyChange;
	});

	useImperativeHandle(ref, () => ({
		async exportBpmn() {
			const modeler = modelerRef.current;
			if (!modeler || isExporting) return;
			setIsExporting(true);
			try {
				const { xml } = await modeler.saveXML({ format: true });
				const baseName = sourceName
					? sourceName.replace(/\.[^.]+$/, "")
					: processName.trim() || "automation";
				triggerDownload(xml, `${baseName}.bpmn`);
			} catch {
				// non-critical
			} finally {
				setIsExporting(false);
			}
		},
		async getXml() {
			const modeler = modelerRef.current;
			if (!modeler) return null;
			try {
				const { xml } = await modeler.saveXML({ format: true });
				return xml;
			} catch {
				return null;
			}
		},
	}));

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		onDirtyChangeRef.current?.(false);

		const modeler = new BpmnModeler({ container });
		modelerRef.current = modeler;
		let isDisposed = false;
		setError(null);

		const diagramXml = sourceXml
			? Promise.resolve(sourceXml)
			: automationToBpmnXml(nodes, edges, processName);

		const onCommandStackChanged = () => onDirtyChangeRef.current?.(true);

		void diagramXml
			.then((xml) => modeler.importXML(xml))
			.then(() => {
				if (!isDisposed) {
					// Subscribe after import so the import itself doesn't mark dirty.
					modeler.on("commandStack.changed", onCommandStackChanged);
					window.requestAnimationFrame(() => {
						if (!isDisposed) fitDiagram(modeler);
					});
				}
			})
			.catch((importError: unknown) => {
				if (!isDisposed) {
					setError(
						importError instanceof Error
							? importError.message
							: "Unknown BPMN rendering error.",
					);
				}
			});

		return () => {
			isDisposed = true;
			modelerRef.current = null;
			modeler.destroy();
		};
	}, [edges, nodes, processName, sourceXml]);

	return (
		<section
			aria-label="BPMN workflow editor"
			className="absolute inset-0 z-0 bg-background"
		>
			{/* Hide the "create group" palette entry — not useful in this context. */}
			<style>{`[data-action="create.group"] { display: none !important; }`}</style>
			<div ref={containerRef} className="absolute inset-0" />
			<div className="absolute right-28 bottom-4 z-20 flex items-center overflow-hidden rounded-lg border bg-background shadow-sm">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Zoom out BPMN diagram"
							onClick={() => {
								const canvas =
									modelerRef.current?.get("canvas");
								const zoom = canvas?.zoom();
								if (typeof zoom === "number")
									canvas?.zoom(zoom / 1.2);
							}}
							className="flex size-8 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<ZoomOut className="size-4" aria-hidden />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">Zoom out</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Zoom in BPMN diagram"
							onClick={() => {
								const canvas =
									modelerRef.current?.get("canvas");
								const zoom = canvas?.zoom();
								if (typeof zoom === "number")
									canvas?.zoom(zoom * 1.2);
							}}
							className="flex size-8 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<ZoomIn className="size-4" aria-hidden />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">Zoom in</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Fit BPMN diagram to view"
							onClick={() => {
								const modeler = modelerRef.current;
								if (modeler) fitDiagram(modeler);
							}}
							className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Scan className="size-4" aria-hidden />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">Fit to view</TooltipContent>
				</Tooltip>
			</div>
			{error && (
				<div
					role="alert"
					className="absolute inset-x-4 bottom-16 z-20 rounded-md border border-destructive/40 bg-background p-3 text-destructive text-sm"
				>
					Could not render BPMN: {error}
				</div>
			)}
		</section>
	);
}

/**
 * Backward-compatible alias — canvas lazy-imports this name.
 * @deprecated Use AutomationBpmnEditor directly.
 */
export { AutomationBpmnEditor as AutomationBpmnViewer };
