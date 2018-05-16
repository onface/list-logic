# API

## new Page()

```js
var Page = require('face-page').default
// import Page from "lsit-logic"
var list = new Page(options)
```

## 生命周期

> options 主要配置用于列表的生命周期触发时所需要获取的一些数据，因为不同列表获取数据的方式是不同的。

```
list.query()
1. getQuery
3. willFetch
4. fetch
5. render & didFetch
```

### getQuery

```js
new Page({
    // 获取查询条件
    getQuery: function () {
        return {
            search_keyword: $('#search_keyword').val()
        }
    }
})
```

### willFetch

即将获取数据时触发执行，可通过 `next()` 终止后续操作。

建议用来防止重复搜索和控制 loading 状态。

> list.query() 调用后会执行 willFetch 若调用 next 则执行 fetch。
> 若要防止重复搜索，不调用 next 则不会执行 fetch

```js
new Page({    
    willFetch: function (next) {
        if ($('#tip').hasClass('loading')) {
            return
        }
        $('#tip').addClass('loading')
        next()
    }
})
```

### fetch

获取数据时触发执行，将 `query` 作为参数查询数据。获取到数据后调用 `didFetch` 进入 `didFetch` 阶段。数据获取成功调用 `render` 调用 `options.render`。（有时服务器会拒绝用户访问数据，比如登录过期了。）

> options.willFetch 中调用 `next()` 后执行

```js
new Page({
    fetch: function (queryData, render, didFetch) {
        $.ajax({
            url: '/some',
            data: queryData,
            dataType: 'json'
        }).done(function (res) {
            if (res.error) {
                aler(res.error)
            }
            else {
                render(res, queryData)
            }
        }).always(function () {
            didFetch()
        })
    }
})
```

### didFetch

获取数据完成后触发执行。

建议用来控制 loading 状态。

> 在 `options.fetch` 中调用 didFetch() 会执行


```js
new Page({    
    didFetch: function (next) {
        $('#tip').removeClass('loading')
    }
})
```

### render

成功获取数据后触发执行，用于渲染页面数据。

> 在 `options.fetch` 中调用 `render(res, query)` 会执行

```js
new Page({
    render: function (res, query) {        
        var html = '<ul><li>' + res.data.join('</li></li>') + '</li></ul>'
        // 渲染列表
        $('#list').html(html)
        // 设置页码 （因为用户可能点击第10页，但是第10页的内容已经被服务器删除了，服务器只会返回第9页）
        $('#page').val(query.page)
        // 同样设置搜索关键字是因为用户可能在加载过程中修改了搜索关键字，设置后搜索条件和结果能保持一致。
        // 或用户调用了 clearQuery
        $('#search_keyword').val(query.search_keyword)
    }
})
```

## query()

搜索或翻页时调用

```js
$('#search').on('submit', function () {
    // 根据 options.getQuery() 返回值进行查询
    list.query()
})

$('#chanegPage').on('submit', function () {
    // 获取 options.getQuery() 返回值，与 {page: 2} 合并后进行查询
    list.query({page: 2})
})
```


### 数据片段条件

> 不求完全理解，知道大概概念即可

注意，修改页码时需要传入 `{page: 2}` 而搜索时不需要传任何值。因为搜索条件分为两种：

1. 查询条件
2. 数据片段条件


区分查询条件和数据片段条件是用于解决类似 [github commits](https://github.com/onface/react/commits/master?after=e7be4bc86ef218f9654ad43398e363962f3127e3+34) 分页的复杂问题。这种列表没有页码，只有 `after` `before` 参数。（打开页面拉到下方点击 [Newer](https://github.com/onface/react/commits/master?before=e7be4bc86ef218f9654ad43398e363962f3127e3+35) 和 [Older](https://github.com/onface/react/commits/master?after=e7be4bc86ef218f9654ad43398e363962f3127e3+69)）

查询条件一般有 `用户名` `手机号` `开始日期` `按金额正序排列` `按金额倒序排列` `每页显示多少条件数据`

数据片段条件一般有 `页码`

**他们的区别是：在多次查询中。`数据片段条件变化`时查询条件不变，`查询条件变化`时数据片段条件被设为为默认值。**（一般情况默认值是 `""` 或 `1`）

从用户的角度来看就是：

```shell
1次搜索： user=nimo&page=1  // 输入 nimo 点击搜索按钮
2次搜索： user=nimo&page=2  // 点击下一页 => page 改变，但 user 不变
3次搜索： user=code&page=1  // 输入 code 点击搜索按钮 => user 改变 page 改为默认值 1
```

这里查询条件是 `user`，数据片段条件是 `page`。

---

有时也会定义成

`https://github.com/onface/react/commits/master?after=e7be4bc86ef218f9654ad43398e363962f3127e3+34`

中的 `after`

什么条件是数据片段条件是由开发者根据项目实际情况去定义的。

### 复杂的情况

> 不求完全理解，知道大概概念即可

用户多次查询时，如果用户搜索了 `user=nimo&age=13&page=2`，接着修改了 `<input name="user" />` 的值为 `abc` 但没有点击搜索按钮，直接点击了下一页 。 请求参数会变成 `user=abc&age=13&page=2`。

有时根据产品需求请求参数需要是 `user=nimo&age=13&page=3` (用户没有点击搜索按钮，查询条件不变化，即使页面中的 input 变化了。)

这时就需要点击搜索按钮时将当前值保存起来，然后通过 `options.getQuery()` 获取的值是刚才保存的值。

比如用 jQuery 可以这样做

```js
var list = new Page({
    getQuery: function () {
        return $('#search').data('query')
    }
})
function setQuery (this) {
    var query = {}
    var $this = $(this)
    $this.serializeArray().forEach(function (item) {
        query[item.name] = item.value
    })
    $this.data('query', query)
}
$('#search').on('submit', function () {
    setQuery(this)
    list.query()
})
setQuery(
    $('#search')
)

```

React Vue Angular 等声明式框架 则将 `setQuery` 改为将搜索条件命名为 `lastTimeQuery` 保存到 `state` 中
