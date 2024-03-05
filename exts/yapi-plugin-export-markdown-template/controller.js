const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
const interfaceCatModel = require('models/interfaceCat.js');
const yapi = require('yapi.js');
const uuid = require('uuid');
const configModel = require("./configModel");
const Safeify = require('safeify').default;
const JSZip = require("jszip");

class exportMarkdownController extends baseController {
    constructor(ctx) {
        super(ctx);
        this.catModel = yapi.getInst(interfaceCatModel);
        this.interModel = yapi.getInst(interfaceModel);
        this.projectModel = yapi.getInst(projectModel);
        this.configModel = yapi.getInst(configModel);
    }

    /*
       handleListClass,handleExistId is same as the exportController(yapi-plugin-export-data).
       No DRY,but i have no idea to optimize it.
    */

    async handleListClass(pid, status) {
        let result = await this.catModel.list(pid),
            newResult = [];
        for (let i = 0, item, list; i < result.length; i++) {
            item = result[i].toObject();
            list = await this.interModel.listByInterStatus(item._id, status);
            list = list.sort((a, b) => {
                return a.index - b.index;
            });
            if (list.length > 0) {
                item.list = list;
                newResult.push(item);
            }
        }

        return newResult;
    }

    handleExistId(data) {
        function delArrId(arr, fn) {
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                delete item._id;
                delete item.__v;
                delete item.uid;
                delete item.edit_uid;
                delete item.catid;
                delete item.project_id;

                if (typeof fn === 'function') fn(item);
            });
        }

        delArrId(data, function (item) {
            delArrId(item.list, function (api) {
                delArrId(api.req_body_form);
                delArrId(api.req_params);
                delArrId(api.req_query);
                delArrId(api.req_headers);
                if (api.query_path && typeof api.query_path === 'object') {
                    delArrId(api.query_path.params);
                }
            });
        });

        return data;
    }



    async exportData(ctx) {
        let pid = ctx.request.query.pid;
        let status = ctx.request.query.status;

        if (!pid) {
            ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
        }

        let result = await this.configModel.getByProjectId(pid);
        // console.log(result);
        if (!result.is_export_by_interface){
            console.log("重定向")
            ctx.status = 302;
            ctx.redirect(`/api/plugin/export?type=markdown&pid=${pid}`);
            return ;
        }
        let curProject;
        try {
            curProject = await this.projectModel.get(pid);
            // ctx.set('Content-Type', 'application/json');
            // ctx.set('Content-Type', 'application/octet-stream');
            const list = await this.handleListClass(pid, status);

            let data = this.handleExistId(list);

            // console.log("curProject", curProject)
            // console.log("list", list)


            let model;

            // const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(),uuid.v4()));
            // console.log("tmpPath=", tmpPath)
            const zip = JSZip();
            let errMsg = [];
            for (let item of data) {
                for(let interfaceItem of item.list){
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
                        interfaceTmp: JSON.stringify(interfaceItem),
                        categoryTmp: JSON.stringify(item)
                    };
                    try {
                        safeVm.preset("const project = JSON.parse(projectTmp);const interface = JSON.parse(interfaceTmp);const category=JSON.parse(categoryTmp)")
                        model = await safeVm.run(result.template_data, vmContext);
                        // fs.writeFileSync(`${tmpPath}/${interfaceItem.title}.md`, model.toString())
                        zip.file(`${item.name}/${interfaceItem.title}.md`, model.toString())
                        safeVm.destroy();
                    } catch (e) {

                        errMsg.push({
                            error: e.toString(),
                            context: vmContext
                        });
                    }
                }
            }
            if (errMsg.length){
                ctx.body = yapi.commons.resReturn(errMsg, 502, '下载出错');
                return ;
            }

            ctx.set('Content-Disposition', `attachment; filename=${encodeURIComponent(curProject.name)}.zip`);
            let dataaa = await zip.generateAsync({
                type: "nodebuffer",
                // 压缩算法
                compression: "DEFLATE",
                streamFiles: true,
                compressionOptions: {
                    level: 9
                }
            });
            ctx.body = dataaa
            // ctx.set('Content-Length', dataaa.length);

            // dataaa.copy(ctx.body)

            // fs.unlinkSync(tmpPath)
        } catch (error) {
            yapi.commons.log(error, 'error');
            ctx.body = yapi.commons.resReturn(null, 502, '下载出错');
        }
    }

    /**
     * 保存配置信息
     * @param {*} ctx
     */
    async upConfig(ctx) {
        let requestBody = ctx.request.body;
        let projectId = requestBody.project_id;
        if (!projectId) {
            return (ctx.body = yapi.commons.resReturn(null, 408, '缺少项目Id'));
        }

        if ((await this.checkAuth(projectId, 'project', 'edit')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限'));
        }

        let result;
        if (requestBody.id) {
            result = await this.configModel.up(requestBody);
        } else {
            result = await this.configModel.save(requestBody);
        }

        return (ctx.body = yapi.commons.resReturn(result));
    }

    /**
     * 查询配置信息
     * @param {*} ctx
     */
    async getConfig(ctx) {
        let projectId = ctx.query.project_id;
        if (!projectId) {
            return (ctx.body = yapi.commons.resReturn(null, 408, '缺少项目Id'));
        }
        let result = await this.configModel.getByProjectId(projectId);
        return (ctx.body = yapi.commons.resReturn(result));
    }
}

module.exports = exportMarkdownController;
