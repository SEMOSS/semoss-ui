import {
	FieldLegend,
	FieldSet,
	Form,
	FormActions,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormSwitch,
	FormTextarea,
	H4,
	Muted,
	Separator,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { createGuardrailEngine } from "@/api";
import { useRootStore } from "@/hooks";
import { EngineFormHeader } from "../shared/engine-form-header";

const REQUIREMENT_VALUES = [
	"FOLLOW_ENGINE_PERMISSIONS",
	"READ_ONLY",
	"EDIT",
	"OWNER",
	"DENY",
] as const;

const REQUIREMENT_OPTIONS = [
	{
		value: "FOLLOW_ENGINE_PERMISSIONS",
		label: "Follow engine permissions",
	},
	{ value: "READ_ONLY", label: "Require view access" },
	{ value: "EDIT", label: "Require edit access" },
	{ value: "OWNER", label: "Require database ownership" },
	{ value: "DENY", label: "Always deny" },
] as const;

const OPERATION_GROUPS = [
	{
		name: "DDL",
		operations: [
			"ALTER_TABLE",
			"ALTER_VIEW",
			"COMMENT",
			"CREATE_INDEX",
			"CREATE_TABLE",
			"CREATE_VIEW",
			"DROP",
			"SELECT_INTO",
			"TRUNCATE",
		],
	},
	{ name: "LOCK", operations: ["SELECT_FOR_UPDATE"] },
	{ name: "METADATA", operations: ["DESCRIBE", "SHOW"] },
	{ name: "READ", operations: ["EXPLAIN", "SELECT", "VALUES"] },
	{ name: "ROUTINE", operations: ["BLOCK", "EXECUTE"] },
	{ name: "SESSION", operations: ["DECLARE", "SET", "USE"] },
	{ name: "TRANSACTION", operations: ["COMMIT"] },
	{ name: "UNKNOWN", operations: ["UNKNOWN"] },
	{
		name: "WRITE",
		operations: [
			"DELETE",
			"INSERT",
			"MERGE",
			"REPLACE",
			"UPDATE",
			"UPSERT",
		],
	},
] as const;

const EXACT_OPERATIONS = OPERATION_GROUPS.flatMap((group) => group.operations);

const PolicyExample = ({ value }: { value: string }) => (
	<span className="block min-w-0">
		<span className="mb-1 block">Example</span>
		<code className="block whitespace-pre-wrap break-words rounded-md border border-border/70 bg-muted/40 px-2 py-1.5 font-mono text-foreground text-xs leading-relaxed">
			{value}
		</code>
	</span>
);

const OperationPolicyReference = () => (
	<div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
		<p>
			Use <code>*</code> for every operation, a group name for all
			operations in that group, or an exact operation name. Precedence is
			exact operation, then group, then <code>*</code>.
		</p>
		<p className="text-muted-foreground text-xs leading-relaxed">
			If no rule matches, the operation follows normal engine permissions.
			Use <code>FOLLOW_ENGINE_PERMISSIONS</code> as an exact exception to
			a more general group or <code>*</code> restriction. Platform
			permissions always apply: reads require view access and mutating or
			control operations require edit access.
		</p>
		<div className="grid gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
			{OPERATION_GROUPS.map((group) => (
				<div className="contents" key={group.name}>
					<code className="font-semibold text-foreground text-xs">
						{group.name}
					</code>
					<code className="whitespace-normal break-words text-xs">
						{group.operations.join(", ")}
					</code>
				</div>
			))}
		</div>
		<div className="border-border border-t pt-2">
			<span className="font-medium text-foreground">Access values: </span>
			<code className="whitespace-normal break-words text-xs">
				FOLLOW_ENGINE_PERMISSIONS, READ_ONLY, EDIT, OWNER, DENY
			</code>
			<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
				FOLLOW_ENGINE_PERMISSIONS leaves the database engine's normal
				authorization in control. READ_ONLY requires existing view
				access, EDIT requires existing edit access, OWNER requires
				existing ownership, and DENY blocks everyone. No value grants or
				upgrades access.
			</p>
		</div>
		<div className="space-y-1 border-border border-t pt-2 text-xs leading-relaxed">
			<p className="font-medium text-foreground">Examples</p>
			<p className="text-muted-foreground">
				<code>
					{'{"SELECT":"FOLLOW_ENGINE_PERMISSIONS","*":"DENY"}'}
				</code>{" "}
				leaves normally authorized selects unchanged and denies every
				other operation, even for owners.
			</p>
			<p className="text-muted-foreground">
				<code>
					{'{"DDL":"DENY","TRUNCATE":"FOLLOW_ENGINE_PERMISSIONS"}'}
				</code>{" "}
				denies DDL generally but returns TRUNCATE to normal engine
				permissions. Viewers remain blocked; edit access is still
				required.
			</p>
		</div>
	</div>
);

const policyMapSchema = z
	.string()
	.trim()
	.min(1, "Enter a JSON policy object")
	.refine((value) => {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (
				typeof parsed !== "object" ||
				parsed === null ||
				Array.isArray(parsed)
			) {
				return false;
			}

			return Object.entries(parsed).every(([key, requirement]) => {
				if (
					key.trim().length === 0 ||
					typeof requirement !== "string"
				) {
					return false;
				}
				const normalized = requirement.trim().toUpperCase();
				return REQUIREMENT_VALUES.some(
					(allowed) => allowed === normalized,
				);
			});
		} catch {
			return false;
		}
	}, "Use a JSON object whose values are FOLLOW_ENGINE_PERMISSIONS, READ_ONLY, EDIT, OWNER, or DENY");

