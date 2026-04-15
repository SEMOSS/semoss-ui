import {
	ChevronDownIcon,
	ChevronUpIcon,
	CopyIcon,
	Loader2,
	Quote,
	SkipForwardIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	H1,
	H2,
	H3,
	H4,
	Markdown,
	P,
	ScrollArea,
	ScrollBar,
	Separator,
	Table,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useMarkdownTypewriter } from "@/hooks/use-markdown-typewriter";
import type { ResponseMessageStore, RoomStore } from "@/stores";
import type { PixelMessageTextPart } from "@/types";

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unable to copy content";
};

const copyToClipboard = async (
	value: string,
	onSuccess: () => void,
	onError: (message: string) => void,
) => {
	try {
		await navigator.clipboard.writeText(value);
		onSuccess();
	} catch (error) {
		onError(getErrorMessage(error));
	}
};

/**
 * Shell document loaded once into the iframe while streaming.
 * It listens for postMessage events and patches its own DOM in-place so
 * we get a live preview without a full navigation on every token.
 *
 * CDN script URLs (<script src>) are pre-fetched here so they land in the
 * browser's HTTP cache before the final srcDoc reload triggers.  The inline
 * chart-init scripts are NOT executed here; script execution happens when the
 * parent switches the iframe's srcDoc to the complete HTML, which lets the
 * browser handle all load ordering natively (no custom runNext() needed).
 */
const IFRAME_SHELL = `<!DOCTYPE html>
<html><head></head><body>
<script>
// Tracks CDN URLs already pre-fetched to avoid duplicate requests.
var _cdnPrefetched = {};

window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'html-update') return;

  var parser = new DOMParser();
  var parsed = parser.parseFromString(e.data.html, 'text/html');

  // Strip all scripts before patching so inert innerHTML copies don't pile up.
  var scripts = [];
  parsed.querySelectorAll('script').forEach(function(s) {
    scripts.push(s);
    s.parentNode.removeChild(s);
  });

  // Live DOM patch — gives a streaming preview without navigating the frame.
  if (parsed.head) document.head.innerHTML = parsed.head.innerHTML;
  if (parsed.body) document.body.innerHTML = parsed.body.innerHTML;

  // Re-inject overflow constraints after head replacement (they get wiped above).
  // This prevents wide content from expanding the iframe horizontally.
  var constraintStyle = document.createElement('style');
  constraintStyle.textContent = 'html,body{max-width:100%!important;overflow-x:hidden!important;box-sizing:border-box;}';
  document.head.appendChild(constraintStyle);

  // Auto-scroll to the bottom so newly streamed content is always visible.
  window.scrollTo(0, document.body.scrollHeight);

  // Pre-fetch CDN scripts so they are in the HTTP cache when the final
  // srcDoc reload fires.  All major browsers keep a started network request
  // alive even after its <script> element is removed from the DOM.
  scripts.forEach(function(s) {
    var src = s.getAttribute('src');
    if (src && !_cdnPrefetched[src]) {
      _cdnPrefetched[src] = true;
      var n = document.createElement('script');
      n.setAttribute('src', src);
      document.head.appendChild(n);
    }
  });
});
</script>
</body></html>`;

/** Send a streaming preview update to the iframe shell via postMessage. */
const sendHtmlToIframe = (iframe: HTMLIFrameElement, html: string): void => {
	iframe.contentWindow?.postMessage({ type: "html-update", html }, "*");
};

const HTML_PREVIEW_STREAM_THROTTLE_MS = 80;

interface HtmlPreviewBlockProps {
	html: string;
	room?: RoomStore;
	isLoading?: boolean;
	copyTooltip: string;
	copySuccessMessage: string;
	copyLabel: string;
}

const createHtmlResponseFilePath = (): string => {
	return `save-html-response-${Date.now()}.html`;
};

