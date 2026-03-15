# Volumio React

React 19 application bootstrapped with Vite (JavaScript/JSX).

## Stack

| Library           | Purpose                   |
| ----------------- | ------------------------- |
| React 19 + Vite   | UI framework & build tool |
| TanStack Query v5 | Server state management   |
| Axios             | HTTP client               |
| React Hook Form   | Form state management     |
| Yup               | Schema validation         |
| Luxon             | Date/time utilities       |
| Bootstrap 5       | CSS framework             |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

| Script            | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start development server         |
| `npm run build`   | Production build                 |
| `npm run preview` | Preview production build locally |
| `npm run lint`    | Lint source files                |

### Visualizations

Required for spectrum analyzer

To stream the audio output from Volumio via HTTP, you must edit the`mpd.conf`file to add a`httpd`output.

1.  Access Volumio via SSH (user:`volumio`, pass:`volumio`).
2.  Edit`/etc/mpd.conf`(or the template in`/volumio/app/plugins/music_service/mpd/mpd.conf.tmpl`).
3.  Add the following`audio_output`block:

    conf

    ```
      audio_output {
      type "httpd"
      name "My HTTP MPD Stream"
      port "8000"
      format "44100:16:1"
    }
    ```

4.  Restart MPD:`sudo service mpd restart`.
