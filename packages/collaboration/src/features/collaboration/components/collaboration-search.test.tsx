import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrainPage } from "@/pages/brain.page";
import {
	emptySearchSession,
	searchEntries,
	searchRecordFixture,
} from "../api/search.test-fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { CollaborationSearch } from "./collaboration-search";
import { SavedRecordBoundary } from "./saved-record-boundary";

const { run } = vi.hoisted(() => ({ run: vi.fn() }));
const actions = { run };
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions }),
}));

function response(output: unknown) {
	return { pixelReturn: [{ output, operationType: ["MAP"] }] };
}
function ThreadContent() {
	const { state } = useCollaborationSession();
	const thread = state.threads[0];
	return (
		<>
			<h1>{thread?.subject}</h1>
			<p>{thread?.source?.nativeId}</p>
			<p>{thread && state.workspaces[thread.id]?.goal}</p>
		</>
	);
}
function ThreadDestination() {
	const { threadId = "" } = useParams();
	return (
		<SavedRecordBoundary kind="thread" id={threadId}>
			<ThreadContent />
		</SavedRecordBoundary>
	);
}
function mount() {
	const router = createMemoryRouter([
		{ path: "/", Component: CollaborationSearch },
		{ path: "/brain/people/:personId", Component: BrainPage },
		{ path: "/brain/topics/:topicId", Component: BrainPage },
		{ path: "/work/thread/:threadId", Component: ThreadDestination },
	]);
	render(
		<CollaborationSessionProvider initialState={emptySearchSession()}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return router;
}
async function openSearch() {
	await userEvent.click(
		screen.getByRole("button", {
			name: "Search threads, people and topics",
		}),
	);
	return screen.getByRole("textbox", { name: "Search" });
}
beforeEach(() => {
	run.mockReset();
	run.mockImplementation(async (statement: string) => {
		if (statement.startsWith("BrainGetSearchRecord")) {
			const entry = searchEntries.find((row) =>
				statement.includes(JSON.stringify(row.id)),
			);
			if (!entry) throw new Error("Record not found");
			return response(searchRecordFixture(entry));
		}
		const offset = statement.includes("offset=[30]") ? 30 : 0;
		return response({
			items: searchEntries.slice(offset, offset + 30),
			total: searchEntries.length,
		});
	});
});
afterEach(cleanup);

describe("saved Collaboration search", () => {
	it.each(["topic", "person", "thread"] as const)(
		"opens an unloaded %s at its correct record",
		async (kind) => {
			const router = mount();
			await userEvent.type(await openSearch(), "  sEaRcHcAsE  ");
			const entry = searchEntries.find((row) => row.kind === kind);
			if (!entry) throw new Error("Missing fixture");
			const label = {
				topic: "Topic",
				person: "Person",
				thread: "Thread",
			}[kind];
			const result = await screen.findByRole("link", {
				name: `${entry.name} ${label}`,
			});
			expect(run).toHaveBeenCalledWith(
				expect.stringContaining('query=["searchcase"]'),
			);
			result.focus();
			await userEvent.keyboard("{Enter}");
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			await screen.findByRole("heading", { name: entry.name });
			expect(router.state.location.pathname).toBe(
				{
					topic: "/brain/topics/",
					person: "/brain/people/",
					thread: "/work/thread/",
				}[kind] + entry.id,
			);
			if (kind === "thread") {
				expect(
					screen.getByText("fixture-native-message"),
				).toBeInTheDocument();
				expect(
					screen.getByText("Saved search fixture goal"),
				).toBeInTheDocument();
			}
		},
	);

	it("retrieves matches after the first 30", async () => {
		mount();
		await userEvent.type(await openSearch(), "SearchCase");
		await screen.findByText("30 of 45 matching items");
		expect(screen.getAllByRole("link")).toHaveLength(30);
		await userEvent.click(
			screen.getByRole("button", { name: "Load more" }),
		);
		await screen.findByText("45 of 45 matching items");
		expect(screen.getAllByRole("link")).toHaveLength(45);
		expect(
			screen.getByRole("link", { name: "SearchCase 44 Thread" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Load more" }),
		).not.toBeInTheDocument();
	});

	it("distinguishes idle, loading, no results and recoverable errors", async () => {
		mount();
		const input = await openSearch();
		expect(
			screen.getByText("Enter a name or subject to search."),
		).toBeInTheDocument();
		expect(run).not.toHaveBeenCalled();
		run.mockResolvedValueOnce(response({ items: [], total: 0 }));
		fireEvent.change(input, { target: { value: "missing" } });
		expect(screen.getByText("Searching…")).toBeInTheDocument();
		await screen.findByText(/No matching items/);
		run.mockRejectedValueOnce(new Error("Offline fixture"));
		fireEvent.change(input, { target: { value: "searchcase" } });
		await screen.findByRole("alert");
		expect(screen.queryByText(/No matching items/)).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		await screen.findByText("30 of 45 matching items");
	});

	it("retains the first page when loading more fails, then retries the same offset", async () => {
		mount();
		await userEvent.type(await openSearch(), "searchcase");
		await screen.findByText("30 of 45 matching items");
		run.mockRejectedValueOnce(new Error("Second page failed"));
		await userEvent.click(
			screen.getByRole("button", { name: "Load more" }),
		);
		await screen.findByRole("alert");
		expect(screen.getAllByRole("link")).toHaveLength(30);
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		await screen.findByText("45 of 45 matching items");
		expect(
			run.mock.calls
				.slice(-2)
				.every(([stmt]) => stmt.includes("offset=[30]")),
		).toBe(true);
	});

	it("discards old responses after the query changes", async () => {
		let resolveOld: (value: unknown) => void = () => {};
		run.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveOld = resolve;
				}),
		);
		mount();
		const input = await openSearch();
		fireEvent.change(input, { target: { value: "old" } });
		await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
		fireEvent.change(input, { target: { value: "new" } });
		await screen.findByText("30 of 45 matching items");
		resolveOld(
			response({
				items: [{ kind: "person", id: "old", name: "Stale result" }],
				total: 1,
			}),
		);
		await waitFor(() =>
			expect(screen.queryByText("Stale result")).not.toBeInTheDocument(),
		);
		expect(screen.getAllByRole("link")).toHaveLength(30);
	});

	it("supports both shortcuts, focuses input, and restores trigger focus on Escape", async () => {
		mount();
		const trigger = screen.getByRole("button", {
			name: "Search threads, people and topics",
		});
		fireEvent.keyDown(window, { key: "K", ctrlKey: true });
		const input = await screen.findByRole("textbox", { name: "Search" });
		await waitFor(() => expect(input).toHaveFocus());
		fireEvent.keyDown(window, { key: "k", metaKey: true });
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(input).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
		await openSearch();
		await userEvent.type(
			screen.getByRole("textbox", { name: "Search" }),
			"searchcase",
		);
		await screen.findByText("30 of 45 matching items");
		await userEvent.tab();
		expect(screen.getAllByRole("link")[0]).toHaveFocus();
	});

	it("shows record loading and retry when navigation detail fails", async () => {
		mount();
		await userEvent.type(await openSearch(), "searchcase");
		const result = await screen.findByRole("link", {
			name: "SearchCase 01 Person",
		});
		run.mockRejectedValueOnce(new Error("Record unavailable"));
		await userEvent.click(result);
		await screen.findByRole("alert");
		expect(
			screen.queryByRole("heading", { name: "SearchCase 01" }),
		).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		await screen.findByRole("heading", { name: "SearchCase 01" });
	});
});
