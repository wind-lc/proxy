/*
 * @Description: 接口
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-21 19:07:00
 * @LastEditTime: 2022-03-30 16:44:39
 * @FilePath: \proxy\src\interface.ts
 */
import { Server } from 'http';
interface IProxyServer {
  proxy: Server
  info: string
}
interface IProxyLog {
  proxy: any
  log: String
}
export {
  IProxyServer,
  IProxyLog
};

