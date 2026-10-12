import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it } from "vitest";
import { TopicPage } from "@/pages/topic.page";
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
import { TopicEditor } from "./topic-editor";

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
			{ path: "/work/all", Component: WorkPage },
			{ path: "/work/done", Component: WorkPage },
			{ path: "/brain", Component: BrainReview },
			{ path: "/brain/memory", Component: BrainMemory },
			{ path: "/topics/:topicId", Component: TopicPage },
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

afterEach(cleanup);

describe("collaboration Work and Brain integration", () => {
	it("carries Work topic confirmation into Brain's learned links and the assistant snapshot", async () => {
		const user = userEvent.setup();
		const router = renderSession("/work/all");
		expect(
			submittedContext().topics.map((topic) => topic.id),
		).not.toContain("t-trip");
		await user.click(
			screen.getByRole("button", {
				name: "Confirm Northwind onsite for Agent architecture at our Oct 15 eng review?",
			}),
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
		const router = renderSession("/work/all");
		const title = "Confirm Oct 15 architecture review slot with Ava";
		await user.click(
			within(articleFor(title)).getByRole("button", {
				name: "Done",
			}),
		);
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
		await act(() => router.navigate("/work/done"));
		expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
		await user.click(
			within(articleFor(title)).getByRole("button", {
				name: "Move back",
			}),
		);
		await act(() => router.navigate("/work/all"));
		expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
	});

	it("clears an item with No response needed and keeps it out of Done", async () => {
		const user = userEvent.setup();
		const router = renderSession("/work/all");
		const title = "Confirm Oct 15 architecture review slot with Ava";
		await user.click(
			within(articleFor(title)).getByRole("button", {
				name: "No response needed",
			}),
		);
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
		await act(() => router.navigate("/work/done"));
		expect(
			screen.queryByRole("link", { name: title }),
		).not.toBeInTheDocument();
	});

	it("ignores a thread from its card and resumes it from the thread page", async () => {
		const user = userEvent.setup();
		const state = createInitialCollaborationState();
		const title = "Confirm Oct 15 architecture review slot with Ava";
		const threadId = state.items.find(
			(item) => item.title === title,
		)?.threadId;
		if (!threadId) throw new Error("Missing thread");
		const router = renderSession("/work/all", state);
		await user.click(
			within(articleFor(title)).getByRole("button", {
				name: "Ignore thread",
			}),
		);
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
		await act(() => router.navigate("/work/all"));
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

	it("preserves a topic memory draft when notes collapse and adds it about the topic", async () => {
		const user = userEvent.setup();
		renderSession("/topics/t-geng");
		expect(
			screen.getByText(
				"Ava prefers a written pre-read 48h before any review.",
			),
		).toBeInTheDocument();
		const note = screen.getByLabelText("New note");
		await user.type(note, "Hugo owns the demo environment.");
		const notesTrigger = screen.getByRole("button", {
			name: "Notes for the assistant",
		});
		await user.click(notesTrigger);
		expect(
			screen.queryByRole("textbox", { name: "New note" }),
		).not.toBeInTheDocument();
		await user.click(notesTrigger);
		expect(screen.getByRole("textbox", { name: "New note" })).toHaveValue(
			"Hugo owns the demo environment.",
		);
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
		await act(() => router.navigate("/topics/t-gsales"));
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

	it("updates a topic goal and keeps it completed while switching workspace views", async () => {
		const user = userEvent.setup();
		renderSession("/topics/t-geng");
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
		await user.click(screen.getByRole("tab", { name: "Threads" }));
		await user.click(screen.getByRole("tab", { name: "Actions" }));
		expect(screen.getByRole("checkbox", { name: title })).toBeChecked();
		expect(screen.getByText(title)).not.toHaveClass("line-through");
	});

	it("adds goals, keywords, and people through the compact topic controls", async () => {
		const user = userEvent.setup();
		const state = createInitialCollaborationState();
		const topic = state.topics.find(
			(candidate) => candidate.id === "t-geng",
		);
		if (!topic) throw new Error("Missing sample topic");
		topic.goals = [];
		topic.keywords = [];
		topic.people = [];
		state.memories = [];
		renderSession("/topics/t-geng", state);
		expect(
			screen.queryByRole("textbox", { name: "New goal" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("textbox", { name: "Add keyword" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("combobox", { name: "Add someone" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("textbox", { name: "New note" }),
		).not.toBeInTheDocument();

		const goalTrigger = screen.getByRole("button", { name: "Add goal" });
		await user.click(goalTrigger);
		const goal = screen.getByLabelText("New goal");
		await user.type(goal, "Share the architecture review.");
		const goalForm = goal.closest("form");
		if (!goalForm) throw new Error("Missing goal form");
		await user.click(
			within(goalForm).getByRole("button", { name: "Add goal" }),
		);
		expect(
			screen.getByRole("checkbox", {
				name: "Share the architecture review.",
			}),
		).not.toBeChecked();

		await user.click(screen.getByRole("button", { name: "Add keyword" }));
		const keyword = screen.getByRole("textbox", { name: "Add keyword" });
		await user.type(keyword, "architecture update");
		const keywordForm = keyword.closest("form");
		if (!keywordForm) throw new Error("Missing keyword form");
		await user.click(
			within(keywordForm).getByRole("button", { name: "Add" }),
		);
		await user.keyboard("{Escape}");
		await user.click(
			screen.getByRole("button", {
				name: "Remove keyword architecture update",
			}),
		);
		expect(
			screen.queryByText("architecture update"),
		).not.toBeInTheDocument();

		const peopleTrigger = screen.getByRole("button", {
			name: "Add people",
		});
		await user.click(peopleTrigger);
		act(() =>
			screen.getByRole("combobox", { name: "Add someone" }).focus(),
		);
		await user.keyboard("{Enter}");
		await waitFor(() =>
			expect(
				screen.getByRole("option", { name: "Ava Reed" }),
			).toHaveFocus(),
		);
		await user.keyboard("{Enter}");
		await user.click(screen.getByRole("button", { name: "Add person" }));
		await user.keyboard("{Escape}");
		expect(
			within(sectionFor("In this topic")).getByRole("link", {
				name: "Ava Reed",
			}),
		).toBeInTheDocument();
		await waitFor(() => expect(peopleTrigger).toHaveFocus());
	});

	it("counts each active feed thread once and distinguishes open, waiting, and muted threads", async () => {
		const user = userEvent.setup();
		const state = createInitialCollaborationState();
		const item = state.items.find(
			(candidate) => candidate.threadId === "th-geng-review",
		);
		const mutedThread = state.threads.find(
			(candidate) => candidate.id === "th-hugo-chat",
		);
		if (!item || !mutedThread)
			throw new Error("Missing sample thread or item");
		mutedThread.muted = true;
		state.items.push(
			{ ...item, id: "second-review-action" },
			{ ...item, id: "muted-action", threadId: mutedThread.id },
		);
		renderSession("/topics/t-geng", state);
		await user.click(screen.getByRole("tab", { name: "Threads" }));
		expect(screen.getByText("2 in your feed")).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Open feed" }),
		).not.toBeInTheDocument();
		const openRow = screen
			.getByRole("link", {
				name: "Agent architecture at our Oct 15 eng review?",
			})
			.closest("li");
		const waitingRow = screen
			.getByRole("link", { name: "Sandbox access for pilot team" })
			.closest("li");
		const mutedRow = screen
			.getByRole("link", { name: mutedThread.subject })
			.closest("li");
		if (!openRow || !waitingRow || !mutedRow)
			throw new Error("Missing topic thread row");
		expect(within(openRow).getByText("For you")).toBeInTheDocument();
		expect(within(waitingRow).getByText("Waiting")).toBeInTheDocument();
		expect(
			within(waitingRow).queryByText("For you"),
		).not.toBeInTheDocument();
		expect(within(mutedRow).queryByText("For you")).not.toBeInTheDocument();
		expect(within(mutedRow).queryByText("Waiting")).not.toBeInTheDocument();
	});

	it("shows an unloaded participant's name without linking to a missing person", async () => {
		const user = userEvent.setup();
		const state = createInitialCollaborationState();
		const thread = state.threads.find(
			(candidate) => candidate.id === "th-geng-review",
		);
		if (!thread) throw new Error("Missing sample thread");
		thread.participants.unshift({
			personId: "unloaded-person",
			name: "Pending participant",
			role: "from",
			included: true,
		});
		renderSession("/topics/t-geng", state);
		await user.click(screen.getByRole("tab", { name: "Threads" }));
		const row = screen
			.getByRole("link", { name: thread.subject })
			.closest("li");
		if (!row) throw new Error("Missing topic thread row");
		expect(
			within(row).getByText("Pending participant"),
		).toBeInTheDocument();
		expect(
			within(row).queryByRole("link", { name: "Pending participant" }),
		).not.toBeInTheDocument();
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
		renderSession("/topics/t-geng");
		const trigger = screen.getByRole("button", { name: /: Edit topic$/ });
		await user.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "Edit topic" });
		await user.click(
			within(dialog).getByRole("button", { name: "Cancel" }),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
	});
});

/** Captures created IDs through actual topic navigation links. */
function TopicCreationFixture() {
	const { state } = useCollaborationSession();
	const returnFocusRef = useRef<HTMLButtonElement>(null);
	return (
		<>
			<button type="button" ref={returnFocusRef}>
				Create another topic
			</button>
			<TopicEditor
				onClose={() => undefined}
				returnFocusRef={returnFocusRef}
			/>
			<nav aria-label="Created topics">
				{state.topics
					.filter((topic) => !topic.isSample)
					.map((topic) => (
						<a
							key={topic.id}
							href={`/topics/${encodeURIComponent(topic.id)}`}
						>
							{topic.name}
						</a>
					))}
			</nav>
		</>
	);
}

describe("new topic form", () => {
	it("creates a navigable session topic when the optional existing ID is absent", async () => {
		const user = userEvent.setup();
		render(
			<CollaborationSessionProvider
				initialState={createInitialCollaborationState()}
			>
				<TopicCreationFixture />
			</CollaborationSessionProvider>,
		);
		const dialog = screen.getByRole("dialog", { name: "New topic" });
		await user.type(
			within(dialog).getByRole("textbox", {
				name: "Name (required)",
			}),
			"New initiative",
		);
		await user.type(
			within(dialog).getByRole("textbox", {
				name: "Short name (required)",
			}),
			"Initiative",
		);
		await user.click(
			within(dialog).getByRole("button", { name: "Create topic" }),
		);
		const link = within(
			screen.getByRole("navigation", {
				name: "Created topics",
				hidden: true,
			}),
		).getByText("New initiative");
		expect(link.getAttribute("href")).toMatch(/^\/topics\/local-topic-/);
	});
});
