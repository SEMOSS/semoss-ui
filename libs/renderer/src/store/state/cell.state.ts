import { makeAutoObservable, runInAction, toJS } from "mobx";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixelAsync,
} from "@semoss/sdk/react";
import { setValueByPath } from "../../utility";
import type { QueryState } from "./query.state";
import type { StateStore } from "./state.store";
import type {
	CellComponent,
	CellConfig,
	CellDef,
	MCPToolConfig,
} from "./state.types";

export interface CellStateStoreInterface<D extends CellDef = CellDef> {
	/** Id of the cell */
	id: string;

	/** Track if the cell is loading */
	isLoading: boolean;

	/** Track how long the cell took */
	executionDurationMilliseconds: number | undefined;

	/** Operation associated with the cell */
	operation: string[];

	/** Output associated with the cell */
	output: unknown | undefined;

	/** Prints and logs */
	messages: string[] | undefined;

	/** Widget to bind the cell to */
	widget: D["widget"];

	/** Parameters associated with the cell */
	parameters: D["parameters"];

	/** Properties used to execute tool */
	mcpEnabled?: MCPToolConfig | null;

	/** used to fill pixel params for RunMCPTool */
	mcpParameters?: Record<string, unknown> | null;
}

export interface CellStateConfig<D extends CellDef = CellDef> {
	/** Id of the cell */
	id: string;

	/** Widget to bind the cell to */
	widget: D["widget"];

	/** Parameters associated with the cell */
	parameters: D["parameters"];

	/** Properties used to execute tool */
	mcpEnabled?: MCPToolConfig | null;

	/** used to fill pixel params for RunMCPTool */
	mcpParameters?: Record<string, unknown> | null;
}

/**
 * Store that manages each cell in a query
 */
export class CellState<D extends CellDef = CellDef> {
	private _state: StateStore;
	private _query: QueryState;
	private _store: CellStateStoreInterface<D> = {
		id: "",
		isLoading: false,
		executionDurationMilliseconds: undefined,
		operation: [],
		output: undefined,
		messages: [],
		widget: "",
		parameters: {},
		mcpEnabled: null,
		mcpParameters: null,
	};

