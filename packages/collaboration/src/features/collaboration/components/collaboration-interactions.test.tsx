import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAttentionItems } from "@/features/attention/attention.model";
import { WorkPage } from "@/pages/work.page";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { selectThreadContext } from "../state/collaboration.selectors";
import type {
	CollaborationCommand,
	ThreadContext,
} from "../state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { BrainMemory } from "./brain-memory";
import { BrainReview } from "./brain-review";
import { BrainThread } from "./brain-thread";
import { CollaborationSearch } from "./collaboration-search";
import { PersonDetail } from "./person-detail";
import { ProfileForm } from "./profile-form";
import { RulesEditor } from "./rules-editor";
import { TopicDetail } from "./topic-detail";

const insightActions = vi.hoisted(() => ({
	run: vi.fn(() => {
		throw new Error("Sample integration must not read backend records");
	}),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: insightActions }),
}));
vi.mock("@/features/attention/attention.context", () => ({
	useAttention: () => {
		const { state } = useCollaborationSession();
		return {
			items: buildAttentionItems(state, {
				runs: [],
				delegations: [],
				roomSource: () => undefined,
			}),
			isLoading: false,
			isComplete: true,
			errors: [],
			refresh: vi.fn(),
			setPriority: vi.fn(),
		};
	},
}));

/** Observe only the context submitted to the assistant, alongside real route controls. */
function ContextObserver() {
	const { state } = useCollaborationSession();
	return (
		<output aria-label="Assistant context snapshot">
			{JSON.stringify(selectThreadContext(state, "th-geng-review"))}
		</output>
	);
}

/** Apply a separate state update while a form has unsaved fields. */
function SessionUpdateControl({ command }: { command: CollaborationCommand }) {
	const { dispatch } = useCollaborationSession();
	return (
		<button type="button" onClick={() => dispatch(command)}>
			Apply session update
		</button>
	);
}

function ProfileFixture() {
	const { state } = useCollaborationSession();
	return <ProfileForm profile={state.profile} target="sample" />;
}

