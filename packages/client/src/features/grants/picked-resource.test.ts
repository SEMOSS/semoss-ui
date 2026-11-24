import { describe, expect, it } from "vitest";
import {
	resourceKey,
	toPickedEngine,
	toPickedProject,
} from "./picked-resource";

describe("toPickedEngine and toPickedProject", () => {
	it("read a picked engine and project as the sides of a permission", () => {
		const model = toPickedEngine({
			engine_id: "model1",
			engine_name: "orders_model",
			engine_display_name: "Orders Model",
			engine_type: "MODEL",
			engine_subtype: "OPEN_AI",
		});
		const agent = toPickedProject({
			project_id: "model1",
			project_name: "orders_agent",
			project_type: "WORKSPACE",
		});

		expect(model).toEqual({
			resourceType: "ENGINE",
			id: "model1",
			type: "MODEL",
			subtype: "OPEN_AI",
			name: "Orders Model",
		});
		expect(agent).toEqual({
			resourceType: "PROJECT",
			id: "model1",
			type: "PROJECT",
			subtype: "WORKSPACE",
			name: "orders_agent",
		});
		expect(model && resourceKey(model)).not.toBe(resourceKey(agent));
	});
});
