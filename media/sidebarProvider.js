/*
 * @Description: 侧边栏js
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-20 11:17:06
 * @LastEditTime: 2021-12-21 21:37:46
 * @FilePath: \proxy\media\sidebarProvider.js
 */
(function () {
  // 获取dom
  const port = document.querySelector('#proxy-port');
  const target = document.querySelector('#proxy-target');
  const create = document.querySelector('.create-btn');
  const log = document.querySelector('.log-container');
  const clear = document.querySelector('.clear-btn');
  const list = document.querySelector('.proxy-list');
  //代理服务器列表
  let proxyList = [];
  // 当前日志输出端口
  let logPort = null;
  // 日志列表
  const logList = {};
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
    proxyList.forEach(({ _connectionKey }) => {
      const arr = _connectionKey.split(':');
      const port = arr[arr.length - 1];
      p.innerText = port;
      const item = li.cloneNode(true);
      if (port === logPort) {
        item.setAttribute('class', 'proxy-log');
      }
      list.appendChild(item);
    });
    // 绑定事件
    document.querySelectorAll('.i-log').forEach(el => {
      el.onclick = (e) => {
        const node = e.target;
        logPort = node.previousElementSibling.innerText;
        const li = node.parentNode.parentNode.children;
        for (let i = 0; i < li.length; i++) {
          li[i].removeAttribute('class');
        }
        node.parentNode.setAttribute('class', 'proxy-log');
        log.innerHTML = logList[logPort] ? logList[logPort].join('') : '';
      };
    });
  };
  /**
   * @description: 存储日志
   * @param {number} port 端口
   * @param {string} log 日志信息
   * @return {void}
   */
  const saveLog = (port, log) => {
    // 增加
    if (logList.hasOwnProperty(port)) {
      logList[port].push(log);
    } else {
      // 新增
      logList[port] = [];
      logList[port].push(log);
    }
  };
  // 监听消息广播
  window.addEventListener('message', ({ data: { type, value } }) => {
    switch (type) {
      // 日志
      case 'log': {
        const { origin, host, target, method, url, port } = value;
        const text = `[${method}]${origin}=>${host}=>${target}${url}\n`;
        saveLog(port, text);
        if (port === logPort) {
          log.innerHTML += text;
        }
        break;
      }
      // 代理
      case 'proxy': {
        const { proxy, port } = value;
        proxyList = proxy.reverse();
        logPort = port;
        updateList();
        break;
      }
    }
  });
  // 创建代理
  create.onclick = () => {
    vs.postMessage({
      type: 'create',
      value: {
        port: port.value,
        target: target.value
      }
    });
  };
  // 清空日志
  clear.onclick = () => {
    // vs.postMessage({
    //   type: 'clear',
    //   value: {}
    // });
  };
}());