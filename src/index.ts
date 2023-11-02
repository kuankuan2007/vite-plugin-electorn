// 开发环境插件
import type { Plugin } from 'vite'
import type { AddressInfo } from 'node:net'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { spawn } from "child_process"
import esbuild from "esbuild"
import fs from "node:fs"
import path from 'node:path'
import * as electronBuilder from "electron-builder"
import { ViteDevServer, PreviewServerForHook, ResolvedConfig } from "vite"


const distBackgroundJsName ='electron-background.js'

// type MakeWritable<T> = { -readonly [P in keyof T]: T[P] };
type MakeDeepWritable<T> = { -readonly [P in keyof T]: MakeDeepWritable<T[P]> };
type WriteableConfiguration = MakeDeepWritable<electronBuilder.Configuration>
type CliOptionsWithConfiguration = Omit<electronBuilder.CliOptions, 'config'> & { config: WriteableConfiguration }
type Config = {
    main: string,
    electronBuilder: Omit<electronBuilder.CliOptions, 'config'> & {
        config: Omit<WriteableConfiguration, 'directories'> & {
            directories?: Omit<MakeDeepWritable<electronBuilder.MetadataDirectories>, 'app'>
        }
    },
    esbuildTarget: string
}
export default function vitePluginElectron(pluginConfig: Config): Plugin {
    let distDir: string;

    let ip: string;
    let processInfo: ChildProcessWithoutNullStreams
    let viteUserConfig: ResolvedConfig

    let distMain:string

    function buildBackground() {
        esbuild.buildSync({
            entryPoints: [path.resolve(process.cwd(), pluginConfig.main)],
            bundle: true,
            outfile: distMain,
            platform: "node",
            target: pluginConfig.esbuildTarget,
            external: ["electron"]
        })
    }
    function startDevElectron(){
        processInfo && processInfo.kill()
        processInfo = spawn(require("electron"), [distMain, ip])
        processInfo.stdout.on("data", (data) => {
            console.log(data.toString())
        })
        processInfo.stderr.on("data", (data) => {
            console.log(data.toString())
        })
    }
    function backgroundChange() {
        console.log("%c background file changed, restart electron", "color:yellow")
        buildBackground()
        startDevElectron()
    }

    function viteElectronConnect(server: ViteDevServer | PreviewServerForHook) {
        server.httpServer?.on("close", () => {
            console.log("%c server closed, kill electron process", "color:yellow")
            processInfo?.kill()
            fs.unwatchFile(pluginConfig.main, backgroundChange)
        })
        server.httpServer?.once("listening", () => {
            const addressInfo = server.httpServer?.address() as AddressInfo
            
            ip = `http://localhost:${addressInfo.port}`
            
            fs.watchFile(pluginConfig.main, backgroundChange)

            buildBackground()
            startDevElectron()
        })
    }

    
    return {
        name: "vite-plugin-electron",
        configResolved(userConfig) {
            viteUserConfig = userConfig
            distDir = path.resolve(process.cwd(), viteUserConfig.build?.outDir || 'dist')
            distMain = path.resolve(distDir, distBackgroundJsName)
        },
        configureServer: viteElectronConnect,
        configurePreviewServer: viteElectronConnect
        , closeBundle() {
            buildBackground()
            const packageInfo = JSON.parse(fs.readFileSync("package.json", "utf-8"))
            
            packageInfo.main = distBackgroundJsName

            const electronBuilderConfig: CliOptionsWithConfiguration = pluginConfig.electronBuilder as CliOptionsWithConfiguration
            if (!electronBuilderConfig.config['directories']) {
                electronBuilderConfig.config.directories = {}
            }

            electronBuilderConfig.config.directories.app = distDir
            electronBuilderConfig.config.directories.buildResources = path.resolve(process.cwd(), electronBuilderConfig.config.directories.buildResources || 'ele-dist')
            electronBuilderConfig.config.directories.output = path.resolve(process.cwd(), electronBuilderConfig.config.directories.output || 'ele-dist')

            fs.writeFileSync(path.resolve(distDir, 'package.json'), JSON.stringify(packageInfo, null, 4))
            fs.mkdirSync(path.resolve(distDir, 'node_modules'))

            electronBuilder.build(electronBuilderConfig as electronBuilder.CliOptions)
        }
    }
}