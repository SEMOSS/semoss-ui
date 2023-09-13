import { styled } from "@mui/material";

import { Box } from "../../";
import { Checkbox } from "../../";
import { FileDropzone } from "../../";
import { ImageList } from "./ImageList";
import { ImageListItem } from "./ImageListItem";
import { ImageListItemBar } from "./ImageListItemBar";

const StyledBox = styled(Box)({
    width: 600,
    height: 340,
});

const StyledImageList = styled(ImageList)({
    width: 600,
    height: 340,
    // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
    transform: "translateZ(0)",
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

const StyledImage = styled("img")({
    borderRadius: "8px",
});

interface ImageSelectorProps {
    /** array of displayed images */
    images: Array<{ src: string; title: string }>;

    /** Callback triggered on selecting image TODO*/
    onChange?: () => void;
}

export const ImageSelector = (props: ImageSelectorProps): JSX.Element => {
    const { images, onChange } = props;

    return (
        <StyledBox>
            <StyledImageList
                rowHeight={164}
                gap={8}
                cols={4}
                variant="standard"
            >
                <ImageListItem key={0}>
                    <StyledFileDropzone description="Drag and Drop Image(s)" />
                </ImageListItem>

                {images.map((item) => (
                    <ImageListItem key={item.src}>
                        <StyledImage
                            src={`${item.src}?w=164&h=164&fit=crop&auto=format`}
                            srcSet={`${item.src}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                            alt={item.title}
                            loading="lazy"
                        />
                        <StyledImageListItemBar
                            position={"top"}
                            actionIcon={
                                <Checkbox checked={false} onChange={onChange} />
                            }
                            actionPosition={"left"}
                        />
                    </ImageListItem>
                ))}
            </StyledImageList>
        </StyledBox>
    );
};
