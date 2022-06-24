/*
 * @Description: 侧边栏
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-20 11:06:45
 * @LastEditTime: 2022-06-23 15:53:24
 * @FilePath: \proxy\src\SidebarProvider.ts
 */

import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { IMessage, IProxyList } from "./interface";
import proxy from "./proxy";
export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  public proxyList: IProxyList[] = [];
  constructor(private readonly _extensionUri: vscode.Uri, private readonly globalState: vscode.Memento) { }
  // 获取端口号
  private getPort(host: string) {
    return Number(host.split(':')[host.split(':').length - 1]);
  }
  /**
   * @description: 创建代理服务器
   * @param {IMessage} data 通信信息
   * @return {void}
   */
  private createProxy(data: IMessage | undefined) {
    if (!data) {
      return;
    }
    const item = data.value.list.find(el => el.checked);
    const target = item?.target || '';
    proxy(data.value.port, target, (log: any) => {
      const { request: { header: { origin, host }, method, url }, target } = log;
      this.proxyList = this.proxyList.map(el => {
        if (data.value.port === this.getPort(el.proxy._connectionKey)) {
          // 保持日志最多一百条
          if (el.log.length >= 100) {
            el.log.shift();
          }
          el.log.push(`[${method}]${origin}=>${host}=>${target}${url}`);
        }
        return el;
      });
      // 发送日志
      this._view?.webview.postMessage({
        type: 'log',
        value: { proxy: this.getProxyList() }
      });
    }).then(({ proxy, info }) => {
      // 保存代理
      this.proxyList.push({
        proxy,
        log: [],
        name: item?.name || '',
        status: 'runing',
        port: Number(data.value.port),
        list: data.value.list
      });
      // 弹窗提示
      vscode.window.showInformationMessage(info);
      this._view?.webview.postMessage({
        type: 'load',
        value: { proxy: this.getProxyList(), type: 'create', port: Number(data.value.port) }
      });
    }).catch(error => {
      vscode.window.showErrorMessage(error);
      this._view?.webview.postMessage({
        type: 'load',
        value: { proxy: this.getProxyList(), type: 'create' }
      });
    });
  }
  /**
   * @description: 获取代理服务器列表
   * @param {boolean} update 是否保存到缓存
   * @return {IProxyList[]}
   */
  private getProxyList(update: boolean = true): IProxyList[] {
    const storage = (this.globalState.get<IProxyList[]>('proxyList') || []).map(el => {
      el.status = 'stop';
      return el;
    });
    this.proxyList.map(el => {
      if (el.proxy._handle === null) {
        el.status = 'stop';
      } else {
        el.status = 'runing';
      }
      return el;
    });
    const list: IProxyList[] = JSON.parse(JSON.stringify(this.proxyList));
    storage.forEach(el => {
      if (list.findIndex(item => item.port === el.port) < 0) {
        list.push(el);
      }
    });
    if (update) {
      this.globalState.update('proxyList', list);
    }
    return list;
  }
  /**
   * @description: 更新代理服务器
   * @param {IMessage} data 通信数据
   * @return {void}
   */
  private async updateProxy(data: IMessage) {
    await this.delProxy(Number(data.value.port));
    this.createProxy(data);
  }
  /**
   * @description: 删除代理服务器
   * @param {number} port 端口号
   * @param {boolean} update 是否更新
   * @return {void}
   */
  private async delProxy(port: number, update: boolean = false) {
    const i = this.proxyList.findIndex(el => el.port === port);
    if (i >= 0) {
      await this.proxyList[i].proxy.close();
      this.proxyList.splice(i, 1);
    }
    const storage = this.globalState.get<IProxyList[]>('proxyList') || [];
    const j = storage.findIndex(el => el.port === Number(port));
    if (j >= 0) {
      storage.splice(j, 1);
    }
    const list: IProxyList[] = JSON.parse(JSON.stringify(this.proxyList));
    storage.forEach(el => {
      if (list.findIndex(item => item.port === el.port) < 0) {
        list.push(el);
      }
    });
    this.globalState.update('proxyList', list);
    if (update) {
      vscode.window.showInformationMessage(`${port}代理服务器已删除`);
    }
    this._view?.webview.postMessage({
      type: 'load',
      value: { proxy: list, type: 'del' }
    });
  }
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    // 接受渲染器事件
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        // 读取代理
        case 'load': {
          this._view?.webview.postMessage({
            type: 'load',
            value: { proxy: this.getProxyList(), type: 'load' }
          });
          break;
        }
        // 创建代理
        case 'create': {
          this.createProxy(data);
          break;
        }
        // 停止代理服务器
        case 'stop': {
          const { port } = data.value;
          this.proxyList[this.proxyList.findIndex(el => el.port === Number(port))].proxy.close();
          vscode.window.showInformationMessage(`端口${port}代理服务器已停止`);
          this._view?.webview.postMessage({
            type: 'load',
            value: { proxy: this.getProxyList(), type: 'close' }
          });
          break;
        }
        // 启动代理服务器
        case 'runing': {
          const { port } = data.value;
          data.value.list = this.getProxyList(false).find(el => Number(el.port) === port)?.list || [];
          this.createProxy(data);
          break;
        }
        // 更新代理服务器
        case 'update': {
          this.updateProxy(data);
          break;
        }
        // 删除服务器
        case 'del': {
          const { port } = data.value;
          vscode.window.showInformationMessage(`确定删除${port}代理服务器吗？`, '确定', '再想想').then(item => {
            if (item === '确定') {
              this.delProxy(Number(port));
            }
          });
          break;
        }
        // 清除日志
        case 'clear': {
          const proxyList = this.getProxyList(false);
          vscode.window.showQuickPick(
            proxyList.map(el => el.port.toString()),
            {
              canPickMany: true,
              ignoreFocusOut: true,
              placeHolder: '选择需要清空日志的代理服务器',
              title: '清空日志'
            }).then((list = []) => {
              if (list.length > 0) {
                const arr = JSON.parse(JSON.stringify(proxyList.map(el => {
                  if (list.includes(el.port.toString())) {
                    el.log = [];
                  }
                  return el;
                })));
                this.globalState.update('proxyList', arr);
                vscode.window.showInformationMessage(`代理服务器${list.join(',')}的日志已清空`);
                this._view?.webview.postMessage({
                  type: 'log',
                  value: { proxy: this.getProxyList() }
                });
              }
            });
          break;
        }
        // 错误弹窗
        case 'error': {
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
    // 当视图的可见性改变时触发的事件
    webviewView.onDidChangeVisibility(() => {
      // 视图隐藏时 某些事件需要卸载
      // 视图显示时 某些事件需要重新绑定
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
        <!-- svg图标 -->
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="svg-list">
          <symbol viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" id="stop">
            <path d="M2 2v12h12V2H2zm10.75 10.75h-9.5v-9.5h9.5v9.5z"/>
          </symbol>
          <symbol viewBox="0 1 14 14" xmlns="http://www.w3.org/2000/svg" id="running">
            <path d="M3.78 2L3 2.41v12l.78.42 9-6V8l-9-6zM4 13.48V3.35l7.6 5.07L4 13.48z"/>
          </symbol>
          <symbol viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="setting">
            <path d="M19.85 8.75l4.15.83v4.84l-4.15.83 2.35 3.52-3.43 3.43-3.52-2.35-.83 4.15H9.58l-.83-4.15-3.52 2.35-3.43-3.43 2.35-3.52L0 14.42V9.58l4.15-.83L1.8 5.23 5.23 1.8l3.52 2.35L9.58 0h4.84l.83 4.15 3.52-2.35 3.43 3.43-2.35 3.52zm-1.57 5.07l4-.81v-2l-4-.81-.54-1.3 2.29-3.43-1.43-1.43-3.43 2.29-1.3-.54-.81-4h-2l-.81 4-1.3.54-3.43-2.29-1.43 1.43L6.38 8.9l-.54 1.3-4 .81v2l4 .81.54 1.3-2.29 3.43 1.43 1.43 3.43-2.29 1.3.54.81 4h2l.81-4 1.3-.54 3.43 2.29 1.43-1.43-2.29-3.43.54-1.3zm-8.186-4.672A3.43 3.43 0 0 1 12 8.57 3.44 3.44 0 0 1 15.43 12a3.43 3.43 0 1 1-5.336-2.852zm.956 4.274c.281.188.612.288.95.288A1.7 1.7 0 0 0 13.71 12a1.71 1.71 0 1 0-2.66 1.422z"/>
          </symbol>
          <symbol viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="log">
            <path d="M19.5 0v1.5L21 3v19.5L19.5 24h-15L3 22.5V3l1.5-1.5V0H6v1.5h3V0h1.5v1.5h3V0H15v1.5h3V0h1.5zm-15 22.5h15V3h-15v19.5zM7.5 6h9v1.5h-9V6zm9 6h-9v1.5h9V12zm-9 6h9v1.5h-9V18z"/>
          </symbol>
          <symbol viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" id="delete">
            <path d="M189.124926 206.817739 834.875074 206.817739C824.056355 206.817739 815.037987 197.278738 815.718488 186.375821L766.845228 969.422054C767.420593 960.203599 774.673955 953.37931 784.03501 953.37931L239.96499 953.37931C249.232543 953.37931 256.586205 960.312638 257.154772 969.422054L208.281512 186.375821C208.961624 197.272664 199.982115 206.817739 189.124926 206.817739ZM186.671228 973.821228C188.422497 1001.879852 211.883661 1024 239.96499 1024L784.03501 1024C811.990051 1024 835.582287 1001.80337 837.328772 973.821228L886.202033 190.774996C888.065218 160.922854 864.68894 136.197049 834.875074 136.197049L189.124926 136.197049C159.269853 136.197049 135.939407 160.996952 137.797967 190.774996L186.671228 973.821228ZM971.034483 206.817739C990.535839 206.817739 1006.344828 191.00875 1006.344828 171.507394 1006.344828 152.00602 990.535839 136.197049 971.034483 136.197049L52.965517 136.197049C33.464161 136.197049 17.655172 152.00602 17.655172 171.507394 17.655172 191.00875 33.464161 206.817739 52.965517 206.817739L971.034483 206.817739ZM358.849148 206.817739 665.150852 206.817739C694.015417 206.817739 717.323123 183.246901 717.323123 154.533323L717.323123 52.284416C717.323123 23.465207 693.830144 0 665.150852 0L358.849148 0C329.984583 0 306.676877 23.570838 306.676877 52.284416L306.676877 154.533323C306.676877 183.352514 330.169856 206.817739 358.849148 206.817739ZM377.297567 52.284416C377.297567 62.397193 369.165877 70.62069 358.849148 70.62069L665.150852 70.62069C654.846093 70.62069 646.702433 62.486652 646.702433 52.284416L646.702433 154.533323C646.702433 144.420529 654.834123 136.197049 665.150852 136.197049L358.849148 136.197049C369.153907 136.197049 377.297567 144.331087 377.297567 154.533323L377.297567 52.284416ZM595.6986 835.467988C595.6986 854.969344 611.507571 870.778333 631.008945 870.778333 650.510301 870.778333 666.319289 854.969344 666.319289 835.467988L666.319289 324.729062C666.319289 305.227705 650.510301 289.418717 631.008945 289.418717 611.507571 289.418717 595.6986 305.227705 595.6986 324.729062L595.6986 835.467988ZM428.3014 324.729062C428.3014 305.227705 412.492429 289.418717 392.991055 289.418717 373.489699 289.418717 357.680711 305.227705 357.680711 324.729062L357.680711 835.467988C357.680711 854.969344 373.489699 870.778333 392.991055 870.778333 412.492429 870.778333 428.3014 854.969344 428.3014 835.467988L428.3014 324.729062Z"/>
          </symbol>
        </svg>
        <!-- svg图标 -->
        <main>
          <p class="proxy-title">代理服务列表:</p>
          <ul class="proxy-list"></ul>
          <button class="create-proxy">创建代理</button>
          <p class="proxy-title">日志详情<span class="proxy-log-name"></span>:</p>
          <textarea class="log-container" readonly></textarea>
          <button class="delete-log">清除日志</button>
          <!-- 设置代理服务器 -->
          <div class="proxy-modal">
            <div class="spin">
              <div>
                <i></i>
                <p>请稍等...</p>
              </div>
            </div>
            <p class="proxy-modal-title"></p>
            <label for="proxy-port">端口号:</label>
            <input id="proxy-port" type="text" placeholder="请输入端口号:0-65535"/>
            <button class="add-target">添加地址</button>
            <div class="proxy-info">
              <table class="proxy-table-thead">
                <colgroup>
                  <col width="40px"></col>
                  <col></col>
                  <col></col>
                  <col width="40px"></col>
                </colgroup>
                <thead>
                  <tr>
                    <th>运行</th>
                    <th>代理地址</th>
                    <th>备注名</th>
                    <th>操作</th>
                  </tr>
                </thead>
              </table>
              <div class="proxy-table-tbody">
                <table>
                  <colgroup>
                    <col width="40px"></col>
                    <col></col>
                    <col></col>
                    <col width="40px"></col>
                  </colgroup>
                  <tbody class="proxy-wrapper"></tbody>
                </table>
              </div>
            </div>
            <button class="save-proxy">保存并运行</button>
            <button class="cancel">取消</button>
          </div>
          <!-- 设置代理服务器 -->
        </main>
        <script src="${scriptUri}" nonce="${nonce}"></script>
			</body>
			</html>`;
  }
}