const yapi = require('yapi.js');
const baseModel = require('models/base.js');

class genCodeModel extends baseModel {
  getName() {
    return 'gencode_template_config';
  }

  getSchema() {
    return {
      uid: { type: Number},
      project_id: { type: Number, required: true },
      //是否开启自动同步
      tag: { type: String, default: "default" },
      tag_desc: { type: String, default: "默认" },
      // 模板
      template_data: String,
      add_time: Number,
      up_time: Number
    };
  }

  getByProjectId(id) {
    return this.model.findOne({
      project_id: id,
      tag: 'default'
    })
  }

  listByProjectId(id) {
    return this.model.find({
      project_id: id
    })
  }

  delByProjectId(project_id){
    return this.model.remove({
      project_id: project_id
    })
  }

  save(data) {
    data.up_time = yapi.commons.time();
    let m = new this.model(data);
    return m.save();
  }

  listAll() {
    return this.model
      .find({})
      .select(
        '_id uid project_id add_time up_time is_sync_open sync_cron sync_json_url sync_mode old_swagger_content last_sync_time'
      )
      .sort({ _id: -1 })
      .exec();
  }

  up(data) {
    console.log(data)
    let id = data.id;
    delete data.id;
    data.up_time = yapi.commons.time();
    return this.model.update({
      _id: id
    }, data)
  }

  upById(id, data) {
    delete data.id;
    data.up_time = yapi.commons.time();
    return this.model.update({
      _id: id
    }, data)
  }

  del(id){
    return this.model.remove({
      _id: id
    })
  }
}

module.exports = genCodeModel;
