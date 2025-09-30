import { makeObservable, observable } from "mobx";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * PLAN Message Store
 */
export class PlanMessageStore extends AbstractMessageStore {
	readonly type = "PLAN";

	/**
	 * Text associated with the message
	 */
	steps: {
		step_number: number;
		step_name: string;
		description: string;
		type:
			| "tool_call"
			| "llm_reasoning"
			| "human_intervention"
			| "no_tool_available";
		status: "pending" | "in_progress" | "completed" | "failed";
		details:
			| {
					stepType: "tool_call";
					tool_name: string;
					parameters: Record<string, unknown>;
					rationaleForStep: string;
			  }
			| {
					stepType: "llm_reasoning";
					prompt: string;
					rationaleForStep: string;
			  }
			| {
					stepType: "human_intervention";
					required_role: string;
					instructions: string;
					rationaleForStep: string;
			  }
			| {
					stepType: "no_tool_available";
					missing_capability: string;
					rationaleForStep: string;
			  };
	}[] = [];

	constructor(
		room: AbstractMessageStore["room"],
		id: string,
		steps: PlanMessageStore["steps"],
	) {
		super(room, id);

		this.steps = steps;

		makeObservable(this, {
			steps: observable,
		});
	}

	/***
	 * Add a new step to the plan
	 * @param step
	 */
	addStep(step: Omit<PlanMessageStore["steps"][number], "step_number">) {
		this.steps.push({
			// increment it
			step_number: this.steps.length,
			...step,
		});
	}

	/**
	 * Delete a step from the plan
	 * @param step_number
	 */
	removeStep(step_number: number) {
		this.steps = this.steps.filter((s) => s.step_number !== step_number);
	}
}
