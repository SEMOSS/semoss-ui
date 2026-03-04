import { configure } from "mobx";
import { Insight as InsightStore } from "@semoss/sdk";
import { ConfigStore, MonolithStore } from "@/stores";

configure({
	enforceActions: "always",
});

/**
 * RootStore that allows us to access the global stores
 */
export class RootStore {
	/**
	 * @deprecated Will be removed in future release, use SDK instead
	 */
	monolithStore: MonolithStore;
	configStore: ConfigStore;
	insightStore: InsightStore;

	constructor() {
		// create the stores
		this.monolithStore = new MonolithStore(this);
		this.configStore = new ConfigStore(this);
		this.insightStore = new InsightStore();
	}
}
