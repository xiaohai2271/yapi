const exportMarkdownController = require('./controller');
const controller = require("../yapi-plugin-swagger-auto-sync/controller/syncController");

module.exports = function(){
    this.bindHook('add_router', function(addRouter){
        addRouter({
            controller: exportMarkdownController,
            method: 'get',
            path: 'exportMarkdown',
            action: 'exportData'
        })

        // 配置信息
        addRouter({
            controller: exportMarkdownController,
            method: 'get',
            path: 'mdConfig/get',
            action: 'getConfig'
        });
        addRouter({
            controller: exportMarkdownController,
            method: 'post',
            path: 'mdConfig/save',
            action: 'upConfig'
        });
    })
}
