# Copilot Instructions

## Purpose

This project is a Volumio plugin called "Stylish Player" that provides a modern and customizable user interface for controlling music playback on Volumio. The plugin is built using React and Vite, and it integrates with Volumio's backend APIs to fetch data and control playback.
See the plugin repository for more details:
https://github.com/volumio/volumio-plugins-sources-bookworm/

Plugin documentation:
https://developers.volumio.com/plugins/plugins-overview

## Project Stack

- React 19 with JSX (no TypeScript)
- Vite 6 build tool
- TanStack Query + Axios for data fetching and caching
- React Hook Form + Yup for forms and validation
- Luxon for date/time handling
- Bootstrap 5 for styling

## Conventions

- Components live in `src/components/`
- Use Bootstrap utility classes for layout and styling
- All UI components like buttons, inputs, etc. should be in `src/components/` and be reusable
- Keep components small and focused on a single responsibility
- Use functional components and React hooks
- Use PropTypes for component props validation
- Use `src/contexts/` for React Context providers (e.g. SocketContext)
- Use `src/pages/` for page-level components that represent routes
- use now_playing folder for reference (it's a separate but completed plugin, so it has examples of how to use Volumio APIs and structure a plugin)
