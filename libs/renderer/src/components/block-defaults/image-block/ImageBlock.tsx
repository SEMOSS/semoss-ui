import { CSSProperties, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { usePixel } from "@semoss/sdk/react";
import { Stack, Typography, styled, Tooltip } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import ImageSkeleton from "../../../assets/img/Image-placeholder.svg";

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

const StyledImage = styled("img")(() => ({
    width: 50,
    height: 50,
    objectFit: "contain",
}));

const AddImageText = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
    cursor: "pointer",
}));

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ImageBlockDef>(id);
    const { appId } = useParams();
    const { src, style: dataStyle, title, unavailable, placeholderText } = data;

    const [imgStyle, setImgStyle] = useState(null);
    const [status, setStatus] = useState({ isLoading: false, hasError: false });

    const isObj = src instanceof Object;

    const getImage = usePixel(
        isObj && src?.fileLocation
            ? `GetAppAssetsBase64(filePath=["/${src?.fileName}"], project=["${appId}"])`
            : "",
    );

    // Handle image loading and error
    useEffect(() => {
        if (isObj && src?.fileLocation && getImage?.status === "SUCCESS") {
            setStatus({ isLoading: false, hasError: false });
            if (typeof getImage.data === "string") {
                const mimeType = getMimeType(src?.fileName);
                const url = `data:${mimeType};base64,${getImage.data}`;
                setImgStyle({
                    backgroundImage: `url('${url}')`,
                    cursor: "pointer",
                });
            }
        } else if (src && typeof src === "string") {
            setStatus({ isLoading: true, hasError: false });

            const img = new globalThis.Image();
            img.onload = () => {
                setStatus({ isLoading: false, hasError: false });
                setImgStyle({ backgroundImage: `url('${src}')` });
            };
            img.onerror = () => {
                setStatus({ isLoading: false, hasError: true });
                setImgStyle(dataStyle);
            };
            img.src = src;
        } else {
            setImgStyle(dataStyle);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getImage.status, isObj ? src.fileName : src]);

    useEffect(() => {
        listeners.preProcess?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const style = imgStyle ? { ...dataStyle, ...imgStyle } : dataStyle;

    const { isLoading, hasError } = status;

    return (
        <Tooltip title={title}>
            <div
                style={style}
                {...attrs}
                aria-label={title || "Tooltip"}
                tabIndex={0}
            >
                {isLoading && (
                    <Typography variant="body2">Loading...</Typography>
                )}

                {!style.backgroundImage && !src && (
                    <Stack
                        alignItems="center"
                        justifyContent="center"
                        direction="column"
                        gap={1}
                        sx={{ height: "100%", width: "100%" }}
                    >
                        <StyledImage
                            src={ImageSkeleton as string}
                            alt={title || "Image"}
                        />
                        <AddImageText variant="body2">Add image</AddImageText>
                    </Stack>
                )}

                {src &&
                    hasError &&
                    (unavailable === "default" ? (
                        <StyledImage
                            src={ImageSkeleton as string}
                            alt={title || "Image"}
                        />
                    ) : (
                        <Typography variant="body2">
                            {placeholderText || "Image not available"}
                        </Typography>
                    ))}
            </div>
        </Tooltip>
    );
});