const operationPolicyKeys = new Set<string>([
	"*",
	...OPERATION_GROUPS.map((group) => group.name),
	...EXACT_OPERATIONS,
]);

const operationPolicyMapSchema = policyMapSchema.refine((value) => {
	try {
		const policy = JSON.parse(value) as Record<string, unknown>;
		return Object.keys(policy).every((key) =>
			operationPolicyKeys.has(key.trim().toUpperCase()),
		);
	} catch {
		return false;
	}
}, "Use *, an operation group, or an exact operation listed above");

const nonNegativeIntegerSchema = z
	.string()
	.trim()
	.regex(/^\d+$/, "Enter a non-negative whole number")
	.refine((value) => Number(value) <= 2_147_483_647, "Value is too large");

const sqlQueryGuardrailSchema = z.object({
	MODEL_NAME: z
		.string()
		.trim()
		.min(1, "Catalog name is required")
		.regex(
			/^[\w\-\s]+$/,
			"Use only letters, numbers, spaces, underscores, and dashes",
		),
	SQL_DIALECT: z.enum([
		"GENERIC",
		"POSTGRESQL",
		"SQL_SERVER",
		"MYSQL",
		"MARIADB",
		"ORACLE",
	]),
	SQUARE_BRACKET_QUOTATION: z.enum(["AUTO", "ENABLED", "DISABLED"]),
	PARSER_FAILURE_POLICY: z.enum(REQUIREMENT_VALUES),
	MULTI_STATEMENT_POLICY: z.enum(REQUIREMENT_VALUES),
	OPERATION_POLICY: operationPolicyMapSchema,
	FUNCTION_POLICY: policyMapSchema,
	VARIABLE_POLICY: policyMapSchema,
	KEYWORD_POLICY: policyMapSchema,
	RELATION_POLICY: policyMapSchema,
	ROUTINE_POLICY: policyMapSchema,
	PROTECT_UNMATCHED_IDENTIFIERS: z.boolean(),
	DELETE_WITHOUT_WHERE_POLICY: z.enum(REQUIREMENT_VALUES),
	UPDATE_WITHOUT_WHERE_POLICY: z.enum(REQUIREMENT_VALUES),
	SELECT_STAR_POLICY: z.enum(REQUIREMENT_VALUES),
	CARTESIAN_JOIN_POLICY: z.enum(REQUIREMENT_VALUES),
	RECURSIVE_CTE_POLICY: z.enum(REQUIREMENT_VALUES),
	JOIN_LIMIT_POLICY: z.enum(REQUIREMENT_VALUES),
	MAX_JOINS: nonNegativeIntegerSchema,
	MAX_QUERY_LENGTH: nonNegativeIntegerSchema,
});

type SqlQueryGuardrailFormValues = z.infer<typeof sqlQueryGuardrailSchema>;

