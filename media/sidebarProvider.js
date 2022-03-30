/*
 * @Description: 侧边栏js
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-20 11:17:06
 * @LastEditTime: 2022-03-30 18:04:37
 * @FilePath: \proxy\media\sidebarProvider.js
 */
(function () {
  // 获取dom
  const proxyPort = document.querySelector('#proxy-port');
  const proxyTarget = document.querySelector('#proxy-target');
  const create = document.querySelector('.create-btn');
  const logContainer = document.querySelector('.log-container');
  const list = document.querySelector('.proxy-list');
  //代理服务器列表
  let proxyList = [];
  // 当前日志输出端口
  let logPort = null;
  /**
   * @description: 存储日志
   * @param {Array} list 代理列表
   * @return {void}
   */
  const saveLog = (list) => {
    logContainer.innerHTML = list.find(el => {
      const l = el.proxy._connectionKey.split(':');
      const p = Number(l[l.length - 1]);
      return logPort === p;
    })?.log;
  };
  /**
   * @description: 更新代理服务器列表
   * @return {void}
   */
  const updateList = () => {
    // 创建dom
    const li = document.createElement('li');
    const p = document.createElement('p');
    const i1 = document.createElement('i');
    const i2 = document.createElement('i');
    // 设置值
    i1.setAttribute('class', 'i-log');
    i1.setAttribute('title', '显示日志');
    i2.setAttribute('class', 'i-close');
    i2.setAttribute('title', '关闭');
    // 插入dom
    li.appendChild(p);
    li.appendChild(i1);
    li.appendChild(i2);
    list.innerHTML = '';
    proxyList.forEach(({ proxy: { _connectionKey } }) => {
      const arr = _connectionKey.split(':');
      const port = Number(arr[arr.length - 1]);
      p.innerText = port;
      const item = li.cloneNode(true);
      if (port === logPort) {
        item.setAttribute('class', 'proxy-log');
      }
      list.appendChild(item);
    });
    // 显示日志
    document.querySelectorAll('.i-log').forEach(el => {
      el.onclick = (e) => {
        const node = e.target;
        // 不是点击当前日志服务器
        if ((node.parentNode.getAttribute('class')?.indexOf('proxy-log') ?? -1) < 0) {
          logPort = Number(node.previousElementSibling.innerText);
          const li = node.parentNode.parentNode.children;
          for (let i = 0; i < li.length; i++) {
            li[i].removeAttribute('class');
          }
          node.parentNode.setAttribute('class', 'proxy-log');
          saveLog(proxyList);
        }
      };
    });
    // 关闭当前代理服务器
    document.querySelectorAll('.i-close').forEach((el, index) => {
      el.onclick = (e) => {
        const port = Number(e.target.parentNode.children[0].innerText);
        if (port === logPort) {
          logContainer.innerHTML = '';
        }
        proxyList.splice(index, 1);
        vs.postMessage({
          type: 'close',
          value: {
            port
          }
        });
      };
    });
  };
  // 监听消息广播
  window.addEventListener('message', ({ data: { type, value } }) => {
    switch (type) {
      // 日志
      case 'log': {
        proxyList = value;
        saveLog(value);
        break;
      }
      // 代理
      case 'proxy': {
        const { proxy, port } = value;
        proxyList = proxy;
        logPort = Number(port);
        updateList();
        break;
      }
      // 读取代理
      case 'load': {
        const { proxy } = value;
        proxyList = proxy;
        if (proxyList.length > 0) {
          const arr = proxyList[0].proxy._connectionKey.split(':');
          const port = Number(arr[arr.length - 1]);
          logPort = port;
          updateList();
          saveLog(proxyList);
        }
        break;
      }
    }
  });
  // 创建代理
  create.onclick = () => {
    const reg = /(http|https):\/\/([\w.]+\/?)\S*/;
    const port = Number(proxyPort.value);
    const target = proxyTarget.value;
    if (!isNaN(port) && port > 0 && port <= 65535) {
      if (reg.test(target)) {
        proxyPort.value = null;
        proxyTarget.value = null;
        vs.postMessage({
          type: 'create',
          value: {
            port,
            target
          }
        });
      } else {
        vs.postMessage({
          type: 'error',
          value: '请输入合法的代理地址'
        });
      }
    } else {
      vs.postMessage({
        type: 'error',
        value: '请输入合法的端口号'
      });
    }
  };
  /**
   * @description: 读取代理
   * @param {void}
   * @return {void}
   */
  const loadProxy = function () {
    vs.postMessage({
      type: 'load',
      value: {}
    });
  };
  loadProxy();
}());