import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	$isTextNode,
	type LexicalEditor,
} from "lexical";
import {
	EMAIL_HTML_CONFIG,
	EMAIL_NODES,
	EMAIL_THEME,
	exportEmailHtml,
} from "./email-editor-config";
import { EmailFormatToolbar } from "./email-format-toolbar";

/** A real editor catches selection loss through portalled controls and history changes. */
function setup() {
	const ref: { current: LexicalEditor | null } = { current: null };
	const surface = (disabled = false) => (
		<LexicalComposer
			initialConfig={{
				namespace: "toolbar-test",
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
				contentEditable={<ContentEditable aria-label="Email body" />}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<EditorRefPlugin editorRef={ref} />
			<HistoryPlugin delay={0} />
			<ListPlugin />
			<LinkPlugin />
			<TablePlugin hasTabHandler={false} />
		</LexicalComposer>
	);
	const view = render(surface());
	const editor = ref.current;
	if (!editor) throw new Error("Editor did not mount");
	return {
		editor,
		user: userEvent.setup(),
		disable: () => view.rerender(surface(true)),
	};
}

async function selectText(editor: LexicalEditor) {
	await act(async () =>
		editor.update(
			() => {
				const root = $getRoot();
				root.clear();
				const text = $createTextNode("Alpha Beta");
				root.append($createParagraphNode().append(text));
				text.select(0, 5);
			},
			{ discrete: true },
		),
	);
}

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = vi.fn();
});

it("formats the saved selection through dropdowns and keeps undo/redo available", async () => {
	const { editor, user } = setup();
	await selectText(editor);
	await user.click(screen.getByRole("button", { name: "Bold" }));
	expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await user.click(screen.getByRole("combobox", { name: "Font size" }));
	await user.click(screen.getByRole("option", { name: "24px" }));
	expect(
		screen.getByRole("textbox").querySelector("strong"),
	).toHaveTextContent("Alpha");
	expect(screen.getByRole("textbox").querySelector("strong")).toHaveStyle({
		fontSize: "24px",
	});
	expect(screen.getByRole("textbox")).toHaveTextContent("Alpha Beta");
	await user.click(screen.getByRole("button", { name: "Undo" }));
	expect(screen.getByRole("textbox").querySelector("strong")).not.toHaveStyle(
		{ fontSize: "24px" },
	);
	await user.click(screen.getByRole("button", { name: "Redo" }));
	expect(screen.getByRole("textbox").querySelector("strong")).toHaveStyle({
		fontSize: "24px",
	});
	await act(async () =>
		editor.update(() => {
			const paragraph = $getRoot().getFirstChildOrThrow();
			const text = $isElementNode(paragraph)
				? paragraph.getLastDescendant()
				: null;
			if ($isTextNode(text)) {
				// Match the format/style recomputation performed by a native selection change.
				const selection = text.select(0, text.getTextContentSize());
				selection.setFormat(text.getFormat());
				selection.setStyle(text.getStyle());
			}
		}),
	);
	expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
		"aria-pressed",
		"false",
	);
	expect(
		screen.getByRole("combobox", { name: "Font size" }),
	).toHaveTextContent("Size");
});

it("applies links and colors to the selection and returns focus after dismissing a popover", async () => {
	const { editor, user } = setup();
	await selectText(editor);
	await user.click(screen.getByRole("button", { name: "Link" }));
	expect(screen.getByRole("button", { name: "Apply link" })).toBeDisabled();
	await user.type(
		screen.getByRole("textbox", { name: "Link address" }),
		"https://example.com/",
	);
	await user.click(screen.getByRole("button", { name: "Apply link" }));
	expect(screen.getByRole("textbox").querySelector("a")).toHaveTextContent(
		"Alpha",
	);
	expect(screen.getByRole("textbox").querySelector("a")).toHaveAttribute(
		"href",
		"https://example.com/",
	);
	await user.click(screen.getByRole("button", { name: "Font color" }));
	fireEvent.change(
		screen.getByLabelText("Font color", { selector: "input" }),
		{ target: { value: "#ff0000" } },
	);
	await user.click(screen.getByRole("button", { name: "Apply color" }));
	expect(exportEmailHtml(editor)).toContain("color: rgb(255, 0, 0)");
	await user.click(screen.getByRole("button", { name: "Font color" }));
	expect(
		screen.getByLabelText("Font color", { selector: "input" }),
	).toHaveValue("#ff0000");
	await user.keyboard("{Escape}");
	await user.click(screen.getByRole("button", { name: "Link" }));
	expect(screen.getByRole("textbox", { name: "Link address" })).toHaveValue(
		"https://example.com/",
	);
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Link" })).toHaveFocus(),
	);
});

