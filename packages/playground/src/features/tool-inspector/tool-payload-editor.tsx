import { type ComponentRef, type ReactNode, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { CodeEditor, toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { ToolPayloadToolbar } from "./tool-payload-toolbar";

interface ToolPayloadEditorProps {
	text: string;
	language: "json" | "plaintext";
	label: string;
	onExpand?: (trigger: HTMLButtonElement) => void;
	/** Optional format selector in place of the language label. */
	toolbarStart?: ReactNode;
}

/** A bounded, virtualized reader with JSON folding and native find shortcuts. */
export const ToolPayloadEditor = ({
	text,
	language,
	label,
	onExpand,
	toolbarStart,
}: ToolPayloadEditorProps) => {
	const { t } = useTranslation("tool");
	const editorRef = useRef<ComponentRef<typeof CodeEditor>>(null);
	const [wrap, setWrap] = useState(true);
	const [ready, setReady] = useState(false);
	const copy = () =>
		copyTextToClipboard(text, {
			onSuccess: () => toast.success(t("inspector.copied")),
			onError: () => toast.error(t("inspector.copyFailed")),
		});

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-background">
			<ToolPayloadToolbar
				text={text}
				onFind={() =>
					editorRef.current?.getAction("actions.find")?.run()
				}
				isFindReady={ready}
				onWrap={() => setWrap((value) => !value)}
				isWrapped={wrap}
				onExpand={onExpand}
			>
				{toolbarStart ?? (
					<span className="text-muted-foreground text-xs">
						{language === "json" ? "JSON" : t("inspector.text")}
					</span>
				)}
			</ToolPayloadToolbar>
			<div className="min-h-0 min-w-0 flex-1" dir="ltr">
				<CodeEditor
					ref={(editor) => {
						editorRef.current = editor;
						setReady(!!editor);
					}}
					code={text}
					language={language}
					disabled
					options={{
						ariaLabel: label,
						domReadOnly: true,
						tabFocusMode: true,
						minimap: { enabled: false },
						fontSize: 13,
						lineHeight: 20,
						lineNumbersMinChars: 3,
						folding: language === "json",
						showFoldingControls: "always",
						wordWrap: wrap ? "on" : "off",
						padding: { top: 8, bottom: 8 },
						renderLineHighlight: "none",
						overviewRulerLanes: 0,
						hideCursorInOverviewRuler: true,
						renderValidationDecorations: "off",
						stickyScroll: { enabled: false },
						scrollbar: { alwaysConsumeMouseWheel: false },
					}}
					menuItems={[
						{
							id: "find",
							label: t("inspector.find"),
							onSelect: (editor) =>
								editor.getAction("actions.find")?.run(),
						},
						{
							id: "copy",
							label: t("inspector.copy"),
							onSelect: copy,
						},
						...(language === "json"
							? [
									{
										id: "fold",
										label: t("inspector.foldAll"),
										onSelect: (
											editor: ComponentRef<
												typeof CodeEditor
											>,
										) =>
											editor
												.getAction("editor.foldAll")
												?.run(),
									},
									{
										id: "unfold",
										label: t("inspector.unfoldAll"),
										onSelect: (
											editor: ComponentRef<
												typeof CodeEditor
											>,
										) =>
											editor
												.getAction("editor.unfoldAll")
												?.run(),
									},
								]
							: []),
					]}
				/>
			</div>
		</div>
	);
};
