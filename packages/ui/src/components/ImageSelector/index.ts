import { ImageList, ImageListProps } from "./ImageList";
import { ImageListItem, ImageListItemProps } from "./ImageListItem";
import { ImageListItemBar, ImageListItemBarProps } from "./ImageListItemBar";

const ImageSelectorSpace = Object.assign(ImageList, {
    Item: ImageListItem,
    ItemButton: ImageListItemBar,
});

export type { ImageListProps, ImageListItemProps, ImageListItemBarProps };

export { ImageSelectorSpace as ImageSelector };
