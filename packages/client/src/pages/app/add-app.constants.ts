export type APP_STEP_INTERFACE = {
    /** Title of Add App Workflow */
    title: string;
    /** Description for Add App Workflow */
    description: string;
    /** List of necessary steps for iomprting this app */
    steps: { name: string; title: string }[];
    /** If Workflow is not ready to be exposed */
    disabled: boolean;
};

export const ADD_APP_STEPS: Record<string, APP_STEP_INTERFACE> = {
    IMPORT_APP: {
        title: 'Import App',
        description:
            'Easily import your app with the flexibility of choosing between a seamless ZIP file upload or direct Git repository integration. Effortlessly bring your codebase into our platform, streamlining the onboarding process for efficient collaboration and development',
        steps: [
            {
                name: 'metavals',
                title: 'Details',
            },
            {
                name: 'access',
                title: 'Access',
            },
        ],
        disabled: false,
    },
    TEMPLATE_APP: {
        title: 'Build from scratch',
        description:
            'Define purpose, research market, design UI/UX, choose tech stack, develop frontend/backend, integrate APIs, test rigorously, ensure security, deploy, monitor, gather feedback, iterate, and launch for a successful app.',
        disabled: true,
        steps: [
            {
                name: 'metavals',
                title: 'Details',
            },
            {
                name: 'access',
                title: 'Access',
            },
        ],
    },
    FRAMEWORK_APP: {
        title: 'Build App with Framework',
        description:
            'Define purpose, research market, design UI/UX, choose front-end framework (React, AngularJs, Vue), develop responsive UI components, integrate APIs, test rigorously, ensure security, deploy, monitor, gather feedback, iterate, and launch for a dynamic and visually engaging app.',
        disabled: true,
        steps: [
            {
                name: 'metavals',
                title: 'Details',
            },
            {
                name: 'connect',
                title: 'Connect',
            },
            {
                name: 'access',
                title: 'Access',
            },
        ],
    },
    PROMPT_BUILDER: {
        title: 'Prompt Builder',
        description:
            'Empower your web design journey with our innovative UI Builder, responding to the prompt to create visually stunning websites effortlessly.  This intuitive platform allows you to design pixel-perfect layouts, customize interactions, and bring ideas to life seamlessly, all while freeing you from code constraints',
        steps: [],
        disabled: false,
    },
    UI_BUILDER: {
        title: 'UI Builder',
        description:
            'Craft visually stunning websites effortlessly with our UI Builder. Design pixel-perfect layouts, customize interactions, and bring ideas to life seamlessly, empowering you to create without code constraints.',
        steps: [
            {
                name: 'metavals',
                title: 'Details',
            },
            {
                name: 'access',
                title: 'Access',
            },
        ],
        disabled: false,
    },
};
