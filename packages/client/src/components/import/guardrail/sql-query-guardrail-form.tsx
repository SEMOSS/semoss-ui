import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	FieldLegend,
	FieldSet,
	Form,
	FormActions,
	FormInput,
	FormSelect,
	FormSelectItem,
	H4,
	Muted,
	Separator,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { createGuardrailEngine } from "@/api/guardrails";
import { EngineFormHeader } from "@/components/import/shared/engine-form-header";
import { useSession } from "@/hooks/use-session";
import { SqlPolicyRulesField } from "./sql-policy-rules-field";
import {
	type BuiltInRules,
	IDENTIFIER_POLICY_FIELDS,
	mergeBuiltInRules,
	type PolicyField,
	type PolicyRule,
	policyRulesSchema,
	REQUIREMENT_OPTIONS,
	REQUIREMENT_VALUES,
	toPolicyJson,
} from "./sql-query-policy";
import { useSqlPolicyBuiltIns } from "./use-sql-policy-built-ins";

/** The query structure policies: each SMSS property, its label and what it controls. */
const QUERY_STRUCTURE_POLICIES = [
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
] as const;

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
	OPERATION_POLICY: policyRulesSchema,
	FUNCTION_POLICY: policyRulesSchema,
	VARIABLE_POLICY: policyRulesSchema,
	KEYWORD_POLICY: policyRulesSchema,
	RELATION_POLICY: policyRulesSchema,
	ROUTINE_POLICY: policyRulesSchema,
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
	OPERATION_POLICY: [],
	FUNCTION_POLICY: [],
	VARIABLE_POLICY: [],
	KEYWORD_POLICY: [],
	RELATION_POLICY: [],
	ROUTINE_POLICY: [],
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
 * the guardrail SMSS file. Each policy's rules become the JSON object the
 * guardrail reads, such as {"SELECT":"FOLLOW_ENGINE_PERMISSIONS","*":"DENY"}.
 * The guardrail keeps applying its built-in rules, which the identifier lists
 * start with, so only a built-in rule whose access changed is written, and one
 * the user removed is written as an exemption.
 *
 * @param values - Validated SQL guardrail configuration.
 * @param builtIns - The chosen dialect's built-in rules, by identifier policy.
 * @returns Every SQL guardrail SMSS property, including its engine type.
 */
export const toSqlQueryGuardrailDetails = (
	values: SqlQueryGuardrailFormValues,
	builtIns: BuiltInRules = {},
): Record<string, string> => {
	const { MODEL_NAME: _modelName, ...configuration } = values;
	const policyBuiltIns: Partial<Record<string, readonly PolicyRule[]>> =
		builtIns;
	return {
		GUARDRAIL_TYPE: "EMBEDDED_SQL_QUERY",
		PROTECT_UNMATCHED_IDENTIFIERS: "true",
		...Object.fromEntries(
			Object.entries(configuration).map(([key, value]) => [
				key,
				Array.isArray(value)
					? toPolicyJson(value, policyBuiltIns[key])
					: String(value),
			]),
		),
	};
};

/** Props for {@link SqlQueryGuardrailForm}. */
export interface SqlQueryGuardrailFormProps {
	/** The guardrail type's logo, shown beside the form's title. */
	icon?: string;
	/** Called with the new guardrail's id once it is created, or with none on cancel. */
	onSubmit: (id?: string) => void;
}

/**
 * Creates an AST-based SQL authorization guardrail with a complete SMSS-backed
 * policy configuration. The identifier lists start with the chosen dialect's
 * built-in rules; a failed create shows its reason above the form's actions.
 */
