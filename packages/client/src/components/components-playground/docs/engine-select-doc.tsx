import { useState } from "react";
import { EngineSelect } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "name",
		type: "string",
		required: true,
		description:
			'The label shown on the trigger button (e.g. "Select engine" or the chosen engine\'s display name).',
	},
	{
		name: "value",
		type: "string",
		required: true,
		description: 'The chosen engine_id, or "".',
	},
	{
		name: "onChange",
		type: "(engine: Engine) => void",
		required: true,
		description: "",
	},
	{ name: "disabled", type: "boolean", description: "" },
	{ name: "className", type: "string", description: "" },
];

export const EngineSelectDoc = () => {
	const [name, setName] = useState("Select engine");
	const [value, setValue] = useState("");

	return (
		<DocPage
			title="EngineSelect"
			description="A thin wrapper around @semoss/chat's own EngineSelect (ported from @semoss/shared, no longer a dependency), pre-filtered to text-generation models — the exact engine picker used above to connect this docs site to a live backend. Self-contained: it fetches its own engine list via a real pixel call."
		>
			<DemoSection
				preview={
					<EngineSelect
						name={name}
						value={value}
						onChange={(engine) => {
							setValue(engine.engine_id);
							setName(
								engine.engine_display_name ||
									engine.engine_name,
							);
						}}
					/>
				}
				code={`import { EngineSelect } from "@semoss/chat/components";

const [engineId, setEngineId] = useState("");
const [engineName, setEngineName] = useState("Select engine");

<EngineSelect
  name={engineName}
  value={engineId}
  onChange={(engine) => {
    setEngineId(engine.engine_id);
    setEngineName(engine.engine_display_name || engine.engine_name);
  }}
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
