/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */

import { FileUploadOutlined } from "@mui/icons-material";
import { ChevronRight, SearchIcon, UploadIcon } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { GUARDRAIL_CONNECTION } from "./guardrail-import.constants";
import { GuardrailForm } from "./guardrail-import-form";
import { GuardrailTitleCard } from "./guardrail-title-card";

interface guardrail {
	fields: [];
	advanced: [];
	id: number;
	name: string;
	icon: string;
	disable: boolean;
}

export const GuardrailImport: React.FC<{ name: string }> = ({ name }) => {
	const navigate = useNavigate();
	const { monolithStore, configStore } = useRootStore();
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTab, setSelectedTab] = useState("");
	const [selectedDatabase, setSelectedDatabase] = useState<guardrail | null>(
		null,
	);

	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [filedata, setFiledata] = useState(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const GuardrailOptions = GUARDRAIL_CONNECTION;
	const CategoryDescription = GUARDRAIL_CONNECTION.description;

	const pageTitle = "Connect to Guardrail Database";
	const pageDescription =
		"In a platform where safe and reliable interactions are critical, connecting to guardrails allows you to seamlessly integrate predefined or custom safety rules into your workflows. Whether you're a developer, data engineer, or product owner, this page helps you explore, configure, and apply guardrails to maintain controlled and secure platform operations.";

	const tabLabels = useMemo(() => {
		return Object.keys(GuardrailOptions).filter(
			(key) => key !== "description",
		);
	}, []);
	const allDatabases = useMemo(() => {
		return [...(GuardrailOptions.GUARDRAIL || [])];
	}, [GuardrailOptions]);

	const DatabasesForTab = useMemo(() => {
		return GuardrailOptions[selectedTab] || [];
	}, [selectedTab, GuardrailOptions, allDatabases]);

	// Set initial tab
	useEffect(() => {
		if (tabLabels.length > 0 && !selectedTab) {
			setSelectedTab(tabLabels[0]);
		}
	}, [tabLabels]);

	const onSubmit = async (data) => {
		setLoading(true);
		try {
			const uploadedFiles = await uploadFile(
				[data],
				configStore.store.insightID,
			);

			if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
				toast.error("Upload failed or returned invalid response.");
				setFiledata(null);
				return;
			}
			const pixelExpressions = uploadedFiles.map(
				(file) =>
					`UploadEngine(filePath=["${uploadedFiles[0].fileLocation}"], engineTypes=["GUARDRAIL"])`,
			);
			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					toast.error(String(output));
					setFiledata(null);
					return;
				}
				toast.success("Successfully Created Guardrail Database");
				navigate(`/engine/guardrail/${output.database_id}`);
			}
		} catch {
			toast.error("Upload failed or returned invalid response.");
			setFiledata(null);
		} finally {
			setLoading(false);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.name.endsWith(".zip")) {
				setFiledata(file);
			} else {
				toast.error("Please upload a ZIP file");
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			setFiledata(files[0]);
		}
	};

	const renderBreadcrumbs = () => (
		<Breadcrumb className="mb-4">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						className="cursor-pointer"
						onClick={() =>
							window.history.length > 1
								? navigate(-1)
								: navigate("/")
						}
						data-testid="breadcrumb-catalog"
					>
						{name} Catalog
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator>
					<ChevronRight />
				</BreadcrumbSeparator>
				<BreadcrumbItem>
					{selectedDatabase ? (
						<BreadcrumbLink
							className="cursor-pointer"
							onClick={() => {
								setSelectedDatabase(null);
							}}
							data-testid="breadcrumb-page"
						>
							Connect to Guardrail
						</BreadcrumbLink>
					) : (
						<BreadcrumbPage data-testid="breadcrumb-page">
							Connect to Guardrail
						</BreadcrumbPage>
					)}
				</BreadcrumbItem>
				{selectedDatabase && (
					<>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage data-testid="breadcrumb-selected-storage">
								{selectedDatabase.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);

	const renderDatabaseGrid = (Databases: guardrail[]) => (
		<div
			className="mt-4 grid grid-cols-6 gap-2"
			data-testid="guardrail-grid"
		>
			{Databases.filter((v) =>
				v.name.toLowerCase().includes(search.toLowerCase()),
			).map((v) => (
				<div key={v.id}>
					<GuardrailTitleCard
						guardrail={{
							...v,
							display: v.name,
						}}
						onGuardrailSelect={() => {
							setSelectedDatabase(v);
						}}
					/>
				</div>
			))}
		</div>
	);

	const handleFileUpload = (flag: boolean) => {
		// Open or close the file upload modal based on the provided flag
		setIsFileUploadModalOpen(flag);
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<P className="text-muted-foreground">Loading...</P>
				</div>
			</div>
		);
	}

	return (
		<div>
			{renderBreadcrumbs()}
			{/* File Upload Modal */}
			<Dialog
				open={isFileUploadModalOpen}
				onOpenChange={setIsFileUploadModalOpen}
			>
				<DialogContent
					className="w-[600px]"
					data-testid="guardrail-zip-upload-modal"
				>
					<div className="flex h-full w-full flex-col gap-4">
						<P
							className="text-base"
							data-testid="guardrail-zip-upload-title"
						>
							Zip File
						</P>
						<div
							className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
							onClick={() => fileInputRef.current?.click()}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							<input
								ref={fileInputRef}
								type="file"
								accept=".zip"
								className="hidden"
								onChange={handleFileChange}
								multiple={false}
							/>
							{filedata ? (
								<div className="text-center">
									<P className="font-medium text-foreground">
										{filedata.name}
									</P>
									<P className="text-muted-foreground text-sm">
										Click or drag to replace
									</P>
								</div>
							) : (
								<div className="text-center">
									<FileUploadOutlined className="mb-2 h-12 w-12 text-muted-foreground" />
									<P className="font-medium text-foreground">
										Drop your file here or click to browse
									</P>
									<P className="text-muted-foreground text-sm">
										Supports ZIP files only
									</P>
								</div>
							)}
						</div>
						<div className="flex flex-row justify-end gap-2">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsFileUploadModalOpen(false)}
								data-testid="guardrail-upload-close-button"
								className="rounded-xl"
							>
								Close
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={!filedata || loading}
								onClick={() => onSubmit(filedata)}
								data-testid="guardrail-upload-submit-button"
								className="rounded-xl"
							>
								Upload
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{selectedDatabase ? (
				<div data-testid="guardrail-form-wrapper">
					<GuardrailForm
						//selectedTab={tabLabels[selectedTab]}
						title={selectedDatabase.name}
						description={`Fill out ${selectedDatabase.name} details in order to add guardrail to catalog`}
						fields={selectedDatabase.fields}
						advanced={selectedDatabase.advanced}
						categoryDescription={CategoryDescription}
					/>
				</div>
			) : (
				<div
					className="flex flex-col gap-2"
					data-testid="guardrail-page"
				>
					<div className="flex flex-col gap-1">
						<H4 className="font-medium" data-testid="page-title">
							{pageTitle}
						</H4>
						<P
							className="text-muted-foreground"
							data-testid="page-description"
						>
							{pageDescription}
						</P>
					</div>

					<div className="flex w-auto flex-col items-start">
						<div className="mt-3 mb-4 flex w-full items-start gap-2">
							<InputGroup className="flex-1 border-b-2 border-none">
								<InputGroupAddon>
									<SearchIcon className="size-4 text-muted-foreground" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									data-testid="search-box"
								/>
							</InputGroup>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleFileUpload(true)}
								data-testid="guardrail-upload-file-button"
								className="rounded-md"
							>
								<UploadIcon className="size-5" />
							</Button>
						</div>

						<div className="w-full">
							<Tabs
								value={selectedTab}
								onValueChange={(newValue) =>
									setSelectedTab(newValue)
								}
								className="mt-1"
							>
								<TabsList data-testid="tabs">
									{tabLabels.map((label) => (
										<TabsTrigger
											key={label}
											value={label}
											data-testid={`tab-${label.toLowerCase()}`}
											className="text-sm"
										>
											{label}
										</TabsTrigger>
									))}
								</TabsList>

								{tabLabels.map((label) => (
									<TabsContent key={label} value={label}>
										{renderDatabaseGrid(DatabasesForTab)}
									</TabsContent>
								))}
							</Tabs>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