export const SqlQueryGuardrailForm = ({
	icon,
	onSubmit,
}: SqlQueryGuardrailFormProps) => {
	const insightID = useSession((state) => state.insightID);
	const form = useForm<SqlQueryGuardrailFormValues>({
		resolver: zodResolver(sqlQueryGuardrailSchema),
		defaultValues: SQL_QUERY_GUARDRAIL_DEFAULTS,
	});

	const { errors, isSubmitting } = form.formState;
	const dialect = form.watch("SQL_DIALECT");
	// each identifier list starts with the chosen dialect's built-in rules, which
	// take the place of the previous dialect's; the user's own rules stay
	const policyBuiltIns = useSqlPolicyBuiltIns({
		dialect,
		insightId: insightID,
		onChange: (next, previous) => {
			for (const field of IDENTIFIER_POLICY_FIELDS) {
				form.setValue(
					field,
					mergeBuiltInRules(
						form.getValues(field),
						previous[field] ?? [],
						next[field] ?? [],
					),
					// rows that moved are checked again once a submit showed problems
					{ shouldValidate: form.formState.isSubmitted },
				);
			}
		},
	});
	const builtIns = policyBuiltIns.builtIns;
	const areBuiltInsLoading = policyBuiltIns.status === "LOADING";
	// the identifier lists start folded away, as their built-in rules are long
	const [openPolicies, setOpenPolicies] = useState<readonly PolicyField[]>(
		[],
	);
	const isEveryPolicyOpen = IDENTIFIER_POLICY_FIELDS.every((field) =>
		openPolicies.includes(field),
	);

	/**
	 * Shows or folds away one identifier list.
	 *
	 * @param field - The list's policy.
	 * @returns The handler for the list's label.
	 */
	const handlePolicyOpenChange = (field: PolicyField) => (open: boolean) =>
		setOpenPolicies((previous) =>
			open
				? [...previous, field]
				: previous.filter((openField) => openField !== field),
		);

	const handleEveryPolicyToggle = () =>
		setOpenPolicies(isEveryPolicyOpen ? [] : IDENTIFIER_POLICY_FIELDS);

	// a submit that fails shows every identifier list with a problem
	const handleInvalid = (
		errors: Partial<Record<keyof SqlQueryGuardrailFormValues, unknown>>,
	) =>
		setOpenPolicies((previous) => [
			...previous,
			...IDENTIFIER_POLICY_FIELDS.filter(
				(field) => errors[field] && !previous.includes(field),
			),
		]);

	const handleSubmit = async (
		values: SqlQueryGuardrailFormValues,
	): Promise<void> => {
		// the lists hold the previous dialect's built-in rules until the chosen
		// dialect's are read
		if (areBuiltInsLoading) {
			form.setError("root.server", {
				type: "server",
				message:
					"The built-in rules for the chosen SQL dialect are still loading. Create the guardrail once they are listed.",
			});
			return;
		}

		let engineId: string;
		try {
			engineId = await createGuardrailEngine(
				insightID,
				values.MODEL_NAME,
				toSqlQueryGuardrailDetails(values, builtIns),
			);
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					error,
					"Unable to create the SQL query guardrail",
				),
			});
			return;
		}
		toast.success("Successfully added SQL query guardrail to catalog");
		onSubmit(engineId);
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			onError={handleInvalid}
			noValidate
			aria-busy={isSubmitting}
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

							<SqlPolicyRulesField
								name="OPERATION_POLICY"
								matchKind="operation"
								label="Operation access"
								description="Restrictions on top of platform permissions. A rule applies to every operation, a group of operations, or one operation, and the most specific rule wins: one operation, then its group, then every operation. With no rule, an operation follows normal engine permissions; give one operation Follow engine permissions to exempt it from a broader rule. No access level grants or upgrades access: reads still need view access, and changes still need edit access."
								disabled={isSubmitting}
							/>

							<Separator />

							<FieldSet>
								<FieldLegend>Identifier policies</FieldLegend>
								<Muted>
									Rules for the names the SQL uses, one list
									for each kind. Each list starts with the
									guardrail's built-in rules for the chosen
									SQL dialect: remove one to stop applying it,
									change its access, or add your own. A name
									can end in * to cover everything it starts
									with, and a rule of * alone decides every
									name of its kind. Exact names win over
									patterns, and longer patterns over shorter
									ones.
								</Muted>
								{/* always there, so the loading message is announced */}
								<output className="block text-muted-foreground text-sm empty:hidden">
									{areBuiltInsLoading
										? "Loading the built-in rules for this dialect..."
										: ""}
								</output>
								{policyBuiltIns.status === "ERROR" && (
									<Alert variant="destructive">
										<AlertTitle>
											Built-in rules not listed
										</AlertTitle>
										<AlertDescription>
											The built-in rules for this dialect
											could not be read. The guardrail
											still applies them.
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={policyBuiltIns.refresh}
											>
												Try again
											</Button>
										</AlertDescription>
									</Alert>
								)}
								<div className="flex flex-col gap-6">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="-ml-2 self-start"
										onClick={handleEveryPolicyToggle}
										aria-label={
											isEveryPolicyOpen
												? "Collapse all identifier policies"
												: "Expand all identifier policies"
										}
									>
										{isEveryPolicyOpen ? (
											<ChevronsDownUp aria-hidden />
										) : (
											<ChevronsUpDown aria-hidden />
										)}
										{isEveryPolicyOpen
											? "Collapse all"
											: "Expand all"}
									</Button>
									<SqlPolicyRulesField
										name="FUNCTION_POLICY"
										matchKind="name"
										builtIns={builtIns.FUNCTION_POLICY}
										open={openPolicies.includes(
											"FUNCTION_POLICY",
										)}
										onOpenChange={handlePolicyOpenChange(
											"FUNCTION_POLICY",
										)}
										label="Functions"
										description="Functions the SQL calls, such as PG_SLEEP or CURRENT_DATABASE."
										placeholder="PG_SLEEP*"
										disabled={
											isSubmitting || areBuiltInsLoading
										}
									/>
									<SqlPolicyRulesField
										name="VARIABLE_POLICY"
										matchKind="name"
										builtIns={builtIns.VARIABLE_POLICY}
										open={openPolicies.includes(
											"VARIABLE_POLICY",
										)}
										onOpenChange={handlePolicyOpenChange(
											"VARIABLE_POLICY",
										)}
										label="Variables"
										description="Session and system variables, such as @@VERSION; @@* covers every system variable."
										placeholder="@@*"
										disabled={
											isSubmitting || areBuiltInsLoading
										}
									/>
									<SqlPolicyRulesField
										name="KEYWORD_POLICY"
										matchKind="name"
										builtIns={builtIns.KEYWORD_POLICY}
										open={openPolicies.includes(
											"KEYWORD_POLICY",
										)}
										onOpenChange={handlePolicyOpenChange(
											"KEYWORD_POLICY",
										)}
										label="Keywords"
										description="Keywords that read the session, such as CURRENT_USER."
										placeholder="CURRENT_USER"
										disabled={
											isSubmitting || areBuiltInsLoading
										}
									/>
									<SqlPolicyRulesField
										name="RELATION_POLICY"
										matchKind="name"
										builtIns={builtIns.RELATION_POLICY}
										open={openPolicies.includes(
											"RELATION_POLICY",
										)}
										onOpenChange={handlePolicyOpenChange(
											"RELATION_POLICY",
										)}
										label="Tables and views"
										description="Tables and views as SCHEMA.NAME; INFORMATION_SCHEMA.* covers every table in that schema."
										placeholder="PG_CATALOG.*"
										disabled={
											isSubmitting || areBuiltInsLoading
										}
									/>
									<SqlPolicyRulesField
										name="ROUTINE_POLICY"
										matchKind="name"
										builtIns={builtIns.ROUTINE_POLICY}
										open={openPolicies.includes(
											"ROUTINE_POLICY",
										)}
										onOpenChange={handlePolicyOpenChange(
											"ROUTINE_POLICY",
										)}
										label="Routines"
										description="Procedures the SQL calls, such as XP_CMDSHELL; APP.* covers a schema's routines."
										placeholder="XP_*"
										disabled={
											isSubmitting || areBuiltInsLoading
										}
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
									{QUERY_STRUCTURE_POLICIES.map(
										([name, label, description]) => (
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
										),
									)}
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

				{errors.root?.server?.message && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>
							{errors.root.server.message}
						</AlertDescription>
					</Alert>
				)}
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
