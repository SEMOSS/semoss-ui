import { makeObservable, observable, runInAction } from "mobx";
import type {
	InputToolExecPixelMessage,
	PixelMessage,
	Plan,
	PlanStep,
	ResponseTextPixelMessage,
	ResponseToolPixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import type { ResponseMessageStore } from "./response-message.store";
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

	/**
	 * Model information associated with the message
	 */
	model: {
		/** Id of the model */
		id: string;

		/** Name of the model */
		name: string;
	} = {
		id: "",
		name: "",
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

		// set the model
		this.model = {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		};

		makeObservable(this, {
			plan: observable,
		});
	}

	/**
	 * The execution step
	 */
	get step(): PlanStep | null {
		return this.plan.steps[this.executionIdx] || null;
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
	runMessage = async (
		inputMessage: InputMessageStore,
	): Promise<PlanMessageStore> => {
		const room = this.room;

		// connect to the parent
		this.addChild(inputMessage);

		// build the context if it is there
		let context = "";
		if (room.options?.instructions) {
			context = room.options?.instructions;
		}

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
${inputMessage.mediaInputs.length ? `image=${JSON.stringify(inputMessage.mediaInputs.map((info) => info.fileLocation))},` : "image=[],"}
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
		) as PlanMessageStore;
		inputMessage.addChild(responseMessage);

		return responseMessage;
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
COTConfirmation(
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
			for (const step of this.plan.steps) {
				step.status = "pending";
			}
		});

		// start executing the first step
		this.executionIdx = 0;
		this.executeStep();
	};

	/**
	 * Execute the next step
	 * @returns resolves if successfully executed
	 */
	private executeNextStep = async (): Promise<void> => {
		// move forward and execute the next one
		this.executionIdx++;
		await this.executeStep();
	};

	/**
	 * Execute a specific step by step number
	 * @param stepNumber - Step number to execute
	 * @returns Promise that resolves to true if step executed successfully
	 */
	private executeStep = async (): Promise<void> => {
		const step = this.step;

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
				completed = await this.executeHumanInterventionStep(step);
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

				// go to the next one
				this.executeNextStep();
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
			`COTToolPrediction(
                engine=["${room.modelId}"],
                roomId=["${room.roomId}"],
                stepNumber=["${step.step_number}"],
                toolName=["${step.details.tool_name}"]
            );`,
		);

		const { output } = response.pixelReturn[0];

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

		const room = this.room;

		// create the input message
		const inputMessage = new InputMessageStore(room, {
			messageId: "TEMP",
			type: "INPUT_TEXT",
			visible: true,
			inputUIPrompt: step.details.prompt,
			imageInfos: [],
			modelId: room.modelId,
			paramMap: {
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			},
			dateCreated: "",
		});

		// add the message
		room.tail.addChild(inputMessage);

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(`AddCOTLLMReasoning(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${inputMessage.imageInfos.length ? `image=${JSON.stringify(inputMessage.imageInfos.map((info) => info.fileLocation))},` : "image=[],"}
${room.tail ? `parentMessageId=["${room.tail.id}"],` : ""}
paramValues=[${JSON.stringify({
			max_new_tokens: room.options.tokenLength,
			temperature: room.options.temperature,
		})}]
);`);

		const { output } = response.pixelReturn[0];

		// Add the response
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);

		return true;
	};

	/**
	 * Execute a human intervention step
	 * @param step - Step to execute
	 */
	private executeHumanInterventionStep = async (
		step: PlanStep,
	): Promise<boolean> => {
		if (step.details.stepType !== "human_intervention") {
			throw new Error("Invalid step type for human intervention");
		}

		// wait for the user
		return false;
	};

	/**
	 * TODO: Fix. This is brittle and will break if we go out of order
	 * Verify the execution of a tool step. Throw an error if it fails.
	 * @param toolName - name of the tool
	 * @param toolId - id of the app
	 */
	saveToolExecution = async (
		message: ResponseMessageStore,
		tool: ResponseMessageStore["tools"][number],
		toolResponse: string,
	) => {
		const step = this.step;
		if (!step) {
			return;
		}

		if (step.details.stepType !== "tool_call") {
			return;
		}

		if (
			step.details._meta.map.SMSS_PROJECT_ID !==
				tool._meta.map.SMSS_PROJECT_ID ||
			step.details.tool_name !== tool.name
		) {
			return;
		}

		const room = this.room;

		// save the response
		runInAction(() => {
			tool.response = toolResponse;
		});

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					toolExecution: InputToolExecPixelMessage;
					toolResponse: ResponseToolPixelMessage;
				},
			]
		>(
			`AddCOTToolExecution(
engine=["${room.modelId}"],
roomId = ["${room.roomId}"],
toolId = ["${tool.id}"],
toolName=["${tool.name}"],
toolPredictedArguments=["<encode>${JSON.stringify(tool.parameters)}</encode>"],
toolExecutionResponse=["<encode>${toolResponse}</encode>"],
paramValues=[${JSON.stringify({})}],
${message.id ? `parentMessageId=["${message.id}"]` : ""}
);`,
		);

		const { output } = response.pixelReturn[0];

		const toolExecution = createMessageStore(room, output.toolExecution);
		message.addChild(toolExecution);

		// create the response and link to the message
		const toolResponseMessage = createMessageStore(
			room,
			output.toolResponse,
		);
		toolExecution.addChild(toolResponseMessage);

		// TODO: check success criteria

		runInAction(() => {
			step.status = "completed";
		});

		this.executeNextStep();
	};

	/**
	 * Verify the execution of human intervention. Throw an error if it fails.
	 */
	verifyHumanInterventionStepExecution = () => {
		const step = this.step;
		if (!step) {
			return;
		}

		if (
			step.details.stepType !== "llm_reasoning" &&
			step.details.stepType !== "human_intervention"
		) {
			return;
		}

		// TODO: check success criteria

		runInAction(() => {
			step.status = "completed";
		});

		this.executeNextStep();
	};

	/**
	 * Fail the execution step
	 */
	failStepExecution = async () => {
		const step = this.step;
		if (!step) {
			return;
		}

		runInAction(() => {
			step.status = "failed";
		});
	};
}
