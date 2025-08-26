import { Box, Typography, Stack, styled, } from "@semoss/ui";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/ui";

const Editor = lazy(() => import("@monaco-editor/react"));

export const RDFMapPage = () => {
    const code = `
    ENGINE_WATCHER	SMSSWatcher
    ENGINE_WEB_WATCHER	SMSSWebWatcher;SMSSStorageWatcher;SMSSModelWatcher;SMSSVectorWatcher;SMSSFunctionWatcher;SMSSGuardrailWatcher
    PROJECT_WATCHER	ProjectWatcher
    
    INSIGHT_CACHE_DIR D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\InsightCache
    CSV_INSIGHT_CACHE_FOLDER CSV_Insights
    
    SMSSWebWatcher	prerna.util.SMSSWebWatcher
    SMSSWebWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\db
    SMSSWebWatcher_EXT	.smss
    SMSSWebWatcher_ETYPE	DATABASE
    
    SMSSStorageWatcher	prerna.util.SMSSNoInitEngineWatcher
    SMSSStorageWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\storage
    SMSSStorageWatcher_EXT	.smss
    SMSSStorageWatcher_ETYPE	STORAGE
    
    SMSSModelWatcher	prerna.util.SMSSNoInitEngineWatcher
    SMSSModelWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\model
    SMSSModelWatcher_EXT	.smss
    SMSSModelWatcher_ETYPE	MODEL
    
    SMSSVectorWatcher	prerna.util.SMSSNoInitEngineWatcher
    SMSSVectorWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\vector
    SMSSVectorWatcher_EXT	.smss
    SMSSVectorWatcher_ETYPE	VECTOR
    
    SMSSFunctionWatcher	prerna.util.SMSSNoInitEngineWatcher
    SMSSFunctionWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\function
    SMSSFunctionWatcher_EXT	.smss
    SMSSFunctionWatcher_ETYPE	FUNCTION
    
    SMSSGuardrailWatcher	prerna.util.SMSSNoInitEngineWatcher
    SMSSGuardrailWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\guardrail
    SMSSGuardrailWatcher_EXT	.smss
    SMSSGuardrailWatcher_ETYPE	GUARDRAIL
    
    #SMSSVenvWatcher	prerna.util.SMSSNoInitEngineWatcher
    #SMSSVenvWatcher_DIR	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\venv
    #SMSSVenvWatcher_EXT	.smss
    #SMSSVenvWatcher_ETYPE	VENV
    
    ProjectWatcher	prerna.util.ProjectWatcher
    ProjectWatcher_DIR		D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\project
    ProjectWatcher_EXT	.smss
    
    #JobSchedulerWatcher prerna.rpa.JobSchedulerWatcher
    #JobSchedulerWatcher_DIR D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\rpa\\json
    #JobSchedulerWatcher_EXT	.json
    #rpa.config.directory D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\rpa
    
    BaseFolder	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss
    ADDITIONAL_REACTORS D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\reactors.json
    ADDITIONAL_REACTOR_PACKAGES
    SOCIAL	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\social.properties
    EMAIL_TEMPLATES	D:\\Users\\gopalanisamy\\eclipse-workspace\\Semoss\\emailTemplates\\
    PYTHONHOME D:\\Users\\gopalanisamy\\.pyenv\\pyenv-win\\versions\\3.11.9
    TCP_WORKER prerna.tcp.SocketServer
    TCP_CLIENT prerna.tcp.client.NativePySocketClient
    NATIVE_PY_SERVER true
    `;

    const StyledContent = styled("div")(({ theme }) => ({
        marginTop: theme.spacing(2),
        borderRadius: "15px",
        backgroundColor: theme.palette.background.paper,
        minHeight: theme.spacing(60),
    }));

    const StyledTitleBox = styled(Box)(({ theme }) => ({
        padding: theme.spacing(2),
        backgroundColor: theme.palette.primary.selected,
        color: theme.palette.text.secondary,
        borderTopLeftRadius: "15px",
        borderTopRightRadius: "15px",
    }));

    const StyledCodeBox = styled("div")(({ theme }) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "460px",
        width: "100%",
        paddingTop: "10px",
        background: theme.palette.background.paper,
    }));

    return (
        <StyledContent>
            <StyledTitleBox>
                RDF_Map.prop
            </StyledTitleBox>
            <StyledCodeBox>
                <Suspense
                    fallback={
                        <LoadingScreen.Trigger description="Loading..." />
                    }
                >
                     <Editor
                        width={"100%"}
                        height={"100%"}
                        value={code}
                        language={"properties"}
                        options={{
                            readOnly: true,
                        }}
                    />
                </Suspense>
            </StyledCodeBox>
        </StyledContent>
    );
};