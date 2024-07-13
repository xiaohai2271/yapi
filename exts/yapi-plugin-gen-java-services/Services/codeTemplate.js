import React, {Component, Fragment} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Form, Button, message, Tabs, Modal, Input} from 'antd';
import {handleSwaggerUrlData} from 'client/reducer/modules/project';


const {TabPane} = Tabs;
const FormItem = Form.Item;
const {confirm} = Modal;

import axios from 'axios';
import AceEditor from "../../../client/components/AceEditor/AceEditor";

const formItemLayout = {
  labelCol: {
    lg: {span: 1},
    xs: {span: 3},
    sm: {span: 2}
  },
  wrapperCol: {
    lg: {span: 22},
    xs: {span: 18},
    sm: {span: 20}
  },
  className: 'form-item'
};
const tailFormItemLayout = {
  wrapperCol: {
    sm: {
      span: 16,
      offset: 11
    }
  }
};

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  },
  {
    handleSwaggerUrlData
  }
)
@Form.create()
export default class CodeGenTemplate extends Component {
  static propTypes = {
    form: PropTypes.object,
    match: PropTypes.object,
    projectId: PropTypes.number,
    projectMsg: PropTypes.object,
    handleSwaggerUrlData: PropTypes.func
  };

  getAddTemplate(isDefault = false) {
    let data = {tag_desc: "新增模板", tag: 'add'}
    if (isDefault) {
      data['tag_desc_t'] = '默认'
      data['tag_t'] = 'default'
    }
    return data;
  }

  constructor(props) {
    super(props);
    this.state = {
      config_data: {template_data: "", _id: null},
      templateList: [],
      activeKey: "default"
    };
  }

  handleSubmit = async (data) => {
    const {form, projectId} = this.props;
    let params = {
      project_id: projectId,
      tag: data.tag_t || data.tag,
      tag_desc: data.tag_desc_t || data.tag_desc,
      template_data: data.template_data,
      uid: this.props.projectMsg.uid
    };
    if (data._id) {
      params.id = data._id;
    }
    form.validateFields(async (err, values) => {
      if (!err) {
        let assignValue = Object.assign(params, values);
        await axios.post('/api/plugin/template/save', assignValue).then(res => {
          if (res.data.errcode === 0) {
            message.success('保存成功');
            this.getSyncData();
          } else {
            message.error(res.data.errmsg);
          }
        });
      }
    });

  };


  UNSAFE_componentWillMount() {
    //查询同步任务
    this.setState({
      config_data: {template_data: "", _id: null},
      templateList: []
    });
    this.getSyncData();
  }

  async getSyncData() {
    let projectId = this.props.projectMsg._id;
    let result = await axios.get('/api/plugin/template/get?projectId=' + projectId);
    if (result.data.errcode === 0) {
      if (result.data.data && result.data.data.length) {
        let defaultTemplate = result.data.data.find(it => it.tag === "default")
        if (defaultTemplate == null) {
          defaultTemplate = result.data.data[0] || {}
        }
        this.setState({
          defaultTemplate,
          activeKey: defaultTemplate.tag,
          templateList: result.data.data
        });
      } else {
        this.setState({
          activeKey: "add",
          templateList: [this.getAddTemplate(true)]
        });
      }
    }
  }

  handleTemplateInput = (e, data) => {
    data.template_data = e.text;
    this.setState()
  };

  onTabChange(key) {
    this.setState({
      activeKey: key
    })
  }

  async onTabEdit(targetKey, action) {
    // this[action](targetKey);
    let templateData = this.state.templateList.find(it => it.tag === targetKey)
    console.log(targetKey, action, templateData)
    confirm({
      title: '是否要删除此模板？',
      content: '删除后将无法找回，是否继续',
      onOk: async () => {
        await axios.delete('/api/plugin/template/' + templateData._id);
        message.success("删除成功")
        this.getSyncData();
      },
      onCancel() {
      }
    });
  }

  addNewTemplate() {
    if (this.state.templateList.find(it => it.tag === 'add')) {
      message.info("请先保存新增的模板")
      this.setState({
        activeKey: 'add'
      })
      return;
    }
    let data = [...this.state.templateList, this.getAddTemplate()];
    console.log(data)
    this.setState({
      templateList: data,
      activeKey: 'add'
    })
  }


  render() {
    const {getFieldDecorator} = this.props.form;

    let panes = [];
    console.log("this.state.templateList", this.state.templateList)

    if (this.state.templateList) {
      panes = this.state.templateList.map(it => {
        return {
          title: it.tag_desc,
          key: it.tag,
          content: it.tag,
          data: it
        }
      })
    }

    let newTemplateData = this.state.templateList.find(it => it.tag === 'add');
    let onFieldChange = (e, field) => {
      newTemplateData[field] = e.text
    }

    const addContent = this.state.activeKey === 'add' && newTemplateData.tag_t !== 'default' && (
      <Fragment key="add">
        <FormItem label="文件名" {...formItemLayout}>
          {getFieldDecorator('tag', {
            rules: [
              {
                required: true,
                message: '文件名必填哦，用来标识你的每个不同的模板'
              }
            ],
            initialValue: newTemplateData.tag_t
          })(<Input onChange={(e) => onFieldChange(e, "tag_t")}/>)}
        </FormItem>
        <FormItem label="文件描述" {...formItemLayout}>
          {getFieldDecorator('tag_desc', {
            rules: [
              {
                required: true,
                message: '文件描述必填哦'
              }
            ],
            initialValue: newTemplateData.tag_desc_t
          })(<Input onChange={(e) => onFieldChange(e, "tag_desc_t")}/>)}
        </FormItem>
      </Fragment>
    )


    return (
      <div className="m-panel">
        <Tabs
          hideAdd
          onChange={key => this.onTabChange(key)}
          activeKey={this.state.activeKey}
          type="card"
          tabBarExtraContent={<Button type="primary" onClick={() => this.addNewTemplate()}>新增模板</Button>}
          onEdit={(t, e) => this.onTabEdit(t, e)}
        >
          {panes.map(pane => (
            <TabPane tab={pane.title}
                     key={pane.key}
                     closable={pane.key !== 'default'}
            >
              <Form>
                <div style={{padding: "10px 0"}}>
                  {addContent}
                  <FormItem {...formItemLayout} label={"模板"}>
                    <AceEditor
                      data={pane.data.template_data}
                      onChange={e => this.handleTemplateInput(e, pane.data)}
                      style={{minHeight: '500px'}}
                    />
                  </FormItem>
                </div>
                <FormItem {...tailFormItemLayout}>
                  <Button type="primary" htmlType="submit" icon="save" size="large"
                          onClick={() => this.handleSubmit(pane.data)}>
                    保存
                  </Button>
                </FormItem>
              </Form>
            </TabPane>
          ))}
        </Tabs>


      </div>
    );
  }
}
