import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePersonaInterview } from "./use-persona-interview";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));

const STEP = {
	id: "limits",
	kind: "choice",
	title: "What should your twin stay out of?",
	detail: "Add anything that is missing.",
	options: ["Hiring"],
	ordered: false,
};
const ASKING = {
	phase: "asking",
	step: STEP,
	progress: { answered: 2, of: 11 },
	learned: [],
	notes: [],
	wrapWait: "Looking for answers that do not add up",
};
const NEXT = {
	...ASKING,
	step: { ...STEP, id: "priorities", ordered: true },
};
const running = (step: string) => ({
	id: "job-1",
	status: "running",
	step,
	progress: 10,
});

/** What the server answers, in order; an Error is a refusal, and the last answer repeats. */
let answers: unknown[];
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

beforeEach(() => {
	answers = [{ phase: "none" }];
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async () => {
		const answer = answers.length > 1 ? answers.shift() : answers[0];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
});
afterEach(() => {
	vi.useRealTimers();
});

it("opens on where the interview is, and on the steps it left out when asked to go on", async () => {
	const { result, unmount } = renderHook(() => usePersonaInterview(false));
	expect(result.current.view).toEqual({ phase: "loading" });
	await waitFor(() => expect(result.current.view).toEqual({ phase: "none" }));
	expect(ran()).toEqual(["WorkTwinPersonaInterview();"]);
	unmount();

	answers = [ASKING];
	const more = renderHook(() => usePersonaInterview(true));
	await waitFor(() => expect(more.result.current.view.phase).toBe("asking"));
	expect(ran().at(-1)).toBe("WorkTwinPersonaInterview(wrap=[false]);");
});

it("says why the interview could not be opened, and opens it when asked again", async () => {
	answers = [new Error("No text model is set."), ASKING];
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("problem"));
	expect(result.current.error).toBe("No text model is set.");
	act(() => result.current.reload());
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));
	expect(result.current.error).toBe("");
});

it("follows the reading until it ends, then asks the first step", async () => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	answers = [{ phase: "none" }];
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("none"));

	answers = [
		{ phase: "reading", job: running("Reading mail you sent") },
		running("Reading your Teams messages"),
		{ ...running("done"), status: "done" },
		ASKING,
	];
	act(() => result.current.start(["mail", "teams"]));
	await waitFor(() =>
		expect(result.current.view).toMatchObject({
			phase: "reading",
			job: { step: "Reading mail you sent" },
		}),
	);
	await act(() => vi.advanceTimersByTimeAsync(2000));
	expect(result.current.view).toMatchObject({
		phase: "reading",
		job: { step: "Reading your Teams messages" },
	});
	await act(() => vi.advanceTimersByTimeAsync(2000));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));
	expect(ran().slice(1)).toEqual([
		'WorkTwinPersonaInterview(sources=["mail","teams"]);',
		'BrainGetJob(kind=["persona"], jobId=["job-1"]);',
		'BrainGetJob(kind=["persona"], jobId=["job-1"]);',
		"WorkTwinPersonaInterview();",
	]);
});

it("starts without reading when nothing is allowed", async () => {
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("none"));
	answers = [ASKING];
	act(() => result.current.start([]));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));
	expect(ran().at(-1)).toBe('WorkTwinPersonaInterview(sources=["none"]);');
});

it("waits with what the step said it would, then shows the next step", async () => {
	answers = [ASKING];
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));

	let finish = (_answer: unknown): void => undefined;
	insight.actions.run.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = (answer) =>
					resolve({
						pixelReturn: [
							{ output: answer, operationType: ["OPERATION"] },
						],
					});
			}),
	);
	act(() =>
		result.current.answer(
			{ stepId: "limits", picked: ["Hiring"] },
			"Writing replies you might send",
		),
	);
	expect(result.current.view).toMatchObject({
		phase: "thinking",
		line: "Writing replies you might send",
		back: { step: { id: "limits" } },
	});
	await act(async () => finish(NEXT));
	expect(result.current.view).toMatchObject({
		phase: "asking",
		step: { id: "priorities" },
	});
	expect(ran().at(-1)).toBe(
		'WorkTwinPersonaInterview(answer=[{"stepId":"limits","picked":["Hiring"]}]);',
	);
});

it("goes back to the step that was answered when the answer does not get there", async () => {
	answers = [ASKING];
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));
	answers = [new Error("The server is restarting.")];
	act(() => result.current.answer({ stepId: "limits" }));
	await waitFor(() => expect(result.current.error).not.toBe(""));
	expect(result.current.error).toBe("The server is restarting.");
	expect(result.current.view).toMatchObject({
		phase: "asking",
		step: { id: "limits" },
	});
});

it("goes back a step, and stays on the step it was on when that does not get there", async () => {
	answers = [NEXT];
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));
	answers = [{ ...ASKING, previous: { picked: ["Hiring"], own: [] } }];
	act(() => result.current.back());
	await waitFor(() =>
		expect(result.current.view).toMatchObject({
			phase: "asking",
			step: { id: "limits" },
			previous: { picked: ["Hiring"], own: [] },
		}),
	);
	expect(ran().at(-1)).toBe("WorkTwinPersonaInterview(back=[true]);");

	answers = [new Error("The server is restarting.")];
	act(() => result.current.back());
	await waitFor(() =>
		expect(result.current.error).toBe("The server is restarting."),
	);
	expect(result.current.view).toMatchObject({
		phase: "asking",
		step: { id: "limits" },
	});
});

it("wraps up with the line the server gave for it, and says when the persona could not be written", async () => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	answers = [ASKING];
	const { result } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));

	answers = [
		{ phase: "writing", job: running("Writing your persona") },
		{
			...running("stopped"),
			status: "failed",
			error: "The model's answer could not be read. Try again.",
		},
	];
	act(() => result.current.wrapUp());
	expect(result.current.view).toMatchObject({
		phase: "thinking",
		line: "Looking for answers that do not add up",
	});
	await waitFor(() => expect(result.current.view.phase).toBe("writing"));
	expect(ran().at(-1)).toBe("WorkTwinPersonaInterview(wrap=[true]);");
	await act(() => vi.advanceTimersByTimeAsync(2000));
	await waitFor(() =>
		expect(result.current.view).toEqual({
			phase: "unwritten",
			reason: "The model's answer could not be read. Try again.",
		}),
	);
});

it("lets go of a call when the owner starts over or leaves", async () => {
	answers = [ASKING];
	const { result, unmount } = renderHook(() => usePersonaInterview(false));
	await waitFor(() => expect(result.current.view.phase).toBe("asking"));

	let finish = (): void => undefined;
	insight.actions.run.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = () =>
					resolve({
						pixelReturn: [
							{ output: NEXT, operationType: ["OPERATION"] },
						],
					});
			}),
	);
	act(() => result.current.answer({ stepId: "limits" }));
	act(() => result.current.startOver());
	expect(result.current.view).toEqual({ phase: "none" });
	// the answer that was on its way lands after that and changes nothing
	await act(async () => finish());
	expect(result.current.view).toEqual({ phase: "none" });
	unmount();
});
