import { describe, expect, it } from "vitest";
import {
	rollbackRouterConfigPixel,
	setRouterLearningPixel,
} from "./router-learning";

describe("router learning pixels", () => {
	it("quotes the version and sends the model only when given", () => {
		expect(rollbackRouterConfigPixel("rt", 'v"1')).toBe(
			'RollbackRouterConfig(engine=["rt"], version=["v\\"1"]);',
		);
		expect(setRouterLearningPixel({ engineId: "rt", enabled: false })).toBe(
			'SetRouterLearning(engine=["rt"], enabled=[false]);',
		);
		expect(
			setRouterLearningPixel({
				engineId: "rt",
				enabled: true,
				optimizerModelId: "judge",
			}),
		).toBe(
			'SetRouterLearning(engine=["rt"], enabled=[true], optimizerModelId=["judge"]);',
		);
	});
});
