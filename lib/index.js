import spare from "sparejs"
import extend from "extend"
class Page {
    constructor(options) {
        const self = this
        self.options = options
    }
}
const _query = function (data, callback) {
    const self = this
    if (typeof callback !== 'function') {
        callback  = () => {}
    }
    data = spare(data, {})
    let queryData = self.options.getQuery()
    let fetchQuery = extend(true, {}, queryData, data)
    let rendered = false
    new Promise(self.options.willFetch).then(function () {
        self.options.fetch(
            fetchQuery,
            function render(...arg) {
                rendered = true
                self.options.render.apply(undefined , arg)
            },
            function didFetch() {
                // 给 rendered 留出时间赋值
                setTimeout(function () {
                    self.options.didFetch()
                    callback({end: 'didFetch', rendered})
                }, 0)
            }
        )
    }).catch(function () {
        callback({
            end: 'willFetch',
            rendered
        })
    })

}

Page.prototype.query = function (data, callback) {
    const self = this
    // 增加延迟是因为 react 框架的 setState 是异步的。
    // 有时会出现 setState 已经调用但是 getQuery 获取的值还是老的
    setTimeout(function () {
        _query.bind(self)(data, callback)
    }, 0)
}
export default Page
module.exports = Page
