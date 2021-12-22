/*
 * @Description: 接口
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-21 19:07:00
 * @LastEditTime: 2021-12-21 19:07:00
 * @FilePath: \proxy\src\interface.ts
 */
import { Server } from 'http';
interface IProxyServer {
  proxy: Server
  info: string
}
export {
  IProxyServer
};

