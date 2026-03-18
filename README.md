# Volumio Stylish Player Plugin (App Code)

About

This repository has the source code for the actual app for the Volumio Stylish Player plugin [found here](https://github.com/kjavia/volumio-plugins-sources-bookworm)

[Feature List](plugin-features.md)

## Official Docs

https://developers.volumio.com/plugins/plugins-overview

## Development

1. To develop the plugin you need to clone 2 repositories (this one and the one linked above) side by side in the same parent folder. This repo has the meat and bones of the UX, the plugin repo has the wrapper plugin code + a Node based web server to handle some api calls and serve the UI at a pre-designated port (3339). The plugin also povides JSON file to accept various settings for the plugin as well as install/uninstall scripts for installing the plugin on the device.

As of now, node version 24.x should be able to build both repos locally.

2. Once you have 2 repos, run `npm i` to install all the dependencies, on both repos. Run
   `npm run build-and-push` step to build, and copy the dist folder contents from this repo to the other one for deployment to the device. Normally you would be doing this on a different branch than `main`. Once you have the branch pushed to origin for the other repo (having the latest build artifcats from this repo).

3. SSH into volumio (username: volumio and pwd: volumio). Clone the other repo there in your user's home folder, switch to the WIP branch there, and run these commands

```
  mkdir /data/plugins/user_interface/stylish_player
  cd ~/volumio-plugins-sources-bookworm/stylish_player
  volumio plugin refresh
  volumio plugin update
```

This should install the plugin at the 1st folder above, on the device. It has the content of the plugin repository linked on top, along with the build artifacts of this repo in the `app` folder. You can manually do `npm i` in that folder.

If something goes wrong, delete `node_modules` and `package-lock.json` and rerun `npm i`
in case volumio hasn't done that.

```
  volumio vrestart
```

Common issues:

- Not being in the current branch (not main) on the device
- Not being in the correct folder to run the volumio commands (should be the stylish_player folder in the repo on the device)
- NPM packages not installed for the platrom on the device
- Some other code or config error

To view logs on the device

```
  sudo journalctl -u volumio -n 50
```

After installing the plugin the first time, it's available for installation like any other plugin at http://volumio.local, the plugin provides a list of settings (check UIConfig.json) to see a list of settings.

- Wallpaper feature requires API key from Unsplash.com
- Weather feature doesn't require an API key for the free tier.

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

Open <http://localhost:5173> in your browser.

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

1. Access Volumio via SSH (user:`volumio`, pass:`volumio`).
2. Edit`/etc/mpd.conf`(or the template in`/volumio/app/plugins/music_service/mpd/mpd.conf.tmpl`).
3. Add the following`audio_output`block:

   conf

   ```
     audio_output {
     type "httpd"
     name "My HTTP MPD Stream"
     port "8000"
     format "44100:16:1"
   }
   ```

4. Restart MPD:`sudo service mpd restart`.

## Plugin installation on Volumio device for testing

To install the plugin for development & testing on actual device, follow these steps:

- build-and-push.js

# Credits

## 3D Globe

The globe visualization uses [cobe](https://github.com/shuding/cobe), a lightweight WebGL globe renderer by Shuding. It is integrated in `src/components/animated-players/GlobePlayer.jsx`.

## Wallpapers

[https://unsplash.com](UnSplash)

## Weather API

[https://open-meteo.com](Open+Mateo)

## Spectrum Analyzer

[https://audiomotion.dev/](Audio+Motion)
