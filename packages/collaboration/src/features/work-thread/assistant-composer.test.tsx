import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { Engine } from "@semoss/shared";
import { TooltipProvider } from "@semoss/ui/next";
import {
	saveEmailDraft,
	sendEmailDraft,
	UncertainDraftError,
} from "@/features/connectors/api/microsoft";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { AssistantComposer } from "./assistant-composer";
import { WorkComposerSession } from "./work-composer-session";
import { workSnapshot } from "./work-thread.test-fixtures";

vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: ({
		name,
		disabled,
		onChange,
	}: {
		name: string;
		disabled?: boolean;
		onChange: (engine: Engine) => void;
	}) => (
		<button
			type="button"
			disabled={disabled}
			aria-label="Choose model"
			onClick={() =>
				onChange({
					engine_id: "new-model",
					engine_name: "New model",
				} as Engine)
			}
		>
			{name}
		</button>
	),
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, error: null }),
}));
vi.mock("./use-work-panel-actions", () => ({ useWorkPanelActions: () => [] }));
vi.mock("@/features/connectors/api/microsoft", async (original) => ({
	...(await original<typeof import("@/features/connectors/api/microsoft")>()),
	saveEmailDraft: vi.fn(),
	sendEmailDraft: vi.fn(),
}));

function setup(
	overrides: Partial<ComponentProps<typeof AssistantComposer>> = {},
) {
	const send = vi.fn(async () => undefined);
	const selectModel = vi.fn();
	const onSent = vi.fn();
	const session = {
		insight: { actions: {} },
		retain: vi.fn(() => vi.fn()),
		send,
		selectModel,
	} as unknown as ThreadSession;
	const props = {
		session,
		snapshot: workSnapshot(),
		title: "Thread",
		sourceUid: "email-1",
		attachments: [],
		context: {
			threadId: "thread-1",
			contextRevision: "r1",
			contextText: "Context",
		},
		onSent,
		...overrides,
	};
	const view = render(
		<TooltipProvider>
			<AssistantComposer {...props} />
		</TooltipProvider>,
	);
	return { ...view, props, send, selectModel, onSent };
}

async function enterText(text: string) {
	const editor = screen.getByRole("textbox");
	await userEvent.setup().click(editor);
	await act(async () => {
		fireEvent.paste(editor, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html", "text/plain"],
				getData: (type: string) =>
					type === "text/html"
						? `<p>${text}</p>`
						: type === "text/plain"
							? text
							: "",
			},
		});
	});
}

async function chooseMode(name: "Ask Assistant" | "Draft") {
	const user = userEvent.setup();
	await user.click(screen.getByRole("combobox", { name: "Message mode" }));
	await user.click(screen.getByRole("option", { name }));
}

beforeAll(() => {
	vi.stubGlobal("DragEvent", class DragEvent extends Event {});
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = vi.fn();
});
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(saveEmailDraft).mockResolvedValue({
		savedDraftId: "draft-1",
		webLink: "https://outlook.office.com/mail/drafts/draft-1",
	});
	vi.mocked(sendEmailDraft).mockResolvedValue({
		sent: true,
		draftId: "draft-1",
	});
});

it("keeps text and attachments when switching modes and selecting a model", async () => {
	const { selectModel, send } = setup();
	await enterText("Keep this text");
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: {
			files: [new File(["hello"], "brief.txt", { type: "text/plain" })],
		},
	});
	await chooseMode("Draft");
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep this text");
	expect(screen.getByText("brief.txt")).toBeVisible();
	await chooseMode("Ask Assistant");
	fireEvent.click(screen.getByRole("button", { name: "Choose model" }));
	expect(selectModel).toHaveBeenCalledWith("new-model", "New model");
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep this text");
	expect(screen.getByText("brief.txt")).toBeVisible();
	expect(send).not.toHaveBeenCalled();
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it("saves a reply draft without a model or assistant run and keeps Enter for newlines", async () => {
	const snapshot = { ...workSnapshot(), modelId: "", modelError: "No model" };
	const { props, send, onSent } = setup({ snapshot });
	await chooseMode("Draft");
	await enterText("A reply for Outlook");
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save draft" }),
		).toBeEnabled(),
	);
	fireEvent.keyDown(screen.getByRole("textbox"), {
		key: "Enter",
		code: "Enter",
		keyCode: 13,
	});
	expect(saveEmailDraft).not.toHaveBeenCalled();
	fireEvent.keyDown(screen.getByRole("textbox"), {
		key: "Enter",
		code: "Enter",
		keyCode: 13,
		ctrlKey: true,
	});
	await waitFor(() =>
		expect(saveEmailDraft).toHaveBeenCalledWith(
			props.session.insight.actions,
			{
				mode: "reply",
				sourceUid: "email-1",
				body: expect.stringContaining("A reply for Outlook"),
				bodyFormat: "html",
				replyAll: false,
			},
		),
	);
	expect(await screen.findByText("Saved to Outlook drafts.")).toBeVisible();
	expect(screen.getByRole("textbox")).toHaveTextContent("");
	expect(send).not.toHaveBeenCalled();
	expect(onSent).not.toHaveBeenCalled();
	expect(sendEmailDraft).not.toHaveBeenCalled();
});

