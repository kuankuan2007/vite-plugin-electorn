# VitePluginElectron

VitePluginElectron is a plugin for Vite that simplifies the development of Electron projects.

## Features

- Automatic Electron startup with `npm run dev`
- Hot-reloading for renderer process and main process
- Automatic Electron opening with `npm run preview`
- Electron packaging automation with `npm run build`

## Installation

```bash
npm install @kuankuan/vite-plugin-electron --D
```

## Usage

### cocnfig

Add the following configuration to your `vite.config.js` file:

```javascript
import vitePluginElectron from "vite-plugin-electron";

export default {
  plugins: [
    vitePluginElectron({
      electronBuilder: {
        config: {
          files: ["**/*"],
          asar: true,
          productName: "yourAppName",
          nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
          },
        },
      },
      esbuildTarget: "node18",
      main: "src/background.ts",// electron entry file
    }),
  ],
};
```

### Main Process

If you are currently running on the development server or preview server, the third entry in `process.argv` will have a URL. You can determine the current environment by `process.argv[2]===undefined` and open the url provided by the development server instead of the index.html, like this

```javascript
if (process.argv[2]) {
  win.loadURL(process.argv[2]);
} else {
  win.loadFile("index.html");
}
```

## Commands

- `npm run dev`: Starts the Vite development server and automatically launches Electron.
- `npm run preview`: Builds your Vite project, opens Electron, and serves the packaged application.
- `npm run build`: Builds your Vite project and packages it using Electron.

## License

VitePluginElectron is licensed under the [MulanPSL-2.0](https://opensource.org/licenses/MulanPSL-2.0) license.

## Issues

If you encounter any issues or have suggestions, please open an issue on the [GitHub repository](https://github.com/kuankuan2007/vite-plugin-electron/issues).

## Credits

VitePluginElectron is developed and maintained by kuankuan and contributors.

Special thanks to the [Vite](https://vitejs.dev/) project and the Electron community for their support and inspiration.

[Gitee](https://gitee.com/kuankuan2007/vite-plugin-electron)|[Github](https://github.com/kuankuan2007/vite-plugin-electron)|[docs](https://kuankuan2007.gitee.io/docs/docsPage/?name=vite-plugin-electron)

![GitHub top language](https://img.shields.io/github/languages/top/kuankuan2007/vite-plugin-electron) ![GitHub issues](https://img.shields.io/github/issues/kuankuan2007/vite-plugin-electron)
