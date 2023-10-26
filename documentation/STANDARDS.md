# Coding Standards

This Markdown file serves as a comprehensive guide outlining the coding standards to be adhered to across our codebase. Consistent coding practices ensure readability, maintainability, and collaboration among developers. Please refer to this document when contributing to the project to ensure uniformity in our code and promote a high standard of quality.

## State Management

### Application Level State

In our application, we harness the power of MobX for seamless global state management. We've adopted a centralized store approach, where a single store acts as the conductor orchestrating all other stores. Each individual store encapsulates and manages state for specific functionalities.

By consolidating state logic into dedicated stores, we enhance code maintainability and clarity. The main store serves as the nexus, effortlessly consuming and coordinating the various state slices across our application. This streamlined architecture not only simplifies state management but also promotes consistency and coherence in our codebase.

To facilitate convenient access to our central store in the application, we've implemented a custom React hook called useRootStore. This hook is designed to simplify the process of interacting with the overarching store from any component.

When you employ useRootStore in your component, it seamlessly grants access to the central store and its associated methods. This abstraction shields components from the details of how the store is implemented, promoting a clean and intuitive API for state management.

Here's a brief guide on utilizing the useRootStore hook:

1. Import the Hook:
```
import { useRootStore } from '@/hooks';
```

2. Invoke the Hook:
```
const { configStore, monolithStore } = useRootStore();
```

### Feature Specific State

In our codebase, we leverage the power of React context for efficient state management within specific business features. By creating dedicated contexts, we encapsulate the state logic related to a particular domain, ensuring modularity and clarity in our code architecture.

To seamlessly access and manipulate the state within these contexts, we provide custom hooks. These hooks serve as a bridge, enabling components to interact with the underlying context state in a clean and intuitive manner.

By adopting this approach, we enhance the maintainability and scalability of our application, as each business feature maintains its own state in isolation. Developers can easily understand and extend the functionality of a feature without impacting the broader application state. This modular design fosters a more organized and collaborative development environment.

## Style

In our development practices, we prioritize the use of styled components over inline styles to craft visually appealing and maintainable user interfaces. Styled components offer a powerful and intuitive way to manage styles in React applications.

Rather than scattering styles throughout the JSX code, styled components allow us to encapsulate styles within dedicated components. This not only promotes a cleaner and more readable codebase but also ensures a clear separation of concerns between structure and presentation.

Example:
```
const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));
```