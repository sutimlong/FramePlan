/**
 * 由 vite.config.ts 的 define 在建置時注入的應用程式版本，
 * 來源是 package.json 的 version，與主程序 app.getVersion() 相同。
 */
declare const __APP_VERSION__: string
