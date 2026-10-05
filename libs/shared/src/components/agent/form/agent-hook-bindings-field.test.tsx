import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
	AgentHookBindingsField,
	extractPixelVariables,
} from "./agent-hook-bindings-field";

const RUNTIME_EVENTS = ["onRoomCreation", "afterRun"];
const SOURCES = [
	{ source: "event", events: RUNTIME_EVENTS },
	{ source: "context.runId", events: RUNTIME_EVENTS },
	{ source: "result.finalText", events: ["afterRun"] },
];

interface BindingFieldHarnessProps {
	pixel: string;
	events: string[];
	initialValue: Record<string, string>;
}

const BindingFieldHarness = ({
	pixel,
	events,
	initialValue,
}: BindingFieldHarnessProps) => {
	const [value, setValue] = useState(initialValue);
	const [error, setError] = useState<string>();

	return (
		<>
			<AgentHookBindingsField
				pixel={pixel}
				value={value}
				events={events}
				runtimeEvents={RUNTIME_EVENTS}
				sources={SOURCES}
				onChange={setValue}
				onBlur={() => undefined}
				error={error}
				onValidityChange={setError}
			/>
			<output aria-label="Committed bindings">
				{JSON.stringify(value)}
			</output>
		</>
	);
};

afterEach(cleanup);

describe("extractPixelVariables", () => {
	it("finds unique variable references and ignores strings, comments, and literals", () => {
		expect(
			extractPixelVariables(`
					LogMessage(message=[val], other=[second]);
					Echo(value=[val], text='[quoted]', list=[1, 2]);
					Select(TEST__cone).as([alias]);
					// [commented]
				/* [alsoCommented] */
			`),
		).toEqual(["val", "second"]);
	});
});

describe("AgentHookBindingsField", () => {
	it("derives the target variable from the Pixel expression", () => {
		render(
			<BindingFieldHarness
				pixel="LogMessage(message=[val]);"
				events={["afterRun"]}
				initialValue={{ val: "context.runId" }}
			/>,
		);

		expect(screen.getByText("[val]")).toBeTruthy();
		expect(
			screen.getByRole("combobox", { name: "Lifecycle value for val" }),
		).toBeTruthy();
		expect(screen.queryByRole("textbox")).toBeNull();
	});

	it("rejects a mapped value that is not available at every selected event", async () => {
		render(
			<BindingFieldHarness
				pixel="LogMessage(message=[hookOutput]);"
				events={["onRoomCreation", "afterRun"]}
				initialValue={{ hookOutput: "result.finalText" }}
			/>,
		);

		const error = await screen.findByRole("alert");
		expect(error.textContent).toContain(
			"result.finalText is not available at every selected hook event.",
		);
		const source = screen.getByRole("combobox", {
			name: "Lifecycle value for hookOutput",
		});
		expect(source.getAttribute("aria-invalid")).toBe("true");
		expect(source.getAttribute("aria-describedby")).toBe(error.id);
	});

	it("preserves bindings while their variables are temporarily absent", async () => {
		const view = render(
			<BindingFieldHarness
				pixel="LogMessage(message=[val]);"
				events={["afterRun"]}
				initialValue={{ val: "context.runId" }}
			/>,
		);

		view.rerender(
			<BindingFieldHarness
				pixel='LogMessage(message="done");'
				events={["afterRun"]}
				initialValue={{ val: "context.runId" }}
			/>,
		);

		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Committed bindings" })
					.textContent,
			).toBe('{"val":"context.runId"}'),
		);
		expect(screen.getByText("Not currently referenced")).toBeTruthy();
	});
});
