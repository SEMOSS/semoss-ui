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
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { ImportEngineSelect } from "./import-engine-select";

const mocks = vi.hoisted(() => ({
	pixels: [] as string[],
}));

const EMBEDDERS = [
	{
		engine_id: "embedder-id",
		engine_name: "text-embedding-3",
		engine_display_name: "OpenAI Embeddings",
		engine_type: "MODEL",
		engine_subtype: "OPEN_AI",
	},
];

vi.mock("@semoss/sdk/react", () => ({
	useIteratorPixel: (
		buildPixel: (limit: number, offset: number) => string,
	) => {
		const pixel = buildPixel(15, 0);
		if (pixel) {
			mocks.pixels.push(pixel);
		}
		return {
			data: pixel ? EMBEDDERS : [],
			isLoading: false,
			hasMore: false,
			next: vi.fn(),
		};
	},
}));

/** Props for {@link EngineFieldHarness}. */
interface EngineFieldHarnessProps {
	/** Receives each engine id the field saves. */
	onChange: (engineId: string) => void;
}

/** An embeddings model field, keeping its value as the import forms do. */
const EngineFieldHarness = ({ onChange }: EngineFieldHarnessProps) => {
	const id = useId();
	const [value, setValue] = useState("");
	return (
		<>
			<label htmlFor={id}>Embedder</label>
			<ImportEngineSelect
				id={id}
				value={value}
				onChange={(engineId) => {
					setValue(engineId);
					onChange(engineId);
				}}
				engineTypes={["MODEL"]}
				metaFilters={[{ tag: "embeddings" }]}
				placeholder="Select Embedder"
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
beforeEach(() => {
	mocks.pixels.length = 0;
});
afterEach(cleanup);
afterAll(() => {
	vi.unstubAllGlobals();
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe("import form engine field", () => {
	it("lists the field's engines with each one's logo, name and id, and saves the chosen id", async () => {
		const onChange = vi.fn();
		render(<EngineFieldHarness onChange={onChange} />);
		const trigger = screen.getByRole("combobox", { name: "Embedder" });
		expect(trigger).toHaveTextContent("Select Embedder");

		fireEvent.click(trigger);
		const option = await screen.findByRole("option", {
			name: /OpenAI Embeddings/,
		});
		expect(within(option).getByText("id: embedder-id")).toBeInTheDocument();
		await waitFor(() =>
			expect(within(option).getByRole("img")).toHaveAttribute(
				"alt",
				"OpenAI Embeddings icon",
			),
		);
		expect(mocks.pixels.at(-1)).toContain('engineTypes=["MODEL"]');
		expect(mocks.pixels.at(-1)).toContain(
			'metaFilters=[{"tag":"embeddings"}]',
		);

		fireEvent.click(option);
		expect(onChange).toHaveBeenCalledWith("embedder-id");
		expect(trigger).toHaveTextContent("OpenAI Embeddings");
		await waitFor(() =>
			expect(trigger.querySelector("img")).toBeInTheDocument(),
		);
	});
});
