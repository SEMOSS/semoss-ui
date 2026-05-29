import { useCallback, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { FileEditor, FlexLayout } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { Logo } from "../../assets/logos";
import type { ConsoleContext, FileMode } from "../../types";
import { modeKey } from "../../utility/file-mode";
import { runPixel } from "../../utility/pixel";
import { useTerminal } from "../terminal/terminal-context";
import { Tooltip } from "../tooltip";

type Ext = "pixel" | "r" | "py" | "shell";

const extToContext = (ext: Ext): ConsoleContext => {
	if (ext === "r") return "R";
	if (ext === "py") return "Python";
	if (ext === "shell") return "Shell";
	return "Pixel";
};

const inferExt = (name: string): Ext => {
	const e = (name.split(".").pop() || "").toLowerCase();
	if (e === "r") return "r";
	if (e === "py") return "py";
	if (e === "pixel") return "pixel";
	if (e === "sh" || e === "shell") return "shell";
	return "pixel";
};

/**
 * Build the "Run" pixel — always sends the file's content inline. No Source
 * variants; the persona just wraps the content appropriately.
 */
const buildRunPixel = (ext: Ext, content: string): string => {
	if (ext === "r") return `R("<encode>${content}</encode>")`;
	if (ext === "py") return `Py("<encode>${content}</encode>")`;
	if (ext === "pixel") return content;
	if (ext === "shell") {
		const escaped = content.replace(/"/g, '\\"');
		return `Command("${escaped}")`;
	}
	return "";
};

/**
 * Pixel used to fetch the on-disk content of a file in the tab's scope.
 * Matches what FileCodeEditor uses internally so we ask the backend in the
 * same way it does.
 */
const buildFetchContentPixel = (mode: FileMode, path: string): string => {
	if (mode.type === "APP") {
		return `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	}
	if (mode.type === "ENGINE") {
		return `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	}
	if (mode.type === "USER") {
		return `GetUserAssets(filePath=["${path}"]);`;
	}
	return `GetInsightAssets(filePath=["${path}"]);`;
};

export interface FileEditorTabConfig {
	path: string;
	mode: FileMode;
	/** Display name without the modified-indicator asterisk. Stored in
	 * config so renames via FlexLayout.Actions.renameTab don't lose it. */
	baseName: string;
	/** Human-readable project name when `mode.type === "APP"`, captured at
	 * open time so the scope-changed banner can show name + id rather than
	 * just the opaque id. */
	appName?: string;
	/** Ext (language) the tab should run as. Initially inferred from the
	 * filename; users can switch via the toolbar. */
	ext: Ext;
}

const scopeLabel = (
	config: FileEditorTabConfig,
	t: (key: string, opts?: Record<string, unknown>) => string,
) => {
	const m = config.mode;
	if (m.type === "APP") {
		return config.appName
			? t("scopeLabel.appWithName", { name: config.appName, id: m.app })
			: t("scopeLabel.appIdOnly", { id: m.app });
	}
	if (m.type === "ENGINE") return t("scopeLabel.engine", { id: m.engine });
	if (m.type === "STORAGE")
		return t("scopeLabel.storage", { name: m.storage });
	if (m.type === "USER") return t("scopeLabel.user");
	return t("scopeLabel.insight");
};

interface TerminalFileProps {
	/** The FlexLayout tab node this pane is mounted in. We read the path /
	 * mode / appName from its config and write back name (with asterisk) +
	 * ext via FlexLayout actions. */
	node: FlexLayout.TabNode;
}

/**
 * Per-tab file editor pane. One instance per file editor tab — FlexLayout
 * keeps inactive tabs mounted (hidden via CSS) so each editor preserves its
 * state across tab switches.
 */
export const TerminalFile = ({ node }: TerminalFileProps) => {
	const terminal = useTerminal();
	const { actions } = useInsight();
	const { t } = useTranslation("file");

	const config = node.getConfig() as FileEditorTabConfig;
	const [ext, setExtState] = useState<Ext>(
		config.ext ?? inferExt(config.baseName),
	);
	const [content, setContent] = useState("");
	const [isModified, setIsModified] = useState(false);
	const contentRef = useRef(content);
	contentRef.current = content;

	// Mirror the asterisk back onto the FlexLayout tab name whenever the
	// editor reports a modified state change. Without this, the tab title
	// would show just the filename even when the buffer has unsaved edits.
	useEffect(() => {
		const model = node.getModel();
		const next = isModified ? `${config.baseName}*` : config.baseName;
		if (node.getName() !== next) {
			model.doAction(FlexLayout.Actions.renameTab(node.getId(), next));
		}
	}, [isModified, config.baseName, node]);

	const setExt = useCallback(
		(nextExt: Ext) => {
			setExtState(nextExt);
			// persist on the tab config so the choice survives tab switches /
			// is recovered if we ever serialize the layout
			node.getModel().doAction(
				FlexLayout.Actions.updateNodeAttributes(node.getId(), {
					config: { ...config, ext: nextExt },
				}),
			);
		},
		[config, node],
	);

	const active = modeKey(config.mode) === modeKey(terminal.fileMode);

	const runFile = useCallback(async () => {
		// content is only populated by FileEditor's onChange — which doesn't
		// fire on initial load. For a tab the user hasn't typed in, fetch the
		// on-disk content first.
		let body = contentRef.current;
		if (!isModified && !body) {
			const fetchPixel = buildFetchContentPixel(config.mode, config.path);
			const resp = await runPixel<string>(actions, fetchPixel);
			if (
				!resp ||
				resp.operationType.some(
					(opType) => opType.indexOf("ERROR") > -1,
				)
			) {
				terminal.alert(
					"error",
					t("errors.loadFailed", { name: config.baseName }),
				);
				return;
			}
			body =
				typeof resp.output === "string"
					? resp.output
					: String(resp.output ?? "");
		}

		const pixel = buildRunPixel(ext, body);
		if (!pixel) {
			terminal.alert(
				"warn",
				t("errors.runFailed", { name: config.baseName }),
			);
			return;
		}

		// Route through the REPL transcript so the user can see the output
		// (FileEditor doesn't surface pixel results on its own).
		terminal.submitToConsole(pixel, {
			displayInput: body,
			context: extToContext(ext),
		});

		// If a non-REPL tabset is currently maximized, the REPL is hidden
		// from view — the user just kicked off a run with no visible output.
		// Nudge them to un-maximize. (A maximized REPL is fine; output is
		// front-and-center there.)
		const maximized = node.getModel().getMaximizedTabset();
		if (maximized && maximized.getId() !== "REPL_TABSET") {
			toast.info(t("maximizedToast.title"), {
				description: t("maximizedToast.description"),
			});
		}
	}, [actions, config, ext, isModified, node, t, terminal]);

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="relative min-h-0 flex-1">
				<FileEditor
					mode={config.mode}
					path={config.path}
					onChange={(value, modifiedFlag) => {
						setContent(value);
						setIsModified(modifiedFlag);
					}}
				/>
				{!active && (
					// Pointer-events overlay blocks edits / clicks on the
					// FileEditor when the active scope no longer matches the
					// tab's captured scope. Save/Run in this state would write
					// to the wrong scope or execute against the wrong Python
					// environment, so we fence it off until the user switches
					// back.
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
						<div className="max-w-sm rounded-md border border-amber-400/60 bg-amber-100/80 px-4 py-3 text-amber-900 text-sm shadow-sm dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-200">
							<div className="mb-1 font-semibold">
								{t("scopeChanged.title")}
							</div>
							<div className="text-xs leading-snug">
								<Trans
									i18nKey="scopeChanged.body"
									ns="file"
									values={{ scope: scopeLabel(config, t) }}
									components={{
										strong: (
											<span className="font-medium" />
										),
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex h-10 items-center gap-2 border-border border-t bg-muted px-2">
				<div className="ml-auto inline-flex overflow-hidden rounded border border-border">
					{(
						[
							["pixel", "Pixel"],
							["r", "R"],
							["py", "Python"],
							["shell", "Shell"],
						] as const
					).map(([extOpt, label]) => (
						<Tooltip
							key={extOpt}
							label={t("context.switchTo", { context: label })}
						>
							<button
								type="button"
								className={`flex items-center justify-center border-border border-r px-2 py-1 last:border-r-0 disabled:opacity-40 ${
									ext === extOpt
										? "bg-primary/15 text-primary"
										: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								}`}
								onClick={() => setExt(extOpt)}
								disabled={!active}
							>
								<Logo name={extOpt} className="h-4 w-4" />
							</button>
						</Tooltip>
					))}
				</div>

				<Tooltip
					label={
						active
							? t("run.tooltipActive")
							: t("run.tooltipInactive")
					}
					align="end"
				>
					<button
						type="button"
						className="rounded bg-primary px-3 py-1 text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-40"
						onClick={runFile}
						disabled={!active}
					>
						{t("run.button")}
					</button>
				</Tooltip>
			</div>
		</div>
	);
};
