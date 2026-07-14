import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EngineSelect } from "./engine-select";

const { SharedEngineSelect } = vi.hoisted(() => ({
	SharedEngineSelect: vi.fn((_props: Record<string, unknown>) => (
		<div data-testid="shared-engine-select" />
	)),
}));

vi.mock("./primitives/engine-select", () => ({
	EngineSelectPrimitive: SharedEngineSelect,
}));

describe("EngineSelect", () => {
	it("pre-configures the same MyEngines filters playground itself uses for chat", () => {
		const onChange = vi.fn();
		render(
			<EngineSelect
				name="Claude"
				value="engine-1"
				onChange={onChange}
				disabled={false}
				className="custom-class"
			/>,
		);

		expect(screen.getByTestId("shared-engine-select")).toBeInTheDocument();
		expect(SharedEngineSelect).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Claude",
				value: "engine-1",
				onChange,
				disabled: false,
				engineTypes: ["MODEL"],
				metaFilters: [{ tag: "text-generation" }],
			}),
			expect.anything(),
		);
		const passedClassName = SharedEngineSelect.mock.calls[0]?.[0]
			.className as string;
		expect(passedClassName).toContain("custom-class");
	});

	it("defaults to playground's own compact trigger sizing when no className is passed", () => {
		render(
			<EngineSelect name="Claude" value="engine-1" onChange={vi.fn()} />,
		);

		const passedClassName = SharedEngineSelect.mock.calls[0]?.[0]
			.className as string;
		expect(passedClassName).toContain("h-8");
		expect(passedClassName).toContain("text-xs");
	});
});
