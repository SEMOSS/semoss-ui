## Contributing Guidelines: Pull Request Code Standards

Thank you for contributing to this project! To ensure code quality, maintainability, and consistency, please follow these standards when submitting pull requests.

---

**Component Structure**

- Keep each React component in its own file.  
  *This improves code organization, readability, and makes components easier to locate, reuse, and test. For example, place `MyButton` in `MyButton.tsx`.*

---

**Styling Practices**

- Do not use inline styles (e.g., `style={{ color: 'red' }}` or `sx={{ color: 'red' }}`in JSX).  
  *All styles should be implemented using Styled Components to maintain separation of concerns and enable theme integration. This also ensures that styles are consistent and easier to manage across the application.*

- When applying styles, always use the respective theming tokens from the project's theme.  
  *This ensures visual consistency and makes it easy to update the design system-wide. For example, use `theme.palette.primary.main` or `theme.spacing(1)` instead of hardcoded values.*

---

**Code Reusability**

- Avoid code duplication when creating components.  
  *Extract shared logic or UI into reusable components or hooks. If you find yourself copying and pasting code, consider creating a new shared component or utility function to follow DRY (Don't Repeat Yourself) principles.*

---

**Documentation and Comments**

- Annotate all functions and add meaningful comments throughout your code.  
  *Briefly describe the purpose and behavior of complex logic, especially for non-obvious code. This helps reviewers and future contributors understand your work.*

- Document all component props clearly.  
  *Use JSDoc comments or TypeScript interfaces to specify prop types, expected values, and default behaviors. This documentation should appear above the component or in the prop type/interface definition.*

---

**UI Library Usage**

- Do not import Material UI or Emotion libraries directly in client code.  
  *These libraries will be restricted soon and should not be used for new development. Use only the approved UI libraries.*

- Minimize the use of generic layout components like `Box`.  
  *Instead, use components from the `@semoss/ui` library to ensure design consistency and leverage shared functionality. If a suitable component does not exist, discuss creating one with the team.*

---

**Summary Table**

| Guideline                            | Description                                                                                   |
|-------------------------------------- |----------------------------------------------------------------------------------------------|
| 1 Component per File                  | Each component should have its own file for clarity and modularity.                           |
| No Inline Styles                      | Use Styled Components for all styling.                                                        |
| Code Reusability                      | Refactor repeated code into reusable components or hooks.                                     |
| Use Theming Tokens                    | Apply styles using theme tokens for consistency.                                              |
| Annotate & Comment Code               | Document functions, logic, and props for maintainability.                                     |
| Avoid Material/Emotion in Client Code | Do not use Material UI or Emotion libraries directly in client-side code.                     |
| Prefer @semoss/ui Components          | Use UI components from the `@semoss/ui` library instead of generic layout elements like `Box`.|

---

**Additional Notes**

- Ensure your code passes all linting and formatting checks before submitting a pull request.
- Test your components for responsiveness and accessibility.
- If you are unsure about a standard or need clarification, please ask in the project's communication channel or refer to the documentation.

By following these guidelines, you help keep the codebase clean, scalable, and easy for everyone to work with. Thank you for your contributions!