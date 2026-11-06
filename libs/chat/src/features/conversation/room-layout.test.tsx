import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { RoomLayout } from "./room-layout";
import { RoomLayoutActionsContext } from "./room-layout-actions.context";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

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
		<RoomLayout isWorkbenchOpen workbench={panel}>
			{children}
		</RoomLayout>,
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
	draft.focus();
	editor.focus();
	rerender(
		<RoomLayout isWorkbenchOpen={false} workbench={panel}>
			{children}
		</RoomLayout>,
	);
	await waitFor(() => expect(draft).toHaveFocus());
	rerender(
		<RoomLayout isWorkbenchOpen workbench={panel}>
			{children}
		</RoomLayout>,
	);
	expect(screen.getByLabelText("Draft")).toBe(draft);
	expect(screen.getByLabelText("Editor")).toBe(editor);
	expect(draft).toHaveValue("Keep my draft");
	expect(editor).toHaveValue("Keep my edits");
});

/** A header control that opens the Workspace, and a close button inside it. */
function HeaderPlace({ onOpen }: { onOpen: () => void }) {
	const workspace = useContext(RoomLayoutActionsContext);
	return (
		<button
			type="button"
			aria-pressed={workspace?.isWorkbenchVisible ?? false}
			onClick={(event) => {
				onOpen();
				workspace?.revealWorkbench(event.currentTarget);
			}}
		>
			Files
		</button>
	);
}

function WorkspaceHeaderHarness() {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<RoomLayout
			isWorkbenchOpen={isOpen}
			header={<HeaderPlace onOpen={() => setIsOpen(true)} />}
			workbench={
				<button type="button" onClick={() => setIsOpen(false)}>
					Close Workspace
				</button>
			}
		>
			<input aria-label="Draft" />
		</RoomLayout>
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

test("closing the Workspace returns focus to the header control that opened it", async () => {
	stubWidth();
	const user = userEvent.setup();
	render(<WorkspaceHeaderHarness />);
	const place = screen.getByRole("button", { name: "Files" });
	await user.click(place);
	expect(place).toHaveAttribute("aria-pressed", "true");
	await user.click(screen.getByRole("button", { name: "Close Workspace" }));
	await waitFor(() => expect(place).toHaveFocus());
	expect(place).toHaveAttribute("aria-pressed", "false");
});

test("a header control brings an already-open Workspace forward from the narrow Chat tab", async () => {
	const resize = stubWidth();
	const user = userEvent.setup();
	render(<WorkspaceHeaderHarness />);
	resize(600);
	const place = screen.getByRole("button", { name: "Files" });
	await user.click(place);
	fireEvent.mouseDown(screen.getByRole("tab", { name: "studio.chat" }), {
		button: 0,
	});
	// on a narrow screen the open Workspace moves the header above both panes
	const narrowPlace = screen.getByRole("button", { name: "Files" });
	expect(narrowPlace).toHaveAttribute("aria-pressed", "false");
	await user.click(narrowPlace);
	await waitFor(() =>
		expect(
			screen.getByRole("tab", { name: "studio.workspace" }),
		).toHaveAttribute("aria-selected", "true"),
	);
	expect(
		screen.getByRole("tabpanel", { name: "studio.workspace" }),
	).toBeVisible();
	expect(narrowPlace).toHaveAttribute("aria-pressed", "true");
});

test("the divider between the panes shows the navigation's hover line, with no grip", () => {
	stubWidth();
	render(
		<RoomLayout isWorkbenchOpen workbench={<p>Work</p>}>
			<p>Chat</p>
		</RoomLayout>,
	);
	const divider = screen.getByRole("separator");
	expect(divider).toHaveClass("after:w-0.5", "hover:after:bg-sidebar-border");
	expect(divider).not.toHaveClass("bg-border");
	expect(divider).toBeEmptyDOMElement();
});

test("the Workspace opens as wide as its content, and fills once it has none to fit", () => {
	let observe: ((width: number) => void) | null = null;
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: ResizeObserverCallback) {
				observe = (width) =>
					callback(
						[{ contentRect: { width } } as ResizeObserverEntry],
						{} as ResizeObserver,
					);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	const panel = <div>Work</div>;
	const { rerender } = render(
		<RoomLayout isWorkbenchOpen workbenchFitWidth={350} workbench={panel}>
			<div>Chat</div>
		</RoomLayout>,
	);
	act(() => observe?.(1400));
	const workspacePane = screen.getByRole("region", {
		name: "studio.workspace",
	}).parentElement;
	// 350px of a 1400px row
	expect(Number(workspacePane?.style.flexGrow)).toBeCloseTo(25);

	rerender(
		<RoomLayout isWorkbenchOpen workbenchFitWidth={null} workbench={panel}>
			<div>Chat</div>
		</RoomLayout>,
	);
	expect(Number(workspacePane?.style.flexGrow)).toBeCloseTo(65);
});
