import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ModelRouterAttribution } from "./model-router-attribution";

afterEach(cleanup);

test("shows the actual model on every routed response, including repeated destinations", () => {
	const routing = {
		router_engine_id: "router",
		routed_engine_id: "destination",
		routed_engine_name: "Answer Model",
	};
	render(
		<>
			<ModelRouterAttribution routing={routing} />
			<ModelRouterAttribution routing={routing} />
		</>,
	);
	expect(screen.getAllByText("Answer Model")).toHaveLength(2);
});

test("uses the destination ID when its display name is unavailable", () => {
	render(
		<ModelRouterAttribution
			routing={{
				routed_engine_id: "destination",
				routed_engine_name: "  ",
			}}
		/>,
	);
	expect(screen.getByText("destination")).toBeVisible();
});

test("does not invent attribution for direct models, legacy messages, or incomplete metadata", () => {
	const { container } = render(
		<>
			<ModelRouterAttribution />
			<ModelRouterAttribution routing={{ routed_engine_id: "" }} />
		</>,
	);
	expect(container).toBeEmptyDOMElement();
});
