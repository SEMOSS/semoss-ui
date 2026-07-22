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

export const TOOL_CANCELLATION_PROMPT = `The user cancelled this tool. It may or may not have already run, so its effect is uncertain and its result is unavailable. Guidance:
1. Don't make a point of the cancellation on your own — just respond naturally to what the user says next. If they ask, keep it plain and everyday; don't explain whether or not it ran unless they want specifics.
2. Internally, don't assume it either ran or did nothing; if the outcome matters for what comes next, check or ask rather than guessing.
3. Don't automatically re-run it unless the user says the issue was only with its parameters.
4. Wait for the user's input before taking further actions or executing tools.`;

// Per-tool note when the user stops while tools are still running. A terse
// internal fact only — the behavioral guidance (including keeping the reply
// light and jargon-free) lives once in the hidden TURN_CANCELLATION_PROMPT.
export const TOOL_INTERRUPTED_PROMPT = `Internal note: the user stopped before this tool finished, so its result isn't available and whether it actually ran is uncertain.`;

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

// Hidden note sent to the model after the user stops a turn — whether mid text
// stream or while tools were still running — so the next turn it knows the
// prior turn was cut short rather than complete.
export const TURN_CANCELLATION_PROMPT = `The user stopped your previous response before it finished. This could be for various reasons (they had enough, saw it going the wrong way, changed their mind, or wanted to redirect). Guidance:
1. Don't announce the stop or draw attention to it on your own — just respond naturally to whatever the user says next. If they ask what happened, keep it plain and everyday (e.g. "you stopped me before I finished"); never describe it as a "turn," "interruption," or other system jargon.
2. Internally, treat the previous response as incomplete: don't assume anything it described, began, or called (including any tools) actually ran or took effect. If that matters for what the user asks next, check or ask rather than guessing — but don't volunteer that uncertainty on your own.
3. Don't resume or regenerate on your own; wait for the user's next instruction. If they ask you to continue, pick up where you left off; if they redirect, follow that.
4. Take no further actions and execute no tools until the user has spoken.`;
