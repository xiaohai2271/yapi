import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {Form, Switch, Button, message} from 'antd';
import {handleSwaggerUrlData} from 'client/reducer/modules/project';
const FormItem = Form.Item;
import axios from 'axios';
import AceEditor from "../../../client/components/AceEditor/AceEditor";
// layout
const formItemLayout = {
  labelCol: {
    lg: { span: 5 },
    xs: { span: 24 },
    sm: { span: 10 }
  },
  wrapperCol: {
    lg: { span: 16 },
    xs: { span: 24 },
    sm: { span: 12 }
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
export default class ProjectInterfaceSync extends Component {
  static propTypes = {
    form: PropTypes.object,
    match: PropTypes.object,
    groupId: PropTypes.number,
    projectId: PropTypes.number,
    projectMsg: PropTypes.object,
    handleSwaggerUrlData: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      config_data: { is_export_by_interface: false, template_data:"",_id:null }
    };
  }
  componentDidMount() {
    this.getSyncData();
  }
  handleSubmit = async () => {
    const { form, projectId, groupId } = this.props;
    let params = {
      project_id: projectId,
      group_id: groupId,
      is_export_by_interface: this.state.config_data.is_export_by_interface,
      template_data: this.state.config_data.template_data,
      uid: this.props.projectMsg.uid
    };
    if (this.state.config_data._id) {
      params.id = this.state.config_data._id;
    }
    if (!this.state.config_data.is_export_by_interface){
      params.template_data = null;
      this.setState({
        config_data: {
          template_data: null,
          is_export_by_interface: this.state.config_data.is_export_by_interface
        }
      });
    }
    form.validateFields(async (err, values) => {
      if (!err) {
        let assignValue = Object.assign(params, values);
        await axios.post('/api/plugin/mdConfig/save', assignValue).then(res => {
          if (res.data.errcode === 0) {
            message.success('保存成功');
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
      config_data: {}
    });
  }

  async getSyncData() {
    let result = await axios.get('/api/plugin/mdConfig/get' + (this.props.projectId ? `?project_id=${this.props.projectId}` : `?groupId=${this.props.groupId}`));
    if (result.data.errcode === 0) {
      if (result.data.data) {
        this.setState({
          config_data: result.data.data
        });
      }
    }
  }

  // 是否开启
  onChange = v => {
    let config_data = this.state.config_data;
    config_data.is_export_by_interface = v;
    this.setState({
      config_data: config_data
    });
  };


  handleTemplateInput = e => {
    let config_data = this.state.config_data;
    config_data.template_data = e.text;
    this.setState({
      config_data: config_data
    });
  };


  render() {
    const templateEditor = (
      <FormItem {...formItemLayout} label="Markdown模板">
        <AceEditor
          data={this.state.config_data.template_data}
          onChange={this.handleTemplateInput}
          style={{ minHeight: '500px' }}
        />

      </FormItem>
    )
    return (
      <div className="m-panel">
        <Form>
          <FormItem
            label="是否按接口导出"
            {...formItemLayout}
          >
            <Switch
              checked={this.state.config_data.is_export_by_interface}
              onChange={this.onChange}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </FormItem>

          <div>
            {this.state.config_data.is_export_by_interface ? templateEditor : null}
          </div>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit" icon="save" size="large" onClick={this.handleSubmit}>
              保存
            </Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}