export const SQL_QUERY_GUARDRAIL_DEFAULTS: SqlQueryGuardrailFormValues = {
	MODEL_NAME: "",
	SQL_DIALECT: "GENERIC",
	SQUARE_BRACKET_QUOTATION: "AUTO",
	PARSER_FAILURE_POLICY: "DENY",
	MULTI_STATEMENT_POLICY: "DENY",
	OPERATION_POLICY: "{}",
	FUNCTION_POLICY: "{}",
	VARIABLE_POLICY: "{}",
	KEYWORD_POLICY: "{}",
	RELATION_POLICY: "{}",
	ROUTINE_POLICY: "{}",
	PROTECT_UNMATCHED_IDENTIFIERS: true,
	DELETE_WITHOUT_WHERE_POLICY: "DENY",
	UPDATE_WITHOUT_WHERE_POLICY: "DENY",
	SELECT_STAR_POLICY: "FOLLOW_ENGINE_PERMISSIONS",
	CARTESIAN_JOIN_POLICY: "FOLLOW_ENGINE_PERMISSIONS",
	RECURSIVE_CTE_POLICY: "OWNER",
	JOIN_LIMIT_POLICY: "DENY",
	MAX_JOINS: "0",
	MAX_QUERY_LENGTH: "100000",
};

/**
 * Converts validated form values into the string-valued properties written to
 * the guardrail SMSS file.
 *
 * @param values - Validated SQL guardrail configuration.
 * @returns Every SQL guardrail SMSS property, including its engine type.
 */
export const toSqlQueryGuardrailDetails = (
	values: SqlQueryGuardrailFormValues,
): Record<string, string> => {
	const { MODEL_NAME: _modelName, ...configuration } = values;
	return {
		GUARDRAIL_TYPE: "EMBEDDED_SQL_QUERY",
		...Object.fromEntries(
			Object.entries(configuration).map(([key, value]) => [
				key,
				String(value),
			]),
		),
	};
};

interface SqlQueryGuardrailFormProps {
	icon?: string;
	onSubmit: (id?: string) => void;
}

/**
 * Creates an AST-based SQL authorization guardrail with a complete SMSS-backed
 * policy configuration.
 */
