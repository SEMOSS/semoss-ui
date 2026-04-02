/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */
// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { FileUploadOutlined } from "@mui/icons-material";
import { Search } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	H4,
	Input,
	P,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { STORAGE_CONNECTIONS, type Storage } from "./storage-import.constants";
import { StorageForm } from "./storage-import-form";
import { StorageTitleCard } from "./storage-title-card";

export const StorageImport: React.FC<{ name: string }> = ({ name }) => {
	const navigate = useNavigate();
	const { monolithStore, configStore } = useRootStore();
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTab, setSelectedTab] = useState("0");
	const [selectedDatabase, setSelectedDatabase] = useState<Storage | null>(
		null,
	);
	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [filedata, setFiledata] = useState(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const StorageOptions = STORAGE_CONNECTIONS;
	const CategoryDescription = STORAGE_CONNECTIONS.description;

	const pageTitle = "Connect to Storage Database";
	const pageDescription =
		"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of storage options available within the LLM landscape.";

	const tabLabels = useMemo(() => {
		return Object.keys(StorageOptions).filter(
			(key) => key !== "description",
		);
	}, []);
	const hasMultipleTabs = tabLabels.length > 1;

	const DatabasesForTab = useMemo(() => {
		const currentTabIndex = Number.parseInt(selectedTab, 10);
		return StorageOptions[tabLabels[currentTabIndex]] || [];
	}, [selectedTab, tabLabels, StorageOptions]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<P className="text-foreground">Loading...</P>
				</div>
			</div>
		);
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
					`UploadEngine(filePath=["${uploadedFiles[0].fileLocation}"], engineTypes=["STORAGE"])`,
			);

			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					toast.error(output as string);
					setFiledata(null);
					return;
				}
				toast.success("Successfully Created Storage Database");
				navigate(`/engine/storage/${output.database_id}`);
			}
		} catch {
			toast.error("Upload failed or returned invalid response.");
			setFiledata(null);
		} finally {
			setLoading(false);
			setIsFileUploadModalOpen(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			setFiledata(files[0]);
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
			setFiledata(files[0]);
		}
	};

	const renderBreadcrumbs = () => (
		<div className="mb-4">
			<Breadcrumb data-testid="breadcrumbs">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							onClick={() =>
								window.history.length > 1
									? navigate(-1)
									: navigate("/")
							}
							data-testid="breadcrumb-catalog"
							className="cursor-pointer text-muted-foreground hover:text-foreground"
						>
							{name} Catalog
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							onClick={() => {
								if (selectedDatabase) {
									setSelectedDatabase(null);
								}
							}}
							data-testid="breadcrumb-page"
							className={
								selectedDatabase
									? "cursor-pointer text-muted-foreground hover:text-foreground"
									: "cursor-default text-foreground"
							}
						>
							Connect to Storage Database
						</BreadcrumbLink>
					</BreadcrumbItem>
					{selectedDatabase && (
						<>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<span
									data-testid="breadcrumb-selected-storage"
									className="text-foreground"
								>
									{selectedDatabase.name}
								</span>
							</BreadcrumbItem>
						</>
					)}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	);

	const renderDatabaseGrid = (Databases: Storage[]) => (
		<div
			className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
			data-testid="storage-grid"
		>
			{Databases.filter((v) =>
				v.name.toLowerCase().includes(search.toLowerCase()),
			).map((v) => (
				<StorageTitleCard
					key={v.id}
					storage={v}
					onSelect={() => setSelectedDatabase(v)}
				/>
			))}
		</div>
	);

	const handleFileUpload = (flag: boolean) => {
		setIsFileUploadModalOpen(flag);
	};

	return (
		<div className="mx-auto w-full">
			{renderBreadcrumbs()}

			{/* File Upload Modal */}
			<Dialog
				open={isFileUploadModalOpen}
				onOpenChange={setIsFileUploadModalOpen}
			>
				<DialogContent
					className="w-[calc(100vw-2rem)] max-w-[600px] sm:w-[600px]"
					data-testid="storage-zip-upload-modal"
				>
					<div className="flex h-full w-full flex-col gap-4">
						<P
							className="font-medium text-base"
							data-testid="storage-zip-upload-title"
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
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsFileUploadModalOpen(false)}
								data-testid="storage-upload-close-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Close
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={!filedata}
								onClick={() => onSubmit(filedata)}
								data-testid="storage-upload-submit-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Upload
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{selectedDatabase ? (
				<div data-testid="storage-form-wrapper">
					<StorageForm
						title={selectedDatabase.name}
						description={`Fill out ${selectedDatabase.name} details in order to add storage to catalog`}
						fields={selectedDatabase.fields}
						advanced={selectedDatabase.advanced}
						categoryDescription={CategoryDescription}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-4" data-testid="storage-page">
					{/* Header Section */}
					<div className="flex flex-col gap-3">
						<H4
							className="font-semibold text-foreground text-xl tracking-tight"
							data-testid="page-title"
						>
							{pageTitle}
						</H4>
						<P
							className="max-w-5xl text-base text-muted-foreground leading-relaxed"
							data-testid="page-description"
						>
							{pageDescription}
						</P>
					</div>

					{/* Search Bar and Upload Button */}
					<div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-10 w-full pl-10"
								data-testid="search-box"
							/>
						</div>
						<Button
							size="lg"
							variant="outline"
							onClick={() => handleFileUpload(true)}
							data-testid="storage-upload-file-button"
							className="h-10 w-full rounded-lg leading-[0.75] sm:w-auto"
						>
							<FileUploadOutlined fontSize="medium" />
						</Button>
					</div>

					{/* Tabs Section - Using shadcn Tabs component */}
					<div className="w-full">
						{hasMultipleTabs ? (
							<Tabs
								value={selectedTab}
								onValueChange={setSelectedTab}
								data-testid="tabs"
							>
								<TabsList className="inline-flex w-full items-center justify-start overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground sm:w-auto sm:justify-center">
									{tabLabels.map((label, index) => (
										<TabsTrigger
											key={label}
											value={index.toString()}
											className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
											data-testid={`tab-${label.toLowerCase()}`}
										>
											{label}
										</TabsTrigger>
									))}
								</TabsList>
								{tabLabels.map((label, index) => (
									<TabsContent
										key={label}
										value={index.toString()}
										className="mt-6"
									>
										{renderDatabaseGrid(DatabasesForTab)}
									</TabsContent>
								))}
							</Tabs>
						) : (
							<div className="mt-6">
								{renderDatabaseGrid(DatabasesForTab)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
