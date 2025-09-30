import type { FieldDefinition } from "./model-import.constants";

interface ModelImportFormProps {
	/** Optional model name being configured */
	name?: string;
	/**
	 * Fields to be rendered in the form
	 */
	fields: FieldDefinition[];
	/**
	 * advanced Fields to be rendered in the form (collapsible section)
	 */
	advanced: FieldDefinition[];
}

export const ModelImportForm = (props: ModelImportFormProps) => {
	const { name, fields, advanced } = props;

	return (
		<div>
			<h3>{name ? `Configure ${name}` : "Configure Model"}</h3>
			<div>
				<h4>Fields</h4>
				<ul>
					{fields.map((f) => (
						<li key={f.key}>
							{f.label} ({f.key}) - type: {f.type}
						</li>
					))}
				</ul>
			</div>
			<div>
				<h4>Advanced</h4>
				<ul>
					{advanced.map((f) => (
						<li key={f.key}>
							{f.label} ({f.key}) - type: {f.type}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};