it("reflects paragraph and alignment changes and toggles lists off", async () => {
	const { editor, user } = setup();
	await selectText(editor);
	await user.click(screen.getByRole("combobox", { name: "Paragraph style" }));
	await user.click(screen.getByRole("option", { name: "Heading 2" }));
	expect(screen.getByRole("textbox").querySelector("h2")).toHaveTextContent(
		"Alpha Beta",
	);
	expect(
		screen.getByRole("combobox", { name: "Paragraph style" }),
	).toHaveTextContent("Heading 2");
	await user.click(screen.getByRole("radio", { name: "Align center" }));
	expect(screen.getByRole("radio", { name: "Align center" })).toHaveAttribute(
		"aria-checked",
		"true",
	);
	expect(screen.getByRole("textbox").querySelector("h2")).toHaveStyle({
		textAlign: "center",
	});
	await user.click(screen.getByRole("radio", { name: "Bullets" }));
	expect(screen.getByRole("textbox").querySelector("ul")).toHaveTextContent(
		"Alpha Beta",
	);
	await user.click(screen.getByRole("radio", { name: "Bullets" }));
	expect(screen.getByRole("textbox").querySelector("ul")).toBeNull();
});

it("edits a table through its contextual menu without losing the selected cell", async () => {
	const { editor, user } = setup();
	await selectText(editor);
	await user.click(screen.getByRole("button", { name: "Insert table" }));
	expect(screen.getByRole("textbox").querySelectorAll("tr")).toHaveLength(3);
	await user.click(screen.getByRole("button", { name: "Table options" }));
	await user.click(screen.getByRole("menuitem", { name: "Add row" }));
	expect(screen.getByRole("textbox").querySelectorAll("tr")).toHaveLength(4);
	await user.click(screen.getByRole("button", { name: "Table options" }));
	await user.click(screen.getByRole("menuitem", { name: "Add column" }));
	expect(
		screen.getByRole("textbox").querySelector("tr")?.children,
	).toHaveLength(4);
	await user.click(screen.getByRole("button", { name: "Table options" }));
	await user.click(screen.getByRole("menuitem", { name: "Delete table" }));
	expect(screen.getByRole("textbox").querySelector("table")).toBeNull();
});

it("disables controls in an already open popover", async () => {
	const { editor, user, disable } = setup();
	await selectText(editor);
	await user.click(screen.getByRole("button", { name: "Link" }));
	await user.type(
		screen.getByRole("textbox", { name: "Link address" }),
		"https://example.com/",
	);
	disable();
	expect(screen.getByRole("button", { name: "Apply link" })).toBeDisabled();
	expect(screen.getByRole("combobox", { name: "Font size" })).toBeDisabled();
	expect(screen.getByRole("radio", { name: "Bullets" })).toBeDisabled();
	expect(exportEmailHtml(editor)).not.toContain("href");
});

it("shows a tooltip on keyboard focus and dismisses it with Escape", async () => {
	const { user } = setup();
	const bold = screen.getByRole("button", { name: "Bold" });
	act(() => bold.focus());
	expect(await screen.findByRole("tooltip")).toHaveTextContent("Bold");
	await user.keyboard("{Escape}");
	expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	expect(bold).toHaveFocus();
});
