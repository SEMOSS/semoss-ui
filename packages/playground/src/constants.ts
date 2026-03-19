export const MODEL_KEY = "SMSS-SELECTED-MODEL-V3";

export const TOKEN_LENGTH = undefined;
export const TEMPERATURE = 0.3;

export const MCP_EXECUTION_AUTO = "auto";
export const MCP_EXECUTION_ASK = "ask";

export const MCP_DISPLAY_INLINE = "inline";
export const MCP_DISPLAY_SIDEBAR = "sidebar";
export const MCP_DISPLAY_HIDDEN = "hidden";

export const LOADING_MESSAGES = [
	"Thinking...",
	"Processing...",
	"Still thinking...",
	"Hold tight...",
	"Hang tight...",
	"Almost there...",
	"One sec...",
	"On it...",
	"Working...",
	"Nearly ready...",
] as const;

export const TOOL_CANCELLATION_PROMPT = `The user chose not to execute this tool. This could be for various reasons (wrong parameters, unnecessary step, privacy concerns, timing, manual preference, etc.). You should:
1. Acknowledge their decision without assuming why
2. Ask if they need anything else or if the current state meets their needs  
3. If they want to continue, ask how they'd prefer to proceed
4. Avoid immediately re-suggesting the same tool unless they indicate the issue was just with parameters
5. If this tool has been declined repeatedly, consider it may not fit their workflow preferences
6. Wait for explicit user input before taking any further actions or executing tools`;

export const TOOL_ERROR_PROMPT = `This tool execution failed due to an unexpected error. You should:
1. Inform the user of the failure and briefly explain what went wrong
2. If the error cause is clear and you know how to fix it (e.g., incorrect parameter, missing dependency), you may attempt one corrective action
3. If the error is unclear or complex, ask the user for guidance and suggest alternative approaches
4. Always explain your reasoning before taking any corrective actions`;

export const TOOL_OUTPUT_UNREADABLE_PROMPT = `This tool was called and returned a response, but that response could not be read — likely because the output was too large to process or something went wrong when generating the next message. You should:
1. Inform the user that the tool result was unavailable and briefly explain the likely cause
2. Avoid acting on the tool output as if its contents are known
3. If the intent is clear, ask the user if they'd like you to try again or proceed a different way
4. Do not repeat the tool call without user confirmation`;
