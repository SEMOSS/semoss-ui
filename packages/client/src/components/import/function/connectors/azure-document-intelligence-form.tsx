import {
	Form,
	FormActions,
	FormInput,
	FormSection,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { catalogNameSchema } from "@/utility/catalog";
import { createFunctionEngine } from "../shared/function-engine.utils";

const schema = z.object({
	NAME: catalogNameSchema,
	URL: z.string().min(1, "URL is required"),
	API_KEY: z.string().min(1, "API key is required"),
});

type FormValues = z.infer<typeof schema>;

/** Add an "Azure Document Intelligence" Function catalog entry. */
export const AzureDocumentIntelligenceForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			URL: "",
			API_KEY: "",
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{
					FUNCTION_TYPE:
						"AZURE_DOCUMENT_INTELLIGENCE_CUSTOM_EMBEDDINGS",
					...values,
				},
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
				description="The Azure resource and key used to call Document Intelligence."
			>
				<FormInput
					name="URL"
					label="URL"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-URL"
				/>
				<FormInput
					name="API_KEY"
					label="API Key"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-API_KEY"
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
