import { useCallback, useRef, useState } from "react";
import { Trans, useTranslation } from "@semoss/i18n";
import {
	type FilePanelMode,
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
	useFileBuffer,
	useFilePanel,
} from "@semoss/panels";
import { CodeEditor, toast } from "@semoss/ui/next";
import type { WorkbenchPanelId } from "@semoss/workbench";
import { useWorkbench } from "@semoss/workbench";
import { Logo } from "../../assets/logos";
import type { ConsoleContext } from "../../types";
import { modeKey } from "../../utility/file-mode";
import { useTerminal } from "../terminal/terminal-context";
import { Tooltip } from "../tooltip";

type Ext = "pixel" | "r" | "py" | "shell";

const extToContext = (ext: Ext): ConsoleContext => {
	if (ext === "r") return "R";
	if (ext === "py") return "Python";
	if (ext === "shell") return "Shell";
	return "Pixel";
};

/**
 * Map a filename to its runnable language, or `null` when the extension isn't
 * one we can execute (json, txt, csv, …). A null ext means "no mode": the run
 * toolbar shows nothing selected and Run prompts the user to pick a language.
 */
export const inferExt = (name: string): Ext | null => {
	const e = (name.split(".").pop() || "").toLowerCase();
	if (e === "r") return "r";
	if (e === "py") return "py";
	if (e === "pixel") return "pixel";
	if (e === "sh" || e === "shell") return "shell";
	return null;
};

const isRunnableExt = (e: string | null | undefined): e is Ext =>
	e === "pixel" || e === "r" || e === "py" || e === "shell";

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

export interface FileEditorTabConfig {
	path: string;
	/**
	 * The scope this file was opened against.
	 *
	 * `FilePanelMode`, not the wider `FileMode`: buckets have no read or save
	 * reactor, so a STORAGE-scoped editor could neither load nor write. The
	 * scope picker only ever selects INSIGHT, USER or APP, so nothing is lost —
	 * and the old code silently fetched a storage file with `GetInsightAssets`.
	 */
	mode: FilePanelMode;
	/** Display name without the modified-indicator asterisk. Stored in
	 * config so a rename of the tab label doesn't lose it. */
	baseName: string;
	/** Human-readable project name when `mode.type === "APP"`, captured at
	 * open time so the scope-changed banner can show name + id rather than
	 * just the opaque id. */
	appName?: string;
	/** Ext (language) the tab runs as, or null when the file type isn't
	 * runnable (no mode selected). Initially inferred from the filename;
	 * users can switch via the toolbar. */
	ext: Ext | null;
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
	if (m.type === "USER") return t("scopeLabel.user");
	return t("scopeLabel.insight");
};

interface TerminalFileProps {
	/** This pane's panel instance, for the maximize check. */
	id: WorkbenchPanelId;
	/** Path, mode and appName, read from the panel's config. */
	config: FileEditorTabConfig;
	/** Writes the tab label, including the unsaved-work asterisk. */
	rename: (name: string) => void;
	/** Persists the chosen run language back onto the panel. */
	setConfig: (patch: Partial<FileEditorTabConfig>) => void;
}

/**
 * Per-panel file editor. One instance per open file — the blueprint is
 * `mount: "keepAlive"`, so a hidden editor stays mounted and preserves its
 * buffer across tab switches.
 */
export const TerminalFile = ({
	id,
	config,
	rename,
	setConfig,
}: TerminalFileProps) => {
	const terminal = useTerminal();
	const { t } = useTranslation("file");
	const maximizedTabsetId = useWorkbench(
		(state) => state.layout.maximizedTabsetId,
	);
	const ownTabsetId = useWorkbench(
		(state) =>
			state.layout.tabsets.find((tabset) => tabset.panelIds.includes(id))
				?.id,
	);
	const [ext, setExtState] = useState<Ext | null>(
		isRunnableExt(config.ext) ? config.ext : inferExt(config.baseName),
	);

	// Access, the insight, reading, saving, downloading and the three blocking
	// states come from `@semoss/panels` — the same machinery the workbench's
	// own file panels are built from. Only the Run toolbar and the scope guard
	// below are the terminal's.
	const panel = useFilePanel({
		mode: config.mode,
		path: config.path,
		name: config.baseName,
	});
	const buffer = useFileBuffer({
		panel: panel,
		name: config.baseName,
		rename: rename,
	});

	const setExt = useCallback(
		(nextExt: Ext) => {
			setExtState(nextExt);
			// persist onto the panel so the choice survives tab switches and
			// comes back with a restored layout
			setConfig({ ext: nextExt });
		},
		[setConfig],
	);

	const active = modeKey(config.mode) === modeKey(terminal.fileMode);
	const activeRef = useRef(active);
	activeRef.current = active;

	const runFile = useCallback(async () => {
		// No runnable language is selected — e.g. a .json/.txt file, or a type
		// we can't infer a mode for. Running would be a no-op, so prompt the
		// user to pick Pixel / R / Python / Shell from the toolbar instead.
		if (!ext) {
			toast.warning(t("noMode.title"), {
				description: t("noMode.description", {
					name: config.baseName,
				}),
			});
			return;
		}

		// the buffer holds the live text, seeded from disk on load, so a run
		// never has to re-fetch the file the way it did when the editor only
		// reported content through onChange
		const body = buffer.contentRef.current;

		const pixel = buildRunPixel(ext, body);
		if (!pixel) {
			terminal.alert(
				"warn",
				t("errors.runFailed", { name: config.baseName }),
			);
			return;
		}

		// Route through the REPL transcript so the user can see the output
		// (the editor doesn't surface pixel results on its own).
		terminal.submitToConsole(pixel, {
			displayInput: body,
			context: extToContext(ext),
		});

		// If the maximized dock is this editor's own, the REPL is hidden from
		// view — the user just kicked off a run with no visible output. Nudge
		// them to un-maximize. (A maximized REPL is fine; output is
		// front-and-center there.)
		if (maximizedTabsetId && maximizedTabsetId === ownTabsetId) {
			toast.info(t("maximizedToast.title"), {
				description: t("maximizedToast.description"),
			});
		}
	}, [
		buffer.contentRef,
		config.baseName,
		ext,
		maximizedTabsetId,
		ownTabsetId,
		t,
		terminal,
	]);

	if (panel.gate) return panel.gate;
	if (panel.readGate) return panel.readGate;

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="relative min-h-0 flex-1">
				<CodeEditor
					className="size-full"
					code={buffer.content}
					disabled={panel.readOnly || !active}
					language={getCodeEditorLanguage(config.path)}
					menuItems={getFileCodeEditorMenuItems({
						canSave: !panel.readOnly && active,
						isBusy: panel.isBusy,
						onDownload: () => void panel.download(),
						onRefresh: panel.read.refresh,
						onSave: () => void buffer.save(),
					})}
					onChange={(value) => buffer.setContent(value ?? "")}
				/>
				{panel.overlay}
				{!active && (
					// Pointer-events overlay blocks edits / clicks on the
					// editor when the active scope no longer matches the
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
