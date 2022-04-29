/*
 * @Description: 
 * @Author: wind-lc
 * @version: 1.0
 * @Date: 2021-12-09 15:36:06
 * @LastEditTime: 2022-04-19 16:55:32
 * @FilePath: \proxy\src\getNonce.ts
 */
export function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const d = new Date().getTime().toString();
  for (let i = 0; i < 32 - d.length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text + d;
}