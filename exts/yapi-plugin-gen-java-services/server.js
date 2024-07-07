const controller = require('./controller');


module.exports = function(){
  this.bindHook('add_router', function(addRouter){
    addRouter({
      controller: controller,
      method: 'get',
      path: 'codeGen',
      action: "genCode"
    });
    addRouter({
      controller: controller,
      method: 'get',
      path: 'template/get',
      action: "getTemplate"
    });
    addRouter({
      controller: controller,
      method: 'post',
      path: 'template/save',
      action: "saveTemplate"
    });
    addRouter({
      controller: controller,
      method: 'delete',
      path: 'template/:templateId',
      action: "deleteTemplate"
    });
  })

}