const CODE_LANG_EXT: Record<string, string> = {
	javascript: "js",
	typescript: "ts",
	python: "py",
	ruby: "rb",
	rust: "rs",
	kotlin: "kt",
	swift: "swift",
	csharp: "cs",
	cpp: "cpp",
	bash: "sh",
	zsh: "sh",
	fish: "sh",
	sh: "sh",
	powershell: "ps1",
	sql: "sql",
	html: "html",
	css: "css",
	scss: "scss",
	less: "less",
	sass: "scss",
	json: "json",
	yaml: "yaml",
	yml: "yml",
	xml: "xml",
	toml: "toml",
	markdown: "md",
	go: "go",
	java: "java",
	php: "php",
	lua: "lua",
	perl: "pl",
	haskell: "hs",
	elixir: "ex",
	erlang: "erl",
	clojure: "clj",
	scala: "scala",
	groovy: "groovy",
	r: "r",
	c: "c",
	js: "js",
	ts: "ts",
	py: "py",
	rb: "rb",
	rs: "rs",
	kt: "kt",
	cs: "cs",
	md: "md",
	pixel: "pixel",
};

const CODE_LANG_LABELS: Record<string, string> = {
	javascript: "JavaScript",
	typescript: "TypeScript",
	python: "Python",
	ruby: "Ruby",
	rust: "Rust",
	kotlin: "Kotlin",
	swift: "Swift",
	csharp: "C#",
	cpp: "C++",
	bash: "Bash",
	zsh: "Zsh",
	fish: "Fish",
	powershell: "PowerShell",
	sql: "SQL",
	html: "HTML",
	css: "CSS",
	scss: "SCSS",
	less: "Less",
	sass: "Sass",
	json: "JSON",
	yaml: "YAML",
	yml: "YAML",
	xml: "XML",
	toml: "TOML",
	markdown: "Markdown",
	dockerfile: "Dockerfile",
	graphql: "GraphQL",
	go: "Go",
	java: "Java",
	php: "PHP",
	lua: "Lua",
	perl: "Perl",
	haskell: "Haskell",
	elixir: "Elixir",
	erlang: "Erlang",
	clojure: "Clojure",
	scala: "Scala",
	groovy: "Groovy",
	svelte: "Svelte",
	vue: "Vue",
	jsx: "JSX",
	tsx: "TSX",
	nginx: "Nginx",
	terraform: "Terraform",
	hcl: "HCL",
	protobuf: "Protobuf",
	proto: "Protobuf",
	plaintext: "Plain Text",
	text: "Text",
	txt: "Text",
	js: "JavaScript",
	ts: "TypeScript",
	py: "Python",
	rb: "Ruby",
	rs: "Rust",
	kt: "Kotlin",
	cs: "C#",
	sh: "Shell",
	md: "Markdown",
	r: "R",
	c: "C",
	pixel: "Pixel",
};

const createCodeFilePath = (lang: string): string => {
	const ext = CODE_LANG_EXT[lang] ?? lang;
	return `save-code-response-${Date.now()}.${ext}`;
};

// Injected at the end of the final srcDoc HTML so the iframe can report its
// rendered content height via postMessage (sandbox prevents direct DOM access).
const IFRAME_HEIGHT_REPORTER =
	"<script>" +
	"(function(){" +
	"function r(){parent.postMessage({type:'iframe-height'," +
	"height:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)},'*');}" +
	"if(document.readyState==='loading'){window.addEventListener('load',r);}else{r();}" +
	"setTimeout(r,400);" + // catch async renders (Chart.js RAF, etc.)
	"setTimeout(r,1200);" + // slow CDN fallback
	"})();" +
	"<\\/script>";

function injectHeightReporter(html: string): string {
	const idx = html.lastIndexOf("</body>");
	return idx !== -1
		? html.slice(0, idx) + IFRAME_HEIGHT_REPORTER + html.slice(idx)
		: html + IFRAME_HEIGHT_REPORTER;
}

