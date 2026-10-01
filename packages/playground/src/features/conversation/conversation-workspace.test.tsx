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
	const onOpenWorkArea = vi.fn();
	const { rerender, container } = render(
		<ConversationWorkspace
			isOpen
			onOpenWorkArea={onOpenWorkArea}
			panel={panel}
		>
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
		<ConversationWorkspace
			isOpen
			onOpenWorkArea={onOpenWorkArea}
			panel={panel}
		>
			{children}
		</ConversationWorkspace>,
	);
	draft.focus();
	editor.focus();
	rerender(
		<ConversationWorkspace
			isOpen={false}
			onOpenWorkArea={onOpenWorkArea}
			panel={panel}
		>
			{children}
		</ConversationWorkspace>,
	);
	await waitFor(() => expect(draft).toHaveFocus());
	rerender(
		<ConversationWorkspace
			isOpen
			onOpenWorkArea={onOpenWorkArea}
			panel={panel}
		>
			{children}
		</ConversationWorkspace>,
	);
	expect(screen.getByLabelText("Draft")).toBe(draft);
	expect(screen.getByLabelText("Editor")).toBe(editor);
	expect(draft).toHaveValue("Keep my draft");
	expect(editor).toHaveValue("Keep my edits");
});

function WorkspaceOpenHarness() {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<ConversationWorkspace
			isOpen={isOpen}
			onOpenWorkArea={() => setIsOpen(true)}
			panel={
				<button type="button" onClick={() => setIsOpen(false)}>
					Close work area
				</button>
			}
		>
			<WorkspaceComposerAction />
		</ConversationWorkspace>
	);
}

test("desktop opener moves focus into the work area and receives it on close", async () => {
	const user = userEvent.setup();
	render(<WorkspaceOpenHarness />);
	const opener = screen.getByRole("button", {
		name: "studio.openWorkArea",
	});
	expect(opener).toHaveAttribute("aria-expanded", "false");
	expect(opener).toHaveClass("top-2", "size-8");
	await user.click(opener);
	const workArea = screen.getByRole("region", { name: "studio.workArea" });
	await waitFor(() => expect(workArea).toHaveFocus());
	expect(
		screen.queryByRole("button", { name: "studio.openWorkArea" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Close work area" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "studio.openWorkArea" }),
		).toHaveFocus(),
	);
});

test("mobile opener uses the top-corner target and selects the Work area tab", async () => {
	vi.stubGlobal("innerWidth", 360);
	const observations: ResizeObserverCallback[] = [];
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: ResizeObserverCallback) {
				observations.push(callback);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	const user = userEvent.setup();
	render(<WorkspaceOpenHarness />);
	act(() => {
		observations[0]?.(
			[{ contentRect: { width: 360 } } as ResizeObserverEntry],
			{} as ResizeObserver,
		);
	});
	const opener = await screen.findByRole("button", {
		name: "studio.openWorkArea",
	});
	expect(opener).toHaveClass("min-h-11", "min-w-11", "top-1");
	await user.click(opener);
	await waitFor(() =>
		expect(
			screen.getByRole("tab", { name: "studio.workArea" }),
		).toHaveAttribute("aria-selected", "true"),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("tabpanel", { name: "studio.workArea" }),
		).toHaveFocus(),
	);
});

function WorkspaceComposerAction() {
	const open = useContext(ConversationWorkspaceActionsContext);
	return (
		<button type="button" onClick={() => open?.()}>
			Conversation action
		</button>
	);
}

test("opening Workspace from the composer reactivates an already-open narrow pane", async () => {
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
	const user = userEvent.setup();
	render(<WorkspaceOpenHarness />);
	act(() =>
		callbacks[0]?.(
			[{ contentRect: { width: 360 } } as ResizeObserverEntry],
			{} as ResizeObserver,
		),
	);
	await user.click(
		screen.getByRole("button", { name: "Conversation action" }),
	);
	await user.click(screen.getByRole("tab", { name: "studio.chat" }));
	await user.click(
		screen.getByRole("button", { name: "Conversation action" }),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("tab", { name: "studio.workArea" }),
		).toHaveAttribute("aria-selected", "true"),
	);
	expect(
		screen.getByRole("tabpanel", { name: "studio.workArea" }),
	).toBeVisible();
});
