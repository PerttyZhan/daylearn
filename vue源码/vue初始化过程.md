# Vue组件初始化过程概要

``` javascript
  import Vue from 'vue'
  new Vue(options)
```

## 创建Vue类

1. 创建一个构造函数 Vue
2. 在 Vue.prototype 上创建一系列实例属性方法，比如 this.$data 等
3. 在 Vue 上创建一些全局方法，比如 Vue.use 可以注册插件

### platforms/web/runtime/index/js

```javascript
  import Vue from 'core/index'
  import config from 'core/config'
  // 省略

  import platformDirectives from './directives/index'
  import platformComponents from './components/index'

  //这里都是web平台相关的一些配置
  // install platform specific utils
  Vue.config.mustUseProp = mustUseProp
  // 省略

  // 注册指令和组件，这里的 directives 和 components 也是web平台上的，是内置的指令和组件，其实很少
  // install platform runtime directives & components
  extend(Vue.options.directives, platformDirectives) // 内置的directives只有两个，`v-show` 和 `v-model`
  extend(Vue.options.components, platformComponents) // 内置的组件也很少，只有`keepAlive`, `transition`和 `transitionGroup`

  // 如果不是浏览器，就不进行 `patch` 操作了
  // install platform patch function
  Vue.prototype.__patch__ = inBrowser ? patch : noop

  // 如果有 `el` 且在浏览器中，则进行 `mount` 操作
  // public mount method
  Vue.prototype.$mount = function (
    el?: string | Element,
    hydrating?: boolean
  ): Component {
    el = el && inBrowser ? query(el) : undefined
    return mountComponent(this, el, hydrating)
  }

  // 省略devtool相关代码

  export default Vue
```

### core/index.js

```javascript
  import Vue from './instance/index'
  import { initGlobalAPI } from './global-api/index'

  initGlobalAPI(Vue) // 这个函数添加了一些类方法属性

  // 省略一些ssr相关的内容
  // 省略

  Vue.version = '__VERSION__'

  export default Vue
```

### 到 core/instance/index.js 这里才是真正的创建了 Vue 构造函数的地方，虽然代码也很简单，就是创建了一个构造函数，然后通过mixin把一堆实例方法添加上去。
### core/instance/index.js

```javascript
  //  省略import语句
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
      !(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword')
    }
    this._init(options)
  }

  initMixin(Vue)
  stateMixin(Vue)
  eventsMixin(Vue)
  lifecycleMixin(Vue)
  renderMixin(Vue)

  export default Vue
```
1. core/instance/init.js, 主要添加 _init方法
2. core/instance/state.js，主要是添加了 $data,$props,$watch,$set,$delete 几个属性和方法
3. core/instance/events.js，主要是添加了 $on,$off,$once,$emit 三个方法
4. core/instance/lifecycle.js，主要添加了 _update, $forceUpdate, $destroy 三个方法
5. core/instance/renderMixin.js，主要添加了 $nextTick 和 _render 两个方法以及一大堆renderHelpers

### 还记得我们跳过的在core/index.js中 添加 globalAPI的代码吗，前面的代码都是在 Vue.prototype 上添加实例属性，让我们回到 core/index 文件，这一步需要在 Vue 上添加一些全局属性方法。前面讲到过，是通过 initGlobalAPI 来添加的，那么我们直接看看这个函数的样子：

```javascript
  export function initGlobalAPI (Vue: GlobalAPI) {
    // config
    const configDef = {}
    configDef.get = () => config
    // 省略

    // 这里添加了一个`Vue.config` 对象，至于在哪里会用到，后面会讲
    Object.defineProperty(Vue, 'config', configDef)

    // exposed util methods.
    // NOTE: these are not considered part of the public API - avoid relying on
    // them unless you are aware of the risk.
    Vue.util = {
      warn,
      extend,
      mergeOptions,
      defineReactive
    }
    
    //一般我们用实例方法而不是这三个类方法
    Vue.set = set
    Vue.delete = del
    Vue.nextTick = nextTick
    
    // 注意这里，循环出来的结果其实是三个 `components`,`directives`, `filters`，这里先创建了空对象作为容器，后面如果有对应的插件就会放进来。
    Vue.options = Object.create(null)
    ASSET_TYPES.forEach(type => {
      Vue.options[type + 's'] = Object.create(null)
    })

    // this is used to identify the "base" constructor to extend all plain-object
    // components with in Weex's multi-instance scenarios.
    Vue.options._base = Vue

    // 内置组件只有一个，就是 `keepAlive`
    extend(Vue.options.components, builtInComponents)

    initUse(Vue) // 添加了 Vue.use 方法，可以注册插件
    initMixin(Vue) //添加了Vue.mixin 方法
    initExtend(Vue) // 添加了 Vue.extend 方法

    // 这一步是注册了 `Vue.component` ,`Vue.directive` 和 `Vue.filter` 三个方法，上面不是有 `Vue.options.components` 等空对象吗，这三个方法的作用就是把注册的组件放入对应的容器中。
    initAssetRegisters(Vue)
  }
```

### 至此，我们就构建出了一个 Vue 类，这个类上的方法都已经添加完毕。这里再次强调一遍，这个阶段只是添加方法而不是执行他们，具体执行他们是要到第二阶段的。总结一下，我们创建的Vue类都包含了哪些内容：

```javascript
  //构造函数
  function Vue () {
    this._init()
  }

  //全局config对象，我们几乎不会用到
  Vue.config = {
    keyCodes,
    _lifecycleHooks: ['beforeCreate', 'created', ...]
  }

  // 默认的options配置，我们每个组件都会继承这个配置。
  Vue.options = {
    beforeCreate, // 比如 vue-router 就会注册这个回调，因此会每一个组件继承
    components, // 前面提到了，默认组件有三个 `KeepAlive`,`transition`, `transitionGroup`，这里注册的组件就是全局组件，因为任何一个组件中不用声明就能用了。所以全局组件的原理就是这么简单
    directives, // 默认只有 `v-show` 和 `v-model`
    filters // 不推荐使用了
  }

  //一些全局方法
  Vue.use // 注册插件
  Vue.component // 注册组件
  Vue.directive // 注册指令
  Vue.nextTick //下一个tick执行函数
  Vue.set/delete // 数据的修改操作
  Vue.mixin // 混入mixin用的

  //Vue.prototype 上有几种不同作用的方法

  //由initMixin 添加的 `_init` 方法，是Vue实例初始化的入口方法，会调用其他的功能初始话函数
  Vue.prototype._init

  // 由 initState 添加的三个用来进行数据操作的方法
  Vue.prototype.$data
  Vue.prototype.$props
  Vue.prototype.$watch

  // 由initEvents添加的事件方法
  Vue.prototype.$on
  Vue.prototype.$off
  Vue.prototype.$one
  Vue.prototype.$emit

  // 由 lifecycle添加的生命周期相关的方法
  Vue.prototype._update
  Vue.prototype.$forceUpdate
  Vue.prototype.$destroy

  //在 platform 中添加的生命周期方法
  Vue.prototype.$mount

  // 由renderMixin添加的`$nextTick` 和 `_render` 以及一堆renderHelper
  Vue.prototype.$nextTick
  Vue.prototype._render
  Vue.prototype._b
  Vue.prototype._e
  //...
```

## 创建Vue实例