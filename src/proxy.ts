/*
 * @Description: 代理服务器
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-21 17:33:38
 * @LastEditTime: 2021-12-21 19:12:24
 * @FilePath: \proxy\src\proxy.ts
 */
import * as Koa from 'koa';
import * as koaBodyparser from 'koa-bodyparser';
import { createProxyMiddleware } from 'http-proxy-middleware';
const k2c = require('koa2-connect');
import * as path from 'path';
import * as koaStatic from 'koa-static';
import { IProxyServer } from './interface';
const app = new Koa();

export default function (port: number, target: string, exportLog: Function): Promise<IProxyServer> {
  return new Promise((resolve, reject) => {
    app
      .use(async (ctx: any, next: () => any) => {
        await k2c(
          createProxyMiddleware({
            target: target,
            changeOrigin: true
          })
        )(ctx, next);
        const log = JSON.parse(JSON.stringify(ctx));
        log.target = target;
        // getCtx({ type: 'log', info: c });
        exportLog(log);
        await next();
      })
      .use(
        koaBodyparser({
          enableTypes: ['json', 'form', 'text']
        })
      )
      .use(koaStatic(path.join(__dirname, 'html')));
    const proxy = app.listen(port, () => {
      console.log(`端口${port}代理服务器已启动`);
      resolve({ proxy, info: `端口${port}代理服务器已启动` });
    }).on('error', (error: Error) => {
      if (error.message.indexOf('address already in use')) {
        console.log(`错误信息：创建失败端口${port}已被占用`);
        reject(`端口${port}已被占用`);
      } else {
        console.log(`错误信息：创建失败${error.message}`);
        reject(`创建失败${error.message}`);
      }

    });
  });
}