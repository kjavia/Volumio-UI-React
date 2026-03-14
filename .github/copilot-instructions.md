# Copilot Instructions

## Project Stack

- React 19 with JSX (no TypeScript)
- Vite 6 build tool
- TanStack Query v5 for server state
- Axios for HTTP requests
- React Hook Form + Yup for forms and validation
- Luxon for date/time handling
- Bootstrap 5 for styling

## Conventions

- Components live in `src/components/`
- Use `useQuery`/`useMutation` from `@tanstack/react-query` for data fetching
- Use `@hookform/resolvers/yup` to connect Yup schemas to React Hook Form
- Use Bootstrap utility classes for layout and styling
- Use Luxon `DateTime` for all date/time formatting
- All UI components like buttons, inputs, etc. should be in `src/components/` and be reusable
- Keep components small and focused on a single responsibility
- Use functional components and React hooks
- Use PropTypes for component props validation
- Use `src/contexts/` for React Context providers (e.g. SocketContext)
- Use `src/pages/` for page-level components that represent routes
- Volumio-UI and Volumio-Theme are read only for reference. All new code should be in this repo.
