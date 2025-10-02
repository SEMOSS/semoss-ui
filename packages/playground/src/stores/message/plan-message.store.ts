import { makeObservable, observable } from "mobx";
import type { Plan, PlanStep, ResponseTextPixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * PLAN Message Store
 */
export class PlanMessageStore extends AbstractMessageStore {
	readonly type = "PLAN";

	/**
	 * Text associated with the message
	 */
	plan: Plan = {
		user_prompt: "",
		plan_id: "",
		steps: [],
	};

	constructor(
		room: AbstractMessageStore["room"],
		message: ResponseTextPixelMessage,
	) {
		super(room, message);

		try {
			this.plan = JSON.parse(message.content);
		} catch {
			console.error("ERROR Parsing Plan");
		}

		makeObservable(this, {
			plan: observable,
		});
	}

	/***
	 * Add a new step to the plan
	 * @param step
	 */
	addStep(step: Omit<PlanStep, "step_number">) {
		this.plan.steps.push({
			// increment it
			step_number: this.plan.steps.length,
			...step,
		});
	}

	/**
	 * Delete a step from the plan
	 * @param step_number
	 */
	removeStep(step_number: number) {
		this.plan.steps = this.plan.steps.filter(
			(s) => s.step_number !== step_number,
		);
	}
}
