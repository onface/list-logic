import spare from "sparejs"
import extend from "extend"
class ListLogic {
    constructor(options) {
        const self = this
        self.options = options
    }
}
const _query = function (data) {
    const self = this
    data = spare(data, {})
    let queryData = self.options.getQuery()
    let fetchQuery = extend(true, {}, queryData, data)
    self.options.willFetch(function next () {
        self.options.fetch(
            fetchQuery,
            self.options.render,
            self.options.didFetch
        )
    })
}
ListLogic.prototype.query = function (data) {
    const self = this
    // 增加延迟是因为 react 框架的 setState 是异步的。
    // 有时会出现 setState 已经调用但是 getQuery 获取的值还是老的
    setTimeout(function () {
        _query.bind(self)(data)
    }, 0)
}
export default ListLogic
module.exports = ListLogic
