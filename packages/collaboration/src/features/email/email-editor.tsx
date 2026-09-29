import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import type { Ref } from "react";
import {
	EMAIL_HTML_CONFIG,
	EMAIL_NODES,
	EMAIL_THEME,
} from "./email-editor-config";
import { EmailEditorPlugin } from "./email-editor-plugin";
import { EmailEditorValuePlugin } from "./email-editor-value-plugin";
import { EmailFormatToolbar } from "./email-format-toolbar";
import { emailLink } from "./email-html";

interface EmailEditorProps {
	/** Sanitized HTML owned by the surrounding form. */
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	inputRef?: Ref<HTMLDivElement>;
	id: string;
	labelId: string;
	errorId?: string;
	disabled?: boolean;
	required?: boolean;
}

/** Form-compatible HTML editor sharing the inline composer's nodes, toolbar and serialization. */
export function EmailEditor({
	value,
	onChange,
	onBlur,
	inputRef,
	id,
	labelId,
	errorId,
	disabled,
	required,
}: EmailEditorProps) {
	return (
		<div className="min-w-0 rounded-md border focus-within:ring-2 focus-within:ring-ring">
			<LexicalComposer
				initialConfig={{
					namespace: "EmailDraft",
					nodes: EMAIL_NODES,
					theme: EMAIL_THEME,
					html: EMAIL_HTML_CONFIG,
					onError: (error) => {
						throw error;
					},
				}}
			>
				<EmailFormatToolbar disabled={disabled} />
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							ref={inputRef}
							id={id}
							aria-labelledby={labelId}
							aria-describedby={errorId}
							aria-invalid={Boolean(errorId)}
							aria-required={required}
							onBlur={onBlur}
							className="max-h-80 min-h-40 overflow-auto p-3 outline-none"
						/>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<EmailEditorPlugin disabled={disabled} />
				<EmailEditorValuePlugin value={value} onChange={onChange} />
				<HistoryPlugin />
				<ListPlugin />
				<LinkPlugin validateUrl={(url) => Boolean(emailLink(url))} />
				<TablePlugin hasHorizontalScroll hasTabHandler={false} />
			</LexicalComposer>
		</div>
	);
}
