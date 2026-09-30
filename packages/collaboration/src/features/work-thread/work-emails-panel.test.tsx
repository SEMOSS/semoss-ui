import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "@semoss/ui/next";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import { ThreadHistoryContext } from "@/features/collaboration/live/thread-history.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { WorkComposerSession } from "./work-composer-session";
import { WorkEmailContext } from "./work-email.context";
import { WorkEmailsPanel } from "./work-emails-panel";

function view(hasMore = false, nextCursor?: string, hasWorkspaceDraft = false) {
	const state = createInitialCollaborationState();
	const thread = {
		...state.threads[0],
		channel: "email" as const,
		source: { kind: "outlook" as const, nativeId: "old", folder: "inbox" },
	};
	const workspace = {
		...state.workspaces[thread.id],
		drafts: hasWorkspaceDraft
			? [
					{
						id: "remote",
						to: "reader@example.com",
						cc: "",
						subject: "Workspace draft",
						body: "Restored draft body",
						isSample: false,
					},
				]
			: [],
		messages: [
			{
				id: "new",
				at: "2026-09-30T12:00:00Z",
				fromId: "person",
				fromName: "New sender",
				subject: "Later email",
				text: "Newest plain text",
			},
			{
				id: "old",
				at: "2026-09-29T12:00:00Z",
				fromId: "person",
				fromName: "Old sender",
				to: ["reader@example.com", "second@example.com"],
				webLink: "https://outlook.office.com/mail/inbox/id/old",
				subject: "First email",
				text: "Searchable body",
				displayBody: {
					contentType: "html" as const,
					content: "<p>Needle in full formatted body</p>",
				},
			},
		],
	};
	state.threads[0] = thread;
	state.workspaces[thread.id] = workspace;
	const panelId = "test-emails";
	const composer = new WorkComposerSession();
	composer.requestEmailDraft(
		{
			id: "draft",
			mode: "new",
			subject: "Local draft",
			body: "Draft body",
		},
		false,
	);
	const load = vi.fn();
	const element = (
		<TooltipProvider>
			<CollaborationSessionProvider initialState={state}>
				<ThreadHistoryContext.Provider
					value={{
						pages: {
							[thread.id]: {
								isLoading: false,
								hasMore,
								nextCursor,
								unavailableCount: 0,
							},
						},
						load,
					}}
				>
					<WorkEmailContext.Provider
						value={{
							thread,
							workspace,
							composer,
							allowedSources: new Set(["new", "old"]),
							openEmail: vi.fn(),
						}}
					>
						<WorkbenchProvider
							store={createWorkbenchStore({ components: {} })}
						>
							<WorkEmailsPanel id={panelId} />
						</WorkbenchProvider>
					</WorkEmailContext.Provider>
				</ThreadHistoryContext.Provider>
			</CollaborationSessionProvider>
		</TooltipProvider>
	);
	const router = createMemoryRouter([{ path: "*", element }], {
		initialEntries: [`/work/thread/${thread.id}`],
	});
	const result = render(<RouterProvider router={router} />);
	return { ...result, load, thread, composer, router };
}

it("shows source emails in chronology and full read-only drafts in the same thread", () => {
	const { container } = view();
	const articles = [...container.querySelectorAll("article")];
	expect(articles.map((item) => item.dataset.searchItem)).toEqual([
		"old",
		"new",
		"draft:draft",
	]);
	expect(
		articles.every(
			(item) => item.parentElement === articles[0]?.parentElement,
		),
	).toBe(true);
	expect(
		screen.getAllByRole("button", { name: /^Collapse email:/ }),
	).toHaveLength(3);
	expect(
		screen.getAllByRole("heading", { name: "First email" }),
	).toHaveLength(1);
	expect(screen.getByTitle("Email from Old sender")).toHaveAttribute(
		"srcdoc",
		expect.stringContaining("Needle in full formatted body"),
	);
	expect(screen.getByTitle("Draft: Local draft")).toHaveAttribute(
		"srcdoc",
		expect.stringContaining("Draft body"),
	);
	expect(screen.queryByRole("region", { name: "Email drafts" })).toBeNull();
	expect(container.querySelector("[contenteditable=true]")).toBeNull();
});

it("finds formatted body text, reveals only the matching email, and expands all on request", async () => {
	const { container } = view();
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
	});
	expect(
		screen.getAllByRole("button", { name: /^Expand email:/ }),
	).toHaveLength(3);
	expect(screen.getByTitle("Email from Old sender")).not.toBeVisible();
	fireEvent.change(screen.getByRole("searchbox", { name: "Search emails" }), {
		target: { value: "needle" },
	});
	await act(async () => {
		fireEvent.click(
			screen.getByRole("button", { name: "Next match: Search emails" }),
		);
	});
	expect(
		container.querySelector("article[data-search-item=old]"),
	).toHaveAttribute("data-search-current", "true");
	expect(screen.getByTitle("Email from Old sender")).toBeVisible();
	expect(
		screen.getByText("Recipients").closest("details"),
	).not.toHaveAttribute("open");
	expect(
		screen.getByRole("button", { name: "Collapse email: First email" }),
	).toHaveAttribute("aria-expanded", "true");
	expect(
		screen.getAllByRole("button", { name: /^Expand email:/ }),
	).toHaveLength(2);
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
	});
	expect(
		screen.getAllByRole("button", { name: /^Collapse email:/ }),
	).toHaveLength(3);
});

