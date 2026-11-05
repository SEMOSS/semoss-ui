import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { CopyPlus, DownloadIcon } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionsMenu, type ActionsMenuItem } from "./actions-menu";

afterEach(cleanup);

/** jsdom has no PointerEvent; this one carries the pointerType the menu reads */
class TestPointerEvent extends MouseEvent {
	readonly pointerType: string;

	constructor(type: string, init: PointerEventInit = {}) {
		super(type, init);
		this.pointerType = init.pointerType ?? "";
	}
}

/** A Clone action that does nothing when chosen */
const cloneItem = (): ActionsMenuItem => ({
	id: "clone",
	label: "Clone",
	icon: CopyPlus,
	onSelect: vi.fn(),
});

/** Opens the menu from the keyboard, the way a keyboard user would */
const openMenu = () => {
	const trigger = screen.getByRole("button", { name: /Actions/ });
	act(() => trigger.focus());
	fireEvent.keyDown(trigger, { key: "ArrowDown" });
	return trigger;
};

describe("ActionsMenu", () => {
	it("is not shown when the viewer has no actions", () => {
		render(<ActionsMenu items={[]} testIdPrefix="test-actions" />);

		expect(
			screen.queryByRole("button", { name: "Actions" }),
		).not.toBeInTheDocument();
	});

	it("lists the actions and runs the one chosen", async () => {
		const onClone = vi.fn();
		render(
			<ActionsMenu
				items={[
					{
						id: "clone",
						label: "Clone",
						icon: CopyPlus,
						onSelect: onClone,
					},
					{
						id: "export",
						label: "Export",
						icon: DownloadIcon,
						onSelect: vi.fn(),
					},
				]}
				testIdPrefix="test-actions"
			/>,
		);

		openMenu();
		const clone = await screen.findByRole("menuitem", { name: "Clone" });
		expect(
			screen.getByRole("menuitem", { name: "Export" }),
		).toBeInTheDocument();
		fireEvent.keyDown(clone, { key: "Enter" });

		await waitFor(() => expect(onClone).toHaveBeenCalledTimes(1));
	});

	it("disables an action while it runs and shows its busy name", async () => {
		render(
			<ActionsMenu
				items={[
					{
						id: "export",
						label: "Export",
						icon: DownloadIcon,
						isBusy: true,
						busyLabel: "Exporting...",
						onSelect: vi.fn(),
					},
				]}
				testIdPrefix="test-actions"
			/>,
		);

		openMenu();
		expect(
			await screen.findByRole("menuitem", { name: "Exporting..." }),
		).toHaveAttribute("aria-disabled", "true");
	});

	it("moves focus into a menu a key opened", async () => {
		render(
			<ActionsMenu items={[cloneItem()]} testIdPrefix="test-actions" />,
		);

		openMenu();
		const menu = await screen.findByRole("menu");

		await waitFor(() =>
			expect(menu.contains(document.activeElement)).toBe(true),
		);
	});

	describe("on hover", () => {
		beforeEach(() => vi.stubGlobal("PointerEvent", TestPointerEvent));

		afterEach(() => vi.unstubAllGlobals());

		it("opens and leaves focus where it is", async () => {
			render(
				<>
					<input aria-label="Search" />
					<ActionsMenu
						items={[cloneItem()]}
						testIdPrefix="test-actions"
					/>
				</>,
			);
			const search = screen.getByRole("textbox", { name: "Search" });
			act(() => search.focus());

			fireEvent.pointerEnter(
				screen.getByRole("button", { name: /Actions/ }),
				{ pointerType: "mouse" },
			);

			expect(
				await screen.findByRole("menuitem", { name: "Clone" }),
			).toBeInTheDocument();
			expect(search).toHaveFocus();
		});

		it("stays open when the trigger is clicked", async () => {
			render(
				<ActionsMenu
					items={[cloneItem()]}
					testIdPrefix="test-actions"
				/>,
			);
			const trigger = screen.getByRole("button", { name: /Actions/ });

			fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
			await screen.findByRole("menuitem", { name: "Clone" });
			// the menu starts listening for pointer downs outside it after a tick
			await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
			fireEvent.pointerDown(trigger, { pointerType: "mouse", button: 0 });
			fireEvent.pointerUp(trigger, { pointerType: "mouse", button: 0 });
			fireEvent.click(trigger);

			expect(
				screen.getByRole("menuitem", { name: "Clone" }),
			).toBeInTheDocument();
		});
	});
});
