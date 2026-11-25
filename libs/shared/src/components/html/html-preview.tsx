import {
	type CSSProperties,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { Alert, AlertDescription, AlertTitle, cn } from "@semoss/ui/next";
import {
	createHtmlPreviewDocument,
	readHtmlPreviewMessage,
} from "./html-preview-document";

export interface HtmlPreviewProps {
	/** Browser-native HTML, CSS, and JavaScript to preview. */
	html: string;
	/** Accessible name for the isolated document. */
	title?: string;
	/** Classes for the preview viewport. */
	className?: string;
	/** Caller-controlled viewport dimensions. */
	style?: CSSProperties;
	/** Wrapper classes, retained for compatibility with the previous preview. */
	providerClassName?: string;
	/** Fill the height provided by the parent instead of using a default height. */
	forceFullHeight?: boolean;
}

interface PreviewStatus {
	id: string;
	isReady: boolean;
	error: { type: "runtime"; message: string } | { type: "timeout" } | null;
}

/** Renders interactive HTML without giving it the application's origin. */
export function HtmlPreview({
	html,
	title = "HTML Preview",
	className,
	style,
	providerClassName,
	forceFullHeight,
}: HtmlPreviewProps) {
	const { t } = useTranslation("common");
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [status, setStatus] = useState<PreviewStatus | null>(null);
	// Feedback renders must not recreate the document and restart its scripts.
	const preview = useMemo(() => {
		const id = crypto.getRandomValues(new Uint32Array(4)).join("-");
		try {
			return {
				id,
				srcDoc: createHtmlPreviewDocument(
					html,
					id,
					window.location.origin,
				),
				error: null,
			};
		} catch (error) {
			// Trusted Types can refuse string HTML before the iframe is mounted.
			if (!(error instanceof TypeError)) throw error;
			console.error("Could not create the HTML preview.", error);
			return { id, srcDoc: undefined, error: error.message };
		}
	}, [html]);
	const currentStatus = status?.id === preview.id ? status : null;
	const isReady = currentStatus?.isReady ?? false;
	const error =
		preview.error ??
		(currentStatus?.error
			? currentStatus.error.type === "runtime"
				? currentStatus.error.message
				: ""
			: null);

	// Subscribe during commit so the first iframe script cannot race the listener.
	useLayoutEffect(() => {
		const handleMessage = (event: MessageEvent<unknown>) => {
			if (
				event.source !== iframeRef.current?.contentWindow ||
				event.origin !== "null"
			) {
				return;
			}
			const message = readHtmlPreviewMessage(event.data, preview.id);
			if (!message) return;
			if (message.type === "ready") {
				setStatus((previous) =>
					previous?.id === preview.id && previous.isReady
						? previous
						: {
								id: preview.id,
								isReady: true,
								error:
									previous?.id === preview.id &&
									previous.error?.type === "runtime"
										? previous.error
										: null,
							},
				);
			} else if (message.type === "error") {
				setStatus((previous) =>
					previous?.id === preview.id &&
					previous.error?.type === "runtime"
						? previous
						: {
								id: preview.id,
								isReady:
									previous?.id === preview.id &&
									previous.isReady,
								error: {
									type: "runtime",
									message: message.message,
								},
							},
				);
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [preview.id]);

	useEffect(() => {
		if (isReady || preview.error !== null) return;
		const timeout = setTimeout(() => {
			console.error(
				"HTML preview did not initialize. Check the document and Content Security Policy.",
			);
			setStatus((previous) =>
				previous?.id === preview.id &&
				(previous.isReady || previous.error !== null)
					? previous
					: {
							id: preview.id,
							isReady: false,
							error: { type: "timeout" },
						},
			);
		}, 10_000);
		return () => clearTimeout(timeout);
	}, [isReady, preview.error, preview.id]);

	return (
		<div
			className={cn(
				"min-h-0",
				forceFullHeight && "h-full",
				providerClassName,
			)}
		>
			<div
				className={cn(
					"flex min-h-0 w-full flex-col overflow-hidden",
					forceFullHeight ? "h-full" : "h-80",
					className,
				)}
				style={style}
				aria-busy={!isReady && error === null}
			>
				{error !== null && (
					<Alert
						variant="destructive"
						className="max-h-32 shrink-0 overflow-auto rounded-none"
					>
						<AlertTitle>{t("cellOutput.panels.error")}</AlertTitle>
						<AlertDescription className="wrap-anywhere min-w-0">
							{error || t("fileExplorer.overlay.toasts.anError")}
						</AlertDescription>
					</Alert>
				)}
				{preview.srcDoc !== undefined && (
					<iframe
						ref={iframeRef}
						title={title}
						srcDoc={preview.srcDoc}
						sandbox="allow-scripts"
						referrerPolicy="no-referrer"
						// design-lint-disable-next-line arbitrary-color -- native Canvas must match the light document, not the host theme
						className="scheme-light min-h-0 w-full flex-1 border-0 bg-[Canvas]"
					/>
				)}
			</div>
		</div>
	);
}
