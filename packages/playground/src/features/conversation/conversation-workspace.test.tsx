import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ConversationWorkspace } from "./conversation-workspace";
import { ConversationWorkspaceActionsContext } from "./conversation-workspace-actions.context";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
	vi.stubGlobal("innerWidth", 1440);
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});
afterEach(() => vi.unstubAllGlobals());

test("keeps conversation drafts and work editors mounted across width, tab, and close changes", async () => {
	const observations: {
		callback: ResizeObserverCallback;
		target: Element;
	}[] = [];
	vi.stubGlobal(
		"ResizeObserver",
		class {
			callback: ResizeObserverCallback;
			constructor(callback: ResizeObserverCallback) {
				this.callback = callback;
			}
			observe(target: Element) {
				observations.push({ callback: this.callback, target });
			}
			unobserve() {}
			disconnect() {}
		},
	);
	const children = <input aria-label="Draft" defaultValue="Unsent message" />;
	const panel = (
		<textarea aria-label="Editor" defaultValue="Unsaved document" />
	);
	const { rerender, container } = render(
		<ConversationWorkspace isOpen panel={panel}>
			{children}
		</ConversationWorkspace>,
	);
	const draft = screen.getByLabelText("Draft");
	const editor = screen.getByLabelText("Editor");
	fireEvent.change(draft, { target: { value: "Keep my draft" } });
	fireEvent.change(editor, { target: { value: "Keep my edits" } });
	const resize = (width: number) =>
		act(() => {
			const observation = observations.find(
				(entry) => entry.target === container.firstElementChild,
			);
			observation?.callback(
				[{ contentRect: { width } } as ResizeObserverEntry],
				{} as ResizeObserver,
			);
		});
	resize(600);
	fireEvent.mouseDown(screen.getByRole("tab", { name: "studio.chat" }), {
		button: 0,
	});
	expect(screen.getByRole("tab", { name: "studio.chat" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	resize(1400);
	rerender(
		<ConversationWorkspace isOpen panel={panel}>
			{children}
		</ConversationWorkspace>,
	);
	draft.focus();
	editor.focus();
	rerender(
		<ConversationWorkspace isOpen={false} panel={panel}>
			{children}
		</ConversationWorkspace>,
	);
	await waitFor(() => expect(draft).toHaveFocus());
	rerender(
		<ConversationWorkspace isOpen panel={panel}>
			{children}
		</ConversationWorkspace>,
	);
	expect(screen.getByLabelText("Draft")).toBe(draft);
	expect(screen.getByLabelText("Editor")).toBe(editor);
	expect(draft).toHaveValue("Keep my draft");
	expect(editor).toHaveValue("Keep my edits");
});

/** A header place that opens the work area, and a close button inside it. */
function HeaderPlace({ onOpen }: { onOpen: () => void }) {
	const workspace = useContext(ConversationWorkspaceActionsContext);
	return (
		<button
			type="button"
			aria-pressed={workspace?.isWorkAreaVisible ?? false}
			onClick={(event) => {
				onOpen();
				workspace?.revealWorkArea(event.currentTarget);
			}}
		>
			Files
		</button>
	);
}

function WorkspaceHeaderHarness() {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<ConversationWorkspace
			isOpen={isOpen}
			header={<HeaderPlace onOpen={() => setIsOpen(true)} />}
			panel={
				<button type="button" onClick={() => setIsOpen(false)}>
					Close work area
				</button>
			}
		>
			<input aria-label="Draft" />
		</ConversationWorkspace>
	);
}

/** Report one width to every ResizeObserver the workspace creates. */
function stubWidth(): (width: number) => void {
	const callbacks: ResizeObserverCallback[] = [];
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: ResizeObserverCallback) {
				callbacks.push(callback);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	return (width) =>
		act(() => {
			for (const callback of callbacks)
				callback(
					[{ contentRect: { width } } as ResizeObserverEntry],
					{} as ResizeObserver,
				);
		});
}

test("the header sits above both panes, with no floating opener", () => {
	stubWidth();
	render(<WorkspaceHeaderHarness />);
	expect(screen.getByRole("button", { name: "Files" })).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "studio.openWorkArea" }),
	).not.toBeInTheDocument();
});

test("closing the work area returns focus to the header place that opened it", async () => {
	stubWidth();
	const user = userEvent.setup();
	render(<WorkspaceHeaderHarness />);
	const place = screen.getByRole("button", { name: "Files" });
	await user.click(place);
	expect(place).toHaveAttribute("aria-pressed", "true");
	await user.click(screen.getByRole("button", { name: "Close work area" }));
	await waitFor(() => expect(place).toHaveFocus());
	expect(place).toHaveAttribute("aria-pressed", "false");
});

test("a header place brings an already-open work area forward from the narrow Chat tab", async () => {
	const resize = stubWidth();
	const user = userEvent.setup();
	render(<WorkspaceHeaderHarness />);
	resize(600);
	const place = screen.getByRole("button", { name: "Files" });
	await user.click(place);
	fireEvent.mouseDown(screen.getByRole("tab", { name: "studio.chat" }), {
		button: 0,
	});
	// on a narrow screen the open work area moves the header above both panes
	const narrowPlace = screen.getByRole("button", { name: "Files" });
	expect(narrowPlace).toHaveAttribute("aria-pressed", "false");
	await user.click(narrowPlace);
	await waitFor(() =>
		expect(
			screen.getByRole("tab", { name: "studio.workArea" }),
		).toHaveAttribute("aria-selected", "true"),
	);
	expect(
		screen.getByRole("tabpanel", { name: "studio.workArea" }),
	).toBeVisible();
	expect(narrowPlace).toHaveAttribute("aria-pressed", "true");
});
