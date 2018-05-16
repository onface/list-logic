var $ = require('jquery')
var Page = require('face-page')
var message = require('face-message')
window.list = null
$(function () {
    var $search = $('#search')
    var $list = $('#list')
    var $page = $('#page')
    var $loading = $('#loading')
    var page = new Page({
        getQuery: function () {
            var serializeArray = $search.serializeArray()
            var data = {}
            serializeArray.forEach(function (item) {
                data[item.name] = item.value
            })
            return data
        },
        willFetch: function (resolve, reject) {
            if ($loading.is(":visible")) {
                message.info('防止重复提交')
                reject()
                return
            }
            $loading.show()
            resolve()
        },
        didFetch: function () {
            $loading.hide()
        },
        fetch: function (queryData, render, didFetch) {
            queryData.page = queryData.page || 1
            $.ajax({
                url: 'http://echo.onface.live/onface/echo/mock/list?$delay=300',
                type: 'get',
                data: queryData,
                dataType: 'json'
            }).done(function (res) {
                render(res, queryData)
            }).fail(function () {
                message.error('网络出错，请刷新重试')
            })
            .always(function () {
                didFetch()
            })
        },
        render: function (res, queryData) {
            // render list
            var html = res.data.map(function (item) {
                return '<a style="display:block;" href="https://github.com/' + item.idol + '" >￥' + item.cash + '-' + item.name + '</a>'
            })
            if (res.data.length === 0) {
                html = '暂无数据 <button id="clearSearch">清除搜索结果</button>'
            }
            $list.html(html)

            // render paging
            var paging = []
            res.page = Number(res.page)
            if (res.pageCount != 1) {
                if (res.page != 1) {
                    paging.push('<button data-page="'+ (res.page - 1) + '" >Prev</button>')
                }
                paging.push(res.page + '/' + res.pageCount)
                if (res.page != res.pageCount) {
                    paging.push('<button data-page="'+ (res.page + 1) + '" >Next</button>')
                }
            }
            $page.html(paging.join(''))

        }
    })
    $('#search').on('submit', function (e) {
        e.preventDefault()
        page.query({}, function (info) {
            console.log('query callback', info)
        })
    })
    $('body').on('click', '#clearSearch', function () {
        $('#search').get(0).reset()
        page.query()
    })
    $('#page').on('click', 'button', function (e) {
        page.query({
            page: $(this).data('page')
        })
    })
    page.query()
})
