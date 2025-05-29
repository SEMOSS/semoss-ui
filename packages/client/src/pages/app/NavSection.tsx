import { Typography, Button, Box } from '@semoss/ui';
import Appagent from '../../assets/img/Appagent.svg';
import Appcode from '../../assets/img/Appcode.svg';
import Appdragdrop from '../../assets/img/Appdragdrop.svg';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';

const navCards = [
    {
        title: 'Drag and drop blocks',
        description:
            'Drag and drop UI components to make your app come to life. Customize the design of your app in this low code environment.',
        image: Appagent,
        type: 'blocks',
        testId: 'new-app-drag-btn',
    },
    {
        title: 'Develop in code',
        description:
            'Choose a framework or start from scratch—code and preview your app seamlessly in our editor!',
        image: Appcode,
        type: 'code',
        testId: 'new-app-code-btn',
    },
    {
        title: 'Construct an agent',
        description:
            'Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.',
        image: Appdragdrop,
        type: 'agent',
        testId: 'new-app-agent-btn',
    },
];

const NavCard = ({ title, description, type, image, setApp, testId }) => (
    <Box
        sx={{
            border: '1px solid #e0e0e0',
            minWidth: '32%',
            borderRadius: 2,
            boxShadow: 3,
            padding: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 2,
            backgroundColor: '#ffffff',
        }}
    >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" gutterBottom>
                {description}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
                variant="outlined"
                data-testid={testId}
                sx={{
                    borderColor: '#C4C4C4',
                    color: '#212121',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    alignSelf: 'flex-start',
                }}
                onClick={() => {
                    // Handle button click, e.g., navigate to a specific page
                    console.log(`Navigating to ${title}`);
                    setApp(type);
                }}
            >
                Get started
            </Button>
            {image && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                    }}
                >
                    <img
                        src={image}
                        alt={title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                        }}
                    />
                </Box>
            )}
        </Box>
    </Box>
);

const NavSection = ({
    setupApp,
    uploadApp,
}: {
    setupApp: (type: 'blocks' | 'code' | 'agent') => void;
    uploadApp?: () => void;
}) => {
    return (
        <Box
            sx={{
                margin: 0,
                paddingBottom: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Get started with our tools
                </Typography>
                {uploadApp && (
                    <Button
                        startIcon={<FileUploadOutlined />}
                        variant="outlined"
                        sx={{
                            borderColor: '#C4C4C4',
                            color: '#212121',
                            borderRadius: '12px',
                            padding: '10px 16px',
                            alignSelf: 'flex-start',
                        }}
                        onClick={uploadApp}
                        data-testid={'new-app-upload-btn'}
                    >
                        Upload App
                    </Button>
                )}
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignSelf: 'center',
                    gap: 3,
                    margin: 0,
                }}
            >
                {navCards.map((card) => (
                    <NavCard key={card.title} {...card} setApp={setupApp} />
                ))}
            </Box>
        </Box>
    );
};

export default NavSection;
