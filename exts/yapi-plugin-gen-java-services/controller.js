const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
// const wikiModel = require('../yapi-plugin-wiki/wikiModel.js');
const interfaceCatModel = require('models/interfaceCat.js');
const groupModel = require("models/group.js");
const userModel = require("models/user.js");
const genCodeModel = require("./genCodeModel");
const yapi = require('yapi.js');
const {default: Safeify} = require("safeify");


// const htmlToPdf = require("html-pdf");
class exportController extends baseController {
  constructor(ctx) {
    super(ctx);
    // 分类
    this.catModel = yapi.getInst(interfaceCatModel);
    this.interModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
    this.groupModel = yapi.getInst(groupModel);
    this.userModel = yapi.getInst(userModel);
    this.genCodeModel = yapi.getInst(genCodeModel);

  }


  async genCode(ctx) {
    let interfaceId = ctx.request.query.interfaceId;
    try {
      let interfaceData = await this.interModel.get(interfaceId);
      if (!interfaceData) {
        ctx.body = yapi.commons.resReturn(null, 502, '接口不存在');
        return
      }
      let curProject = await this.projectModel.get(interfaceData.project_id);
      let userData = await this.userModel.findById(this.getUid());
      let errMsg = [];

      let templateList = await this.genCodeModel.listByProjectId(interfaceData.project_id);
      let retData = {};
      if (templateList == null || templateList.length === 0) {
        templateList = await this.genCodeModel.listByGroupId(curProject.group_id);
      }
      console.log(templateList)
      if (templateList == null || templateList.length === 0) {
        ctx.body = yapi.commons.resReturn(errMsg, 502, '请先设置生成模板');
        return;
      }
      for (const template of templateList) {
        const safeVm = new Safeify({
          timeout: 3000,          //超时时间
          asyncTimeout: 10000,    //包含异步操作的超时时间
          unrestricted: true,
          quantity: 4,          //沙箱进程数量，默认同 CPU 核数
          memoryQuota: 500,     //沙箱最大能使用的内存（单位 m），默认 500m
          cpuQuota: 0.5        //沙箱的 cpu 资源配额（百分比），默认 50%
        });
        // console.log("curProject", curProject)
        const vmContext = {
          projectTmp: JSON.stringify(curProject),
          interfaceTmp: JSON.stringify(interfaceData),
          userTemp: JSON.stringify(userData)
        };

        try {
          safeVm.preset("const project = JSON.parse(projectTmp);const interface = JSON.parse(interfaceTmp);const user=JSON.parse(userTemp)")
          let model = await safeVm.run(template.template_data, vmContext);
          safeVm.destroy();
          retData[template.tag] = model
        } catch (e) {
          errMsg.push({
            error: e.toString(),
            context: vmContext
          });
        }
      }
      ctx.body = retData;
      if (errMsg.length) {
        ctx.body = yapi.commons.resReturn(errMsg, 502, '渲染出错');
      }
    } catch (error) {
      yapi.commons.log(error, 'error');
      ctx.body = yapi.commons.resReturn(null, 502, '渲染出错');
    }
  }


  async saveTemplate(ctx) {
    let requestBody = ctx.request.body;
    let projectId = requestBody.project_id || requestBody.projectId
    let groupId = requestBody.group_id || requestBody.groupId
    if (!projectId && !groupId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少项目Id/组id'));
    }

    if ((await this.checkAuth(projectId, 'project', 'edit')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限'));
    }
    let result;
    if (requestBody.id) {
      result = await this.genCodeModel.up(requestBody);
    } else {
      let existData = await this.genCodeModel.listByProjectId(projectId);

      if (existData.find(templ => templ.tag === requestBody.tag)) {
        return (ctx.body = yapi.commons.resReturn(null, 502, 'tag已存在'));
      }
      result = await this.genCodeModel.save(requestBody);
    }

    return (ctx.body = yapi.commons.resReturn(result));
  }

  /**
   * 查询配置信息
   * @param {*} ctx
   */
  async getTemplate(ctx) {
    let projectId = ctx.params.projectId || ctx.params.project_id;
    let groupId = ctx.params.groupId || ctx.params.group_id;
    if (!projectId && !groupId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少项目Id/组id'));
    }
    console.log(this.genCodeModel)
    let result = null;
    if (projectId) {
      result = await this.genCodeModel.listByProjectId(projectId);
    } else {
      result = await this.genCodeModel.listByGroupId(groupId);
    }
    return (ctx.body = yapi.commons.resReturn(result));
  }


  /**
   * 删除模板
   * @param {*} ctx
   */
  async deleteTemplate(ctx) {
    let templateId = ctx.params.templateId;
    if (!templateId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少模板Id'));
    }
    let result = await this.genCodeModel.del(templateId);
    return (ctx.body = yapi.commons.resReturn(result));
  }


}

module.exports = exportController;
