import { useMemo, ComponentPropsWithoutRef } from "react";
import { styled } from "../../";

import { Icon } from "../Icon";
import { IconButton } from "../IconButton";

const StyledContainer = styled("div")({
    display: "flex",
    alignItems: "center",
    columnGap: 1,
    justifyContent: "space-between",
    marginTop: "1rem",
    borderColor: "#D9D9D9",
    borderWidth: "16px",
    borderRadius: "16px",
    padding: "8px 16px",
});

const StyledDownloadButton = styled("a")({
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: "12px",
    color: "#5C5C5C",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    height: "1rem",
    width: "1rem",
    fontSize: "1rem",
    margin: "0",
    outline: "none",
    textAlign: "center",
    userSelect: "none",
    whiteSpace: "nowrap",
    marginRight: "8px",
    "&:hover": {
        color: "#8E8E8E",
    },
    "&:focus": {
        outline: "2px solid #40A0FF",
        outlineOffset: "2px",
    },
});

const StyledDescription = styled("span")({
    flex: "1",
    fontSize: "$sm",
    color: "#5C5C5C",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
});

const mdiDelete =
    "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";
const mdiDownload = "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z";

interface FileDisplayProps
    extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
    /** Displayed File */
    file: File;

    /** Name of the file */
    name?: string;

    /** Disable deleting of the file */
    disabled?: boolean;

    /** Callback triggered on deleting of the file */
    onDelete: () => void;
}

export const FileDisplay = (props: FileDisplayProps): JSX.Element => {
    const { disabled, file, onDelete, ...otherProps } = props;

    const href = useMemo(() => {
        return URL.createObjectURL(file);
    }, [file]);

    return (
        <StyledContainer {...otherProps}>
            <StyledDownloadButton
                href={href}
                download={file.name}
                title={`Download ${file.name}`}
                aria-label={`Download ${file.name}`}
                role="button"
            >
                <Icon aria-hidden="true">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={mdiDownload}
                        />
                    </svg>
                </Icon>
            </StyledDownloadButton>
            <StyledDescription title={file.name} aria-label={file.name}>
                {file.name}
            </StyledDescription>
            <IconButton
                size="small"
                disabled={disabled}
                onClick={() => onDelete()}
                // title={`Remove ${file.name} from list`}
                aria-label={`Remove ${file.name} from list`}
            >
                <Icon aria-hidden="true">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={mdiDelete}
                        />
                    </svg>
                </Icon>
            </IconButton>
        </StyledContainer>
    );
};
