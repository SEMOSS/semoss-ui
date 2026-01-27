import { makeAutoObservable } from "mobx";
import { MCP_EXECUTION_ASK } from "@/constants";
import type { ResponseMessageStore, RoomStore } from "@/stores";
import type { McpDisplay, McpExecution } from "@/types";

/**
 * Tool
 */
export class ToolStore {
	/**
	 * Store the room
	 */
	room: RoomStore = null;

	/**
	 * Store the message
	 */
	message: ResponseMessageStore = null;

	/**
	 * Id for the tool
	 */
	id: string = "";

	/**
	 * Id of the node
	 */
	get nodeId() {
		return `message-${this.message.id}-tool-${this.id}`;
	}

	/**
	 * Json for the tool
	 */
	json: {
		/** tool execution id */
		id: string;

		/**  title of tool **/
		title: string;

		/** meta data from the tool */
		_meta: {
			SMSS_MCP_EXECUTION: McpExecution;
			SMSS_PROJECT_NAME: string;
			SMSS_PROJECT_ID: string;
			SMSS_MCP_UI?: {
				loadingMessage?: string;
				resourceURI?: string;
				displayLocation?: McpDisplay;
			};
		};

		/**  Name of function with app_id **/
		name: string;

		/**  Name of function in mcp json **/
		original_name: string;

		/** Parameters used in the tool */
		parameters: Record<string, unknown>;
	} = {
		id: "",
		title: "",
		_meta: {
			SMSS_MCP_EXECUTION: MCP_EXECUTION_ASK,
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
		},
		name: "",
		original_name: "",
		parameters: {},
	};

	/**
	 * Status for the tool
	 */
	status: "INITIAL" | "LOADING" | "CANCELLED" | "SUCCESS" | "ERROR" =
		"INITIAL";

	/**
	 * Response for the tool
	 */
	response: string = "";

	/**
	 * Track if the tool is open
	 */
	isOpen: boolean = false;

	/**
	 * Deplay information for the tool
	 */
	display: McpDisplay = "sidebar";

	/**
	 * Parameters for the tool
	 */
	parameters: Record<string, unknown> = {};

	constructor(
		room: RoomStore,
		message: ResponseMessageStore,
		json: ToolStore["json"],
	) {
		this.room = room;
		this.message = message;
		this.id = json.id;
		this.json = json;
		this.parameters = json.parameters || {};

		// set the default display
		this.display = json._meta.SMSS_MCP_UI?.displayLocation || "sidebar";

		makeAutoObservable(this);
	}

	/**
	 * Update the parameters of the tool
	 */
	updateParameters = (parameters: Partial<ToolStore["parameters"]>) => {
		this.parameters = {
			...this.parameters,
			...parameters,
		};
	};

	/**
	 * Update the parameters of the tool
	 */
	openTool = (display?: McpDisplay) => {
		if (this.isOpen) {
			// already open in the requested location
			if (this.display === display) {
				return;
			} else {
				this.closeTool();
			}
		}

		// set as open
		this.isOpen = true;

		// update the display if it is defined
		if (display) {
			this.display = display;
		}

		if (this.display === "inline") {
			// noop. processed by component
		} else if (this.display === "sidebar") {
			// Default to sidebar
			this.room.addSidebarNode(this.nodeId, {
				type: "tab",
				name: this.json.title,
				component: "room-tool",
				config: {
					app: this.json._meta.SMSS_PROJECT_ID,
					message: this.message.id,
					tool: this.json,
				},
				enableClose: true,
			});
		} else if (this.display === "hidden") {
			// noop
		}
	};

	/**
	 * Close the tool
	 */
	closeTool = () => {
		// close it
		this.isOpen = false;

		// close the previous location
		if (this.display === "inline") {
			// noop. processed by component
		} else if (this.display === "sidebar") {
			this.room.removeSidebarNode(this.nodeId);
		} else if (this.display === "hidden") {
			// noop
		}
	};
}
