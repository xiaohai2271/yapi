import mdTemplate from './mdTemplate/mdTemplate.js'
import Services from "./mdTemplate/Services";

function exportData(exportDataModule, pid) {
    exportDataModule.markdown = {
      name: 'markdown',
      route: `/api/plugin/exportMarkdown?pid=${pid}`,
      desc: '根据模板导出项目接口文档'
    };
}



function hander(routers) {
  routers.mdExport = {
    name: 'Markdown导出',
    component: mdTemplate
  };
}




module.exports = function() {
    this.bindHook('export_data', exportData);
    this.bindHook('sub_setting_nav', hander);


    this.bindHook('interface_tab', function (tabs) {
      tabs.mdGen = {
        name: 'Markdown',
        component: Services
      }
    })

    this.bindHook('add_group_tab', function (panes) {
      panes.push({
        key: 'Markdown',
        title: 'Markdown设置',
        component: mdTemplate,
        roles: ['admin', 'owner']
      })
    })
};
