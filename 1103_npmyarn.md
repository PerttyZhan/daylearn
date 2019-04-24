# npm and yarn 相关命令

### npm

npm config ls 查看全部配置

npm config get <key> 查看某一个配置
    比如 npm config get registry

npm config set <key> <value> 设置某一个配置
    比如 npm congi set registry https://taobao.com

npm ls 获取当前npm的包
npm ls -g --depth 0 获取全部安装的包
npm ls <key> 获取某一个全部包的版本号 
npm update -g <key> 更新某一个全部包
    比如 npm update -g vue-cli


### yarn

1. Yarn Cache
    ```
    yarn cache ls # 将打印出每个缓存方案。
      yarn cache dir package# 安装在本地的什么位置
      yarn cache clean # 对本地缓存进行强制清除 再执行yarn cache ls将找不到缓存

      # 改变默认的缓存目录
      yarn config set cache-folder <path>
      yarn <command> --cache-folder <path>
    ```

2. Yarn Config
    ```
      yarn config set <key> <value> [-g|--global]  #设置配置项
      yarn config set init-license BSD-2-Clause
      yarn config set registry https://registry.npm.taobao.org
      #修改镜像获取位置'https://registry.yarnpkg.com'  默认的镜像位置
      yarn config get <key> # 获取配置项信息
      yarn config get init-license
      yarn config delete <key>  # 删除某一配置项
      yarn config delete test-key
      yarn config list # 显示当前所有的配置
    ```

3. Yarn info
    ```
        yarn info react
       yarn info react --json # 以json的格式显示
       yarn info react@15.3.0 # 查看详细版本信息
       yarn info react description # 只看描述信息
       yarn info react time
       ## 如果指定的字段是又一个嵌套对象,返回子树
       yarn info react readme 读取readme字段
    ```

4. Yarn Ls
    ```
         yarn ls  ## 给出根目录下面已经安装的依赖
     yarn global ls
     yarn list [--depth]
     yarn list --depth=0 ## 限制输出的深度
    ```

5. Yarn upgrade
    ```
        yarn upgrade webpack
        yarn upgrade [package]@[version]
        yarn upgrade [package]@[tag]
    ```