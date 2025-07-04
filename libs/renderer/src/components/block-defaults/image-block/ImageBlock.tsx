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
        src: string;
        title: string;
        show: string;
        unavailable: string;
        file: { fileName: string; fileLocation: string } | null;
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
    const { file } = data;
    const [imgStyle, setImgStyle] = useState(null);

    const getImage = usePixel(
        file?.fileLocation
            ? `GetAppAssetsBase64(filePath=["/${file?.fileName}"], project=["${appId}"])` //file location need to do as forward slash
            : "",
    );

    useEffect(() => {
        if (file?.fileLocation && getImage && getImage.status === "SUCCESS") {
            let mimeType = "image/png";
            let url = "";
            if (file?.fileName) {
                mimeType = getMimeType(file.fileName);
            }
            if (typeof getImage.data === "string") {
                url = `data:${mimeType};base64,${getImage.data}`;
            } else if (getImage.data instanceof ArrayBuffer) {
                const uint8Array = new Uint8Array(getImage.data);
                let binary = "";
                for (let i = 0; i < uint8Array.byteLength; i++) {
                    binary += String.fromCharCode(uint8Array[i]);
                }
                url = `data:${mimeType};base64,${btoa(binary)}`;
            }
            if (url) {
                setImgStyle({
                    backgroundImage: `url('${url}')`,
                });
            }
        } else if (data.src) {
            const img = new globalThis.Image();
            img.onload = () => {
                setImgStyle({
                    backgroundImage: `url('${data.src}')`,
                });
            };
            img.onerror = () => {
                setImgStyle(null);
            };
            img.src = data.src;
        } else {
            setImgStyle(null);
        }
    }, [data.src, getImage.status]);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const style = imgStyle ? { ...data.style, ...imgStyle } : data.style;

    return (
        <Tooltip title={data.src ? data?.title : ""}>
            <div style={style} {...attrs} tabIndex={0}>
                {!data.src && !imgStyle && (
                    <Stack
                        alignItems="center"
                        justifyContent="center"
                        direction="column"
                        gap={1}
                        sx={{ height: "100%", width: "100%" }}
                    >
                        <StyledImage
                            src={ImageSkeleton as string}
                            alt={data?.title || "Image"}
                        />
                        <AddImageText variant="body2">Add image</AddImageText>
                    </Stack>
                )}
                {data.src && !imgStyle ? (
                    data.unavailable === "default" ? (
                        <StyledImage
                            src={ImageSkeleton as string}
                            alt={data?.title || "Image"}
                        />
                    ) : (
                        <Typography variant="body2">
                            {data.placeholderText || "Image not available"}
                        </Typography>
                    )
                ) : null}
            </div>
        </Tooltip>
    );
});
