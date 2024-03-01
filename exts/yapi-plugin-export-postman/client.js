function exportData(exportDataModule, pid) {
  console.log("inject ")
    exportDataModule.postman = {
      name: 'postman collection',
      route: `/api/plugin/exportPostman?pid=${pid}`,
      desc: '导出项目接口文档为Postman Json文件'
    };
}

module.exports = function() {
    this.bindHook('export_data', exportData);
};