	constructor(config: CellStateConfig, query: QueryState, state: StateStore) {
		// register the query + state
		this._query = query;
		this._state = state;

		// set the initial state information
		this._store.id = config.id;
		this._store.widget = config.widget;
		this._store.parameters = config.parameters;

		this._store.mcpEnabled = config.mcpEnabled;
		this._store.mcpParameters = config.mcpParameters;

		// make it observable
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
	/**
	 * Id of the cell
	 */
	get id() {
		return this._store.id;
	}

	/**
	 * Query associated with the cell
	 */
	get query() {
		return this._query;
	}

	/**
	 * Track if the cell is loading
	 */
	get isLoading() {
		return this._store.isLoading;
	}

	/** Track how long the cell took */
	get executionDurationMilliseconds() {
		return this._store.executionDurationMilliseconds;
	}

	/**
	 * Track if the cell has errored loading
	 */
	get isError() {
		if (this._store.operation.indexOf("ERROR") > -1) {
			return true;
		}

		return false;
	}

	/**
	 * Track if the cell was successfully run
	 */
	get isSuccessful() {
		if (
			this._store.operation.length > 0 &&
			this._store.operation.indexOf("ERROR") === -1
		) {
			return true;
		}

		return false;
	}

	/**
	 * Track if the query is executed (there is an output or an error)
	 */
	get isExecuted() {
		if (this._store.operation.length > 0) {
			return true;
		}

		return false;
	}

	/**
	 * Get any errors associated with the cell
	 */
	get error() {
		if (this.isError) {
			return this.output as string;
		}

		return "";
	}

	/**
	 * Get the operation of the cell
	 */
	get operation() {
		return this._store.operation;
	}

	/**
	 * Get the output of the cell
	 */
	get output() {
		return this._store.output;
	}

	/**
	 * Get the messages of the cell
	 */
	get messages() {
		return this._store.messages;
	}

	/**
	 * Get the widget associated with the cell
	 */
	get widget() {
		return this._store.widget;
	}

	/**
	 * Get the component associated with the cell
	 */
	get component(): CellComponent | null {
		if (this._state.cellRegistry[this._store.widget]) {
			return this._state.cellRegistry[this._store.widget].view;
		}

		return null;
	}

	/**
	 * Get the config associated with the cell
	 */
	get config(): CellConfig | null {
		if (this._state.cellRegistry[this._store.widget]) {
			return this._state.cellRegistry[this._store.widget];
		}

		return null;
	}

	/**
	 * Get the parameters associated with the cell
	 */
	get parameters() {
		return this._store.parameters;
	}

	/**
	 * Get the inputs to execute mcp tool
	 */
	get mcpEnabled() {
		return this._store.mcpEnabled;
	}

	/**
	 * Get the mcp parameters associated with the cell
	 */
	get mcpParameters() {
		return this._store.mcpParameters;
	}

	/**
	 * Bind the MCP Tool to the cell for execution
	 * @returns
	 */
	makeCellMCP = (): void => {
		// TODO: Make Pixel call
		// `MakeCellMCP(projectId=[], queryId=[], cellId=[])`

		this._store.mcpEnabled = {
			name: "diagnose_short_symptom",
			title: "Diagnose Short Symptom",
			description:
				"Generates a short (20-character) possible diagnosis based on two symptom inputs, using the SEMOSS Insight engine.\n\nArgs:\n    symptom1 (str): Description or name of the first symptom.\n    symptom2 (str): Description or name of the second symptom.\n\nReturns:\n    str: A concise diagnosis (up to 20 characters), inferred by the LLM engine.",
			inputSchema: {
				properties: {
					symptom1: {
						title: "Symptom1",
						description:
							"Description or name of the first symptom.",
						type: "string",
					},
					symptom2: {
						title: "Symptom2",
						description:
							"Description or name of the second symptom.",
						type: "string",
					},
				},
				required: ["symptom1", "symptom2"],
				title: "diagnose_short_symptom_Arguments",
				type: "object",
			},
		};

		this._store.mcpParameters = {
			symptom1: "{{input_1}}",
			symptom2: "{{input_2}}",
		};
	};

	/**
	 *
	 */
	setMCPParameters = (key: string, value: unknown): void => {
		this._store.mcpParameters[key] = value;
	};

	/**
	 * Actions
	 */
	/**
	 * Serialize to JSON
	 */
	toJSON = (): CellStateConfig => {
		return {
			id: this._store.id,
			widget: this._store.widget,
			mcpEnabled: this._store.mcpEnabled,
			parameters: toJS(this._store.parameters),
			mcpParameters: toJS(this._store.mcpParameters),
		};
	};

	/**
	 * Convert the parameters to pixel
	 *
	 * @param parameters - Convert the cell with these parameters
	 */
	toPixel(
		parameters: Record<string, unknown> = this._store.parameters,
	): string | string[] {
		const cellConfig = this.config;

		// TODO: if mcpEnabled do not run the pixel
		// RunMCPTool(tool=["${cell.mcpEnabled.name}"])

		// use the toPixel from the cell
		if (cellConfig) {
			const pixelReturn = cellConfig.toPixel(parameters);
			return pixelReturn;
		}

		return Object.keys(parameters)
			.map((key) => {
				return `${key}=[${JSON.stringify(parameters[key])}]`;
			})
			.join(", ");
	}

	/**
	 * Helpers
	 */
	/**
	 * Helper function to run a pixel
	 * @param rawPixel - pixel to be formatted and run
	 * TODO: projectId
	 */
	private async runPixel(rawPixel: string) {
		console.log("-------------------------------------");
		console.log("cell state: is this cell, mcpEnabled");
		console.log(this._store.mcpEnabled);
		console.log("-------------------------------------");

		const projId = "7c5771e1-ce6a-4cfb-a2d6-9f6a2dd049d3";

		let filled: string;
		// Construct pixel for MCPEnabled
		if (this._store.mcpEnabled) {
			const pixel = `RunMCPTool(project=["${this._state.projectId}"], function=["${this._store.mcpEnabled.name}"], paramValues=[${JSON.stringify(this._store.mcpParameters)}])`;

			console.log("pixel", pixel);

			filled = this._state.flattenVariable(pixel);
		} else {
			// Gets rid of braces and evaluate parameters in query
			// const filled = this._state.flattenVar(raw);
			filled = this._state.flattenVariable(rawPixel);
		}

		console.log("filled", filled);

		// clear the previous messages + operation + output
		this._store.messages = [];
		this._store.operation = [];
		this._store.output = undefined;

		console.log("--------------------------------------");
		console.log("state.projectId", this._state.projectId);
		console.log("--------------------------------------");

		// start polling
		const { jobId } = await runPixelAsync(filled, this._state.insightId);

		// Set up polling in order to get full stdout
		let isPolling = true;
		while (isPolling) {
			try {
				// get the reponse from the job id
				const data = await getPixelConsole(jobId);

				const { message: messages, status } = data;

				// add the new messages
				runInAction(() => {
					messages.forEach((mess) => {
						this._store.messages.push(mess);
					});
				});
				// Currently console does not get pass STREAMING
				if (
					status === "ProgressComplete" ||
					status === "Streaming" ||
					status === "Complete"
				) {
					isPolling = false;
				} else {
					// poll
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			} catch (error) {
				console.error("Error during polling:", error.message);

				// turn it off
				isPolling = false;
			}
		}

		const { errors, results } = await getPixelAsyncResult(jobId);
		if (errors.length > 0) {
			throw new Error(errors.join(""));
		}

		const last = results[results.length - 1];

		// set the output per operation
		let output: unknown;
		const opType: string[] = last.operationType;

		if (last.operationType.indexOf("CUSTOM_DATA_STRUCTURE") > -1) {
			output = last.output;
		} else if (last.operationType.indexOf("FORMATTED_DATA_SET") > -1) {
			output = last.output[0];
		} else if (last.operationType.indexOf("CODE_EXECUTION") > -1) {
			output = last.output[0].output;
		} else if (last.operationType.indexOf("CODE") > -1) {
			output = last.output[0].value[0];
		} else if (last.operationType.indexOf("ERROR") > -1) {
			output = last.output[0];
		} else if (last.operationType.indexOf("CONST_STRING") > -1) {
			output = last.output[0];
		} else if (last.operationType.indexOf("INVALID_SYNTAX") > -1) {
			output = last.output[0];
		} else if (last.operationType.indexOf("VECTOR") > -1) {
			output = last.output[0];
		} else {
			output = last.output;
		}

		return { opType, output };
	}

	/**
	 * Run the cell
	 */
	async _run() {
		const start = new Date();

		try {
			// check the loading state
			if (this._store.isLoading) {
				throw new Error("Cell is already loading");
			}

			// start the loading screen
			this._store.isLoading = true;

			// convert the cells to the raw pixel
			const raw: string | string[] = this.toPixel();

			// TODO: Call tool instead RunMCPTool instead.
			// I think MakePythonMCP needs to be called everytime someone saves

			// Determine if multiple pixels need to be ran.
			if (this._store.parameters.type === "markdown") {
				// set the value
				this._update("parameters.marked", true);

				runInAction(() => {
					// store the operation and output
					this._store.operation = ["MARKDOWN"];
					// save the last output
					this._store.output = this._store.parameters.code;
				});
			} else if (typeof raw === "string") {
				const { opType, output } = await this.runPixel(raw);

				runInAction(() => {
					// store the operation and output
					this._store.operation = opType;

					// save the last output
					this._store.output = output;
				});
			} else if (Array.isArray(raw)) {
				// Collect responses for each call to store in state.
				let opTypes = [];
				const outputs = [];

				for (const str of raw) {
					const { opType, output } = await this.runPixel(str);
					opTypes = [...opTypes, ...opType];
					outputs.push(output);
				}

				runInAction(() => {
					// store the operation and output
					this._store.operation = opTypes;

					// save the last output
					this._store.output = outputs;
				});
			}

			// process side effects from running a pixel
			this._state.processSideEffects(this.operation, this.output);
		} catch (e) {
			runInAction(() => {
				// store the operation and output
				this._store.operation = ["ERROR"];

				// save the last output
				this._store.output = e.message;
			});
		} finally {
			runInAction(() => {
				//TODO: Integrate with backend
				const end = new Date();

				this._store.executionDurationMilliseconds =
					end.getTime() - start.getTime();

				// stop the loading screen
				this._store.isLoading = false;
			});
		}
	}

	/**
	 * Update the the store of the cell
	 * @param path - path of the data to set
	 * @param value - value of the data
	 */
	_update(path: string | null, value: unknown) {
		if (!path) {
			// set the value
			this._store = value as CellStateStoreInterface<D>;
			return;
		}

		// update the parameters
		setValueByPath(this._store, path, value);
	}

	/**
	 * Get the exposed value that can be accesed by a variable
	 */
	get _exposed() {
		return {
			id: this._store.id,
			isExecuted: this.isExecuted,
			isLoading: this.isLoading,
			isError: this.isError,
			isSuccessful: this.isSuccessful,
			error: this.error,
			output: this.output,
			messages: this.messages,
			operation: this.operation,
		};
	}
}
