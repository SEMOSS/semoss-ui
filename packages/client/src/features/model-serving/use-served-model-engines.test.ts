import { describe, expect, it } from "vitest";
import type { ServedModelEngineList } from "@/api/model-serving";
import { findMissingModels, groupEngines } from "./use-served-model-engines";

const engine = (
	engineId: string,
	servedModel: string | null,
	calls: string[],
	namespace: string | null = servedModel ? "semoss" : null,
) => ({
	engineId,
	engineName: engineId,
	endpoint: null,
	model: null,
	servedModel,
	namespace,
	calls,
});

describe("a served model's engines", () => {
	const list: ServedModelEngineList = {
		namespace: "semoss",
		engines: [
			engine("linked", "olmo", ["olmo"]),
			engine("elsewhere", "olmo", ["olmo"], "another-namespace"),
			engine("by-hand", null, ["olmo"]),
			engine("linked-to-another", "next", ["olmo"]),
		],
	};

	it("are the linked ones of its namespace, and the unlinked ones that call it", () => {
		const group = groupEngines(list, "olmo");

		expect(group.linked.map((entry) => entry.engineId)).toEqual(["linked"]);
		expect(group.unlinked.map((entry) => entry.engineId)).toEqual([
			"by-hand",
		]);
	});

	it("are none until the engines are read", () => {
		expect(groupEngines(null, "olmo")).toEqual({
			linked: [],
			unlinked: [],
		});
	});

	it("leave the models deleted from the cluster missing while engines are linked to them", () => {
		const missing = findMissingModels(list, ["olmo"]);

		expect(missing).toEqual([
			{
				servedModel: "next",
				engines: [list.engines[3]],
			},
		]);
		expect(findMissingModels(list, null)).toEqual([]);
		expect(findMissingModels(null, ["olmo"])).toEqual([]);
	});
});