it("retains a failed save and blocks duplicates until an uncertain save is checked", async () => {
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(
		new UncertainDraftError(new Error("Connection interrupted")),
	);
	setup();
	await chooseMode("Draft");
	await enterText("Do not lose this reply");
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save draft" }),
		).toBeEnabled(),
	);
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	expect(
		await screen.findByRole("button", {
			name: "I checked Outlook — allow another save",
		}),
	).toBeVisible();
	expect(screen.getByRole("textbox")).toHaveTextContent(
		"Do not lose this reply",
	);
	expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
	await chooseMode("Ask Assistant");
	await chooseMode("Draft");
	expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
	fireEvent.click(
		screen.getByRole("button", {
			name: "I checked Outlook — allow another save",
		}),
	);
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	expect(await screen.findByText("Saved to Outlook drafts.")).toBeVisible();
	expect(saveEmailDraft).toHaveBeenCalledTimes(2);
});

it("never silently drops attached files when saving a reply", async () => {
	setup();
	await enterText("Attached reply");
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: { files: [new File(["hello"], "brief.txt")] },
	});
	await chooseMode("Draft");
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Remove the queued attachments",
	);
	expect(screen.getByText("brief.txt")).toBeVisible();
	expect(screen.getByRole("textbox")).toHaveTextContent("Attached reply");
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it("locks the mode during save and submits only one copy", async () => {
	let finish: () => void = () => undefined;
	vi.mocked(saveEmailDraft).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = () => resolve({ savedDraftId: "draft-1" });
			}),
	);
	setup();
	await chooseMode("Draft");
	await enterText("Save once");
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Save draft" }),
		).toBeEnabled(),
	);
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	expect(
		screen.getByRole("combobox", { name: "Message mode" }),
	).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
	await act(async () => finish());
	expect(
		screen.getByRole("combobox", { name: "Message mode" }),
	).toBeEnabled();
});

it("locks model changes during an active run and disables draft mode without an Outlook source", async () => {
	const snapshot = workSnapshot();
	snapshot.turn.isRunning = true;
	const { rerender, props } = setup({ snapshot, sourceUid: undefined });
	expect(screen.getByRole("button", { name: "Choose model" })).toBeDisabled();
	expect(
		screen.getByRole("combobox", { name: "Message mode" }),
	).toBeDisabled();
	rerender(
		<TooltipProvider>
			<AssistantComposer {...props} snapshot={workSnapshot()} />
		</TooltipProvider>,
	);
	await userEvent
		.setup()
		.click(screen.getByRole("combobox", { name: "Message mode" }));
	expect(screen.getByRole("option", { name: "Draft" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	expect(
		screen.queryByRole("option", { name: "Send reply" }),
	).not.toBeInTheDocument();
});

it("preserves rich formatting and blocks an over-limit reply without flattening it", async () => {
	setup();
	await chooseMode("Draft");
	const editor = screen.getByRole("textbox");
	const paste = (html: string) =>
		fireEvent.paste(editor, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html"],
				getData: (type: string) => (type === "text/html" ? html : ""),
			},
		});
	await act(async () => paste(`<p><strong>${"x".repeat(8001)}</strong></p>`));
	expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
	expect(
		Array.from(
			editor.querySelectorAll("strong"),
			(node) => node.textContent,
		).join(""),
	).toBe("x".repeat(8001));
	await chooseMode("Ask Assistant");
	await chooseMode("Draft");
	expect(
		Array.from(
			editor.querySelectorAll("strong"),
			(node) => node.textContent,
		).join(""),
	).toBe("x".repeat(8001));
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it("keeps formatting after a failed reply save", async () => {
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(
		new UncertainDraftError(new Error("Connection lost")),
	);
	setup();
	await chooseMode("Draft");
	await act(async () =>
		fireEvent.paste(screen.getByRole("textbox"), {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html"],
				getData: (type: string) =>
					type === "text/html"
						? "<p><strong>Formatted reply</strong></p>"
						: "",
			},
		}),
	);
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	await screen.findByRole("button", {
		name: "I checked Outlook — allow another save",
	});
	expect(
		screen.getByRole("textbox").querySelector("strong"),
	).toHaveTextContent("Formatted reply");
	expect(vi.mocked(saveEmailDraft).mock.calls[0]?.[1].body).toContain(
		"<strong",
	);
	expect(sendEmailDraft).not.toHaveBeenCalled();
});

it("restores rich text, mode, and files after navigating away without stealing focus", async () => {
	const composerSession = new WorkComposerSession();
	const first = setup({ composerSession });
	await enterText("Remember my reply");
	await chooseMode("Draft");
	const editor = screen.getByRole("textbox");
	await userEvent.setup().click(editor);
	await act(async () => {
		fireEvent.paste(editor, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html", "text/plain"],
				getData: (type: string) =>
					type === "text/html"
						? "<p><strong>Formatted</strong> reply</p>"
						: type === "text/plain"
							? "Formatted reply"
							: "",
			},
		});
	});
	const file = new File(["contents"], "resume.txt");
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: { files: [file] },
	});
	await waitFor(() =>
		expect(composerSession.getSnapshot().draft.files).toEqual([file]),
	);
	const document = composerSession.getSnapshot().draft.document;
	expect(document).not.toBeNull();
	first.unmount();
	await act(async () => {
		setup({ composerSession });
	});
	expect(
		screen.getByRole("combobox", { name: "Message mode" }),
	).toHaveTextContent("Draft");
	expect(screen.getByRole("textbox")).toHaveTextContent("Remember my reply");
	expect(
		screen.getByRole("textbox").querySelector("strong"),
	).toHaveTextContent("Formatted");
	expect(screen.getByText("resume.txt")).toBeVisible();
	expect(screen.getByRole("textbox")).not.toHaveFocus();
	expect(composerSession.getSnapshot().draft.document).toEqual(document);
});

