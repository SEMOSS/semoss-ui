import { useState } from "react";
import { useMediaQuery } from "@mui/material";
import { Checkbox, FileDropzone, Typography, Grid, styled } from "../../";
import { ImageList } from "./ImageList";
import { ImageListItem } from "./ImageListItem";
import { ImageListItemBar } from "./ImageListItemBar";

const StyledContainer = styled(Grid)({
    width: "800px",
});

const StyledImageListItem = styled(ImageListItem)({
    width: "120px",
    // height: "120px",
    zIndex: 998,
    borderRadius: "8px",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    border: "solid 1px #0000003B",
    "&:hover": {
        border: "solid 1px #0471F0",
        opacity: ".7",
        span: {
            opacity: "1",
            color: "#0471F0",
        },
    },
    "&.isChecked": {
        border: "solid 1px #0471F0",
        opacity: ".7",
        span: {
            opacity: "1",
            accentColor: "white",
        },
    },
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

export interface ImageSelectorProps {
    /** value of selected image */
    value: {
        name: string;
        src: string;
        fileContents?: unknown;
    };

    /** changes the value of the component*/
    onChange?: (val) => void;

    //default image options
    defaultImageOptions: {
        name: string;
        src: string;
        fileContents?: unknown;
    }[];
}

export const ImageSelector = (props: ImageSelectorProps): JSX.Element => {
    const { value, defaultImageOptions, onChange, ...otherProps } = props;

    //for number of columns
    const matchMedia = useMediaQuery("(min-width: 800px)");

    // set checked image to the default value
    const [checked, setCheckbox] = useState(value.src);
    const [controlledImages, setControlledImages] =
        useState<{ title: string; src: string; fileContents?: unknown }[]>(
            defaultImageOptions,
        );

    const checkImage = (image) => {
        setCheckbox(image.src);

        //Pass image to parent
        onChange(image);
    };

    /**
     * @name handleAddNewImage
     * @desc add new image, compare it to default list
     * @param value
     */
    const handleAddNewImage = (value) => {
        // create image url from file
        const imageUrl = URL.createObjectURL(value);

        //create the image to add
        const newControlledImage = {
            name: value.name,
            src: imageUrl,
            fileContents: value,
        };

        // new image will replace the first in list
        const newControlledImages = defaultImageOptions;
        newControlledImages[0] = newControlledImage;

        // Set new controlled images in state
        setControlledImages(newControlledImages);
        setCheckbox(newControlledImage.src);

        // Pass new file to parent
        onChange(newControlledImage);
    };

    return (
        <StyledContainer container direction="column" {...otherProps}>
            <Grid item xs>
                <Typography variant="subtitle1">Select Image</Typography>
                <Typography variant="caption">
                    Select a default image or upload your own
                </Typography>
            </Grid>

            <Grid item xs>
                <ImageList
                    rowHeight={117}
                    cols={matchMedia ? 5 : 4}
                    variant="standard"
                    sx={{ gap: "16px 0 !important" }}
                >
                    <StyledDragAndDrop key={0}>
                        <StyledFileDropzone
                            imageSelector={true}
                            description="Browse"
                            onChange={(value) => handleAddNewImage(value)}
                        />
                    </StyledDragAndDrop>
                    {controlledImages.map((image, id) => {
                        return (
                            <StyledImageListItem
                                key={id.toString()}
                                // value={image}
                                className={`${
                                    checked === image.src ? "isChecked" : ""
                                }`}
                                sx={{
                                    backgroundImage: `url(${image.src})`,
                                    loading: "lazy",
                                }}
                            >
                                <StyledImageListItemBar
                                    position={"top"}
                                    actionIcon={
                                        <Checkbox
                                            checked={checked === image.src}
                                            onChange={() => checkImage(image)}
                                        />
                                    }
                                    actionPosition={"left"}
                                />
                            </StyledImageListItem>
                        );
                    })}
                </ImageList>
            </Grid>
        </StyledContainer>
    );
};
