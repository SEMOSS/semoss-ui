import { ToolCallView } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "toolName",
		type: "string",
		required: true,
		description: 'Displayed as "Ran <toolName>" once expanded.',
	},
	{
		name: "status",
		type: `"running" | "success" | "error"`,
		default: `"running"`,
		description: "Drives the leading icon and expand affordance.",
	},
	{
		name: "arguments",
		type: "Record<string, unknown>",
		description:
			"Shown as formatted JSON in the expanded Parameters section.",
	},
	{
		name: "output",
		type: "string",
		description:
			"Shown in the expanded Result section once the call has resolved (success or error).",
	},
	{
		name: "className",
		type: "string",
		description: "Merged onto the root element via cn().",
	},
];

export const ToolCallViewDoc = () => {
	return (
		<DocPage
			title="ToolCallView"
			description="An expandable inline card for a tool/function call — click to inspect Parameters (always) and Result (once resolved). Renders directly inside a message's parts, not as a separate floating indicator."
		>
			<DemoSection
				title="Running, success, and error states"
				preview={
					<div className="flex flex-col gap-2">
						<ToolCallView
							toolName="lookupClaimStatus"
							status="running"
							arguments={{ claimId: "482" }}
						/>
						<ToolCallView
							toolName="lookupClaimStatus"
							status="success"
							arguments={{ claimId: "482" }}
							output='{"status":"in review","daysLeft":3}'
						/>
						<ToolCallView
							toolName="lookupClaimStatus"
							status="error"
							arguments={{ claimId: "482" }}
							output="Claim not found"
						/>
					</div>
				}
				code={`import { ToolCallView } from "@semoss/chat/components";

<ToolCallView
  toolName="lookupClaimStatus"
  status="running"
  arguments={{ claimId: "482" }}
/>

<ToolCallView
  toolName="lookupClaimStatus"
  status="success"
  arguments={{ claimId: "482" }}
  output='{"status":"in review","daysLeft":3}'
/>

<ToolCallView
  toolName="lookupClaimStatus"
  status="error"
  arguments={{ claimId: "482" }}
  output="Claim not found"
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
