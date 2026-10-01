import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { TopicsStep } from "./onboarding-steps";

type Output = Record<string, unknown>;

function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	let reject: (reason: Error) => void = () => undefined;
	const promise = new Promise<T>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}

function suggestions(name = "Northwind Migration"): Output {
	return {
		topics: [
			{
				id: "topic-1",
				name,
				suggested: true,
				threadIds: ["thread-1", "thread-2"],
				memberIds: [],
				sampleSubjects: [],
			},
		],
	};
}

function session(generate: () => Promise<Output>) {
	const run = vi.fn(async (statement: string) => {
		let output: Output;
		if (statement === "BrainSuggestTopics();") {
			output = await generate();
		} else if (statement.startsWith("BrainListAccounts(")) {
			output = { items: [] };
		} else if (statement.startsWith("BrainSaveTopic(")) {
			output = { id: "topic-new" };
		} else if (statement.startsWith("BrainSetTopicPerson(")) {
			output = {};
		} else if (statement.startsWith("BrainClassifyThreads(")) {
			output = {
				id: "job-1",
				status: "running",
				params: { mode: "topics" },
			};
		} else {
			throw new Error(`Unexpected request: ${statement}`);
		}
		return { pixelReturn: [{ output, operationType: ["MAP"] }] };
	});
	return { actions: { run } as unknown as InsightActions, run };
}

function step(actions: InsightActions, onNext = vi.fn()) {
	return (
		<StrictMode>
			<TopicsStep
				actions={actions}
				onNext={onNext}
				onBack={vi.fn()}
				eyebrow="Step 7 of 8"
			/>
		</StrictMode>
	);
}

afterEach(cleanup);

