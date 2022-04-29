/*
 * @Description: 接口
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-21 19:07:00
 * @LastEditTime: 2022-04-27 17:41:53
 * @FilePath: \proxy\src\interface.ts
 */
import { Server } from 'http';

interface IProxyServer {
  proxy: Server
  info: string
}
interface IProxyList {
  proxy: any
  log: string[]
  name: string
  status: string
  port: number
  list: IProxyItem[]
}
interface IProxyItem {
  id: string
  checked: boolean
  target: string
  name: string
}
interface IProxyInfo {
  port: number
  list: IProxyItem[]
}
interface IMessage {
  type: string
  value: IProxyInfo
}
export {
  IProxyServer,
  IProxyList,
  IProxyInfo,
  IMessage
};

