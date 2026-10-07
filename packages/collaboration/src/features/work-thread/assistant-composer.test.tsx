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
	const send = vi.fn<ThreadSession["send"]>(async () => undefined);
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

it("keeps text and attachments while selecting a model and keeps email actions out of chat", async () => {
	const { selectModel, send } = setup();
	await enterText("Keep this text");
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: {
			files: [new File(["hello"], "brief.txt", { type: "text/plain" })],
		},
	});
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep this text");
	expect(screen.getByText("brief.txt")).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Choose model" }));
	expect(selectModel).toHaveBeenCalledWith("new-model", "New model");
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep this text");
	expect(screen.getByText("brief.txt")).toBeVisible();
	expect(send).not.toHaveBeenCalled();
	expect(saveEmailDraft).not.toHaveBeenCalled();
});

it("locks model changes during an active assistant run", async () => {
	const snapshot = workSnapshot();
	snapshot.turn.isRunning = true;
	await act(async () => {
		setup({ snapshot });
	});
	expect(screen.getByRole("button", { name: "Choose model" })).toBeDisabled();
	expect(screen.queryByRole("combobox", { name: "Message mode" })).toBeNull();
});

it("restores assistant text and files after navigating away without stealing focus", async () => {
	const composerSession = new WorkComposerSession();
	const first = setup({ composerSession });
	await enterText("Remember my reply");
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
	expect(screen.queryByRole("combobox", { name: "Message mode" })).toBeNull();
	expect(screen.getByRole("textbox")).toHaveTextContent("Remember my reply");
	expect(screen.getByRole("textbox")).toHaveTextContent("Formatted reply");
	expect(screen.getByText("resume.txt")).toBeVisible();
	expect(screen.getByRole("textbox")).not.toHaveFocus();
	expect(composerSession.getSnapshot().draft.document).toEqual(document);
});

it("focuses only after an explicit quick action reveal", async () => {
	const composerSession = new WorkComposerSession();
	const { rerender, props } = setup({ composerSession, isOpen: false });
	expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	act(() => composerSession.setMode("assistant"));
	rerender(
		<TooltipProvider>
			<AssistantComposer {...props} isOpen focusRequest={1} />
		</TooltipProvider>,
	);
	await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
	expect(saveEmailDraft).not.toHaveBeenCalled();
	expect(sendEmailDraft).not.toHaveBeenCalled();
});

it("submits a typed draft request for the selected email without Outlook writes", async () => {
	const composerSession = new WorkComposerSession();
	composerSession.setSourceMessage("selected-email");
	const { send } = setup({ composerSession });
	await enterText("Draft a short reply confirming Friday");
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	await waitFor(() => expect(send).toHaveBeenCalledOnce());
	expect(send.mock.calls[0][1]).toMatchObject({
		selectedSourceMessageId: "selected-email",
	});
	expect(send.mock.calls[0][2]).toMatchObject({
		text: "Draft a short reply confirming Friday",
	});
	expect(saveEmailDraft).not.toHaveBeenCalled();
	expect(sendEmailDraft).not.toHaveBeenCalled();
});
