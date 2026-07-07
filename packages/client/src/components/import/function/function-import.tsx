/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */
// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { SearchIcon, UploadIcon } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
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
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { FUNCTION_CONNECTIONS } from "./function-import.constants";
import { FunctionForm } from "./function-import-form";
import { FunctionTitleCard } from "./function-title-card";

interface functionCatalog {
	fields: [];
	advanced: [];
	id: number;
	name: string;
	icon: string;
	disable: boolean;
}

export const FunctionImport = ({ name }: { name: string }) => {
	const navigate = useNavigate();
	const { monolithStore, configStore } = useRootStore();
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTab, setSelectedTab] = useState("0");
	const [selectedEngine, setSelectedEngine] =
		useState<functionCatalog | null>(null);

	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [filedata, setFiledata] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const FunctionOptions = FUNCTION_CONNECTIONS;
	const CategoryDescription = FUNCTION_CONNECTIONS.description;

	const pageTitle = "Connect to Function Database";
	const pageDescription =
		"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of function options available within the LLM landscape.";

	const tabLabels = useMemo(() => {
		return Object.keys(FunctionOptions).filter(
			(key) => key !== "description",
		);
	}, []);
	const hasMultipleTabs = tabLabels.length > 1;

	const DatabasesForTab = useMemo(() => {
		const selectedIndex = Number.parseInt(selectedTab, 10);
		return FunctionOptions[tabLabels[selectedIndex]] || [];
	}, [selectedTab, tabLabels, FunctionOptions]);

	if (loading) {
		return <Spinner />;
	}

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
				() =>
					`UploadEngine(filePath=["${uploadedFiles[0].fileLocation}"], engineTypes=["FUNCTION"])`,
			);
			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					toast.error(output as string);
					setFiledata(null);
					return;
				}
				toast.success("Successfully Created Function Database");
				navigate(`/function/${output.database_id}`);
			}
		} catch {
			toast.error("Upload failed or returned invalid response.");
			setFiledata(null);
		} finally {
			setLoading(false);
		}
	};

	const renderBreadcrumbs = () => (
		<Breadcrumb data-testid="breadcrumbs" className="mb-6">
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
				<BreadcrumbSeparator>/</BreadcrumbSeparator>
				<BreadcrumbItem>
					{selectedEngine ? (
						<BreadcrumbLink
							className="cursor-pointer"
							onClick={() => {
								setSelectedEngine(null);
							}}
							data-testid="breadcrumb-page"
						>
							Connect to Function Database
						</BreadcrumbLink>
					) : (
						<BreadcrumbPage data-testid="breadcrumb-page">
							Connect to Function Database
						</BreadcrumbPage>
					)}
				</BreadcrumbItem>
				{selectedEngine && (
					<>
						<BreadcrumbSeparator>/</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage data-testid="breadcrumb-selected-function">
								{selectedEngine.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);

	const renderDatabaseGrid = (Databases: functionCatalog[]) => (
		<div
			className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
			data-testid="function-grid"
		>
			{Databases.filter((v) =>
				v.name.toLowerCase().includes(search.toLowerCase()),
			).map((v) => (
				<FunctionTitleCard
					key={v.id}
					selectedFunction={{
						...v,
						display: v.name,
					}}
					onModelSelect={() => {
						setSelectedEngine(v);
					}}
				/>
			))}
		</div>
	);

	const handleFileUpload = (flag: boolean) => {
		// Open or close the file upload modal based on the provided flag
		setIsFileUploadModalOpen(flag);
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setFiledata(file);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files?.[0];
		if (file?.name.endsWith(".zip")) {
			setFiledata(file);
		}
	};

	return (
		<>
			{renderBreadcrumbs()}
			<Dialog
				open={isFileUploadModalOpen}
				onOpenChange={setIsFileUploadModalOpen}
			>
				<DialogContent
					className="w-[calc(100vw-2rem)] max-w-[600px] sm:w-[600px]"
					data-testid="function-zip-upload-modal"
				>
					<div className="flex h-full w-full flex-col gap-4">
						<P
							className="text-base"
							data-testid="function-zip-upload-title"
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
									<UploadIcon className="mb-2 h-12 w-12 text-muted-foreground" />
									<P className="font-medium text-foreground">
										Drop your file here or click to browse
									</P>
									<P className="text-muted-foreground text-sm">
										Supports ZIP files only
									</P>
								</div>
							)}
						</div>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsFileUploadModalOpen(false)}
								data-testid="function-upload-close-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Close
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={!filedata || loading}
								onClick={() => onSubmit(filedata)}
								data-testid="function-upload-submit-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Upload
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{selectedEngine ? (
				<div data-testid="function-form-wrapper">
					<FunctionForm
						title={selectedEngine.name}
						description={`Fill out ${selectedEngine.name} details in order to add function to catalog`}
						notice={(selectedEngine as { notice?: string }).notice}
						icon={(selectedEngine as { icon?: string }).icon}
						fields={selectedEngine.fields}
						advanced={selectedEngine.advanced}
						categoryDescription={CategoryDescription}
					/>
				</div>
			) : (
				<div
					className="flex flex-col gap-4"
					data-testid="function-page"
				>
					<div className="flex flex-col gap-2">
						<H4 className="font-medium" data-testid="page-title">
							{pageTitle}
						</H4>
						<p
							className="text-[16px] text-muted-foreground"
							data-testid="page-description"
						>
							{pageDescription}
						</p>
					</div>

					<div className="flex flex-col">
						<div className="mt-3 mb-4 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-start">
							<InputGroup className="flex-1 border-b-2 border-none">
								<InputGroupAddon>
									<SearchIcon className="size-4 text-muted-foreground" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
									}}
									data-testid="search-bar"
								/>
							</InputGroup>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleFileUpload(true)}
								data-testid="function-upload-file-button"
								className="w-full sm:w-auto"
							>
								<UploadIcon className="size-5" />
							</Button>
						</div>

						<div className="w-full">
							{hasMultipleTabs ? (
								<Tabs
									value={selectedTab}
									onValueChange={setSelectedTab}
									className="w-full"
									data-testid="tabs"
								>
									<TabsList
										data-testid="tabs-list"
										className="w-full justify-start overflow-x-auto sm:w-auto"
									>
										{tabLabels.map((label, index) => (
											<TabsTrigger
												key={label}
												value={index.toString()}
												data-testid={`tab-${label.toLowerCase()}`}
												className="shrink-0"
											>
												{label}
											</TabsTrigger>
										))}
									</TabsList>
									{tabLabels.map((label, index) => (
										<TabsContent
											key={label}
											value={index.toString()}
											className="mt-3.5"
										>
											<div className="">
												{renderDatabaseGrid(
													DatabasesForTab,
												)}
											</div>
										</TabsContent>
									))}
								</Tabs>
							) : (
								<div className="mt-3.5">
									{renderDatabaseGrid(DatabasesForTab)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};
