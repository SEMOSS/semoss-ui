import { useState, useEffect } from "react";
import { styled } from "@mui/material";

import { Box } from "../../";
import { Checkbox } from "../../";
import { FileDropzone } from "../../";
import { ImageList } from "./ImageList";
import { ImageListItem } from "./ImageListItem";
import { ImageListItemBar } from "./ImageListItemBar";
import { Typography } from "../../";

const StyledBox = styled(Box)({
    width: "600px",
    height: "282px",
});

const StyledImageList = styled(ImageList)({
    width: "600px",
    height: "282px",
    // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
    transform: "translateZ(0)",
    padding: "16px, 0px, 16px, 0px",
});

const StyledImageListItem = styled(ImageListItem)({
    width: "100%",
    height: "117px",
    border: "solid 1px #0000003B",
    zIndex: 998,
    borderRadius: "8px",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    "&:hover": {
        border: "solid 2px #0471F0",
        opacity: ".5",
    },
    "&.isChecked": {
        border: "solid 2px #0471F0",
        opacity: ".5",
    },
});

const StyledDragAndDrop = styled(ImageListItem)({
    width: "126px",
    height: "117px",
    borderRadius: "8px",
});

const StyledFileDropzone = styled(FileDropzone)({
    width: "100%",
    height: "100%",
    padding: "0",
    textAlign: "center",
});

const StyledImageListItemBar = styled(ImageListItemBar)({
    marginLeft: "10px",
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
});

export interface ImageSelectorProps {
    /** array of displayed images */
    images: Array<{ src: string; title: string }>;

    /** Callback triggered on selecting image TODO*/
    // onChange?: () => void;

    /** Function for new images*/
    handleAddNewImage?: (value) => void;
}

export const ImageSelector = (props: ImageSelectorProps): JSX.Element => {
    const { images, handleAddNewImage, ...otherProps } = props;

    const [checked, setCheckbox] = useState("");

    const checkImage = (imageSrc) => {
        setCheckbox(imageSrc);
    };

    //set the default check
    useEffect(() => {
        const findSrc = images.find(
            (defaultSrc) => defaultSrc.title === "Default",
        );
        findSrc ? checkImage(findSrc.src) : checkImage("");
    }, [images]);

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

                {images.map((item, id) => (
                    <StyledImageListItem
                        key={id}
                        className={`${checked === item.src ? "isChecked" : ""}`}
                        sx={{ backgroundImage: `url(${item.src})` }}
                    >
                        <StyledImageListItemBar
                            position={"top"}
                            actionIcon={
                                <StyledCheckbox
                                    checked={checked === item.src}
                                    onChange={() => checkImage(item.src)}
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