it("keeps tools inline and usable while collapsed, with keyboard disclosure and mounted reader state", async () => {
	const user = userEvent.setup();
	const { composer } = view();
	const frame = screen.getByTitle("Email from Old sender");
	const collapse = screen.getByRole("button", {
		name: "Collapse email: First email",
	});
	const actions = collapse.closest<HTMLElement>('[role="group"]');
	expect(actions).not.toBeNull();
	if (!actions) throw new Error("Missing email action group");
	expect(
		within(actions).getByRole("button", { name: "Reply" }),
	).toBeVisible();
	await user.hover(within(actions).getByRole("button", { name: "Reply" }));
	expect(await screen.findByRole("tooltip", { name: "Reply" })).toBeVisible();
	const recipients = screen.getByText("Recipients").closest("details");
	if (!recipients) throw new Error("Missing recipient disclosure");
	recipients.open = true;
	await user.click(collapse);
	expect(collapse).toHaveAttribute("aria-expanded", "false");
	expect(frame).toBeInTheDocument();
	expect(frame).not.toBeVisible();
	expect(recipients).not.toBeVisible();
	expect(
		within(actions).getByRole("link", { name: "Open in Outlook" }),
	).toBeVisible();
	await user.keyboard("{Enter}");
	expect(collapse).toHaveAttribute("aria-expanded", "true");
	expect(screen.getByTitle("Email from Old sender")).toBe(frame);
	expect(recipients.open).toBe(true);
	await user.click(collapse);
	await user.click(within(actions).getByRole("button", { name: "Reply" }));
	expect(composer.getSnapshot().emailRequest).toEqual({ id: "reply:old" });
	expect(collapse).toHaveAttribute("aria-expanded", "false");
	await user.click(
		within(actions).getByRole("button", { name: "Forward email" }),
	);
	expect(composer.getSnapshot().emailRequest).toEqual({ id: "forward:old" });
});

it("sorts emails without resetting disclosure, draft state, or formatted-body search", async () => {
	const { container, composer } = view();
	const frame = screen.getByTitle("Email from Old sender");
	const draft = composer.getSnapshot().emailDrafts[0];
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
		fireEvent.keyDown(
			screen.getByRole("button", { name: "Sort emails: Oldest first" }),
			{ key: "ArrowDown" },
		);
	});
	expect(
		screen.getByRole("menuitemradio", { name: "Oldest first" }),
	).toHaveAttribute("aria-checked", "true");
	await act(async () => {
		fireEvent.click(
			screen.getByRole("menuitemradio", { name: "Newest first" }),
		);
	});
	expect(
		[...container.querySelectorAll("article")].map(
			(item) => item.dataset.searchItem,
		),
	).toEqual(["new", "old", "draft:draft"]);
	expect(screen.getByTitle("Email from Old sender")).toBe(frame);
	expect(frame).not.toBeVisible();
	expect(
		screen.getByRole("button", { name: "Expand email: Local draft" }),
	).toBeVisible();
	expect(composer.getSnapshot().emailDrafts[0]).toBe(draft);
	await act(async () => {
		fireEvent.change(screen.getByRole("searchbox"), {
			target: { value: "needle" },
		});
	});
	await act(async () => {
		fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
	});
	expect(frame).toBeVisible();
	expect(
		container.querySelector("article[data-search-item=old]"),
	).toHaveAttribute("data-search-current", "true");
	await act(async () => {
		fireEvent.keyDown(
			screen.getByRole("button", { name: "Sort emails: Newest first" }),
			{ key: "ArrowDown" },
		);
	});
	await act(async () => {
		fireEvent.click(
			screen.getByRole("menuitemradio", { name: "Oldest first" }),
		);
	});
	expect(
		[...container.querySelectorAll("article")].map(
			(item) => item.dataset.searchItem,
		),
	).toEqual(["old", "new", "draft:draft"]);
	expect(screen.getByTitle("Email from Old sender")).toBe(frame);
	expect(frame).toBeVisible();
});