const HtmlPreviewBlock: React.FC<HtmlPreviewBlockProps> = ({
	html,
	room,
	isLoading,
	copyTooltip,
	copySuccessMessage,
	copyLabel,
}) => {
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const latestHtmlRef = useRef(html);
	const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasSentFirstRef = useRef(false);

	latestHtmlRef.current = html;

	// Mirror isLoading into a ref so the throttle callback can read the current
	// value without capturing a stale closure.
	const isLoadingRef = useRef(!!isLoading);
	isLoadingRef.current = !!isLoading;

	// Measured content height reported by the final iframe via postMessage.
	// null while shell is active (streaming) or before first report arrives.
	const [contentHeight, setContentHeight] = useState<number | null>(null);

	// Reset the measured height when switching back to shell so the final
	// iframe always starts at the default tall height then resizes down.
	useEffect(() => {
		if (isLoading) setContentHeight(null);
	}, [isLoading]);

	// Listen for height reports from the final iframe only.
	// isLoadingRef / iframeRef are mutable so they don't need to be deps.
	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (e.data?.type !== "iframe-height") return;
			if (isLoadingRef.current) return; // ignore shell phase
			if (e.source !== iframeRef.current?.contentWindow) return; // ignore other iframes
			setContentHeight(e.data.height as number);
		};
		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []); // register once

	// When the IFRAME_SHELL loads, immediately send whatever HTML we have so the
	// user gets an instant preview without waiting for the next streaming token.
	const handleIframeLoad = () => {
		const iframe = iframeRef.current;
		if (iframe && latestHtmlRef.current) {
			hasSentFirstRef.current = true;
			sendHtmlToIframe(iframe, latestHtmlRef.current);
		}
	};

	// While isLoading=true, forward streaming HTML updates to the shell via
	// postMessage (throttled).  When isLoading flips false the key on the iframe
	// changes ("shell" → "final"), React unmounts the shell and mounts a new
	// iframe with srcDoc=html so the browser executes all scripts natively.
	useEffect(() => {
		// Shell replaced — cancel any pending throttle and stop updates.
		if (!isLoading) {
			if (flushTimerRef.current) {
				clearTimeout(flushTimerRef.current);
				flushTimerRef.current = null;
			}
			return;
		}

		// First content: send immediately for instant preview.
		if (html && !hasSentFirstRef.current) {
			hasSentFirstRef.current = true;
			if (iframeRef.current) sendHtmlToIframe(iframeRef.current, html);
			return;
		}

		// Subsequent tokens: throttle to avoid thrashing the iframe DOM.
		if (!flushTimerRef.current) {
			flushTimerRef.current = setTimeout(() => {
				flushTimerRef.current = null;
				if (iframeRef.current && isLoadingRef.current) {
					sendHtmlToIframe(iframeRef.current, latestHtmlRef.current);
				}
			}, HTML_PREVIEW_STREAM_THROTTLE_MS);
		}
	}, [html, isLoading]);

	useEffect(() => {
		return () => {
			if (flushTimerRef.current) {
				clearTimeout(flushTimerRef.current);
			}
		};
	}, []);

	const saveInRoom = async () => {
		if (!room || !html) {
			return;
		}

		const filePath = createHtmlResponseFilePath();
		try {
			setIsSavingToRoom(true);

			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${html}</encode>"]);`,
				false,
				false,
			);

			toast.success(`Saved in room as ${filePath}`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSavingToRoom(false);
		}
	};

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<div className="border-border border-b px-3 py-2 text-muted-foreground text-xs">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1">
							<button
								type="button"
								aria-label={
									isCollapsed
										? "Expand preview"
										: "Collapse preview"
								}
								className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
								disabled={!html}
								onClick={() =>
									setIsCollapsed((previous) => !previous)
								}
							>
								{isCollapsed ? (
									<ChevronDownIcon className="size-3.5" />
								) : (
									<ChevronUpIcon className="size-3.5" />
								)}
							</button>
							<span>
								HTML Preview
								{isCollapsed ? " - Collapsed" : ""}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={
									!room ||
									!html ||
									isSavingToRoom ||
									isLoading
								}
								onClick={() => {
									void saveInRoom();
								}}
							>
								{isSavingToRoom ? "Saving..." : "Save In Room"}
							</Button>
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={isLoading}
								onClick={() => setIsFullViewOpen(true)}
							>
								Full View
							</Button>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="-my-1 -mr-2 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
										variant="ghost"
										size="sm"
										disabled={!html || isLoading}
										onClick={() => {
											void copyToClipboard(
												html,
												() =>
													toast.success(
														copySuccessMessage,
													),
												(message) =>
													toast.error(message),
											);
										}}
									>
										<CopyIcon className="size-3.5" />
										{copyLabel}
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{copyTooltip}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
				{!isCollapsed && (
					<div className="relative">
						<iframe
							key={isLoading ? "shell" : "final"}
							ref={iframeRef}
							title="HTML Preview"
							className={
								!isLoading && contentHeight
									? "w-full border-0 bg-white"
									: "h-[70dvh] min-h-[34rem] w-full border-0 bg-white"
							}
							style={
								!isLoading && contentHeight
									? {
											// Shrink to content height so there is no blank space below.
											// maxHeight caps tall responses at 90dvh; the browser then
											// scrolls the iframe's own document for the overflow.
											height: `${contentHeight}px`,
											maxHeight: "90dvh",
											minHeight: "80px",
										}
									: undefined
							}
							sandbox="allow-scripts"
							referrerPolicy="no-referrer"
							srcDoc={
								isLoading
									? IFRAME_SHELL
									: injectHeightReporter(html)
							}
							onLoad={isLoading ? handleIframeLoad : undefined}
						/>
						{isLoading && (
							<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
								<div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/75 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em] shadow-sm">
									<Loader2 className="size-3 animate-spin" />
									Loading Preview...
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-[100dvw] sm:max-w-[100dvw]">
					<DialogHeader>
						<DialogTitle>HTML Preview</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0">
						<iframe
							title="HTML Preview Full View"
							className="h-full min-h-0 w-full rounded-md border border-border bg-white"
							sandbox="allow-scripts"
							referrerPolicy="no-referrer"
							srcDoc={html}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

interface CodePreviewBlockProps {
	code: string;
	/** Shiki-safe language used for syntax highlighting */
	language: React.ComponentProps<typeof Code>["language"];
	/** Original language token from the fence (used for label + filename) */
	rawLanguage?: string;
	room?: RoomStore;
}

const CodePreviewBlock: React.FC<CodePreviewBlockProps> = ({
	code,
	language,
	rawLanguage,
	room,
}) => {
	const { t } = useTranslation("chat");
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Prefer rawLanguage for display/filename so custom tokens like "pixel"
	// show their proper label even though Shiki falls back to "txt" for rendering.
	const langStr = rawLanguage ?? language ?? "txt";
	const langLabel = CODE_LANG_LABELS[langStr] ?? langStr.toUpperCase();

	const saveInRoom = async () => {
		if (!room || !code) return;
		const filePath = createCodeFilePath(langStr);
		try {
			setIsSavingToRoom(true);
			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${code}</encode>"]);`,
				false,
				false,
			);
			toast.success(`Saved in room as ${filePath}`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSavingToRoom(false);
		}
	};

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<div className="border-border border-b px-3 py-2 text-muted-foreground text-xs">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1">
							<button
								type="button"
								aria-label={
									isCollapsed
										? "Expand code"
										: "Collapse code"
								}
								className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
								disabled={!code}
								onClick={() => setIsCollapsed((prev) => !prev)}
							>
								{isCollapsed ? (
									<ChevronDownIcon className="size-3.5" />
								) : (
									<ChevronUpIcon className="size-3.5" />
								)}
							</button>
							<span>
								{langLabel}
								{isCollapsed ? " - Collapsed" : ""}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!room || !code || isSavingToRoom}
								onClick={() => void saveInRoom()}
							>
								{isSavingToRoom ? "Saving..." : "Save In Room"}
							</Button>
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!code}
								onClick={() => setIsFullViewOpen(true)}
							>
								Full View
							</Button>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="-my-1 -mr-2 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
										variant="ghost"
										size="sm"
										disabled={!code}
										onClick={() =>
											void copyToClipboard(
												code,
												() =>
													toast.success(
														t(
															"notifications.copySuccess",
														),
													),
												(msg) => toast.error(msg),
											)
										}
									>
										<CopyIcon className="size-3.5" />
										Copy
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Copy
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
				{!isCollapsed && (
					<div className="p-3">
						<Code code={code} language={language ?? "txt"} />
					</div>
				)}
			</div>
			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-[100dvw] sm:max-w-[100dvw]">
					<DialogHeader>
						<DialogTitle>{langLabel}</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0 overflow-auto">
						<Code code={code} language={language ?? "txt"} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

// Regex to detect the first ```html...``` block in a response.
// Uses non-greedy [\s\S]*? so it stops at the first closing fence.
// The closing alternative (?:\n```|$) matches either "\n```" or end-of-string
// so partial (still-streaming) fences are also detected.
const FENCED_HTML_RE = /```html[ \t]*\n([\s\S]*?)(?:\n```|$)/i;

// Shiki throws on unknown language IDs (e.g. "h", "ht", "htm" that appear
// while "html" is still being streamed token by token).  Map unrecognised
// identifiers to "txt" so the Code block degrades gracefully.
const KNOWN_SHIKI_LANGS = new Set([
	"c",
	"r",
	"go",
	"js",
	"ts",
	"py",
	"rb",
	"rs",
	"kt",
	"sh",
	"cs",
	"md",
	"html",
	"css",
	"javascript",
	"typescript",
	"python",
	"ruby",
	"rust",
	"kotlin",
	"swift",
	"java",
	"scala",
	"bash",
	"zsh",
	"fish",
	"sql",
	"yaml",
	"yml",
	"json",
	"xml",
	"toml",
	"ini",
	"markdown",
	"dockerfile",
	"graphql",
	"svelte",
	"vue",
	"jsx",
	"tsx",
	"scss",
	"less",
	"sass",
	"php",
	"perl",
	"lua",
	"haskell",
	"erlang",
	"elixir",
	"clojure",
	"cpp",
	"csharp",
	"objc",
	"groovy",
	"powershell",
	"batch",
	"nginx",
	"terraform",
	"hcl",
	"proto",
	"protobuf",
	"txt",
	"text",
	"plaintext",
]);

const createMarkdownComponents = (
	room?: RoomStore,
	isHtmlPreviewLoading?: boolean,
) => ({
	h1: ({ children, ...props }) => (
		<H1 className="mt-5 font-semibold text-2xl text-inherit" {...props}>
			{children}
		</H1>
	),
	h2: ({ children, ...props }) => (
		<H2 className="mt-4 font-semibold text-inherit text-xl" {...props}>
			{children}
		</H2>
	),
	h3: ({ children, ...props }) => (
		<H3 className="mt-4 text-inherit text-lg" {...props}>
			{children}
		</H3>
	),
	h4: ({ children, ...props }) => (
		<H4 className="mt-3 text-inherit text-lg" {...props}>
			{children}
		</H4>
	),
	h5: ({ children, ...props }) => (
		<h5
			className="mt-2 scroll-m-20 font-semibold text-base text-inherit tracking-tight"
			{...props}
		>
			{children}
		</h5>
	),
	h6: ({ children, ...props }) => (
		<h6
			className="mt-2 scroll-m-20 font-medium text-base text-inherit tracking-tight"
			{...props}
		>
			{children}
		</h6>
	),
	p: ({ children, ...props }) => (
		<P className="mt-2 text-base text-inherit" {...props}>
			{children}
		</P>
	),
	a: ({ children, href, ...props }) => {
		if (href?.startsWith("room://") && room) {
			const path = `/${href.slice("room://".length)}`;

			// Folder link — ends with "/"
			if (path.endsWith("/")) {
				return (
					<button
						type="button"
						className="cursor-pointer font-medium text-base text-primary underline underline-offset-1"
						onClick={() => {
							room.addSidebarNode(`FILE_EXPLORER--${path}`, {
								type: "tab",
								name: "Files",
								component: "room-file-explorer",
								config: { initialPath: path },
								enableClose: true,
							});
						}}
					>
						{children}
					</button>
				);
			}

			// File link
			const filename = path.split("/").filter(Boolean).pop() ?? path;
			return (
				<button
					type="button"
					className="cursor-pointer font-medium text-base text-primary underline underline-offset-1"
					onClick={() => {
						room.addSidebarNode("FILE_EXPLORER", {
							type: "tab",
							name: "Files",
							component: "room-file-explorer",
							config: {},
							enableClose: true,
						});
						room.addSidebarNode(`FILE--${path}`, {
							type: "tab",
							name: filename,
							component: "room-file-editor",
							config: { name: filename, path },
							enableClose: true,
						});
					}}
				>
					{children}
				</button>
			);
		}
		return (
			<a
				href={href}
				className="font-medium text-base text-primary underline underline-offset-1"
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			>
				{children}
			</a>
		);
	},
	ul: ({ children, ...props }) => (
		<ul
			className="my-1 ml-4 list-disc text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ml-4 list-decimal text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="text-base text-inherit" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, ...props }) => (
		<Quote className="mt-1" {...props}>
			{children}
		</Quote>
	),
	hr: ({ ...props }) => <Separator className="mt-2 mb-1" {...props} />,
	code: ({ children, className, ...props }) => {
		const { t } = useTranslation("chat");
		// react-markdown sets className to "language-<lang>" on fenced code blocks.
		// Inline code (single backtick) has no className, so match will be null.
		const match = /language-(\w+)/.exec(className || "");
		// During streaming children can briefly be undefined before content arrives.
		// String() coerces undefined/null to "" so Shiki never receives a non-string.
		const code = children != null ? String(children) : "";

		// Inline code — no language class means this is a `backtick` snippet inside
		// a paragraph. Return a plain <code> so we don't nest a <div> inside a <p>.
		if (!match?.[1]) {
			return (
				<code className={className} {...props}>
					{children}
				</code>
			);
		}

		// Fenced code block — render the full UI with copy button and syntax highlighting.
		// During streaming the language token builds up incrementally (e.g. "h" →
		// "ht" → "htm" → "html").  Shiki throws on unknown IDs, so normalise to
		// "txt" for anything not in our known-language set.
		const rawLang = match[1].toLowerCase();
		const lang = (
			KNOWN_SHIKI_LANGS.has(rawLang) ? rawLang : "txt"
		) as React.ComponentProps<typeof Code>["language"];

		if (lang === "html") {
			return (
				<HtmlPreviewBlock
					html={code}
					room={room}
					isLoading={isHtmlPreviewLoading}
					copyTooltip="Copy"
					copySuccessMessage={t("notifications.copySuccess")}
					copyLabel="Copy"
				/>
			);
		}

		return (
			<CodePreviewBlock
				code={code}
				language={lang}
				rawLanguage={rawLang}
				room={room}
			/>
		);
	},
	table: ({ ...props }) => (
		<ScrollArea className="w-full">
			<ScrollBar orientation="horizontal"></ScrollBar>
			<Table {...props} />
		</ScrollArea>
	),
});

interface ResponseMessageTextProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Thinking to render */
	part: PixelMessageTextPart;

	/** Is it the last part */
	isLast: boolean;
}

