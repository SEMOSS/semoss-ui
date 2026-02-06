import { FileUploadOutlined } from "@mui/icons-material";
import { ChevronRight, Upload } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
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
	Input,
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
import { VECTOR_CONNECTIONS } from "./vector-import.constants";
import { VectorForm } from "./vector-import-form";
import { VectorTitleCard } from "./vector-title-card";

interface vector {
	fields: [];
	advanced: [];
	id: number;
	name: string;
	icon: string;
	disable: boolean;
}

export const VectorImport: React.FC<{ name: string }> = ({ name }) => {
	const navigate = useNavigate();
	const { monolithStore, configStore } = useRootStore();
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTab, setSelectedTab] = useState("Connections");
	const [selectedDatabase, setSelectedDatabase] = useState<vector | null>(
		null,
	);

	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [filedata, setFiledata] = useState(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const VectorOptions = VECTOR_CONNECTIONS;
	const CategoryDescription = VECTOR_CONNECTIONS.description;

	const pageTitle = "Connect to Vector Database";
	const pageDescription =
		"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of vector options available within the LLM landscape.";

	const tabLabels = useMemo(() => {
		return Object.keys(VectorOptions).filter(
			(key) => key !== "description",
		);
	}, []);
	const allDatabases = useMemo(() => {
		return [...(VectorOptions.Connections || [])];
	}, [VectorOptions]);

	const DatabasesForTab = useMemo(() => {
		return VectorOptions[selectedTab] || [];
	}, [selectedTab, VectorOptions, allDatabases]);

	if (loading) {
		return <Spinner />;
	}

	const handleFileUpload = (flag: boolean) => {
		// Open or close the file upload modal based on the provided flag
		setIsFileUploadModalOpen(flag);
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
					`UploadEngine(filePath=["${uploadedFiles[0].fileLocation}"], engineTypes=["VECTOR"])`,
			);
			for (const pixelString of pixelExpressions) {
				const response = await monolithStore.runQuery(pixelString);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					toast.error(String(output));
					setFiledata(null);
					return;
				}
				toast.success("Successfully Created Vector Database");
				const databaseId = (output as { database_id: string | number })
					.database_id;
				navigate(`/engine/vector/${databaseId}`);
			}
		} catch {
			toast.error("Upload failed or returned invalid response.");
			setFiledata(null);
		} finally {
			setLoading(false);
		}
	};

	const renderBreadcrumbs = () => (
		<Breadcrumb data-testid="breadcrumbs">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						onClick={() =>
							window.history.length > 1
								? navigate(-1)
								: navigate("/")
						}
						className="cursor-pointer"
						data-testid="breadcrumb-catalog"
					>
						{name} Catalog
					</BreadcrumbLink>
				</BreadcrumbItem>

				<BreadcrumbSeparator>/</BreadcrumbSeparator>

				<BreadcrumbItem>
					{selectedDatabase === null ? (
						<BreadcrumbPage>
							Connect to Vector Database
						</BreadcrumbPage>
					) : (
						<BreadcrumbLink
							className="cursor-pointer"
							onClick={() => {
								setSelectedDatabase(null);
							}}
						>
							Connect to Vector Database
						</BreadcrumbLink>
					)}
				</BreadcrumbItem>

				{selectedDatabase && (
					<>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>
								{selectedDatabase.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);

	const renderDatabaseGrid = (Databases: vector[]) => (
		<div className="mt-1 grid grid-cols-6 gap-2" data-testid="vector-grid">
			{Databases.filter((v) =>
				v.name.toLowerCase().includes(search.toLowerCase()),
			).map((v) => (
				<VectorTitleCard
					key={v.id}
					vector={{
						...v,
						display: v.name,
					}}
					onModelSelect={() => {
						setSelectedDatabase(v);
					}}
				/>
			))}
		</div>
	);

	return (
		<>
			{renderBreadcrumbs()}
			<Dialog
				open={isFileUploadModalOpen}
				onOpenChange={(isOpen) => setIsFileUploadModalOpen(isOpen)}
			>
				<DialogContent
					className="w-[600px]"
					data-testid="vector-zip-upload-modal"
				>
					<div className="flex h-full w-full flex-col gap-4">
						<P
							className="text-base"
							data-testid="vector-zip-upload-title"
						>
							Zip File
						</P>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: drag-and-drop area */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop area */}
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
								data-testid="vector-upload-close-button"
								className="rounded-xl"
							>
								Close
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={!filedata || loading}
								onClick={() => onSubmit(filedata)}
								data-testid="vector-upload-submit-button"
								className="rounded-xl"
							>
								Upload
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{selectedDatabase ? (
				<div data-testid="vector-form-wrapper">
					<VectorForm
						title={selectedDatabase.name}
						description={`Fill out ${selectedDatabase.name} details in order to add vector to catalog`}
						fields={selectedDatabase.fields}
						advanced={selectedDatabase.advanced}
						categoryDescription={CategoryDescription}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-4" data-testid="vector-page">
					<div className="flex flex-col gap-2">
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
						<div className="flex w-full items-start gap-4">
							<Input
								placeholder="Search..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="flex-1"
								data-testid="search-box"
							/>
							<Button
								size="lg"
								variant="outline"
								className="rounded-xl"
								onClick={() => handleFileUpload(true)}
								data-testid="vector-upload-file-button"
							>
								<Upload className="size-5" />
							</Button>
						</div>

						<div className="mt-4 w-full">
							<Tabs
								value={selectedTab}
								onValueChange={(value) => setSelectedTab(value)}
							>
								<TabsList data-testid="tabs">
									{tabLabels.map((label) => (
										<TabsTrigger
											key={label}
											value={label}
											data-testid={`tab-${label.toLowerCase()}`}
										>
											{label}
										</TabsTrigger>
									))}
								</TabsList>
								{tabLabels.map((label) => (
									<TabsContent
										key={label}
										value={label}
										className="mt-8"
									>
										{renderDatabaseGrid(DatabasesForTab)}
									</TabsContent>
								))}
							</Tabs>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