export const SqlQueryGuardrailForm = ({
	icon,
	onSubmit,
}: SqlQueryGuardrailFormProps) => {
	const { configStore } = useRootStore();
	const form = useForm<SqlQueryGuardrailFormValues>({
		resolver: zodResolver(sqlQueryGuardrailSchema),
		defaultValues: SQL_QUERY_GUARDRAIL_DEFAULTS,
		mode: "onChange",
	});

	const isSubmitting = form.formState.isSubmitting;

	const handleSubmit = async (values: SqlQueryGuardrailFormValues) => {
		try {
			const engineId = await createGuardrailEngine(
				configStore.store.insightID,
				values.MODEL_NAME,
				toSqlQueryGuardrailDetails(values),
			);
			toast.success("Successfully added SQL query guardrail to catalog");
			onSubmit(engineId);
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to create the SQL query guardrail",
			);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			className="my-4"
			data-testid="sql-query-guardrail-form"
		>
			<EngineFormHeader
				testIdPrefix="sql-query-guardrail"
				icon={icon}
				title="SQL Query Policy"
				description="Parse SQL into an AST and authorize operations, identifiers, and query structure against the caller's database access."
			/>

			<div
				className="mt-4 mb-8"
				data-testid="sql-query-guardrail-form-box"
			>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
						<div className="flex flex-1 flex-col gap-1">
							<H4 className="font-semibold text-base tracking-tight">
								General
							</H4>
							<Muted className="text-muted-foreground text-sm leading-6">
								Basic information used to identify the guardrail
								in the catalog.
							</Muted>
						</div>
						<div className="flex flex-2 flex-col gap-2">
							<FormInput
								name="MODEL_NAME"
								label="Catalog name"
								description="Name used to identify this guardrail in the catalog."
								disabled={isSubmitting}
								autoFocus
								data-testid="sql-query-guardrail-name"
							/>
						</div>
					</div>

					<Separator />

					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
						<div className="flex flex-1 flex-col gap-1">
							<H4 className="font-semibold text-base tracking-tight">
								Settings
							</H4>
							<Muted className="text-muted-foreground text-sm leading-6">
								Configure how SQL is parsed and which
								database-aware policies are enforced.
							</Muted>
						</div>
						<div className="flex flex-2 flex-col gap-6">
							<FieldSet>
								<FieldLegend>Parser behavior</FieldLegend>
								<Muted>
									Select the database syntax profile and how
									unsupported or stacked statements are
									handled.
								</Muted>
								<div className="grid gap-4 md:grid-cols-2">
									<FormSelect
										name="SQL_DIALECT"
										label="SQL dialect"
										description="Selects built-in safety rules for identifiers not matched by your configured policies."
										disabled={isSubmitting}
									>
										<FormSelectItem value="GENERIC">
											Generic
										</FormSelectItem>
										<FormSelectItem value="POSTGRESQL">
											PostgreSQL
										</FormSelectItem>
										<FormSelectItem value="SQL_SERVER">
											SQL Server
										</FormSelectItem>
										<FormSelectItem value="MYSQL">
											MySQL
										</FormSelectItem>
										<FormSelectItem value="MARIADB">
											MariaDB
										</FormSelectItem>
										<FormSelectItem value="ORACLE">
											Oracle
										</FormSelectItem>
									</FormSelect>
									<FormSelect
										name="SQUARE_BRACKET_QUOTATION"
										label="Square-bracket quotation"
										description="AUTO enables brackets for SQL Server only."
										disabled={isSubmitting}
									>
										<FormSelectItem value="AUTO">
											Auto
										</FormSelectItem>
										<FormSelectItem value="ENABLED">
											Enabled
										</FormSelectItem>
										<FormSelectItem value="DISABLED">
											Disabled
										</FormSelectItem>
									</FormSelect>
									<FormSelect
										name="PARSER_FAILURE_POLICY"
										label="Parser failure policy"
										description="DENY is recommended for unrecognized vendor syntax."
										disabled={isSubmitting}
									>
										{REQUIREMENT_OPTIONS.map((option) => (
											<FormSelectItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</FormSelectItem>
										))}
									</FormSelect>
									<FormSelect
										name="MULTI_STATEMENT_POLICY"
										label="Multiple-statement policy"
										description="Controls raw multi-statement SQL passed to one engine call. SqlQuery batches are AST-split and checked statement by statement."
										disabled={isSubmitting}
									>
										{REQUIREMENT_OPTIONS.map((option) => (
											<FormSelectItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</FormSelectItem>
										))}
									</FormSelect>
								</div>
							</FieldSet>

							<Separator />

							<FieldSet>
								<FieldLegend>Operation access</FieldLegend>
								<Muted>
									Add restrictions on top of platform
									permissions. Within your configured map,
									exact operations override groups, and groups
									override the catch-all.
								</Muted>
								<OperationPolicyReference />
								<FormTextarea
									name="OPERATION_POLICY"
									label="Operation policy JSON"
									description={
										<PolicyExample value='{"SELECT":"FOLLOW_ENGINE_PERMISSIONS","*":"DENY"}' />
									}
									placeholder='{"DELETE":"OWNER","TRUNCATE":"DENY","WRITE":"EDIT"}'
									rows={5}
									spellCheck={false}
									disabled={isSubmitting}
								/>
							</FieldSet>

							<Separator />

							<FieldSet>
								<FieldLegend>Identifier policies</FieldLegend>
								<Muted>
									Each JSON map controls one identifier
									category extracted from the SQL AST. Use{" "}
									<code>{'{"*":"DENY"}'}</code> as a catch-all
									for that category. Exact names and
									more-specific wildcards take precedence. If
									no configured rule matches, SEMOSS uses its
									built-in safety rule for that identifier. A
									configured catch-all decides the entire
									category, so no identifier is unmentioned.
								</Muted>
								<FormSwitch
									name="PROTECT_UNMATCHED_IDENTIFIERS"
									label="Protect identifiers not listed"
									description="Apply built-in DENY policies to the guardrail's known sensitive functions, variables, keywords, and routines, and OWNER policies to known system-catalog relations. A matching custom policy below takes precedence over the built-in restriction."
									disabled={isSubmitting}
								/>
								<div className="grid gap-4 md:grid-cols-2">
									<FormTextarea
										name="FUNCTION_POLICY"
										label="Function policy JSON"
										description={
											<PolicyExample value='{"CURRENT_DATABASE":"OWNER","PG_SLEEP":"DENY"}' />
										}
										placeholder='{"PG_SLEEP*":"DENY","CURRENT_DATABASE":"OWNER"}'
										rows={4}
										spellCheck={false}
										disabled={isSubmitting}
									/>
									<FormTextarea
										name="VARIABLE_POLICY"
										label="Variable policy JSON"
										description={
											<PolicyExample value='{"@@*":"DENY","@*":"EDIT"}' />
										}
										placeholder='{"@@*":"DENY"}'
										rows={4}
										spellCheck={false}
										disabled={isSubmitting}
									/>
									<FormTextarea
										name="KEYWORD_POLICY"
										label="Keyword policy JSON"
										description={
											<PolicyExample value='{"CURRENT_USER":"OWNER"}' />
										}
										placeholder='{"CURRENT_USER":"DENY"}'
										rows={4}
										spellCheck={false}
										disabled={isSubmitting}
									/>
									<FormTextarea
										name="RELATION_POLICY"
										label="Relation policy JSON"
										description={
											<PolicyExample value='{"PG_CATALOG.*":"OWNER","INFORMATION_SCHEMA.*":"READ_ONLY"}' />
										}
										placeholder='{"PG_CATALOG.*":"OWNER","INFORMATION_SCHEMA.*":"READ_ONLY"}'
										rows={4}
										spellCheck={false}
										disabled={isSubmitting}
									/>
									<FormTextarea
										name="ROUTINE_POLICY"
										label="Routine policy JSON"
										description={
											<PolicyExample value='{"XP_*":"DENY","APP.*":"OWNER"}' />
										}
										placeholder='{"XP_*":"DENY","APP.*":"OWNER"}'
										rows={4}
										spellCheck={false}
										disabled={isSubmitting}
									/>
								</div>
							</FieldSet>

							<Separator />

							<FieldSet>
								<FieldLegend>Query structure</FieldLegend>
								<Muted>
									Apply additional requirements to destructive
									or potentially expensive AST structures.
								</Muted>
								<div className="grid gap-4 md:grid-cols-2">
									{(
										[
											[
												"DELETE_WITHOUT_WHERE_POLICY",
												"DELETE without WHERE",
												"Controls unbounded DELETE statements.",
											],
											[
												"UPDATE_WITHOUT_WHERE_POLICY",
												"UPDATE without WHERE",
												"Controls unbounded UPDATE statements.",
											],
											[
												"SELECT_STAR_POLICY",
												"SELECT star",
												"Controls wildcard column selection.",
											],
											[
												"CARTESIAN_JOIN_POLICY",
												"Cartesian joins",
												"Controls CROSS JOIN and joins without a condition.",
											],
											[
												"RECURSIVE_CTE_POLICY",
												"Recursive CTE",
												"Controls recursive common table expressions.",
											],
											[
												"JOIN_LIMIT_POLICY",
												"Join limit exceeded",
												"Applied when a query exceeds the configured join limit.",
											],
										] as const
									).map(([name, label, description]) => (
										<FormSelect
											key={name}
											name={name}
											label={label}
											description={description}
											disabled={isSubmitting}
										>
											{REQUIREMENT_OPTIONS.map(
												(option) => (
													<FormSelectItem
														key={option.value}
														value={option.value}
													>
														{option.label}
													</FormSelectItem>
												),
											)}
										</FormSelect>
									))}
									<FormInput
										name="MAX_JOINS"
										type="number"
										min={0}
										step={1}
										label="Maximum joins"
										description="Set to 0 to disable the join-count limit."
										disabled={isSubmitting}
									/>
									<FormInput
										name="MAX_QUERY_LENGTH"
										type="number"
										min={0}
										step={1}
										label="Maximum query length"
										description="Maximum SQL characters; set to 0 for no application limit."
										disabled={isSubmitting}
									/>
								</div>
							</FieldSet>
						</div>
					</div>

					<Separator />
				</div>

				<FormActions
					className="mt-4"
					isSubmitting={isSubmitting}
					onCancel={() => onSubmit()}
					submitLabel="Create guardrail"
				/>
			</div>
		</Form>
	);
};