export const ResponseMessageText: React.FC<ResponseMessageTextProps> = observer(
	({ message, part, isLast }) => {
		const { t } = useTranslation("chat");

		// ── Standalone-HTML detection ────────────────────────────────────────────
		// Sticky: once the response opens with <!DOCTYPE (no code fence), stay in
		// standalone-HTML mode for the lifetime of this message.
		const isHtmlResponseRef = useRef(false);
		if (!isHtmlResponseRef.current) {
			const trimmed = part.text.trimStart();
			if (!trimmed.includes("```") && /^<!DOCTYPE\s/i.test(trimmed)) {
				isHtmlResponseRef.current = true;
			}
		}
		const isHtmlResponse = isHtmlResponseRef.current;

		// ── Code-fenced HTML detection ───────────────────────────────────────────
		// Detect the first ```html…``` block directly in part.text so that
		// HtmlPreviewBlock mounts as soon as the fence appears during streaming —
		// independent of the typewriter position.  This lets CDN prefetch start
		// early and allows scripts to fire mid-stream when a complete <script>
		// block arrives, without waiting for the typewriter to reach the fence.
		const fencedHtmlData = useMemo(() => {
			if (isHtmlResponse) return null;
			const m = FENCED_HTML_RE.exec(part.text);
			if (!m) return null;
			const isClosed = m[0].endsWith("```");
			const postStart = isClosed ? m.index + m[0].length : -1;
			return {
				preFenceProse: part.text.slice(0, m.index),
				fencedHtmlContent: m[1],
				fencedHtmlClosed: isClosed,
				postFenceProse:
					postStart !== -1
						? part.text.slice(postStart).trimStart()
						: "",
			};
		}, [isHtmlResponse, part.text]);
		const hasFencedHtml = !!fencedHtmlData;

		// ── Standalone-HTML split ────────────────────────────────────────────────
		const htmlEndMatch = isHtmlResponse
			? /(<\/html\s*>)/i.exec(part.text)
			: null;
		const htmlPart = isHtmlResponse
			? htmlEndMatch
				? part.text.slice(
						0,
						htmlEndMatch.index + htmlEndMatch[0].length,
					)
				: part.text
			: "";
		const standaloneHtml = isHtmlResponse ? htmlPart.trim() : null;

		// ── Post-block prose ─────────────────────────────────────────────────────
		// Unified: after </html> for standalone, after closing ``` for fenced.
		const postHtmlProse =
			isHtmlResponse && htmlEndMatch
				? part.text
						.slice(htmlEndMatch.index + htmlEndMatch[0].length)
						.trimStart()
				: "";
		const postBlockProse = isHtmlResponse
			? postHtmlProse
			: (fencedHtmlData?.postFenceProse ?? "");

		// ── Typewriters ──────────────────────────────────────────────────────────
		// Main typewriter: animates part.text (for normal markdown) or just the
		// pre-fence prose slice (we display only up to the fence boundary).
		const typewriter = useMarkdownTypewriter(part.text);
		const renderedText = typewriter.isTyping
			? typewriter.rendered
			: part.text;

		// Post-block prose typewriter (after </html> or after closing ```).
		const postTypewriter = useMarkdownTypewriter(postBlockProse);
		const [postProseStarted, setPostProseStarted] = useState(false);

		// ── isPreviewLoading for code-fenced HTML ────────────────────────────────
		// True while streaming AND the fence hasn't closed AND no inline script
		// is complete yet.  HtmlPreviewBlock's own effectiveIsLoading further
		// overrides this based on HTML content, so this is just the outer gate.
		const inlineScriptInFenced =
			hasFencedHtml &&
			/<script(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script\s*>/i.test(
				fencedHtmlData?.fencedHtmlContent ?? "",
			);
		const fencedIsPreviewLoading =
			isLast &&
			message.isThinking &&
			!(fencedHtmlData?.fencedHtmlClosed ?? false) &&
			!inlineScriptInFenced;

		// ── isPreviewLoading for standalone HTML ─────────────────────────────────
		const inlineScriptComplete =
			isHtmlResponse &&
			/<script(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script\s*>/i.test(
				part.text,
			);
		const standaloneIsPreviewLoading =
			isLast &&
			message.isThinking &&
			!htmlEndMatch &&
			!inlineScriptComplete;

		// isPreviewLoading passed to Markdown components (for non-HTML code blocks).
		const isPreviewLoading =
			isLast && (message.isThinking || typewriter.isTyping);

		const components = useMemo(
			() => createMarkdownComponents(message.room, isPreviewLoading),
			[message.room, isPreviewLoading],
		);

		// ── Effects ──────────────────────────────────────────────────────────────
		useEffect(() => {
			if (message.isThinking && isLast) typewriter.start();
		}, [message.isThinking, typewriter.start, isLast]);

		// No text to animate for standalone-HTML responses.
		useEffect(() => {
			if (isHtmlResponse) typewriter.skipToEnd();
		}, [isHtmlResponse, typewriter.skipToEnd]);

		useEffect(() => {
			if (!isLast) typewriter.skipToEnd();
		}, [isLast, typewriter.skipToEnd]);

		// Start post-block prose animation when it first appears during a live stream.
		// Historical messages (isThinking=false) must NOT start the typewriter —
		// they show the full text immediately via the render gate below.
		useEffect(() => {
			if (
				isLast &&
				message.isThinking &&
				(isHtmlResponse || hasFencedHtml) &&
				postBlockProse &&
				!postProseStarted
			) {
				setPostProseStarted(true);
				postTypewriter.start();
			}
		}, [
			isLast,
			message.isThinking,
			isHtmlResponse,
			hasFencedHtml,
			postBlockProse,
			postProseStarted,
			postTypewriter.start,
		]);

		useEffect(() => {
			if (!isLast) postTypewriter.skipToEnd();
		}, [isLast, postTypewriter.skipToEnd]);

		const isAnyTyping =
			(typewriter.isTyping || postTypewriter.isTyping) &&
			!message.isThinking &&
			isLast;

		// ── URL transform (shared) ───────────────────────────────────────────────
		const urlTransform = (url: string) => {
			if (url.startsWith("room://")) return url;
			if (/^(https?:|mailto:|#)/.test(url)) return url;
			return "";
		};

		// ── Render ───────────────────────────────────────────────────────────────
		return (
			<>
				{standaloneHtml ? (
					/* ── Standalone HTML (response begins with <!DOCTYPE) ── */
					<>
						<HtmlPreviewBlock
							html={standaloneHtml}
							room={message.room}
							isLoading={standaloneIsPreviewLoading}
							copyTooltip="Copy"
							copySuccessMessage={t("notifications.copySuccess")}
							copyLabel="Copy"
						/>
						{postBlockProse &&
							(postProseStarted ||
								!isLast ||
								!message.isThinking) && (
								<Markdown
									components={components}
									className="[&>*:first-child]:mt-0"
									urlTransform={urlTransform}
								>
									{postTypewriter.isTyping
										? postTypewriter.rendered
										: postBlockProse}
								</Markdown>
							)}
					</>
				) : hasFencedHtml ? (
					/* ── Code-fenced HTML (```html…```) ── */
					<>
						{/* Pre-fence prose: slice typewriter up to the fence boundary */}
						{fencedHtmlData!.preFenceProse && (
							<Markdown
								components={components}
								className="[&>*:first-child]:mt-0"
								urlTransform={urlTransform}
							>
								{typewriter.isTyping &&
								typewriter.rendered.length <
									fencedHtmlData!.preFenceProse.length
									? typewriter.rendered
									: fencedHtmlData!.preFenceProse}
							</Markdown>
						)}
						{/* HTML block fed directly from part.text — not from the
						    typewriter — so it mounts during streaming and CDN scripts
						    are prefetched immediately.  Scripts fire (via srcDoc
						    reload) as soon as a complete inline <script> or </html>
						    is detected. */}
						<HtmlPreviewBlock
							html={fencedHtmlData!.fencedHtmlContent}
							room={message.room}
							isLoading={fencedIsPreviewLoading}
							copyTooltip="Copy"
							copySuccessMessage={t("notifications.copySuccess")}
							copyLabel="Copy"
						/>
						{/* Post-fence prose */}
						{postBlockProse &&
							(postProseStarted ||
								!isLast ||
								!message.isThinking) && (
								<Markdown
									components={components}
									className="[&>*:first-child]:mt-0"
									urlTransform={urlTransform}
								>
									{postTypewriter.isTyping
										? postTypewriter.rendered
										: postBlockProse}
								</Markdown>
							)}
					</>
				) : (
					/* ── Normal markdown ── */
					<Markdown
						components={components}
						className="[&>*:first-child]:mt-0"
						urlTransform={urlTransform}
					>
						{renderedText}
					</Markdown>
				)}
				{isAnyTyping && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="absolute right-4 bottom-4 z-50">
								<Button
									size="icon-sm"
									variant={"outline"}
									disabled={!part.text}
									onClick={() => {
										typewriter.skipToEnd();
										postTypewriter.skipToEnd();
									}}
									aria-label="Fast Forward to End"
									className="shadow-lg"
								>
									<SkipForwardIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.fastForwardToEnd")}
						</TooltipContent>
					</Tooltip>
				)}
			</>
		);
	},
);