function renderSession(
	path: string,
	initialState = createInitialCollaborationState(),
	update?: CollaborationCommand,
) {
	const router = createMemoryRouter(
		[
			{ path: "/tasks/topic/:topicId", Component: WorkPage },
			{ path: "/tasks/done", Component: WorkPage },
			{ path: "/work/topic/:topicId", Component: WorkPage },
			{ path: "/brain", Component: BrainReview },
			{ path: "/brain/memory", Component: BrainMemory },
			{ path: "/brain/topics/:topicId", Component: TopicDetail },
			{ path: "/brain/threads/:threadId", Component: BrainThread },
			{ path: "/brain/people/:personId", Component: PersonDetail },
			{ path: "/rules", Component: RulesEditor },
			{ path: "/search", Component: CollaborationSearch },
			{ path: "/profile", Component: ProfileFixture },
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider initialState={initialState}>
			<RouterProvider router={router} />
			<ContextObserver />
			{update && <SessionUpdateControl command={update} />}
		</CollaborationSessionProvider>,
	);
	return router;
}

function submittedContext(): ThreadContext {
	return JSON.parse(
		screen.getByLabelText("Assistant context snapshot").textContent ??
			"null",
	) as ThreadContext;
}

function articleFor(text: string): HTMLElement {
	const article = screen.getByText(text, {}).closest("article");
	if (!article) throw new Error(`No article for ${text}`);
	return article;
}

function sectionFor(heading: string): HTMLElement {
	const section = screen
		.getByRole("heading", { name: heading })
		.closest("section");
	if (!section) throw new Error(`No section for ${heading}`);
	return section;
}

afterEach(() => {
	expect(insightActions.run).not.toHaveBeenCalled();
	cleanup();
	vi.clearAllMocks();
});

describe("collaboration Work and Brain integration", () => {
	it("carries topic source confirmation from Context into Brain learned links and the assistant snapshot", async () => {
		const user = userEvent.setup();
		const router = renderSession("/tasks/topic/t-geng");
		expect(
			submittedContext().topics.map((topic) => topic.id),
		).not.toContain("t-trip");
		await user.click(screen.getByRole("tab", { name: "Context" }));
		await user.click(
			screen.getByRole("button", {
				name: "Thread actions for Agent architecture at our Oct 15 eng review?",
			}),
		);
		await user.click(screen.getByRole("button", { name: "View in Brain" }));
		const topics = sectionFor("Topics");
		await user.click(
			within(topics).getByRole("button", { name: "Confirm" }),
		);
		expect(submittedContext().topics.map((topic) => topic.id)).toContain(
			"t-trip",
		);
		await act(() => router.navigate("/brain"));
		await user.click(screen.getByRole("tab", { name: "Learned recently" }));
		const panel = screen.getByRole("tabpanel", {
			name: "Learned recently",
		});
		const rows = within(panel).getAllByRole("article");
		expect(
			rows.some(
				(row) =>
					row.textContent?.includes(
						"Agent architecture at our Oct 15 eng review?",
					) &&
					row.textContent.includes("Filed under Northwind onsite"),
			),
		).toBe(true);
	});

	it("shows completed Work items in Done and reopens the selected item", async () => {
		const user = userEvent.setup();
		const router = renderSession("/tasks/topic/t-geng");
		const title = "Confirm Oct 15 architecture review slot with Ava";
		const next = screen.getByRole("list", { name: "Next up" });
		await user.click(
			within(next).getByRole("checkbox", { name: `Complete ${title}` }),
		);
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Show completed tasks" }),
		);
		expect(
			within(screen.getByRole("list", { name: "Completed" })).getByRole(
				"checkbox",
				{ name: `Reopen ${title}` },
			),
		).toBeChecked();
		await act(() => router.navigate("/tasks/done"));
		expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
		await user.click(
			within(articleFor(title)).getByRole("button", {
				name: "Move back",
			}),
		);
		await act(() => router.navigate("/tasks/topic/t-geng"));
		expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
	});

	it("clears an item with No response needed and keeps it out of Done", async () => {
		const user = userEvent.setup();
		const router = renderSession("/tasks/topic/t-geng");
		const title = "Confirm Oct 15 architecture review slot with Ava";
		await user.click(
			screen.getByRole("button", { name: `Task actions for ${title}` }),
		);
		await user.click(
			screen.getByRole("menuitem", { name: "Dismiss task" }),
		);
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
		await act(() => router.navigate("/tasks/done"));
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
	});

	it("ignores a topic source thread from Context and resumes it from the thread page", async () => {
		const user = userEvent.setup();
		const state = createInitialCollaborationState();
		const title = "Confirm Oct 15 architecture review slot with Ava";
		const threadId = state.items.find(
			(item) => item.title === title,
		)?.threadId;
		if (!threadId) throw new Error("Missing thread");
		const router = renderSession("/tasks/topic/t-geng", state);
		const thread = state.threads.find(
			(candidate) => candidate.id === threadId,
		);
		if (!thread) throw new Error("Missing source thread");
		await user.click(screen.getByRole("tab", { name: "Context" }));
		await user.click(
			screen.getByRole("button", {
				name: `Thread actions for ${thread.subject}`,
			}),
		);
		await user.click(screen.getByRole("button", { name: "Ignore thread" }));
		await user.click(screen.getByRole("tab", { name: "Overview" }));
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
		await act(() =>
			router.navigate(`/brain/threads/${encodeURIComponent(threadId)}`),
		);
		const ignored = screen.getByRole("switch", {
			name: "Ignore this thread",
		});
		expect(ignored).toBeChecked();
		await user.click(ignored);
		await act(() => router.navigate("/tasks/topic/t-geng"));
		expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
	});

	it("keeps a suggested memory from review, which puts it in use", async () => {
		const user = userEvent.setup();
		const router = renderSession("/brain");
		const text =
			"Pilot scope is limited to 2 use cases (claims triage, contract Q&A).";
		const row = screen.getByRole("article", { name: `Memory: ${text}` });
		expect(
			within(row).getByText("Not used until you keep it"),
		).toBeInTheDocument();
		await user.click(
			within(row).getByRole("button", { name: `Keep memory: ${text}` }),
		);
		expect(
			screen.queryByRole("article", { name: `Memory: ${text}` }),
		).not.toBeInTheDocument();
		await act(() => router.navigate("/brain/memory"));
		const kept = screen.getByRole("article", { name: `Memory: ${text}` });
		expect(
			within(kept).queryByText("Not used until you keep it"),
		).not.toBeInTheDocument();
		expect(
			within(kept).getByText(/Suggested by Brain/),
		).toBeInTheDocument();
	});

	it("adds, edits, and removes a memory on the Memory page", async () => {
		const user = userEvent.setup();
		renderSession("/brain/memory");
		await user.type(
			screen.getByLabelText("New memory"),
			"Keep status emails to three bullets.",
		);
		await user.click(screen.getByRole("button", { name: "Add" }));
		const row = screen.getByRole("article", {
			name: "Memory: Keep status emails to three bullets.",
		});
		expect(within(row).getByText("Preference")).toBeInTheDocument();
		await user.click(
			within(row).getByRole("button", {
				name: "Edit memory: Keep status emails to three bullets.",
			}),
		);
		const field = within(row).getByLabelText("Memory");
		await user.clear(field);
		await user.type(field, "Keep status emails to two bullets.");
		await user.click(
			within(row).getByRole("button", { name: "Save memory" }),
		);
		const edited = screen.getByRole("article", {
			name: "Memory: Keep status emails to two bullets.",
		});
		await user.click(
			within(edited).getByRole("button", {
				name: "Remove memory: Keep status emails to two bullets.",
			}),
		);
		expect(
			screen.queryByText("Keep status emails to two bullets."),
		).not.toBeInTheDocument();
	});

	it("shows a topic's notes as memories and adds one about the topic", async () => {
		const user = userEvent.setup();
		renderSession("/brain/topics/t-geng");
		await user.click(screen.getByRole("tab", { name: /Goals and notes/ }));
		expect(
			screen.getByText(
				"Ava prefers a written pre-read 48h before any review.",
			),
		).toBeInTheDocument();
		const note = screen.getByLabelText("New note");
		await user.type(note, "Hugo owns the demo environment.");
		const form = note.closest("form");
		if (!form) throw new Error("Missing note form");
		await user.click(within(form).getByRole("button", { name: "Add" }));
		expect(
			screen.getByRole("article", {
				name: "Memory: Hugo owns the demo environment.",
			}),
		).toBeInTheDocument();
	});

	it("accepts a person in review and keeps topic and person membership screens consistent", async () => {
		const user = userEvent.setup();
		const router = renderSession("/brain");
		await user.click(
			within(
				articleFor("Add Gia Moreno to Northwind - Sales / GTM?"),
			).getByRole("button", { name: "Add person" }),
		);
		await act(() => router.navigate("/brain/topics/t-gsales"));
		await user.click(screen.getByRole("tab", { name: "People" }));
		const memberSection = sectionFor("In this topic");
		const personLink = within(memberSection).getByRole("link", {
			name: "Gia Moreno",
		});
		const row = personLink.parentElement?.parentElement;
		if (!row) throw new Error("Missing membership row");
		await user.click(within(row).getByRole("button", { name: "Remove" }));
		expect(
			within(sectionFor("Removed")).getByRole("link", {
				name: "Gia Moreno",
			}),
		).toBeInTheDocument();
		await act(() => router.navigate("/brain/people/p-gia"));
		expect(
			within(sectionFor("Topics")).queryByRole("link", {
				name: "Northwind Sales",
			}),
		).not.toBeInTheDocument();
	});

	it("updates a topic goal in Brain and shows its completed state in Work", async () => {
		const user = userEvent.setup();
		const router = renderSession("/brain/topics/t-geng");
		await user.click(screen.getByRole("tab", { name: "Goals and notes" }));
		const title =
			"Present agent architecture at Northwind eng review (Oct 15)";
		const checkbox = screen.getByRole("checkbox", { name: title });
		await user.click(checkbox);
		expect(checkbox).toBeChecked();
		expect(
			submittedContext().topics[0].goals.find(
				(goal) => goal.text === title,
			)?.status,
		).toBe("done");
		await act(() => router.navigate("/work/topic/t-geng"));
		expect(
			screen.getByText("Sandbox access for the pilot team"),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "2 more goals" }));
		expect(
			screen.getByText(title, { exact: false, selector: "p" }),
		).toHaveClass("line-through");
	});

	it("allows more than three topic links and retains one selected primary", async () => {
		const user = userEvent.setup();
		const state = createInitialCollaborationState();
		const thread = state.threads.find(
			(candidate) => candidate.id === "th-geng-review",
		);
		if (!thread) throw new Error("Missing sample thread");
		thread.topicLinks = state.topics.slice(0, 5).map((topic, index) => ({
			topicId: topic.id,
			source: "confirmed",
			primary: index === 0,
			confidence: 90,
		}));
		renderSession("/brain/threads/th-geng-review", state);
		const topics = sectionFor("Topics");
		expect(
			within(topics).getAllByRole("button", { name: /main topic/ }),
		).toHaveLength(5);
		act(() =>
			within(topics)
				.getByRole("combobox", { name: "Add a topic" })
				.focus(),
		);
		await user.keyboard("{Enter}");
		await waitFor(() =>
			expect(
				screen.getByRole("option", { name: "Budget" }),
			).toHaveFocus(),
		);
		await user.keyboard("{Enter}");
		await user.click(
			within(topics).getByRole("button", { name: "Add topic" }),
		);
		expect(
			within(topics).getAllByRole("button", { name: /main topic/ }),
		).toHaveLength(6);
		await user.click(
			within(topics).getByRole("button", {
				name: "Make Board the main topic",
			}),
		);
		expect(
			within(topics).getByRole("button", {
				name: "Board is the main topic",
			}),
		).toHaveAttribute("aria-pressed", "true");
		expect(
			within(topics).getAllByRole("button", {
				name: /main topic/,
				pressed: true,
			}),
		).toHaveLength(1);
		expect(submittedContext().topics[0].id).toBe("t-board");
		await user.click(
			within(topics).getByRole("button", {
				name: "Remove Board",
			}),
		);
		expect(
			within(topics).getAllByRole("button", {
				name: /main topic/,
				pressed: true,
			}),
		).toHaveLength(1);
		expect(
			within(topics).getAllByRole("button", { name: /main topic/ }),
		).toHaveLength(5);
	});

	it("reflects participant exclusions in the assistant snapshot immediately", async () => {
		const user = userEvent.setup();
		renderSession("/brain/threads/th-geng-review");
		expect(
			submittedContext().messages.some(
				(message) => message.fromId === "p-ben",
			),
		).toBe(true);
		await user.click(
			screen.getByRole("switch", {
				name: "Include Ben Carter in assistant context",
			}),
		);
		expect(
			submittedContext().messages.some(
				(message) => message.fromId === "p-ben",
			),
		).toBe(false);
		expect(
			screen.getByRole("switch", {
				name: "Include Ben Carter in assistant context",
			}),
		).not.toBeChecked();
	});

	it("removes a rule from the visible active rules list", async () => {
		const user = userEvent.setup();
		renderSession("/rules");
		const value = screen.getByText("benefits@contoso.example", {});
		const row = value.parentElement;
		if (!row) throw new Error("Missing rule row");
		await user.click(
			within(row).getByRole("button", {
				name: "Remove sender rule benefits@contoso.example",
			}),
		);
		expect(
			screen.queryByText("benefits@contoso.example", {}),
		).not.toBeInTheDocument();
	});

	it("refreshes pristine preferences after a session update while preserving unsaved fields", async () => {
		const user = userEvent.setup();
		renderSession("/rules", createInitialCollaborationState(), {
			type: "settings.save",
			changes: { fileAt: 85, askAt: 40 },
		});
		const fileAt = screen.getByRole("spinbutton", {
			name: "File automatically at (%)",
		});
		const askAt = screen.getByRole("spinbutton", { name: "Ask from (%)" });
		await user.clear(fileAt);
		await user.type(fileAt, "90");
		await user.clear(askAt);
		await user.type(askAt, "45");
		await user.click(
			screen.getByRole("button", { name: "Save preferences" }),
		);
		await user.clear(fileAt);
		await user.type(fileAt, "91");
		await user.click(
			screen.getByRole("button", { name: "Apply session update" }),
		);
		expect(fileAt).toHaveValue(91);
		expect(askAt).toHaveValue(40);
	});

	it("keeps an unsaved profile draft while a session update refreshes other fields", async () => {
		const user = userEvent.setup();
		renderSession("/profile", createInitialCollaborationState(), {
			type: "profile.save",
			target: "sample",
			changes: {
				role: { value: "Team lead", source: "you" },
				workingHours: "8:00 - 18:30 ET",
			},
		});
		const role = screen.getByRole("textbox", { name: "Role" });
		const workingHours = screen.getByRole("textbox", {
			name: "Working hours",
		});
		await user.clear(role);
		await user.type(role, "Engineering lead");
		await user.clear(workingHours);
		await user.type(workingHours, "9 to 5");
		await user.click(
			screen.getByRole("button", {
				name: "Save profile for this session",
			}),
		);
		await user.clear(role);
		await user.type(role, "Chief architect");
		await user.click(
			screen.getByRole("button", { name: "Apply session update" }),
		);
		expect(role).toHaveValue("Chief architect");
		expect(workingHours).toHaveValue("8:00 - 18:30 ET");
		expect(submittedContext().profile?.workingHours).toBe(
			"8:00 - 18:30 ET",
		);
	});

	it("searches loaded people and navigates without leaving its dialog open", async () => {
		const user = userEvent.setup();
		renderSession("/search");
		await user.click(
			screen.getByRole("button", {
				name: "Search your workspace",
			}),
		);
		const dialog = screen.getByRole("dialog", {
			name: "Search your workspace",
		});
		await user.type(
			within(dialog).getByRole("combobox", {
				name: "Search",
			}),
			"Ava",
		);
		const result = within(dialog).getByRole("option", {
			name: /Ava Reed/,
		});
		await user.click(result);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Ava Reed" }),
		).toBeInTheDocument();
	});

	it("returns focus to the search trigger when the dialog is dismissed", async () => {
		const user = userEvent.setup();
		renderSession("/search");
		const trigger = screen.getByRole("button", {
			name: "Search your workspace",
		});
		await user.click(trigger);
		await user.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("returns focus to the edit-topic action after cancelling its dialog", async () => {
		const user = userEvent.setup();
		renderSession("/brain/topics/t-geng");
		const trigger = screen.getByRole("button", { name: "Edit topic" });
		await user.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "Edit topic" });
		await user.click(
			within(dialog).getByRole("button", { name: "Cancel" }),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});
});

