import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Muted, Spinner } from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";

interface FileHtmlViewerProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;
}

/**
 * Sanitizes raw HTML and wraps it in a controlled document with:
 * - A strict CSP meta tag blocking all network access
 * - A runtime guard that overrides network APIs (fetch, XHR, WebSocket, etc.)
 *
 * The result is converted to a blob URL so the iframe gets an opaque origin.
 */
function buildSandboxedDoc(rawHtml: string): string {
	// WHOLE_DOCUMENT preserves <html>/<head>/<body> so <style> blocks in <head>
	// survive. ADD_TAGS allows <style> and <script> through; DOMPurify cannot
	// sanitize JS code itself, so containment relies on sandbox + CSP + runtime guard.
	const clean = DOMPurify.sanitize(rawHtml, {
		ADD_TAGS: ["style", "script"],
		WHOLE_DOCUMENT: true,
	});

	// Inject CSP meta and runtime network guard into the existing <head>.
	const injected = `<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none'; navigate-to 'none';">
<script>
(function () {
    window.fetch = function () { return Promise.reject(new Error("Network access is disabled")); };
    window.XMLHttpRequest = function () { throw new Error("Network access is disabled"); };
    window.WebSocket = function () { throw new Error("Network access is disabled"); };
    window.EventSource = function () { throw new Error("Network access is disabled"); };
    if (navigator.sendBeacon) { navigator.sendBeacon = function () { return false; }; }
    window.open = function () { return null; };
    // Intercept all link clicks to prevent iframe self-navigation.
    // navigate-to CSP has inconsistent browser support so this is the reliable layer.
    document.addEventListener("click", function (e) {
        var el = e.target;
        while (el) {
            if (el.tagName === "A") {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            el = el.parentElement;
        }
    }, true);
})();
</script>`;

	return clean.replace("<head>", `<head>\n${injected}`);
}

export const FileHtmlViewer: React.FC<FileHtmlViewerProps> = ({
	mode,
	path,
	onChange = () => null,
}) => {
	const insight = useInsight();
	const [view, setView] = useState<"preview" | "source">("preview");
	const [blobUrl, setBlobUrl] = useState<string | null>(null);

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT") {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	}

	// Always fetch so content is ready when switching to preview
	const getFile = usePixel<string>(getFilePixel, {}, insight.insightId);

	// Build a sandboxed blob URL whenever the file content changes.
	// Blob URLs are revoked on cleanup to avoid memory leaks.
	useEffect(() => {
		if (getFile.status !== "SUCCESS") {
			setBlobUrl(null);
			return;
		}

		const html = buildSandboxedDoc(getFile.data);
		const blob = new Blob([html], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		setBlobUrl(url);

		return () => {
			URL.revokeObjectURL(url);
			setBlobUrl(null);
		};
	}, [getFile.status, getFile.data]);

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Toggle toolbar */}
			<div className="flex shrink-0 items-center gap-1 border-b px-3 py-1.5">
				<button
					type="button"
					className={`rounded px-2.5 py-1 font-medium text-sm transition-colors ${
						view === "preview"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => setView("preview")}
				>
					Preview
				</button>
				<button
					type="button"
					className={`rounded px-2.5 py-1 font-medium text-sm transition-colors ${
						view === "source"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					}`}
					onClick={() => setView("source")}
				>
					Source
				</button>
			</div>

			{/* Content area */}
			<div className="relative flex flex-1 overflow-hidden">
				{view === "preview" && (
					<>
						{getFile.status === "LOADING" && (
							<div className="flex flex-1 items-center justify-center">
								<Spinner />
							</div>
						)}
						{getFile.status === "ERROR" && (
							<div className="flex flex-1 items-center justify-center">
								<Muted className="text-destructive">
									{getFile.error?.message ||
										"Failed to load file"}
								</Muted>
							</div>
						)}
						{getFile.status === "SUCCESS" && blobUrl && (
							<iframe
								className="h-full w-full border-0"
								src={blobUrl}
								title={`Preview of ${path}`}
								sandbox="allow-scripts"
							/>
						)}
					</>
				)}
				{view === "source" && (
					<FileCodeEditor
						mode={mode}
						path={path}
						onChange={onChange}
					/>
				)}
			</div>
		</div>
	);
};
