/** biome-ignore-all lint/a11y/useKeyWithClickEvents: matches existing engine-import dialogs */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: matches existing engine-import dialogs */

import { SearchIcon, UploadIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	cn,
	Dialog,
	DialogContent,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId } from "@/utility";
import {
	FUNCTION_CONNECTORS,
	type FunctionConnector,
} from "./function-connectors.constants";

interface ConnectorCardProps {
	connector: FunctionConnector;
	onSelect: () => void;
}

const ConnectorCard = ({ connector, onSelect }: ConnectorCardProps) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		const checkTruncated = () => {
			const el = textRef.current;
			if (el) {
				setIsTruncated(el.scrollWidth > el.clientWidth);
			}
		};

		checkTruncated();
		window.addEventListener("resize", checkTruncated);
		return () => {
			window.removeEventListener("resize", checkTruncated);
		};
	}, []);

	const handleCardClick = () => {
		if (!connector.disable) {
			onSelect();
		}
	};

	const handleCardKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleCardClick();
		}
	};

	const cardContent = (
		// biome-ignore lint/a11y/useSemanticElements: matches existing engine-import cards
		<div
			className={cn(
				"flex min-h-[204px] w-full cursor-pointer flex-col justify-between rounded-lg border border-input bg-card p-4 sm:w-[215px]",
				"hover:border-[1.5px] hover:border-primary hover:bg-primary/5",
				connector.disable &&
					"cursor-auto opacity-60 hover:border hover:border-input hover:bg-card",
			)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			data-testid={formatToDataTestId(
				`importPageContent-connect-to-${connector.name}-img`,
			)}
			role="button"
			tabIndex={connector.disable ? -1 : 0}
		>
			<div className="flex flex-col items-start gap-1">
				<div className="flex w-full flex-row items-center gap-2">
					<img
						src={connector.icon}
						alt={connector.name}
						className="flex h-[30px] w-[30px] shrink-0 rounded-lg object-cover"
					/>
					{connector.disable && (
						<Badge variant="secondary">Coming Soon</Badge>
					)}
				</div>
				<p
					ref={textRef}
					className="mt-1 self-stretch overflow-hidden text-ellipsis whitespace-nowrap font-medium text-secondary-foreground text-sm leading-[143%] tracking-[0.17px]"
				>
					{connector.name}
				</p>
				<p
					className="mt-1 line-clamp-3 text-[12px] text-muted-foreground leading-[1.3]"
					title={connector.description}
				>
					{connector.description}
				</p>
			</div>
			{connector.link && !connector.disable && (
				<Button
					type="button"
					variant="link"
					className="mt-2 flex justify-end p-0 text-sm"
					onClick={(e) => {
						e.stopPropagation();
						window.open(
							connector.link,
							"_blank",
							"noopener,noreferrer",
						);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								connector.link,
								"_blank",
								"noopener,noreferrer",
							);
						}
					}}
					aria-label={`Open documentation for ${connector.name}`}
				>
					Docs
				</Button>
			)}
		</div>
	);

	return isTruncated ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="block w-full sm:w-[215px]">{cardContent}</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">{connector.name}</TooltipContent>
		</Tooltip>
	) : (
		cardContent
	);
};

/**
 * Lists every available Function connector as a card grid; selecting one
 * navigates to its dedicated `/function/new/:connector` form page. Also
 * exposes a generic zip-upload path for a pre-packaged function engine.
 */
export const FunctionConnectorsPage = ({ name }: { name: string }) => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const [search, setSearch] = useState("");
	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [fileData, setFileData] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const pageTitle = "Connect to Function Database";
	const pageDescription =
		"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of function options available within the LLM landscape.";

	const filteredConnectors = FUNCTION_CONNECTORS.filter((connector) =>
		connector.name.toLowerCase().includes(search.toLowerCase()),
	);

	const handleZipUpload = async (file: File) => {
		setUploading(true);
		try {
			const uploadedFiles = await uploadFile(
				[file],
				configStore.store.insightID,
			);
			if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
				toast.error("Upload failed or returned invalid response.");
				return;
			}
			const pixel = `UploadEngine(filePath=["${uploadedFiles[0].fileLocation}"], engineTypes=["FUNCTION"])`;
			const response = await runPixel<[{ database_id?: string }]>(pixel);
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.includes("ERROR")) {
				toast.error(output as string);
				return;
			}
			toast.success("Successfully Created Function Database");
			navigate(`/function/${output.database_id}`);
		} catch {
			toast.error("Upload failed or returned invalid response.");
		} finally {
			setUploading(false);
			setFileData(null);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setFileData(file);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files?.[0];
		if (file?.name.endsWith(".zip")) {
			setFileData(file);
		}
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb data-testid="breadcrumbs">
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
							<BreadcrumbPage data-testid="breadcrumb-page">
								{pageTitle}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</NavbarLeft>
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
							{fileData ? (
								<div className="text-center">
									<P className="font-medium text-foreground">
										{fileData.name}
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
								disabled={!fileData || uploading}
								onClick={() =>
									fileData && handleZipUpload(fileData)
								}
								data-testid="function-upload-submit-button"
								className="w-full rounded-xl sm:w-auto"
							>
								Upload
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<div className="flex flex-col gap-4" data-testid="function-page">
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
								onChange={(e) => setSearch(e.target.value)}
								data-testid="search-bar"
							/>
						</InputGroup>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setIsFileUploadModalOpen(true)}
							data-testid="function-upload-file-button"
							className="w-full sm:w-auto"
						>
							<UploadIcon className="size-5" />
						</Button>
					</div>

					<div
						className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
						data-testid="function-grid"
					>
						{filteredConnectors.map((connector) => (
							<ConnectorCard
								key={connector.slug}
								connector={connector}
								onSelect={() =>
									navigate(`/function/new/${connector.slug}`)
								}
							/>
						))}
					</div>
				</div>
			</div>
		</>
	);
};