describe("edit topic form", () => {
	it("requires both names and saves edits under the existing topic identity", async () => {
		const user = userEvent.setup();
		const router = renderSession("/brain/topics/t-geng");
		const trigger = screen.getByRole("button", { name: "Edit topic" });
		await user.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "Edit topic" });
		const name = within(dialog).getByRole("textbox", {
			name: "Name (required)",
		});
		const short = within(dialog).getByRole("textbox", {
			name: "Short name (required)",
		});
		expect(name).toHaveValue("Northwind - Engineering partnership");
		expect(short).toHaveValue("Northwind Eng");
		await user.clear(name);
		await user.type(name, " ");
		await user.clear(short);
		await user.type(short, " ");
		await user.click(
			within(dialog).getByRole("button", { name: "Save topic" }),
		);
		await waitFor(() => expect(name).toHaveFocus());
		expect(name).toHaveAccessibleDescription("Name is required.");
		expect(short).toHaveAccessibleDescription("Short name is required.");
		await user.clear(name);
		await user.type(name, "Engineering initiative");
		await user.clear(short);
		await user.type(short, "Initiative");
		await user.click(
			within(dialog).getByRole("button", { name: "Save topic" }),
		);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Engineering initiative" }),
		).toBeVisible();
		expect(router.state.location.pathname).toBe("/brain/topics/t-geng");
		expect(submittedContext().topics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "t-geng",
					name: "Engineering initiative",
				}),
			]),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});
});
