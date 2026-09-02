import {
	Form,
	FormActions,
	FormInput,
	FormSection,
	FormSelect,
	SelectItem,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { catalogNameSchema } from "@/utility/catalog";
import {
	createFunctionEngine,
	FUNCTION_METADATA_DESCRIPTION,
	parameterListSchema,
	stringListSchema,
} from "../shared/function-engine.utils";
import { ParameterListField } from "../shared/parameter-list-field";
import { StringListField } from "../shared/string-list-field";

const schema = z.object({
	NAME: catalogNameSchema,
	API_KEY: z.string().min(1, "Subscription token is required"),
	ENDPOINT: z.string(),
	COUNT: z.string(),
	COUNTRY: z.string(),
	SEARCH_LANGUAGE: z.string(),
	UI_LANGUAGE: z.string(),
	SAFE_SEARCH: z.string(),
	FRESHNESS: z.string(),
	EXTRA_SNIPPETS: z.string(),
	SNIPPET_LENGTH: z.string(),
	FUNCTION_NAME: z.string().min(1, "Function name is required"),
	FUNCTION_DESCRIPTION: z.string(),
	FUNCTION_PARAMETERS: parameterListSchema,
	FUNCTION_REQUIRED_PARAMETERS: stringListSchema,
});

type FormValues = z.infer<typeof schema>;

/** Add a "Brave Web Search" Function catalog entry. */
export const BraveWebSearchForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			API_KEY: "",
			ENDPOINT: "https://api.search.brave.com/res/v1/web/search",
			COUNT: "5",
			COUNTRY: "",
			SEARCH_LANGUAGE: "",
			UI_LANGUAGE: "",
			SAFE_SEARCH: "moderate",
			FRESHNESS: "",
			EXTRA_SNIPPETS: "false",
			SNIPPET_LENGTH: "",
			FUNCTION_NAME: "",
			FUNCTION_DESCRIPTION: "",
			FUNCTION_PARAMETERS: [],
			FUNCTION_REQUIRED_PARAMETERS: [],
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "BRAVE_SEARCH", ...values },
				undefined,
				configStore.store.insightID,
			);
			toast.success("Successfully added function database to catalog");
			navigate(`/function/${engineId}`);
		} catch (err) {
			console.error(err);
			toast.error(
				err instanceof Error ? err.message : "Something went wrong",
			);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			className="flex w-full flex-col gap-6"
		>
			<FormSection title="General" description="Name this catalog entry.">
				<FormInput
					name="NAME"
					label="Catalog Name"
					placeholder="Enter a name"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-NAME"
				/>
			</FormSection>
			<FormSection
				title="Credentials"
				description="The token used to authenticate against the Brave Search API."
			>
				<FormInput
					name="API_KEY"
					label="Subscription Token"
					type="password"
					description="The token for the Brave Search API plan, sent as the X-Subscription-Token header."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-API_KEY"
				/>
				<FormInput
					name="ENDPOINT"
					label="Search Endpoint"
					description="Change this only when routing through a proxy that mirrors the Brave web search route."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ENDPOINT"
				/>
			</FormSection>
			<FormSection
				title="Settings"
				description="How search results are scoped and how the resulting function is described."
			>
				<FormInput
					name="COUNT"
					label="Default Result Count"
					type="number"
					description="Results returned when the caller does not ask for a specific number. A single search is capped at 20."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-COUNT"
				/>
				<FormInput
					name="COUNTRY"
					label="Country"
					description="Two letter country code to search from, ie US. Leave blank for no country preference."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-COUNTRY"
				/>
				<FormInput
					name="SEARCH_LANGUAGE"
					label="Search Language"
					description="Two letter language code the results should be written in, ie en. Leave blank for any language."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SEARCH_LANGUAGE"
				/>
				<FormInput
					name="UI_LANGUAGE"
					label="Response Metadata Language"
					description="Language for labels in the response itself, ie en-US. Rarely needs setting."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-UI_LANGUAGE"
				/>
				<FormSelect
					name="SAFE_SEARCH"
					label="Safe Search"
					description="How aggressively adult content is filtered out of the results."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SAFE_SEARCH"
				>
					<SelectItem value="off">off</SelectItem>
					<SelectItem value="moderate">moderate</SelectItem>
					<SelectItem value="strict">strict</SelectItem>
				</FormSelect>
				<FormInput
					name="FRESHNESS"
					label="Default Freshness"
					description="Restricts every search to recent results. Use pd for the last day, pw week, pm month, py year, or a YYYY-MM-DDtoYYYY-MM-DD range. Leave blank for no restriction."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FRESHNESS"
				/>
				<FormSelect
					name="EXTRA_SNIPPETS"
					label="Extra Snippets"
					description="Return up to five additional excerpts per result. More grounding per source, at the cost of more tokens. Requires a plan that includes it."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-EXTRA_SNIPPETS"
				>
					<SelectItem value="false">false</SelectItem>
					<SelectItem value="true">true</SelectItem>
				</FormSelect>
				<FormInput
					name="SNIPPET_LENGTH"
					label="Snippet Character Limit"
					type="number"
					description="Trims each result snippet to this many characters so a wide search cannot fill up a model's context. Leave blank to return the full snippet."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SNIPPET_LENGTH"
				/>
			</FormSection>
			<FormSection
				title="Function Metadata"
				description={FUNCTION_METADATA_DESCRIPTION}
			>
				<FormInput
					name="FUNCTION_NAME"
					label="Function Name"
					description="Becomes the MCP tool name, so name it for what it does, ie web_search."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_NAME"
				/>
				<FormInput
					name="FUNCTION_DESCRIPTION"
					label="Function Description"
					description="Leave blank to use the built in description of what a web search returns."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_DESCRIPTION"
				/>
				<ParameterListField
					name="FUNCTION_PARAMETERS"
					label="Function Parameters"
					description="Leave empty to use the built in search parameters: query, limit, page, country, freshness, and safeSearch."
					disabled={form.formState.isSubmitting}
				/>
				<StringListField
					name="FUNCTION_REQUIRED_PARAMETERS"
					label="Function Required Parameters"
					description="List the names of parameters above that must be provided when calling this function."
					disabled={form.formState.isSubmitting}
				/>
			</FormSection>
			<FormActions
				isSubmitting={form.formState.isSubmitting}
				onCancel={() => navigate(-1)}
				submitLabel="Create"
			/>
		</Form>
	);
};
