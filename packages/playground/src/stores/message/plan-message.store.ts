import {
	action,
	computed,
	makeObservable,
	observable,
	runInAction,
} from "mobx";
import type {
	InputToolExecPixelMessage,
	PixelMessage,
	Plan,
	PlanStep,
	ResponseTextPixelMessage,
	ResponseToolPixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import type { InputMessageStore } from "./input-message.store";
import type { ResponseMessageStore } from "./response-message.store";
import { createMessageStore } from "./utility";

/**
 * PLAN Message Store
 */
export class PlanMessageStore extends AbstractMessageStore {
	readonly type = "PLAN";
	readonly pixelMessageType: ResponseTextPixelMessage["type"] =
		"RESPONSE_TEXT";

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
	executionIdx: number = -1;

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

		makeObservable(this, {
			plan: observable,
			step: computed,
			sync: action,
			addStep: action,
			updateStep: action,
			removeStep: action,
			runMessage: action,
			confirmPlan: action,
			saveToolExecution: action,
			failStepExecution: action,
		});

		// sync the message (must be after makeObservable so sync action is registered)
		this.sync(message);
	}

	/**
	 * The execution step
	 */
	get step(): PlanStep | null {
		return this.plan.steps[this.executionIdx] || null;
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync = (message: PixelMessage) => {
		// type guard + specifics
		if (message.type === "RESPONSE_TEXT") {
			try {
				this.plan = JSON.parse(message.content);
			} catch {
				console.error("ERROR Parsing Plan");
			}
		} else {
			throw new Error(
				`Invalid message object passed to ResponseMessageStore.update: ${JSON.stringify(message)}`,
			);
		}

		// cast the types
		message = message as ResponseTextPixelMessage;

		// set the id
		this.id = message.messageId;

		// set the model that was used
		this.model = {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		};
	};

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
		const stepIdx = this.plan.steps.findIndex(
			(s) => s.step_number === stepNumber,
		);

		// ignore if not found
		if (stepIdx === -1) {
			return;
		}

		this.plan.steps[stepIdx] = {
			...this.plan.steps[stepIdx],
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
	 * @param optionsToSave - optional room options to save before running the message
	 */
	runMessage = async (
		inputMessage: InputMessageStore,
		optionsToSave?: Record<string, unknown>,
	): Promise<PlanMessageStore> => {
		const room = this.room;

		// Update room options if provided
		if (optionsToSave) {
			await room.runRoomPixel(
				`UpdateRoomOptions(roomId=${JSON.stringify(room.roomId)}, roomOptions=[${JSON.stringify(
					optionsToSave,
				)}]);`,
			);
		}
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
engine=["${room.model.app_id}"],
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

		// sync the input message
		inputMessage.sync(output.inputMessage);

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
engine=["${room.model.app_id}"],
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

		// reset execution index and start
		this.executionIdx = -1;
		this.executeNextStep();
	};

	/**
	 * Complete execution of the steps
	 */
	private completeExecution = async (): Promise<void> => {
		const room = this.room;

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(`COTRoomResult(
engine=["${room.model.app_id}"],
roomId=["${room.roomId}"]
);`);

		const { output } = response.pixelReturn[0];

		// get the parent
		const parentMessage = room.getMessage(
			output.inputMessage.parentMessageId,
		);

		if (!parentMessage) {
			throw new Error("Parent message not found for LLM reasoning step");
		}

		// add the input
		const inputMessage = createMessageStore(room, output.inputMessage);
		parentMessage.addChild(inputMessage);

		// add the response
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);

		// set mode to chat
		room.setMode("chat");
	};

	/**
	 * Execute the next step
	 * @returns resolves if successfully executed
	 */
	private executeNextStep = async (): Promise<void> => {
		// move forward and execute the next one
		this.executionIdx++;

		// get the new step
		const step = this.step;

		// if there is a step execute it. Otherwise assume it is the last one
		if (step) {
			await this.executeStep();
		} else {
			await this.completeExecution();
		}
	};

	/**
	 * Execute a specific step by step number
	 * @returns Promise that resolves to true if step executed successfully
	 */
	private executeStep = async (): Promise<void> => {
		const step = this.step;

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
                engine=["${room.model.app_id}"],
                roomId=["${room.roomId}"],
                stepNumber=["${step.step_number}"],
                toolName=["${step.details.tool_name}"]
            );`,
		);

		const { output } = response.pixelReturn[0];

		// get the parent
		const parentMessage = room.getMessage(
			output.inputMessage.parentMessageId,
		);

		if (!parentMessage) {
			throw new Error("Parent message not found for LLM reasoning step");
		}

		// add the input
		const inputMessage = createMessageStore(room, output.inputMessage);
		parentMessage.addChild(inputMessage);

		// add the response
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);

		// // Get the input from COT
		// const inputMessage = createMessageStore(room, output.inputMessage);
		// room.tail.addChild(inputMessage);

		// // Add the response
		// const responseMessage = createMessageStore(
		// 	room,
		// 	output.responseMessage,
		// );
		// inputMessage.addChild(responseMessage);

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

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(`AddCOTLLMReasoning(
engine=["${room.model.app_id}"],
roomId=["${room.roomId}"],
stepNumber=["${step.step_number}"]
);`);

		const { output } = response.pixelReturn[0];

		// get the parent
		const parentMessage = room.getMessage(
			output.inputMessage.parentMessageId,
		);

		if (!parentMessage) {
			throw new Error("Parent message not found for LLM reasoning step");
		}

		// add the input
		const inputMessage = createMessageStore(room, output.inputMessage);
		parentMessage.addChild(inputMessage);

		// add the response
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
			step.details._meta.SMSS_PROJECT_ID !== tool._meta.SMSS_PROJECT_ID ||
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
engine=["${room.model.app_id}"],
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
