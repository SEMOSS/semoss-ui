export const MODEL_KEY = "SMSS-SELECTED-MODEL-V3";

export const TOKEN_LENGTH = undefined;
export const TEMPERATURE = 0.3;

export const MCP_EXECUTION_AUTO = "auto";
export const MCP_EXECUTION_ASK = "ask";

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

export const TOOL_CANCELLATION_PROMPT = `This tool execution was intentionally cancelled by the user. The AI assistant should inform the user of the tool's cancellation and ask the user for further instructions. The AI assistant may mention alternative tools or actions to take next, but should not take any further actions or select any further tools without user input.`;
export const TOOL_ERROR_PROMPT = `This tool execution failed due to an unexpected error. The AI assistant should inform the user of the tool's failure and ask the user for further instructions. The AI assistant may mention alternative tools or actions to take next, but should not take any further actions or select any further tools without user input.`;
