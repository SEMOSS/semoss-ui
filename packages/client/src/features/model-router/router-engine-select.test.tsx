import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { useId, useState } from "react";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	type RouterEngineOption,
	type RouterEngineRole,
	RouterEngineSelect,
} from "./router-engine-select";

const ENGINES: RouterEngineOption[] = [
	{
		engine_id: "gpt-id",
		engine_name: "gpt",
		engine_display_name: "GPT-4o",
		engine_subtype: "OPEN_AI",
		tag: ["text-generation"],
	},
	{ engine_id: "claude-id", engine_name: "Claude", engine_subtype: "CLAUDE" },
	{
		engine_id: "jev-id",
		engine_name: "Jev Latest",
		engine_subtype: "TYPESAFE",
	},
	{
		engine_id: "embed-id",
		engine_name: "Embedder",
		engine_subtype: "OPEN_AI",
		tag: "embeddings",
	},
];

/** Props for {@link PickerHarness}. */
interface PickerHarnessProps {
	/** The model chosen to start with. */
	initialValue?: string;
	/** What the model does in the router. */
	routerRole?: RouterEngineRole;
	/** Whether the picker offers no model. */
	allowNone?: boolean;
}

/** The picker under a label, keeping its value as the router editor does. */
const PickerHarness = ({
	initialValue = "",
	routerRole,
	allowNone,
}: PickerHarnessProps) => {
	const id = useId();
	const [value, setValue] = useState(initialValue);
	return (
		<>
			<label htmlFor={id}>Router model</label>
			<RouterEngineSelect
				id={id}
				value={value}
				onChange={setValue}
				engines={ENGINES}
				role={routerRole}
				allowNone={allowNone}
			/>
		</>
	);
};

const scrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});
afterEach(cleanup);
afterAll(() => {
	vi.unstubAllGlobals();
	Element.prototype.scrollIntoView = scrollIntoView;
});

/** Opens the picker's list. */
const openPicker = () =>
	fireEvent.click(screen.getByRole("combobox", { name: "Router model" }));

/**
 * Reads the names of the models the open list offers.
 *
 * @returns The text of each option.
 */
const offeredOptions = () =>
	screen.getAllByRole("option").map((option) => option.textContent);

describe("Model Router model picker", () => {
	it("lists each model with its logo, name and id, and shows the chosen one's logo", async () => {
		render(<PickerHarness />);
		expect(
			screen.getByRole("combobox", { name: "Router model" }),
		).toHaveTextContent("Select a model");

		openPicker();
		const option = await screen.findByRole("option", { name: /GPT-4o/ });
		expect(within(option).getByText("id: gpt-id")).toBeInTheDocument();
		await waitFor(() =>
			expect(within(option).getByRole("img")).toHaveAttribute(
				"alt",
				"GPT-4o icon",
			),
		);

		fireEvent.click(option);
		const trigger = screen.getByRole("combobox", { name: "Router model" });
		expect(trigger).toHaveTextContent("GPT-4o");
		await waitFor(() =>
			expect(trigger.querySelector("img")).toBeInTheDocument(),
		);
	});

	it("offers only the models that can answer a route", async () => {
		render(<PickerHarness />);

		openPicker();
		await screen.findAllByRole("option");

		expect(offeredOptions()).toEqual([
			expect.stringContaining("GPT-4o"),
			expect.stringContaining("Claude"),
		]);
	});

	it("offers only TYPESAFE models to decide", async () => {
		render(<PickerHarness routerRole="decision" />);

		openPicker();
		await screen.findAllByRole("option");

		expect(offeredOptions()).toEqual([
			expect.stringContaining("Jev Latest"),
		]);
	});

	it("finds models by name or id", async () => {
		render(<PickerHarness />);

		openPicker();
		fireEvent.change(await screen.findByPlaceholderText("Search"), {
			target: { value: "CLAUDE-ID" },
		});

		expect(offeredOptions()).toEqual([expect.stringContaining("Claude")]);
	});

	it("offers no model where the router allows none", async () => {
		render(<PickerHarness routerRole="embeddings" allowNone />);
		expect(
			screen.getByRole("combobox", { name: "Router model" }),
		).toHaveTextContent("No embeddings model");

		openPicker();
		await screen.findAllByRole("option");

		expect(offeredOptions()).toEqual([
			"No embeddings model",
			expect.stringContaining("Claude"),
			expect.stringContaining("Embedder"),
		]);
	});

	it("keeps a chosen model that cannot play the role, with a warning", async () => {
		render(<PickerHarness initialValue="jev-id" />);

		expect(
			screen.getByRole("combobox", { name: "Router model" }),
		).toHaveAccessibleDescription(
			"Choose a compatible model you can access before saving.",
		);

		openPicker();
		const option = await screen.findByRole("option", {
			name: /Jev Latest/,
		});
		expect(option).toHaveAttribute("aria-disabled", "true");
		expect(
			within(option).getByText("Unavailable for this role"),
		).toBeInTheDocument();
	});
});