describe("onboarding topics", () => {
	it("generates once in Strict Mode and lets the owner rename and keep the result", async () => {
		const request = deferred<Output>();
		const generate = vi
			.fn<() => Promise<Output>>()
			.mockReturnValueOnce(request.promise)
			.mockResolvedValue({ topics: [] });
		const { actions, run } = session(generate);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(actions, onNext));

		expect(generate).toHaveBeenCalledTimes(1);
		expect(
			screen.getByRole("button", { name: "Keep 0 topics" }),
		).toBeDisabled();
		await act(async () => request.resolve(suggestions()));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		expect(name).toHaveValue("Northwind Migration");
		expect(screen.queryByText(/No topics found/)).not.toBeInTheDocument();
		await user.clear(name);
		await user.type(name, "Northwind Rollout");
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(run).toHaveBeenCalledWith(
			'BrainSaveTopic(topic=[{"id":"topic-1","name":"Northwind Rollout","status":"active"}]);',
		);
		expect(run).toHaveBeenCalledWith(
			"BrainClassifyThreads(topics=[true], async=[true]);",
		);
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it("saves a description, removed people and a topic the owner added", async () => {
		const generate = vi.fn(async () => ({
			topics: [
				{
					id: "topic-1",
					name: "Northwind Migration",
					about: "Moving Northwind to the new platform.",
					suggested: true,
					threadIds: ["thread-1"],
					memberIds: ["p-1", "p-2"],
					people: [
						{ id: "p-1", name: "Ana Lima" },
						{ id: "p-2", name: "Bo Chen" },
					],
					domains: ["northwind.example"],
					sampleSubjects: [],
				},
			],
		}));
		const { actions, run } = session(generate);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(actions, onNext));

		expect(
			await screen.findByDisplayValue(
				"Moving Northwind to the new platform.",
			),
		).toBeEnabled();
		expect(screen.getByText("northwind.example")).toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Remove Bo Chen" }),
		);
		expect(screen.queryByText("Bo Chen")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Add a topic" }));
		const added = screen.getAllByRole("textbox", { name: "Topic name" })[1];
		await user.type(added, "Backend Hiring");
		await user.type(
			screen.getAllByRole("textbox", {
				name: "What this topic covers",
			})[1],
			"Interviews for the backend team.",
		);
		await user.click(screen.getByRole("button", { name: "Keep 2 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(run).toHaveBeenCalledWith(
			'BrainSaveTopic(topic=[{"id":"topic-1","name":"Northwind Migration","status":"active"}]);',
		);
		expect(run).toHaveBeenCalledWith(
			'BrainSetTopicPerson(topicId=["topic-1"], personId=["p-2"], state=["removed"]);',
		);
		expect(run).toHaveBeenCalledWith(
			'BrainSaveTopic(topic=[{"name":"Backend Hiring","description":"Interviews for the backend team.","status":"active"}]);',
		);
	});

	it("shares the pending generation when the owner leaves and returns before it finishes", async () => {
		const request = deferred<Output>();
		const generate = vi.fn(() => request.promise);
		const { actions } = session(generate);
		const first = render(step(actions));
		first.unmount();
		render(step(actions));

		expect(generate).toHaveBeenCalledTimes(1);
		await act(async () => request.resolve(suggestions()));
		expect(
			await screen.findByDisplayValue("Northwind Migration"),
		).toBeEnabled();
		expect(
			screen.getByRole("button", { name: "Keep 1 topics" }),
		).toBeEnabled();
	});

	it("generates fresh suggestions on a later visit after the previous request finishes", async () => {
		const generate = vi
			.fn<() => Promise<Output>>()
			.mockResolvedValueOnce(suggestions())
			.mockResolvedValue(suggestions("Backend Hiring"));
		const { actions } = session(generate);
		const first = render(step(actions));
		await screen.findByDisplayValue("Northwind Migration");
		first.unmount();
		render(step(actions));

		expect(await screen.findByDisplayValue("Backend Hiring")).toBeEnabled();
		expect(
			screen.queryByDisplayValue("Northwind Migration"),
		).not.toBeInTheDocument();
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it("allows a fresh request after a failed generation", async () => {
		const generate = vi
			.fn<() => Promise<Output>>()
			.mockRejectedValueOnce(new Error("Topic generation failed"))
			.mockResolvedValue(suggestions());
		const { actions } = session(generate);
		const first = render(step(actions));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Topic generation failed",
		);
		expect(
			screen.getByRole("button", { name: "Keep 0 topics" }),
		).toBeDisabled();
		first.unmount();
		render(step(actions));

		expect(
			await screen.findByDisplayValue("Northwind Migration"),
		).toBeEnabled();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it.each(["success", "failure"])(
		"ignores a late %s from a previous insight",
		async (outcome) => {
			const request = deferred<Output>();
			const oldGeneration = vi.fn(() => request.promise);
			const currentGeneration = vi.fn(async () => suggestions());
			const old = session(oldGeneration);
			const current = session(currentGeneration);
			const view = render(step(old.actions));
			view.rerender(step(current.actions));
			await screen.findByDisplayValue("Northwind Migration");

			await act(async () => {
				if (outcome === "success") request.resolve({ topics: [] });
				else request.reject(new Error("Old request failed"));
			});

			expect(
				screen.getByDisplayValue("Northwind Migration"),
			).toBeEnabled();
			expect(
				screen.queryByText(/No topics found/),
			).not.toBeInTheDocument();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(oldGeneration).toHaveBeenCalledTimes(1);
			expect(currentGeneration).toHaveBeenCalledTimes(1);
		},
	);

	it("clears the previous insight's selections while loading the next one", async () => {
		const old = session(async () => suggestions());
		const request = deferred<Output>();
		const current = session(() => request.promise);
		const view = render(step(old.actions));
		await screen.findByDisplayValue("Northwind Migration");
		view.rerender(step(current.actions));

		expect(
			screen.queryByDisplayValue("Northwind Migration"),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Keep 0 topics" }),
		).toBeDisabled();
		await act(async () => request.resolve(suggestions("Backend Hiring")));
		expect(await screen.findByDisplayValue("Backend Hiring")).toBeEnabled();
	});
});
