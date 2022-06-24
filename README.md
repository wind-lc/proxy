<!--
 * @Description:
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-17 17:55:27
 * @LastEditTime: 2022-06-24 15:40:55
 * @FilePath: \proxy\README.md
-->

# MIECZ

[![Visual Studio Marketplace](https://img.shields.io/badge/Visual%20Studio%20Marketplace-v0.1.202206242-brightgreen)](https://marketplace.visualstudio.com/items?itemName=wind-lc.miecz)
[![passing](https://img.shields.io/badge/Go-passing-brightgreen?logo=github)](https://github.com/wind-lc/proxy)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](./LICENSE)

## &#x1f4c4;描述(Description)

**这是一个 VSCode 的代理服务器扩展。** 可以同时创建多个代理服务器方便前端项目切换服务器地址(例如：测试、开发等环境)。一般情况下我们使用打包工具如 `webpack` 开发代码，经常会出现切换环境的情况。然而随着代码量的增加打包时间也相应增加，导致我们想切换服务器地址都需要重启&#x1F40C;会浪费大量时间，现在如果使用了 `MIECZ` 可以做到迅速 &#x1F680;切换服务器地址。

> I used translation tools to translate the text, including this sentence &#x1f60f; **This is a proxy server extensions for VSCode.** Multiple proxy servers can be created at the same time for front-end projects to switch server addresses (for example, test, development, etc.). Usually we use packaging tools such as `Webpack` to develop code, and often switch environments. However, as the amount of code increases, the packaging time also increases accordingly. As a result, we need to restart if we want to switch the server address, which will waste a lot of time. Now, if we use `MIECZ`, we can quickly switch the server address.

## &#x1fa9b;安装(Installation)

VSCode 扩展库中搜索安装最新版本

> Install the latest version by searching the VSCode Marketplace library

## &#x2728;使用(Usage)

- 安装完成之后可以再左侧活动栏发现一个新的扩展 `MIECZ` 如下图所示

  > After the installation is complete, you can find a new extension `MIECZ` in the left activity bar as shown below

  ![miecz2](https://fastly.jsdelivr.net/gh/wind-lc/PicGoImage/img/miecz2.jpg)

- 创建代理服务器，点击按钮即可进入创建

  > To create a proxy server, click the button to enter create

  - 在端口号这里输入你想要创建代理服务器的端口号，这样可以让你的项目服务器地址指向这个端口(例如:http://localhost:9000,那么你只需要在这里输入 9000)
    > Enter the port number where you want to create the proxy server, so that your project server address points to this port (for example :http://localhost:9000, then you only need to enter 9000 here).
  - 点击添加地址，可以新增多个地址方便切换(例如:http://localhost:8000/xxx/xxx,http://localhost:7000/xxx/xxx),并且添加备注名方便区别
    > Click on add address, you can add more than one address convenient switch (for example: http://localhost:8000/xxx/xxx, http://localhost:7000/xxx/xxx), convenient and add notes
  - 完成之后需要选择中一个地址进行第一次运行
    > After completion, you need to select one of the addresses for the first run
  - 点击保存并运行即可
    > Click Save and run

<center>
  <img src="https://fastly.jsdelivr.net/gh/wind-lc/PicGoImage/img/miecz3.jpg" width="49%"/>
  <img src="https://fastly.jsdelivr.net/gh/wind-lc/PicGoImage/img/miecz6.jpg" width="49%"/>
  <img src="https://fastly.jsdelivr.net/gh/wind-lc/PicGoImage/img/miecz7.jpg" width="98%"/>
</center>

- 代理服务器运行

  > Proxy server running

  - 运行中代理服务器会自动保存显示前 100 条日志，可以手动清除
    > The running proxy server automatically saves and displays the first 100 logs, which can be manually cleared
  - 在代理服务器列表上有四个按钮分别是：启动/停止、编辑、显示日志、删除
    > There are four buttons on the proxy server list: Start/Stop, Edit, Show log, and Delete
    - 启动/停止: 启动和停止代理服务器
      > Start/Stop:Start and stop the proxy server
    - 编辑：修改代理服务器的信息(代理地址、备注名、切换代理等)暂不支持修改端口号
      > Edit:modify the information about the proxy server (such as the proxy address, remarks, and proxy switchover). The port number cannot be changed
    - 删除：删除当前代理服务器
      > Delete:Deletes the current proxy server

- 清除日志，点击清除日志即可勾选要清除日志的服务器

  > To clear logs, click Clear Logs to select the server to clear logs

  ![miecz9](https://fastly.jsdelivr.net/gh/wind-lc/PicGoImage/img/miecz9.jpg)
