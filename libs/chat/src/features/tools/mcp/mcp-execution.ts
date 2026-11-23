/** `SMSS_MCP_EXECUTION` of a tool the chat runs without asking. */
export const MCP_EXECUTION_AUTO = "auto";

/** `SMSS_MCP_EXECUTION` of a tool that waits for the user to allow it. */
export const MCP_EXECUTION_ASK = "ask";

/**
 * Executed by the backend agent harness, not client-dispatched — so neither
 * ever equals MCP_EXECUTION_AUTO, which the FE's own continueToolExecution
 * treats as "run this". The -ask/-auto split preserves the original
 * SMSS_MCP_EXECUTION the tool call carried, so ask/auto-mode rendering checks
 * (grouping, tool UI, custom UI resolution) stay keyed on execution mode alone.
 */
export const MCP_EXECUTION_AGENT_ASK = "agent-ask";

/** An agent-run tool that ran without asking; see {@link MCP_EXECUTION_AGENT_ASK}. */
export const MCP_EXECUTION_AGENT_AUTO = "agent-auto";
