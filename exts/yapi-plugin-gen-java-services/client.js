import Services from './Services/Services.js';
import CodeGenTemplate from "./Services/codeTemplate";

module.exports = function () {
  this.bindHook('interface_tab', function (tabs) {
    tabs.javaGen = {
      name: '代码生成',
      component: Services
    }
  })


  this.bindHook('add_group_tab', function (panes) {
    panes.push({
      key: 'codeGen',
      title: '代码生成模板配置',
      component: CodeGenTemplate,
      roles: ['admin', 'owner']
    })
  })

  this.bindHook('sub_setting_nav', function (route) {
    route.codeGen = {
      name: '代码生成模板配置',
      component: CodeGenTemplate
    };
  })
}


