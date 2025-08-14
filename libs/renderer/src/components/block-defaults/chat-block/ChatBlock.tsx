import {
  ContentCopy,
  Send,
  ThumbDownOffAlt,
  ThumbUpOffAlt,
} from "@mui/icons-material";
import {
  Avatar,
  CircularProgress,
  IconButton,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { Divider, Markdown, Tooltip } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { unescapeMarkdown } from "../../../utility";

interface ChatMessage {
  /** Agent Message */
  agent: string;

  /** User Message */
  user: string;
}

const StyledChat = styled("div")(() => ({
  position: "relative",
  width: "100%",
  height: "100%",
  background: "#FFFFFF",
  overflow: "hidden",
}));

const StyledScroll = styled("div")(() => ({
  display: "flex",
  flex: "1",
  flexDirection: "column",
  overflowX: "hidden",
  overflowY: "auto",
}));

const StyledScrollInner = styled("div")(({ theme }) => ({
  paddingBottom: theme.spacing(1),
}));

const StyledMessage = styled("div", {
  shouldForwardProp: (prop) => prop !== "agent",
})<{
  /** Track if the it is an agent */
  agent: boolean;
}>(({ theme, agent }) => ({
  position: "relative",
  display: "flex",
  justifyContent: agent ? "flex-start" : "flex-end",
  width: "100%",
  marginBottom: agent ? "10px" : theme.spacing(0),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  paddingRight: theme.spacing(1),
}));

const StyledContent = styled("div", {
  shouldForwardProp: (prop) => prop !== "agent",
})<{
  /** Track if the it is an agent */
  agent: boolean;
}>(({ theme, agent }) => ({
  width: "100%", // 70%
  padding: agent ? theme.spacing(1) : "16px",
  color: agent ? theme.palette.common.black : theme.palette.text.primary,
  backgroundColor: agent
    ? theme.palette.common.white //theme.palette.primary.light // #FAFAFA
    : theme.palette.grey["200"],
  borderRadius: theme.shape.borderRadius,
}));

const StyledTextField = styled(TextField)(() => ({
  flex: "1",
}));

const ActionIcons = styled("div")(() => ({
  position: "absolute",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginRight: "5px",
  right: "0",
}));

const StyledIcon = styled(Avatar)(() => ({
  width: "30px",
  height: "30px",
  backgroundColor: "transparent",
  color: "#9a9a9a",
  cursor: "pointer",
}));

const StyledChatStack = styled(Stack)({
  height: "100%",
  flex: "1",
  flexDirection: "column",
});

const QuestionStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  spacing: theme.spacing(1),
}));

const MessageStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  width: "100%",
  marginBottom: theme.spacing(2),
  overflow: "hidden",
  spacing: theme.spacing(2),
}));

const MessageDivider = styled(Divider)({
  borderColor: "#E6E6E6",
  backgroundColor: "transparent",
});

export interface ChatBlockDef extends BlockDef<"chat"> {
  widget: "chat";
  data: {
    /**
     * Track if the chat block is loading
     */
    loading?: boolean;

    /**
     * Current message being asked by the user
     */
    ask: string;

    /**
     * History of messages
     */
    history: string | ChatMessage[];
  };
  slots: {
    header: true;
    content: true;
  };
  listeners: {
    /**
     * Callback triggered when the chat block is loaded
     */
    onLoad: {
      order: ListenerActions[];
      type: "sync" | "async";
    };

    /**
     * Callback triggered when the user sends a message
     */
    onAsk: {
      order: ListenerActions[];
      type: "sync" | "async";
    };
  };
}

