import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import ImageSkeleton from "../../../assets/img/Image-placeholder.svg";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ImageBlockDef extends BlockDef<"image"> {
	widget: "image";
	data: {
		style: CSSProperties;
		src: string | { fileName: string; fileLocation: string };
		title: string;
		show: string;
		unavailable: string;
		placeholderText: string;
	};
	slots: never;
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

function getMimeType(fileName: string) {
	const ext = fileName.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		case "gif":
			return "image/gif";
		case "webp":
			return "image/webp";
		case "svg":
			return "image/svg+xml";
		case "avif":
			return "image/avif";
		case "bmp":
			return "image/bmp";
		default:
			return "image/*";
	}
}

const LoadingIndicator = () => (
	<p className="text-muted-foreground text-sm">Loading...</p>
);

const Placeholder = ({ title }: { title?: string }) => (
	<div className="flex h-full w-full flex-col items-center justify-center gap-2">
		<img
			src={ImageSkeleton as string}
			alt={title || "Image"}
			className="h-[50px] w-[50px] object-contain"
		/>
		<span className="cursor-pointer text-secondary-foreground text-sm">
			Add image
		</span>
	</div>
);

const ErrorDisplay = ({
	unavailable,
	placeholderText,
	title,
}: {
	unavailable: string;
	placeholderText?: string;
	title?: string;
}) =>
	unavailable === "default" ? (
		<img
			src={ImageSkeleton as string}
			alt={title || "Image"}
			className="h-[50px] w-[50px] object-contain"
		/>
	) : (
		<p className="text-muted-foreground text-sm">
			{placeholderText || "Image not available"}
		</p>
	);

export const ImageBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ImageBlockDef>(id);
	const { appId } = useParams();
	const { src, style: dataStyle, title, unavailable, placeholderText } = data;

	const [imgStyle, setImgStyle] = useState<CSSProperties | null>(null);
	const [status, setStatus] = useState({ isLoading: false, hasError: false });

	const isObjSrc =
		typeof src === "object" && src !== null && "fileLocation" in src;

	const getImage = usePixel(
		isObjSrc && src?.fileLocation
			? `GetAppAssetsBase64(filePath=["/${src.fileName}"], project=["${appId}"])`
			: "",
	);

	// Handle image loading and error
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		// Reset to initial state before processing
		setStatus({ isLoading: false, hasError: false });
		setImgStyle(dataStyle);

		// Handle object source (base64 from backend)
		if (isObjSrc && src?.fileLocation) {
			if (
				getImage?.status === "SUCCESS" &&
				typeof getImage.data === "string"
			) {
				const mimeType = getMimeType(src.fileName);
				const url = `data:${mimeType};base64,${getImage.data}`;
				setImgStyle({
					...dataStyle,
					backgroundImage: `url('${url}')`,
					cursor: "pointer",
				});
			} else if (getImage?.status === "ERROR") {
				setStatus({ isLoading: false, hasError: true });
			}
			return;
		}

		// Handle direct string URL
		if (typeof src === "string" && src) {
			setStatus({ isLoading: true, hasError: false });
			let isMounted = true;
			const img = new globalThis.Image();

			img.onload = () => {
				if (isMounted) {
					setStatus({ isLoading: false, hasError: false });
					setImgStyle({
						...dataStyle,
						backgroundImage: `url('${src}')`,
					});
				}
			};
			img.onerror = () => {
				if (isMounted) {
					setStatus({ isLoading: false, hasError: true });
					setImgStyle(dataStyle);
				}
			};
			img.src = src;

			return () => {
				isMounted = false;
			};
		}

		// Fallback: no src or unknown type
		setStatus({ isLoading: false, hasError: false });
		setImgStyle(dataStyle);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [getImage.status, isObjSrc ? src.fileName : src]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		listeners.preProcess?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const style = useMemo(
		() => (imgStyle ? { ...dataStyle, ...imgStyle } : dataStyle),
		[dataStyle, imgStyle],
	);
	const { isLoading, hasError } = status;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div style={style} {...attrs}>
					{isLoading && <LoadingIndicator />}
					{!style.backgroundImage && !src && (
						<Placeholder title={title} />
					)}
					{src && hasError && (
						<ErrorDisplay
							unavailable={unavailable}
							placeholderText={placeholderText}
							title={title}
						/>
					)}
				</div>
			</TooltipTrigger>
			{title && <TooltipContent>{title}</TooltipContent>}
		</Tooltip>
	);
});

export default ImageBlock;
