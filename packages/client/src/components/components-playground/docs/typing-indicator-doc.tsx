import { TypingIndicator } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "className",
		type: "string",
		description: "Merged onto the root element via cn().",
	},
];

export const TypingIndicatorDoc = () => {
	return (
		<DocPage
			title="TypingIndicator"
			description="A rotating 'Thinking...' status shown by MessageList while a response hasn't started streaming any content yet."
		>
			<DemoSection
				preview={<TypingIndicator />}
				code={`import { TypingIndicator } from "@semoss/chat/components";

<TypingIndicator />`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
