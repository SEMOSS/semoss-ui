import { makeObservable, observable, runInAction } from "mobx";
import type {
	PixelMessage,
	Plan,
	PlanStep,
	ResponseTextPixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import type { InputMessageStore } from "./input-message.store";
import { createMessageStore } from "./utility";

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

	/**
	 * Current execution index of the plan
	 */
	executionIdx: number = 0;

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

	/***
	 * Update a step in the plan
	 * @param step
	 */
	updateStep(stepNumber: number, step: Partial<PlanStep>) {
		this.plan.steps[stepNumber] = {
			...this.plan.steps[stepNumber],
			...step,
		};
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

	/**
	 * Send a new user message and recieve a response
	 * @param prompt - user message
	 */
	runMessage = async (inputMessage: InputMessageStore): Promise<void> => {
		const room = this.room;

		// connect to the parent
		this.addChild(inputMessage);

		// build the context if it is there
		let context = "";
		if (room.options?.instructions) {
			context = room.options?.instructions;
		}

		// get a list of tool ids
		const tools: string[] = room.options.tools.map((t) => t.id, []);

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(`AskCOTRoom(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.files.length ? `image=${JSON.stringify(inputMessage.files.map((file) => file.fileLocation))},` : "image=[],"}
${tools.length ? `mcpToolID=${JSON.stringify(tools)},` : "mcpToolID=[],"}
${this.id ? `parentMessageId=["${this.id}"],` : ""}
paramValues=[${JSON.stringify({
			max_new_tokens: room.options.tokenLength,
			temperature: room.options.temperature,
		})}]
);`);

		const { output } = response.pixelReturn[0];

		// update the input's id
		inputMessage.updateId(output.inputMessage.messageId);

		// create the response and link to the input
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);
	};

	/**
	 * Confirm the plan and execute it
	 */
	confirmPlan = async () => {
		const room = this.room;

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(
			`
ConfirmCOT(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
cotPlan=["<encode>${JSON.stringify(this.plan)}</encode>"]
);`,
		);

		const { output } = response.pixelReturn[0];

		// get the input from COT
		const inputMessage = createMessageStore(room, output.inputMessage);
		this.addChild(inputMessage);

		// add the response
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);

		// start executing
		this.startExecution();
	};

	/**
	 * TODO: Fix. This is brittle and will break if we go out of order
	 * Save the tool and continue execution
	 */
	saveTool = () => {
		const step = this.plan.steps[this.executionIdx];

		runInAction(() => {
			step.status = "completed";
		});

		// move forward and execute the next one
		this.executionIdx++;
		this.executeStep();
	};

	/**
	 * Execution
	 */
	/**
	 * Switch to pending and start execution of all steps
	 */
	private startExecution = (): void => {
		const room = this.room;

		// set mode to executing
		room.setMode("executing");

		// mark all as pending
		runInAction(() => {
			this.executionIdx = 0;

			for (const step of this.plan.steps) {
				step.status = "pending";
			}
		});

		// start executing the first step
		this.executeStep();
	};

	/**
	 * Execute a specific step by step number
	 * @param stepNumber - Step number to execute
	 * @returns Promise that resolves to true if step executed successfully
	 */
	private executeStep = async (): Promise<void> => {
		const step = this.plan.steps[this.executionIdx];

		// No more pending steps, switch back to chat mode
		if (!step) {
			this.room.setMode("chat");
			return;
		}

		if (step.status === "completed") {
			console.warn(`Step ${step.step_number} is already completed`);
			return;
		}

		try {
			// Mark step as in progress
			runInAction(() => {
				step.status = "in_progress";
			});

			// Execute based on step type
			let completed = false;
			if (step.details.stepType === "tool_call") {
				completed = await this.executeToolStep(step);
			} else if (step.details.stepType === "llm_reasoning") {
				completed = await this.executeReasoningStep(step);
			} else if (step.details.stepType === "human_intervention") {
				throw new Error("TODO: Human Intervention step execution");
			} else if (step.details.stepType === "no_tool_available") {
				throw new Error(
					`Step ${step.step_number}: No tool available for ${step.details.missing_capability}`,
				);
			}

			// if the step was completed, mark it as such. Try to execute the next one
			if (completed) {
				runInAction(() => {
					step.status = "completed";
				});

				// move forward and execute the next one
				this.executionIdx++;
				this.executeStep();
			}
		} catch (error) {
			// Mark step as failed
			runInAction(() => {
				step.status = "failed";
			});

			console.error(`Step ${step.step_number} failed:`, error);
		}
	};

	/**
	 * Execute a tool call step
	 * @param step - Step to execute
	 */
	private executeToolStep = async (step: PlanStep): Promise<boolean> => {
		if (step.details.stepType !== "tool_call") {
			throw new Error("Invalid step type for tool execution");
		}

		const room = this.room;

		// Wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(
			`GetCOTToolResponse(
                engine=["${room.modelId}"],
                roomId=["${room.roomId}"],
                stepNumber=["${step.step_number}"],
                toolName=["${step.details.tool_name}"]
            );`,
		);

		const { output } = response.pixelReturn[0];

		console.error(
			"TODO: Validate if this is correct. Shold I search by messageId and then add it there?",
		);

		// Get the input from COT
		const inputMessage = createMessageStore(room, output.inputMessage);
		room.tail.addChild(inputMessage);

		// Add the response
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);

		return false;
	};

	/**
	 * Execute an LLM reasoning step
	 * @param step - Step to execute
	 */
	private executeReasoningStep = async (step: PlanStep): Promise<boolean> => {
		if (step.details.stepType !== "llm_reasoning") {
			throw new Error("Invalid step type for LLM reasoning");
		}

		// Execute the reasoning as a regular message
		await this.room.askMessage(step.details.prompt, []);

		return true;
	};
}
