/*
 * @Description: 侧边栏js
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-20 11:17:06
 * @LastEditTime: 2022-04-29 10:23:15
 * @FilePath: \proxy\media\sidebarProvider.js
 */
(function () {
  //代理服务器列表
  let proxyList = [];
  // 日志端口
  let logPort = null;
  // 模态框类型
  let modalType = '';
  // 代理信息
  let proxyInfo = {
    port: null,
    list: []
  };
  /**
   * @description: 生成18位随机字符串
   * @param {void}
   * @return {string}
   */
  const getNonce = () => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const d = new Date().getTime().toString();
    for (let i = 0; i < 18 - d.length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text + d;
  };
  /**
   * @description: 提取端口号
   * @param {object} proxy 代理对象
   * @return {number} 端口号
   */
  const getPort = (proxy) => {
    const arr = proxy._connectionKey.split(':');
    return Number(arr[arr.length - 1]);
  };
  /**
   * @description: 更新日志
   * @param {void}
   * @return {void}
   */
  const updateLog = () => {
    document.querySelector('.proxy-log-name').innerText = logPort === null ? '' : `[${logPort}]`;
    document.querySelector('.log-container').innerHTML = proxyList.find(el => el.port === logPort)?.log || '';
  };
  /**
   * @description: 更新代理列表
   * @param {void}
   * @return {void}
   */
  const updateProxyList = () => {
    // 列表
    const li = document.querySelector('.proxy-list');
    // 代理服务器
    li.innerHTML = '';
    proxyList.forEach(el => {
      const port = getPort(el.proxy);
      li.innerHTML += `<li class="${el.status === 'runing' ? 'proxy-run' : ''}">
                        <p>${port}[${el.name}]</p>
                        <i title="${el.status === 'runing' ? '停止' : '运行'}">
                          <svg aria-hidden="true" data-status="${el.status}" data-port="${port}">
                            <use xlink:href="#${el.status === 'runing' ? 'stop' : 'running'}"/>
                          </svg>
                        </i>
                        <i title="设置">
                          <svg aria-hidden="true" data-port="${port}">
                            <use xlink:href="#setting"/>
                          </svg>
                        </i>
                        <i title="显示日志">
                          <svg aria-hidden="true" data-port="${port}">
                            <use xlink:href="#log"/>
                          </svg>
                        </i>
                        <i title="删除">
                          <svg aria-hidden="true" data-port="${port}">
                            <use xlink:href="#delete"/>
                          </svg>
                        </i>
                      </li>`;
    });
    li.querySelectorAll('li i:nth-of-type(1) svg').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.dataset.status === 'runing') {
          // 停止代理服务器
          vs.postMessage({
            type: 'stop',
            value: {
              port: Number(e.target.dataset.port)
            }
          });
        } else {
          // 启动代理服务器
          vs.postMessage({
            type: 'runing',
            value: {
              port: Number(e.target.dataset.port)
            }
          });
        }
      });
    });
    // 编辑代理服务器
    li.querySelectorAll('li i:nth-of-type(2) svg').forEach(el => {
      el.addEventListener('click', (e) => {
        openModal(Number(e.target.dataset.port));
      });
    });
    // 切换日志
    li.querySelectorAll('li i:nth-of-type(3) svg').forEach(el => {
      el.addEventListener('click', (e) => {
        logPort = Number(e.target.dataset.port);
        updateLog();
      });
    });
    // 删除代理服务器
    li.querySelectorAll('li i:nth-of-type(4) svg').forEach(el => {
      el.addEventListener('click', (e) => {
        vs.postMessage({
          type: 'del',
          value: {
            port: Number(e.target.dataset.port)
          }
        });
      });
    });
  };

  // 清除日志
  document.querySelector('.delete-log').addEventListener('click', () => {
    vs.postMessage({
      type: 'clear',
      value: {}
    });
  });

  // 模态框
  const modal = document.querySelector('.proxy-modal');

  /**
   * @description: 回显代理信息
   * @param {void}
   * @return {void}
   */
  const getProxyInfo = () => {
    // 回显代理信息
    const port = document.querySelector('#proxy-port');
    port.value = proxyInfo.port;
    if (modalType === 'update') {
      port.setAttribute('disabled', true);
    } else {
      port.removeAttribute('disabled');
    }
    proxyInfo.list.forEach(el => {
      addProxyTarget(el);
    });
  };

  /**
     * @description: 加载遮罩层
     * @param {void}
     * @return {void}
     */
  const spin = () => {
    document.querySelector('.spin').classList.add('spin-active');
  };

  /**
   * @description: 清除加载遮罩层
   * @param {void}
   * @return {void}
   */
  const clearSpin = () => {
    document.querySelector('.spin').classList.remove('spin-active');
  };

  /**
   * @description: 打开模态框
   * @param {number} port 编辑端口号
   * @return {void}
   */
  const openModal = (port = null) => {
    const title = document.querySelector('.proxy-modal-title');
    if (port === null) {
      modalType = 'create';
      title.innerText = '创建代理';
      modal.classList.add('proxy-modal-active');
      getProxyInfo();
    } else {
      modalType = 'update';
      title.innerText = '编辑代理';
      modal.classList.add('proxy-modal-active');
      proxyInfo = proxyList.find(el => Number(el.port) === port);
      getProxyInfo();
    }

  };

  // 创建代理打开模态框
  document.querySelector('.create-proxy').addEventListener('click', () => openModal());

  // 代理
  const proxyPort = document.querySelector('#proxy-port');
  proxyPort.addEventListener('input', (e) => {
    proxyInfo.port = e.target.value;
  });

  /**
   * @description: 创建新代理地址
   * @param {string} item 代理地址成员
   * @return {void}
   */
  const addProxyTarget = (item = undefined) => {
    // 表格内容
    const tb = document.querySelector('.proxy-wrapper');
    // 行
    const tr = document.createElement('tr');
    // 设置行id
    if (item === undefined) {
      id = getNonce();
      item = {
        id,
        checked: false,
        target: '',
        name: ''
      };
      tr.setAttribute('data-id', item.id);
      proxyInfo.list.push(item);
    } else {
      tr.setAttribute('data-id', item.id);
    }
    tr.innerHTML = `<td>
                      <input type="radio" name="radio" ${item.checked ? 'checked' : ''} data-id="${item.id}" title="运行这个代理地址"/>
                    </td>
                    <td>
                      <input type="text" placeholder="例:http://xxx.xxx" ${item === undefined ? '' : 'value="' + item.target + '"'} required data-id="${item.id}"/>
                    </td>
                    <td>
                      <input type="text" placeholder="例:开发"  ${item === undefined ? '' : 'value="' + item.name + '"'} data-id="${item.id}"/>
                    </td>
                    <td>
                      <i class="target-delete" title="删除">
                        <svg aria-hidden="true" data-id="${item.id}">
                          <use xlink:href="#delete"/>
                        </svg>
                      </i>
                    </td>`;
    // 运行
    tr.querySelectorAll('td:nth-of-type(1) input').forEach(el => {
      el.addEventListener('input', (e) => {
        proxyInfo.list.forEach(el => {
          if (el.id === e.target.dataset.id) {
            el.checked = e.target.checked;
          } else {
            el.checked = false;
          }
        });
      });
    });
    // 代理地址修改
    tr.querySelectorAll('td:nth-of-type(2) input').forEach(el => {
      el.addEventListener('input', (e) => {
        proxyInfo.list.find(el => el.id === e.target.dataset.id).target = e.target.value.trim();
      });
    });
    // 备注名修改
    tr.querySelectorAll('td:nth-of-type(3) input').forEach(el => {
      el.addEventListener('input', (e) => {
        proxyInfo.list.find(el => el.id === e.target.dataset.id).name = e.target.value.trim();
      });
    });
    tr.querySelectorAll('td:last-of-type svg').forEach(el => {
      // 解决svg样式表不生效，手动添加一次
      el.setAttribute('class', 'svg-delete');
      // 删除行
      el.addEventListener('click', (e) => {
        proxyInfo.list.splice(proxyInfo.list.findIndex(el => el.id === e.target.dataset.id), 1);
        tr.remove();
      });
    });
    tb.appendChild(tr);
  };

  //新增代理地址表成员
  document.querySelector('.add-target').addEventListener('click', () => addProxyTarget());

  /**
   * @description: 清空模态框
   * @param {void}
   * @return {void}
   */
  const clearModal = () => {
    proxyPort.value = '';
    document.querySelector('.proxy-wrapper').innerHTML = '';
    proxyInfo = {
      port: null,
      list: []
    };
  };

  /**
   * @description: 保存代理信息
   * @param {void}
   * @return {void}
   */
  const save = () => {
    spin();
    if (modalType === 'create') {
      // 新增
      vs.postMessage({
        type: 'create',
        value: proxyInfo
      });
    } else {
      // 编辑
      vs.postMessage({
        type: 'update',
        value: proxyInfo
      });
    }
  };

  /**
   * @description: 校验代理信息
   * @param {void}
   * @return {void}
   */
  const verify = () => {
    // 表格内容
    if (modalType === 'create') {
      // 新增校验端口号
      const port = Number(proxyInfo.port);
      if (!isNaN(port) && port > 0 && port <= 65535) {
        verifyList();
      } else {
        vs.postMessage({
          type: 'error',
          value: '请输入正确的端口号'
        });
      }
    } else {
      verifyList();
    }
  };

  /**
   * @description: 校验代理地址列表
   * @param {void}
   * @return {void}
   */
  const verifyList = () => {
    if (proxyInfo.list.length === 0) {
      vs.postMessage({
        type: 'error',
        value: '至少有一个代理地址'
      });
      return;
    }
    // 校验代理地址信息
    const reg = /(http|https):\/\/([\w.]+\/?)\S*/;
    if (proxyInfo.list.every((el, index) => {
      if (reg.test(el.target)) {
        if (el.name) {
          return true;
        } else {
          vs.postMessage({
            type: 'error',
            value: `请在第${index + 1}行处输入备注名`
          });
          return false;
        }
      } else {
        vs.postMessage({
          type: 'error',
          value: `请在第${index + 1}行处输入正确的代理地址`
        });
        return false;
      }
    })) {
      if (proxyInfo.list.some(el => el.checked)) {
        save();
      } else {
        vs.postMessage({
          type: 'error',
          value: '请选择一个运行的代理地址'
        });
      }
    }
  };

  // 保存代理
  document.querySelector('.save-proxy').addEventListener('click', () => verify());
  // 取消
  document.querySelector('.cancel').addEventListener('click', () => {
    clearModal();
    modal.classList.remove('proxy-modal-active');
  });

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

  // 监听消息广播
  window.addEventListener('message', ({ data: { type, value } }) => {
    switch (type) {
      // 日志
      case 'log': {
        const { proxy } = value;
        proxyList = proxy;
        updateLog();
        break;
      }
      // 创建/关闭/读取代理
      case 'load': {
        const { proxy, type, port } = value;
        proxyList = proxy;
        if (type === 'create') {
          clearSpin();
          clearModal();
          modal.classList.remove('proxy-modal-active');
        }
        updateProxyList();
        if (port) {
          logPort = Number(port);
        }
        updateLog();
        break;
      }
    }
  });
}());