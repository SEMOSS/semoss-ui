import { CSSProperties, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { usePixel } from "@semoss/sdk/react";
import { useBlock, useBlockSettings } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import ImageSkeleton from "../../../assets/img/Image-placeholder.svg";
import { Box, Stack, Typography } from "@mui/material";

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

function binaryStringToBase64(binaryString) {
    return window.btoa(
        Uint8Array.from(binaryString, (c: any) => c.charCodeAt(0)).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
        ),
    );
}

export const ImageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ImageBlockDef>(id);
    const { appId } = useParams();
    const { file } = data;
    // console.log("ImageBlock data: ", data);
    // console.log("ImageBlock file: ", file);
    const getImage = usePixel(
        file?.fileLocation
            ? `GetAsset(filePath=["${file?.fileLocation?.replace(
                  /\\/g,
                  "//",
              )}"], space=["${appId}"])` //file location need to do as forward slash
            : "",
    );

    // const getImage = usePixel(
    //     file?.fileLocation
    //         ? `GetAppAssets(filePath=["${file?.fileLocation?.replace(
    //               /\\/g,
    //               "//",
    //           )}"], project=["${appId}"])` //file location need to do as forward slash
    //         : "",
    // );

    // GetAppAssets(filePath=["/Chat_Hover.png"], project=["8205b8c5-8068-47ab-8068-9bbe10d2a245"])

    console.log("getImage: ", getImage);
    const [imgStyle, setImgStyle] = useState(null);
    const fileUrlRef = useRef<string | null>(null);
    useEffect(() => {
        if (fileUrlRef.current) {
            URL.revokeObjectURL(fileUrlRef.current);
            fileUrlRef.current = null;
        }
        if (file?.fileLocation && getImage && getImage.status === "SUCCESS") {
            // If getImage.data is ArrayBuffer or Blob
            let url: string | null = null;
            if (getImage.data instanceof ArrayBuffer) {
                const blob = new Blob([getImage.data], { type: "image/png" });
                url = URL.createObjectURL(blob);
            } else if (getImage.data instanceof Blob) {
                url = URL.createObjectURL(getImage.data);
            } else if (typeof getImage.data === "string") {
                // Convert UTF-8 string to byte array
                // const byteArray = new Uint8Array(
                //     [getImage.data].map((char) => char.charCodeAt(0)),
                // );
                // const byteArray = new Uint8Array(
                //     getImage.data.split("").map((char) => char.charCodeAt(0)),
                // );
                // // Create a Blob from the byte array
                // const blob = new Blob([byteArray], { type: "image/png" });
                // // Create an object URL
                // const byteArray = new TextEncoder().encode(getImage.data);
                // const blob = new Blob([byteArray], { type: "image/png" });
                // url = URL.createObjectURL(blob);
                // const escaped = getImage.data; // Example
                // const binaryString = JSON.parse('"' + escaped + '"');
                // url = `data:image/png;base64,${btoa(binaryString)}`;
                const len = getImage.data.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = getImage.data.charCodeAt(i);
                }
                // Create a Blob and Object URL
                const blob = new Blob([bytes], { type: "image/png" });
                url = URL.createObjectURL(blob);
            }
            if (url) {
                fileUrlRef.current = url;
                setImgStyle({
                    backgroundImage: `url('${url}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                });
            }
        } else if (data.src) {
            const img = new globalThis.Image();
            img.onload = () => {
                setImgStyle({
                    backgroundImage: `url('${data.src}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                });
            };
            img.onerror = () => {
                setImgStyle(null);
            };
            img.src = data.src;
        } else {
            setImgStyle(null);
        }
        return () => {
            if (fileUrlRef.current) {
                URL.revokeObjectURL(fileUrlRef.current);
                fileUrlRef.current = null;
            }
        };
    }, [data.src, getImage.status]);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);
    const style = imgStyle ? { ...data.style, ...imgStyle } : { ...data.style };
    return (
        <div style={style} {...attrs}>
            {!data.src && !imgStyle && (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    direction="column"
                    gap={1}
                    sx={{ height: "100%", width: "100%" }}
                >
                    <Box
                        component="img"
                        src={ImageSkeleton as string}
                        alt={data.title || "Placeholder"}
                        sx={{
                            width: 50,
                            height: 50,
                            objectFit: "contain",
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            color: (theme) => theme.palette.secondary.dark,
                        }}
                    >
                        Add image
                    </Typography>
                </Stack>
            )}
            {data.src && !imgStyle ? (
                data.unavailable === "default" ? (
                    <Box
                        component="img"
                        src={ImageSkeleton as string}
                        alt={data.title || "Placeholder"}
                        sx={{
                            width: 50,
                            height: 50,
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <Box component="p">
                        {data.placeholderText || "Image not available"}
                    </Box>
                )
            ) : null}
        </div>
    );
});
