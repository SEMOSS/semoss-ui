import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
	toItem,
	WorkItems,
} from "@/features/collaboration/components/work-items-list";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { groupTopicWork } from "./use-topic-work";

/** A work item as WorkListMyWork returns it. */
const workItem = (id: string, extra: Record<string, unknown> = {}) => ({
	id,
	title: `Item ${id}`,
	state: "active",
	mine: true,
	openSteps: [],
	...extra,
});

const mineStep = { id: "m", text: "Draft the agenda", status: "open" };
const owedStep = {
	id: "o",
	text: "Send the policy",
	status: "open",
	kind: "waiting_on",
	assigneeId: "priya",
	assigneeName: "Shah, Priya",
};

/** Every case that splits the groups: only a next step, a next step and a handoff, someone else's item, one in review, and one with no steps. */
const rows = [
	workItem("next-only", { openSteps: [mineStep] }),
	workItem("both", { openSteps: [mineStep, owedStep] }),
	workItem("theirs", { mine: false, openSteps: [owedStep] }),
	workItem("review", { state: "proposed", openSteps: [mineStep] }),
	workItem("empty"),
];

const insight = vi.hoisted(() => ({
	rows: [] as Record<string, unknown>[],
	actions: {
		run: vi.fn(async (_statement: string) => ({
			pixelReturn: [
				{
					output: { selfId: "me", workItems: insight.rows },
					operationType: ["OPERATION"],
				},
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

beforeAll(() => {
	// JSDOM does not provide the pointer-capture APIs used by the shared Select.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

it("gives the same counts as the Work page's Next steps and Waiting tabs for the same items", async () => {
	insight.rows = rows;
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await screen.findByRole("list", { name: "Your work items" });

	const work = groupTopicWork(rows.map(toItem), [], "me");
	// not a vacuous match of two zeros
	expect(work.yours).toHaveLength(2);
	expect(work.waiting).toHaveLength(1);
	expect(
		screen.getByRole("tab", { name: `Next steps ${work.yours.length}` }),
	).toBeInTheDocument();
	expect(
		screen.getByRole("tab", { name: `Waiting ${work.waiting.length}` }),
	).toBeInTheDocument();
});
