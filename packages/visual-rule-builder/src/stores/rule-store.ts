import { makeAutoObservable } from "mobx";

export interface Rule {
	rule_id: string;
	rule: string;
}

export class RuleStore {
	selectedRule: Rule | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	setSelectedRule(rule: Rule) {
		this.selectedRule = rule;
	}

	clearSelectedRule() {
		this.selectedRule = null;
	}

	get parsedRule() {
		if (!this.selectedRule?.rule) return null;

		try {
			return JSON.parse(this.selectedRule.rule);
		} catch (error) {
			console.error("Failed to parse rule:", error);
			return null;
		}
	}
}

export const ruleStore = new RuleStore();