it("focuses only after an explicit quick action reveal", async () => {
	const composerSession = new WorkComposerSession();
	const { rerender, props } = setup({ composerSession, isOpen: false });
	expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	act(() => composerSession.setMode("draft"));
	rerender(
		<TooltipProvider>
			<AssistantComposer {...props} isOpen focusRequest={1} />
		</TooltipProvider>,
	);
	await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
	expect(saveEmailDraft).not.toHaveBeenCalled();
	expect(sendEmailDraft).not.toHaveBeenCalled();
});

it("keeps pending writes locked across remounts and clears only the originating thread on success", async () => {
	let finish: (receipt: { savedDraftId: string }) => void = () => undefined;
	vi.mocked(saveEmailDraft).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	const composerSession = new WorkComposerSession();
	composerSession.setMode("draft");
	const first = setup({ composerSession });
	await enterText("Save while away");
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	first.unmount();
	const second = setup({ composerSession });
	await act(async () => {});
	expect(screen.getByRole("textbox")).toHaveTextContent("Save while away");
	expect(
		screen.getByRole("combobox", { name: "Message mode" }),
	).toBeDisabled();
	expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
	second.unmount();
	const other = setup({
		composerSession: new WorkComposerSession(),
		context: {
			threadId: "other",
			contextRevision: "r1",
			contextText: "Other",
		},
	});
	await enterText("Other thread stays intact");
	await act(async () => finish({ savedDraftId: "saved-away" }));
	expect(screen.getByRole("textbox")).toHaveTextContent(
		"Other thread stays intact",
	);
	expect(composerSession.getSnapshot().draft.text).toBe("");
	other.unmount();
	setup({ composerSession });
	expect(screen.getByText("Saved to Outlook drafts.")).toBeVisible();
	expect(screen.getByRole("textbox")).toHaveTextContent("");
	expect(saveEmailDraft).toHaveBeenCalledTimes(1);
});

it("retains an ordinary save failure and shows its recovery message after remount", async () => {
	vi.mocked(saveEmailDraft).mockRejectedValueOnce(
		new Error("Outlook is unavailable"),
	);
	const composerSession = new WorkComposerSession();
	composerSession.setMode("draft");
	const first = setup({ composerSession });
	await enterText("Keep failed reply");
	fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
	await screen.findByText("Outlook is unavailable");
	first.unmount();
	setup({ composerSession });
	await act(async () => {});
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep failed reply");
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Outlook is unavailable",
	);
	expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
});

it("offers only Ask Assistant and Draft, with an icon-only save action", async () => {
	setup();
	const user = userEvent.setup();
	await user.click(screen.getByRole("combobox", { name: "Message mode" }));
	expect(
		screen.getAllByRole("option").map((option) => option.textContent),
	).toEqual(["Ask Assistant", "Draft"]);
	await user.click(screen.getByRole("option", { name: "Draft" }));
	await enterText("Save this draft");
	const save = screen.getByRole("button", { name: "Save draft" });
	expect(save).toHaveTextContent("");
	await user.hover(save);
	expect(await screen.findByRole("tooltip")).toHaveTextContent("Save draft");
	await user.click(save);
	await screen.findByText("Saved to Outlook drafts.");
	expect(sendEmailDraft).not.toHaveBeenCalled();
});
