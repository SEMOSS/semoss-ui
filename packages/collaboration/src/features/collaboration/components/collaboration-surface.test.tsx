import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, useRef } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CollaborationSidebarContext } from "./collaboration-sidebar.context";
import { CollaborationSidebarProvider } from "./collaboration-sidebar-provider";
import { CollaborationSurface } from "./collaboration-surface";

let isWide = false;
const listeners = new Set<() => void>();
beforeEach(() => {
	isWide = false;
	listeners.clear();
	vi.stubGlobal("matchMedia", () => ({
		get matches() {
			return isWide;
		},
		addEventListener: (_event: string, listener: () => void) =>
			listeners.add(listener),
		removeEventListener: (_event: string, listener: () => void) =>
			listeners.delete(listener),
	}));
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

function SidebarControl() {
	const context = useContext(CollaborationSidebarContext);
	const ref = useRef<HTMLButtonElement>(null);
	return context?.sidebar ? (
		<button
			ref={ref}
			type="button"
			onClick={() => context.sidebar?.open(ref.current)}
		>
			Open {context.sidebar.title}
		</button>
	) : null;
}

function SurfaceFixture({ title }: { title?: string }) {
	return (
		<CollaborationSidebarProvider>
			<SidebarControl />
			<main tabIndex={-1}>
				<CollaborationSurface
					asideTitle={title}
					aside={title ? <p>Current context</p> : undefined}
				>
					<p>Page contents</p>
				</CollaborationSurface>
			</main>
		</CollaborationSidebarProvider>
	);
}

function setup(title = "Brain overview") {
	const router = createMemoryRouter(
		[
			{ path: "/brain", element: <SurfaceFixture title={title} /> },
			{
				path: "/brain/people",
				element: <SurfaceFixture title="Person context" />,
			},
			{ path: "/brain/empty", element: <SurfaceFixture /> },
		],
		{ initialEntries: ["/brain"] },
	);
	render(<RouterProvider router={router} />);
	return { router, user: userEvent.setup() };
}

it.each(["Brain overview", "Person context", "Topic context"])(
	"opens and dismisses the %s sheet without navigation",
	async (title) => {
		const { user, router } = setup(title);
		const trigger = screen.getByRole("button", { name: `Open ${title}` });
		await user.click(trigger);
		const dialog = await screen.findByRole("dialog", { name: title });
		expect(dialog).toContainElement(document.activeElement as HTMLElement);
		expect(router.state.location.pathname).toBe("/brain");
		await user.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
	},
);

it("focuses the visible desktop sidebar without opening a sheet", async () => {
	isWide = true;
	const { user } = setup();
	await user.click(
		screen.getByRole("button", { name: "Open Brain overview" }),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("complementary", { name: "Brain overview" }),
		).toHaveFocus(),
	);
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("closes the sheet when switching to desktop and does not reopen on shrinking", async () => {
	const { user } = setup();
	await user.click(
		screen.getByRole("button", { name: "Open Brain overview" }),
	);
	await screen.findByRole("dialog");
	act(() => {
		isWide = true;
		for (const listener of listeners) listener();
	});
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
	expect(
		screen.getByRole("complementary", { name: "Brain overview" }),
	).toHaveFocus();
	act(() => {
		isWide = false;
		for (const listener of listeners) listener();
	});
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("clears registration and pending sheet state across navigation and Back", async () => {
	const { router, user } = setup();
	await user.click(
		screen.getByRole("button", { name: "Open Brain overview" }),
	);
	await screen.findByRole("dialog");
	await act(() => router.navigate("/brain/people"));
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Open Person context" }),
	).toBeVisible();
	await act(() => router.navigate("/brain/empty"));
	expect(
		screen.queryByRole("button", { name: /^Open / }),
	).not.toBeInTheDocument();
	await act(() => router.navigate(-2));
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
