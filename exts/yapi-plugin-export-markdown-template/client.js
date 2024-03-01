import mdTemplate from './mdTemplate/mdTemplate.js'

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
};
