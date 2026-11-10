// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */

import { GitCompare, Search, Upload } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	H4,
	Input,
	P,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { NavbarHeader } from "@/components/shared/navbar-header";
import { NavbarLeft } from "@/components/shared/navbar-left";
import { useNavigate } from "@/hooks/useNavigate";
import {
	CATEGORY_DESCRIPTIONS,
	DATABASE_CONNECTION,
} from "./database.constants";
import { DatabaseCard } from "./database-card";
import { DatabaseForm } from "./database-form";

interface database {
	fields: [];
	advanced: [];
	name: string;
	icon: string;
	disable: boolean;
}

interface DatabasePageContentProps {
	/** The catalog the page opened from, named in the first breadcrumb, such as "Database". */
	name: string;
}

/**
 * The Connect to Database page: the database types to connect to or upload, by
 * tab, and the chosen one's form. An exported database can also be uploaded as
 * a zip.
 */
export const DatabasePageContent: React.FC<DatabasePageContentProps> = ({
	name,
}) => {
	const navigate = useNavigate();
	const { run: runPixel, upload } = useSessionInsight();
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTab, setSelectedTab] = useState(0);
	const [selectedEngine, setSelectedEngine] = useState<database | null>(null);

	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [filedata, setFiledata] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const DatabaseOptions = DATABASE_CONNECTION;
	const CategoryDescription = CATEGORY_DESCRIPTIONS;

	const pageTitle = "Connect to Database";
	const pageDescription =
		"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";

	const tabLabels = useMemo(() => ["Connections", "File Uploads"], []);
	const allDatabases = useMemo(() => {
		return [
			...(DatabaseOptions.Connections || []),
			...(DatabaseOptions["File Uploads"] || []),
		];
	}, [DatabaseOptions]);

	const DatabasesForTab = useMemo(() => {
		return DatabaseOptions[tabLabels[selectedTab]] || [];
	}, [selectedTab, tabLabels, DatabaseOptions, allDatabases]);

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

	const onSubmit = async (data: File) => {
		setLoading(true);
		try {
			const uploadedFiles = await upload([data]);

			if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
				toast.error("Upload failed or returned invalid response.");
				setFiledata(null);
				return;
			}
			const pixelExpressions = uploadedFiles.map(
				(file) =>
					`UploadDatabase(filePath=["${file.fileLocation}"],space=[""])`,
			);
			for (const pixelString of pixelExpressions) {
				const response = await runPixel(pixelString);
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.includes("ERROR")) {
					toast.error(output as string);
					setFiledata(null);
					return;
				}
				toast.success("Successfully Created Database");
				navigate(
					`/database/${(output as { database_id?: string }).database_id}`,
				);
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
		<NavbarLeft>
			<NavbarHeader logo={null} />
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
							className="cursor-pointer"
						>
							{name} Catalog
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							onClick={() => {
								if (selectedEngine) {
									setSelectedEngine(null);
								}
							}}
							data-testid="breadcrumb-page"
							className={
								selectedEngine
									? "cursor-pointer text-muted-foreground hover:text-foreground"
									: "cursor-default text-foreground"
							}
						>
							Connect To Database
						</BreadcrumbLink>
					</BreadcrumbItem>
					{selectedEngine && (
						<>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<span
									data-testid="breadcrumb-selected-database"
									className="text-foreground"
								>
									{selectedEngine.name}
								</span>
							</BreadcrumbItem>
						</>
					)}
				</BreadcrumbList>
			</Breadcrumb>
		</NavbarLeft>
	);

	const renderDatabaseGrid = (Databases: database[]) => (
		<div
			className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
			data-testid="database-grid"
		>
			{Databases.filter((v) =>
				v.name.toLowerCase().includes(search.toLowerCase()),
			).map((v) => (
				<DatabaseCard
					key={v.name}
					database={v}
					onSelect={() => setSelectedEngine(v)}
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
			<Dialog
				open={isFileUploadModalOpen}
				onOpenChange={setIsFileUploadModalOpen}
			>
				<DialogContent
					aria-describedby={undefined}
					className="sm:max-w-xl"
					data-testid="database-zip-upload-modal"
				>
					<div className="flex h-full w-full flex-col gap-4">
						<DialogTitle
							className="text-base"
							data-testid="database-zip-upload-title"
						>
							Zip File
						</DialogTitle>
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
									<Upload className="mb-2 h-12 w-12 text-muted-foreground" />
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
								data-testid="database-upload-close-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Close
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={!filedata}
								onClick={() => onSubmit(filedata)}
								data-testid="database-upload-submit-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Upload
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{selectedEngine ? (
				<div data-testid="database-form-wrapper">
					<DatabaseForm
						selectedTab={tabLabels[selectedTab]}
						title={selectedEngine.name}
						description={`Fill out ${selectedEngine.name} details in order to add database to catalog`}
						icon={selectedEngine.icon}
						fields={selectedEngine.fields}
						advanced={selectedEngine.advanced}
						categoryDescription={CategoryDescription}
					/>
				</div>
			) : (
				<div
					className="flex flex-col gap-6"
					data-testid="database-page"
				>
					<div className="flex flex-col gap-3">
						<H4
							className="font-semibold text-foreground tracking-tight"
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

					<div className="flex w-full flex-col items-start gap-6">
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
								data-testid="database-upload-file-button"
								className="h-10 w-full rounded-lg leading-[0.75] sm:w-auto"
							>
								<Upload className="size-5" />
							</Button>
						</div>

						<div className="w-full">
							<Tabs
								value={selectedTab.toString()}
								onValueChange={(value) =>
									setSelectedTab(Number(value))
								}
								className="gap-6"
								data-testid="tabs"
							>
								<TabsList>
									{tabLabels.map((label, index) => (
										<TabsTrigger
											key={label}
											value={index.toString()}
											data-testid={`tab-${label.toLowerCase()}`}
										>
											{index === 0 && (
												<GitCompare
													className="h-4 w-4"
													aria-hidden="true"
												/>
											)}
											{index === 1 && (
												<Upload
													className="h-4 w-4"
													aria-hidden="true"
												/>
											)}
											{label}
										</TabsTrigger>
									))}
								</TabsList>
								{tabLabels.map((label, index) => (
									<TabsContent
										key={label}
										value={index.toString()}
										className="mt-0"
									>
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
