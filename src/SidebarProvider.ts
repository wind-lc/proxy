/*
 * @Description: 侧边栏
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-20 11:06:45
 * @LastEditTime: 2022-04-01 11:22:30
 * @FilePath: \proxy\src\SidebarProvider.ts
 */

import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { IProxyLog } from "./interface";
import proxy from "./proxy";
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  public proxyList: IProxyLog[] = [];
  constructor(private readonly _extensionUri: vscode.Uri) { }
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        // 创建代理
        case 'create': {
          const { port, target } = data.value;
          proxy(port, target, (log: any) => {
            const { request: { header: { origin, host }, method, url }, target } = log;
            const arr = host.split(':');
            const port = Number(arr[arr.length - 1]);
            this.proxyList = this.proxyList.map(el => {
              const l = el.proxy._connectionKey.split(':');
              const p = Number(l[l.length - 1]);
              if (port === p) {
                el.log += `[${method}]${origin}=>${host}=>${target}${url}\n`;
              }
              return el;
            });
            this._view?.webview.postMessage({
              type: 'log',
              value: this.proxyList
            });
          }).then(({ proxy, info }) => {
            this.proxyList.push({
              proxy,
              log: ''
            });
            vscode.window.showInformationMessage(info);
            this._view?.webview.postMessage({
              type: 'proxy',
              value: { proxy: this.proxyList, port }
            });
          }).catch(error => {
            vscode.window.showErrorMessage(error);
          });
          break;
        }
        // 读取代理
        case 'load': {
          this._view?.webview.postMessage({
            type: 'load',
            value: { proxy: this.proxyList }
          });
          break;
        }
        // 关闭代理服务器
        case 'close': {
          const { port } = data.value;
          const index = this.proxyList.findIndex(el => el.proxy._connectionKey.indexOf(port) > 0);
          this.proxyList[index].proxy.close();
          this.proxyList.splice(index, 1);
          vscode.window.showInformationMessage(`${port}代理服务器已关闭`);
          this._view?.webview.postMessage({
            type: 'proxy',
            value: { proxy: this.proxyList, port: null }
          });
          break;
        }
        // 关闭代理服务器
        case 'error': {
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }
  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }
  private _getHtmlForWebview(webview: vscode.Webview) {
    // 加载js
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "sidebarProvider.js"));
    // 样式表路径
    const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "media", "reset.css");
    const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css");
    const styleSidebarProvider = vscode.Uri.joinPath(this._extensionUri, "media", "sidebarProvider.css");
    // 加载样式表
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    const styleSidebarProviderUri = webview.asWebviewUri(styleSidebarProvider);
    const nonce = getNonce();
    return `<!DOCTYPE html>
			<html lang="zh-Hans">
			<head>
				<meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <link href="${styleSidebarProviderUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const vs = acquireVsCodeApi();
        </script>
			</head>
      <body>
        <main>
          <section class="proxy-form">
            <label for="proxy-port">端口号：</label>
            <input id="proxy-port" type="text" placeholder="0-65535"/>
            <label for="proxy-target">代理地址：</label>
            <input id="proxy-target" type="text" placeholder="http://xxx.xxx"/>
            <button class="create-btn">创建代理</button>
          </section>
          <p class="proxy-title">代理服务器列表：</p>
          <ul class="proxy-list"></ul>
          <p class="proxy-title">日志详情：</p>
          <textarea class="log-container" readonly></textarea>
        </main>
        <script src="${scriptUri}" nonce="${nonce}"></script>
			</body>
			</html>`;
  }
}