export const ChatBlock: BlockComponent = observer(({ id }) => {
  const { attrs, data, listeners, setData } = useBlock<ChatBlockDef>(id);
  // track if the chat is initialized
  const [isInitialized, setIsInitialized] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const copiedTimeout = useRef<NodeJS.Timeout | null>(null);
  // track if the loading screen is on
  const isLoading = data.loading; // !isInitialized
  let updateHistory: { agent: string; user: string }[] = [];
  if (!isLoading && data.history) {
    try {
      updateHistory = JSON.parse(
        data.history as unknown as string
      ) as ChatMessage[];
    } catch (e) {
      console.log(e);
    }
  }

  // reset the ask when the history changes
  useEffect(() => {
    // reset the ask
    if (updateHistory.length > 0) {
      setData("ask", "");
      setHistory(updateHistory);
    }
  }, [updateHistory.length]);

  useEffect(() => {
    if (history.length > 0 && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history.length]);

  // method called when the component is initialized
  useEffect(() => {
    // trigger it
    listeners.onLoad();

    // update the state
    setIsInitialized(true);
    return () => {
      // clear the timeout if it exists
      if (copiedTimeout.current) {
        clearTimeout(copiedTimeout.current);
      }
    };
  }, []);

  /**
   * Trigger the events linked to the onAsk listener
   */
  const onAsk = () => {
    // trigger it
    listeners.onAsk();
  };

  const handleCopy = async (idx: number) => {
    try {
      // Retrieve the DOM node from the copyRefs array using the provided index
      const node = copyRefs.current[idx];
      if (node) {
        // Extract the inner HTML content of the node
        const htmlContent = node.innerHTML;

        // Extract the plain text content of the node
        const textContent = node.innerText || node.textContent;

        // Create ClipboardItems for both plain text and HTML
        const clipboardItems: Record<string, Blob> = {};
        if (textContent) {
          clipboardItems["text/plain"] = new Blob([textContent], {
            type: "text/plain",
          });
        }
        if (htmlContent) {
          clipboardItems["text/html"] = new Blob([htmlContent], {
            type: "text/html",
          });
        }

        // Write the ClipboardItems to the clipboard
        const clipboardItem = new window.ClipboardItem(clipboardItems);
        await navigator.clipboard.write([clipboardItem]);
        setCopiedIndex(idx); // Set the copied index to trigger a re-render
        copiedTimeout.current = setTimeout(() => {
          setCopiedIndex(null); // Reset the copied index after a delay
        }, 1500);
      }
    } catch (err) {
      // Log an error if the copy operation fails
      console.error("Failed to copy content: ", err);
    }
  };

  return (
    <StyledChat id={id} {...attrs}>
      <StyledChatStack>
        <StyledScroll>
          <StyledScrollInner>
            {isInitialized
              ? history.map((m, idx) => {
                  return (
                    <React.Fragment key={`${id}_${m.agent}`}>
                      {m.user ? (
                        <StyledMessage agent={false}>
                          <StyledContent agent={false}>
                            <Typography variant="body2">{m.user}</Typography>
                          </StyledContent>
                        </StyledMessage>
                      ) : null}
                      {m.agent ? (
                        <StyledMessage agent={true}>
                          <MessageStack>
                            <StyledContent
                              agent={true}
                              ref={(el) => {
                                copyRefs.current[idx] = el;
                              }}
                            >
                              <Markdown>{unescapeMarkdown(m.agent)}</Markdown>
                              <MessageDivider />
                              <ActionIcons>
                                <StyledIcon>
                                  <Tooltip
                                    title={
                                      copiedIndex === idx ? "Copied" : "Copy"
                                    }
                                    arrow
                                  >
                                    <ContentCopy
                                      fontSize="small"
                                      onClick={() => handleCopy(idx)}
                                    />
                                  </Tooltip>
                                </StyledIcon>
                                <StyledIcon>
                                  <ThumbUpOffAlt fontSize="small" />
                                </StyledIcon>
                                <StyledIcon>
                                  <ThumbDownOffAlt fontSize="small" />
                                </StyledIcon>
                              </ActionIcons>
                            </StyledContent>
                          </MessageStack>
                        </StyledMessage>
                      ) : null}
                    </React.Fragment>
                  );
                })
              : null}
            <div ref={endRef}></div>
          </StyledScrollInner>
        </StyledScroll>
        <QuestionStack>
          <StyledTextField
            size="small"
            value={data.ask}
            disabled={isLoading}
            placeholder="Ask a question..."
            type={"text"}
            onChange={(e) => {
              const value = e.target.value;
              setData("ask", value);
            }}
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                onAsk();
              }
            }}
          />

          <IconButton
            title="Ask the chat"
            disabled={isLoading}
            color={"primary"}
            size="small"
            onClick={() => {
              onAsk();
            }}
          >
            {isLoading ? (
              <CircularProgress size="1em" variant="indeterminate" />
            ) : (
              <Send />
            )}
          </IconButton>
        </QuestionStack>
      </StyledChatStack>
    </StyledChat>
  );
});
