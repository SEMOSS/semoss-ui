import { useState, useEffect, useMemo } from "react";
import { styled } from "@mui/material";
// import { usePixel, useRootStore, useDatabase } from "@/hooks";

import { Box } from "../../";
import { Checkbox } from "../../";
import { FileDropzone } from "../../";
import { ImageList } from "./ImageList";
import { ImageListItem } from "./ImageListItem";
import { ImageListItemBar } from "./ImageListItemBar";
import { Typography } from "../../";

const StyledBox = styled(Box)({
    width: "600px",
    height: "300px",
    margin: "8px",
});

const StyledImageList = styled(ImageList)({
    width: "600px",
    height: "300px",
    // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
    transform: "translateZ(0)",
    padding: "16px, 0px, 16px, 0px",
});

const StyledImageListItem = styled(ImageListItem)({
    width: "120px",
    height: "120px",
    // border: "solid 1px #0000003B",
    zIndex: 998,
    borderRadius: "8px",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    "&:hover": {
        border: "solid 2px #0471F0",
        // opacity: ".5",
    },
    // "&.isChecked": {
    //     border: "solid 2px #0471F0",
    //     opacity: ".5",
    // },
});

const StyledDragAndDrop = styled(ImageListItem)({
    width: "120px",
    height: "120px",
    borderRadius: "8px",
});

const StyledFileDropzone = styled(FileDropzone)({
    width: "100%",
    height: "100%",
    padding: "0",
    textAlign: "center",
});

const StyledImageListItemBar = styled(ImageListItemBar)({
    marginLeft: "8px",
    background: "rgba(0,0,0,0)",
    width: "20px",
    height: "20px",
    top: "8px",
    borderRadius: "2px",
});

const StyledCheckbox = styled(Checkbox)({
    "&:hover": {
        color: "#0471F0",
    },
    "&.isChecked": {
        opacity: "1",
    },
});

export interface ImageSelectorProps {
    /** src value of selected image */
    value: string;

    /** Callback for handling when an image is selected*/
    onChange?: () => void;

    //image options
    options: { title: string; src: string; fileContents?: unknown }[];
}

export const ImageSelector = (props: ImageSelectorProps): JSX.Element => {
    const { value, options, onChange, ...otherProps } = props;

    // get the configStore
    // const { configStore, monolithStore } = useRootStore();

    //set checked image to the default value
    const [checked, setCheckbox] = useState(value);

    const [controlledImages, setControlledImages] =
        useState<{ title: string; src: string; fileContents?: unknown }[]>(
            options,
        );

    const checkImage = (imageSrc) => {
        setCheckbox(imageSrc);
    };

    useEffect(() => {
        console.log("all controlled images", controlledImages);
    }, [controlledImages.length]);

    /**
     * @name handleAddNewImage
     * @desc add new image, compare it to default list
     * @param value
     */
    const handleAddNewImage = async (value) => {
        console.log("test upload", value);
        const imageurl = URL.createObjectURL(value);

        console.log("img url", imageurl);

        const newControlledImage = {
            title: value.name,
            src: imageurl,
            fileContents: value,
        };

        console.log("new con image", newControlledImage);

        const newControlledImages = controlledImages;

        newControlledImages.push(newControlledImage);

        debugger;

        setControlledImages(newControlledImages);

        console.log("img url", imageurl);

        // try {
        //     const path = "version/assets/";

        //     // // upload the file
        //     // const upload = await monolithStore.upload(
        //     //     configStore.store.insightID,
        //     //     value.name,
        //     // );

        //     // // upnzip the file in the new project
        //     // await monolithStore.runQuery(
        //     //     `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${id}"])`,
        //     // );

        //     //have check first
        //     // imageOptions.push({
        //     //     title: upload[0].fileName,
        //     //     src: require(upload[0].fileLocation),
        //     // });
        // } catch (e) {
        //     console.error(e);
        // } finally {
        //     // turn off loading
        //     // setIsLoading(false);
        // }
    };

    return (
        <StyledBox {...otherProps}>
            <Typography variant="subtitle1">Select Image</Typography>
            <Typography variant="caption">
                Select a default image or upload your own
            </Typography>
            <StyledImageList
                rowHeight={117}
                gap={16}
                cols={4}
                variant="standard"
            >
                <StyledDragAndDrop key={0}>
                    <StyledFileDropzone
                        description="Browse"
                        onChange={(value) => handleAddNewImage(value)}
                    />
                </StyledDragAndDrop>

                {controlledImages.map((image, id) => (
                    <StyledImageListItem
                        key={id}
                        value={image.src}
                        className={`${
                            checked === image.src ? "isChecked" : ""
                        }`}
                        sx={{ backgroundImage: `url(${image.src})` }}
                    >
                        <StyledImageListItemBar
                            position={"top"}
                            actionIcon={
                                <StyledCheckbox
                                    checked={checked === image.src}
                                    onChange={() => checkImage(image.src)}
                                />
                            }
                            actionPosition={"left"}
                        />
                    </StyledImageListItem>
                ))}
            </StyledImageList>
        </StyledBox>
    );
};
