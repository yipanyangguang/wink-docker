/**
 * 运行时路径别名注册。
 *
 * 必须作为入口的第一个 import：ES 模块的所有静态 import 会先于模块体求值，
 * 所以别名注册只能放在独立模块里被最先加载。
 *
 * 本文件位于源码/产物根目录（src/bootstrap.ts → dist/bootstrap.js），
 * 因此 __dirname 本身就是别名根：
 *   dev  : <app>/src   -> @/config/env = src/config/env.ts
 *   prod : <app>/dist  -> @/config/env = dist/config/env.js
 * ts-node-dev 跑源码与 node dist/index.js 跑产物都指向正确位置。
 */
// module-alias 没有随包提供类型声明，这里用 require 避免引入额外 @types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const moduleAlias = require("module-alias") as {
  addAlias: (alias: string, target: string) => void;
};

moduleAlias.addAlias("@", __dirname);

export {};
