import {
	Alert,
	AlertDescription,
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
import {
	catalogNameSchema,
	createFunctionEngine,
	FUNCTION_METADATA_DESCRIPTION,
	parameterListSchema,
	stringListSchema,
} from "../shared/function-engine.utils";
import { ParameterListField } from "../shared/parameter-list-field";
import { StringListField } from "../shared/string-list-field";

const schema = z.object({
	NAME: catalogNameSchema,
	ENDPOINT: z.string().min(1, "Resource endpoint is required"),
	MODEL: z.string().min(1, "Model deployment name is required"),
	AUTH_TYPE: z.string().min(1, "Authentication type is required"),
	API_KEY: z.string().min(1, "API key or Entra token is required"),
	ALLOWED_DOMAINS: z.string(),
	BLOCKED_DOMAINS: z.string(),
	SEARCH_CONTEXT_SIZE: z.string(),
	REASONING_EFFORT: z.string(),
	COUNTRY: z.string(),
	REGION: z.string(),
	CITY: z.string(),
	TIMEZONE: z.string(),
	INSTRUCTION: z.string(),
	FUNCTION_NAME: z.string().min(1, "Function name is required"),
	FUNCTION_DESCRIPTION: z.string(),
	FUNCTION_PARAMETERS: parameterListSchema,
	FUNCTION_REQUIRED_PARAMETERS: stringListSchema,
});

type FormValues = z.infer<typeof schema>;

/** Add a "Bing Web Search (Foundry)" Function catalog entry. */
export const BingWebSearchForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			ENDPOINT: "",
			MODEL: "",
			AUTH_TYPE: "api_key",
			API_KEY: "",
			ALLOWED_DOMAINS: "",
			BLOCKED_DOMAINS: "",
			SEARCH_CONTEXT_SIZE: "medium",
			REASONING_EFFORT: "",
			COUNTRY: "",
			REGION: "",
			CITY: "",
			TIMEZONE: "",
			INSTRUCTION: "",
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
				{ FUNCTION_TYPE: "BING_SEARCH", ...values },
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
			<Alert>
				<AlertDescription>
					This calls a model deployment that reads the web for you, so
					a search costs a model call plus a grounding tool call and
					returns prose with citations. For raw title/url/snippet
					results, use Brave Web Search instead.
				</AlertDescription>
			</Alert>
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
				description="The Azure OpenAI deployment that performs the grounded search and how it authenticates."
			>
				<FormInput
					name="ENDPOINT"
					label="Resource Endpoint"
					description="The Azure OpenAI resource, ie https://YOUR-RESOURCE.openai.azure.com. The /openai/v1/responses path is added if you leave it off."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ENDPOINT"
				/>
				<FormInput
					name="MODEL"
					label="Model Deployment Name"
					description="The deployment that performs the search, ie gpt-5.5. Must be GPT-4 or later."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-MODEL"
				/>
				<FormSelect
					name="AUTH_TYPE"
					label="Authentication Type"
					description="API key sends the value below on the api-key header. Entra ID sends it as a bearer token."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-AUTH_TYPE"
				>
					<SelectItem value="api_key">API Key</SelectItem>
					<SelectItem value="entra">Microsoft Entra ID</SelectItem>
				</FormSelect>
				<FormInput
					name="API_KEY"
					label="API Key or Entra Token"
					type="password"
					description="For Entra ID the token scope must be https://ai.azure.com/.default"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-API_KEY"
				/>
			</FormSection>
			<FormSection
				title="Settings"
				description="How the search is scoped and how the resulting function is described."
			>
				<FormInput
					name="ALLOWED_DOMAINS"
					label="Allowed Domains"
					description="Comma separated list, up to 100, ie who.int,cdc.gov. Subdomains are included. Leave blank to search the whole web."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ALLOWED_DOMAINS"
				/>
				<FormInput
					name="BLOCKED_DOMAINS"
					label="Blocked Domains"
					description="Comma separated list of domains to exclude from results."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-BLOCKED_DOMAINS"
				/>
				<FormSelect
					name="SEARCH_CONTEXT_SIZE"
					label="Search Context Size"
					description="How much web content the model reads before answering. Higher is more thorough and more expensive."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SEARCH_CONTEXT_SIZE"
				>
					<SelectItem value="low">low</SelectItem>
					<SelectItem value="medium">medium</SelectItem>
					<SelectItem value="high">high</SelectItem>
				</FormSelect>
				<FormInput
					name="REASONING_EFFORT"
					label="Reasoning Effort"
					description="Only for reasoning model deployments, ie low, medium, high. Higher lets the model search repeatedly and take longer. Leave blank for a plain lookup."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-REASONING_EFFORT"
				/>
				<FormInput
					name="COUNTRY"
					label="Country"
					description="Two letter country code to search from, ie US. Leave blank for no country preference."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-COUNTRY"
				/>
				<FormInput
					name="REGION"
					label="Region"
					description="Region or state name, ie Illinois. Only used alongside a country."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-REGION"
				/>
				<FormInput
					name="CITY"
					label="City"
					description="City name, ie Chicago."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-CITY"
				/>
				<FormInput
					name="TIMEZONE"
					label="Time Zone"
					description="IANA time zone identifier, ie America/Chicago. Helps the model resolve words like today."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-TIMEZONE"
				/>
				<FormInput
					name="INSTRUCTION"
					label="Search Instruction"
					description="Prepended to every query to push the model to actually search rather than answer from memory. Leave blank to use the built in instruction."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-INSTRUCTION"
				/>
			</FormSection>
			<FormSection
				title="Function Metadata"
				description={FUNCTION_METADATA_DESCRIPTION}
			>
				<FormInput
					name="FUNCTION_NAME"
					label="Function Name"
					description="Becomes the MCP tool name, so name it for what it does, ie web_research."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_NAME"
				/>
				<FormInput
					name="FUNCTION_DESCRIPTION"
					label="Function Description"
					description="Leave blank to use the built in description of what a grounded search returns."
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-FUNCTION_DESCRIPTION"
				/>
				<ParameterListField
					name="FUNCTION_PARAMETERS"
					label="Function Parameters"
					description="Leave empty to use the built in search parameters: query and country."
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
