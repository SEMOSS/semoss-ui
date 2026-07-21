export const MODEL_KEY = "SMSS-SELECTED-MODEL-V3";

export const MCP_EXECUTION_AUTO = "auto";
export const MCP_EXECUTION_ASK = "ask";

export const MCP_DISPLAY_INLINE = "inline";
export const MCP_DISPLAY_SIDEBAR = "sidebar";
export const MCP_DISPLAY_HIDDEN = "hidden";

export const STREAMING_PLACEHOLDER_ID = "STREAMING_PLACEHOLDER_ID";

export const LOADING_MESSAGES = [
	"Thinking through it...",
	"Working on that...",
	"Processing your request...",
	"Checking the details...",
	"Gathering context...",
	"Making progress...",
	"Preparing the result...",
	"Finalizing...",
	"Almost done...",
	"One moment...",
	"Still working...",
] as const;

export const TOOL_CANCELLATION_PROMPT = `The user chose not to execute this tool. This could be for various reasons (wrong parameters, unnecessary step, privacy concerns, timing, manual preference, etc.). You should:
1. Acknowledge their decision without assuming why
2. Ask if they need anything else or if the current state meets their needs  
3. If they want to continue, ask how they'd prefer to proceed
4. Avoid immediately re-suggesting the same tool unless they indicate the issue was just with parameters
5. If this tool has been declined repeatedly, consider it may not fit their workflow preferences
6. Wait for explicit user input before taking any further actions or executing tools`;

export const TOOL_ERROR_PROMPT = `This tool execution failed due to an unexpected error. The error details are included below. You should:
1. Inform the user of the failure and briefly explain what went wrong, using the error details to be specific
2. If the error cause is clear, obvious, and this is the first failure, you may attempt one corrective action — but always explain your reasoning first
3. If this tool has already failed once before, do not retry automatically — stop and check in with the user instead
4. If the error is unclear or complex, ask the user for guidance and suggest alternative approaches`;

export const TOOL_OUTPUT_UNREADABLE_PROMPT = `This tool returned a response, but that response could not be read or processed — the failure occurred when attempting to interpret the output, not during the tool call itself. What the tool actually returned is unknown. You should:
1. Be honest with the user: the tool returned a response, but you could not read or interpret it
2. Do not act on or infer the tool output as if its contents are known to you
3. Suggest a possible reason (e.g., response too large, unexpected format) without overstating certainty
4. Ask the user if they'd like to try again, narrow the request, or proceed a different way
5. Do not repeat the tool call without user confirmation`;

// Hidden note sent to the model after the user stops a response mid-stream, so
// the next turn it knows the prior response was cut short rather than complete.
export const TURN_CANCELLATION_PROMPT = `The user stopped your previous response before it finished generating. This could be for various reasons (they had enough of the answer, saw it going the wrong way, changed their mind, or simply wanted to redirect). You should:
1. Treat the prior response as incomplete — do not assume it fully generated or that anything it described or started was actually carried out
2. Acknowledge the stop without assuming why, and without apologizing excessively
3. Wait for the user's next instruction rather than resuming or re-generating the same response on your own
4. If they ask you to continue, pick up from where you left off; if they redirect, follow the new direction instead
5. Take no further actions and execute no tools until the user has spoken`;