it("keeps only secondary actions in the email menu and returns keyboard focus on Escape", async () => {
	const user = userEvent.setup();
	const { router, thread } = view();
	await user.click(
		screen.getByRole("button", { name: "Collapse email: First email" }),
	);
	const more = screen.getByRole("button", {
		name: "More email actions: First email",
	});
	await act(async () => more.focus());
	await user.keyboard("{Enter}");
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual([
		"Ask assistant",
		"Draft reply",
		"Delete email",
		"Copy email link",
	]);
	await user.keyboard("{Escape}");
	expect(more).toHaveFocus();
	await user.keyboard("{Enter}");
	await user.click(screen.getByRole("menuitem", { name: "Draft reply" }));
	expect(router.state.location.state.threadAction).toMatchObject({
		threadId: thread.id,
		action: "draft",
		sourceMessageId: "old",
	});
	expect(
		screen.getByRole("button", { name: "Expand email: First email" }),
	).toBeVisible();
});

it("copies only the selected email link and hides copying when no link exists", async () => {
	const user = userEvent.setup();
	view();
	await user.click(
		screen.getByRole("button", { name: "More email actions: First email" }),
	);
	await user.click(screen.getByRole("menuitem", { name: "Copy email link" }));
	expect(await navigator.clipboard.readText()).toBe(
		"https://outlook.office.com/mail/inbox/id/old",
	);
	await user.click(
		screen.getByRole("button", { name: "More email actions: Later email" }),
	);
	expect(
		screen.queryByRole("menuitem", { name: "Copy email link" }),
	).toBeNull();
});

it("adds arriving drafts without resetting collapsed emails and opens the separate retained editor", async () => {
	const { composer } = view();
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
	});
	act(() => {
		composer.requestEmailDraft(
			{
				id: "incoming",
				mode: "new",
				subject: "Incoming draft",
				body: "Initial response",
			},
			false,
		);
	});
	expect(
		screen.getByRole("button", { name: "Expand email: First email" }),
	).toHaveAttribute("aria-expanded", "false");
	expect(screen.getByTitle("Draft: Incoming draft")).toBeVisible();
	expect(screen.queryByRole("textbox")).toBeNull();
	const draft = composer
		.getSnapshot()
		.emailDrafts.find((item) => item.seed.id === "incoming");
	if (!draft) throw new Error("Missing arriving draft");
	act(() => draft.replaceBody("<p>Revised searchable draft</p>"));
	await act(async () => {
		fireEvent.click(
			screen.getByRole("button", {
				name: "Collapse email: Incoming draft",
			}),
		);
	});
	fireEvent.change(screen.getByRole("searchbox"), {
		target: { value: "revised searchable" },
	});
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Next match: Search emails" }),
		).toBeEnabled(),
	);
	await act(async () => {
		fireEvent.click(
			screen.getByRole("button", { name: "Next match: Search emails" }),
		);
	});
	expect(screen.getByTitle("Draft: Incoming draft")).toBeVisible();
	expect(screen.getByTitle("Draft: Incoming draft")).toHaveAttribute(
		"srcdoc",
		expect.stringContaining("Revised searchable draft"),
	);
	await act(async () => {
		fireEvent.click(
			screen.getByRole("button", { name: "Open draft: Incoming draft" }),
		);
	});
	expect(composer.getSnapshot().emailRequest).toEqual({ id: "incoming" });
	expect(
		composer
			.getSnapshot()
			.emailDrafts.find((item) => item.seed.id === "incoming"),
	).toBe(draft);
	expect(
		screen.getAllByRole("article", { name: "Email draft: Incoming draft" }),
	).toHaveLength(1);
});

it("shows restored workspace drafts and replaces their preview with the live editor exactly once", async () => {
	const { composer } = view(false, undefined, true);
	expect(screen.getByTitle("Draft: Workspace draft")).toHaveAttribute(
		"srcdoc",
		expect.stringContaining("Restored draft body"),
	);
	await act(async () => {
		fireEvent.click(
			screen.getByRole("button", {
				name: "Collapse email: Workspace draft",
			}),
		);
	});
	await act(async () => {
		fireEvent.click(
			screen.getByRole("button", { name: "Open draft: Workspace draft" }),
		);
	});
	expect(composer.getSnapshot().emailRequest).toEqual({
		id: "workspace:remote",
	});
	expect(
		screen.getAllByRole("article", {
			name: "Email draft: Workspace draft",
		}),
	).toHaveLength(1);
	expect(
		screen.getByRole("button", { name: "Expand email: Workspace draft" }),
	).toHaveAttribute("aria-expanded", "false");
});

it("loads older emails only when requested and explains old-server limitations", () => {
	const { load, thread } = view(true, "older-page");
	expect(load).not.toHaveBeenCalled();
	expect(
		screen.getByRole("searchbox", { name: "Search loaded emails" }),
	).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Load older emails" }));
	expect(load).toHaveBeenCalledWith(thread.id, "older-page");
});

it("does not offer broken continuation on an older backend", () => {
	view(true);
	expect(
		screen.queryByRole("button", { name: "Load older emails" }),
	).toBeNull();
	expect(screen.getByText(/server does not support/)).toBeVisible();
});
