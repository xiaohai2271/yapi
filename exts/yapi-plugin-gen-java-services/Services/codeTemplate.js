import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Form, Button, message} from 'antd';
import {handleSwaggerUrlData} from 'client/reducer/modules/project';

const FormItem = Form.Item;
import axios from 'axios';
import AceEditor from "../../../client/components/AceEditor/AceEditor";
// layout
const formItemLayout = {
  labelCol: {
    lg: {span: 5},
    xs: {span: 24},
    sm: {span: 10}
  },
  wrapperCol: {
    lg: {span: 16},
    xs: {span: 24},
    sm: {span: 12}
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

  constructor(props) {
    super(props);
    this.state = {
      config_data: {template_data: "", _id: null}
    };
  }

  handleSubmit = async () => {
    const {form, projectId} = this.props;
    let params = {
      project_id: projectId,
      template_data: this.state.config_data.template_data,
      uid: this.props.projectMsg.uid
    };
    if (this.state.config_data._id) {
      params.id = this.state.config_data._id;
    }
    form.validateFields(async (err, values) => {
      if (!err) {
        let assignValue = Object.assign(params, values);
        await axios.post('/api/plugin/template/save', assignValue).then(res => {
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
    this.getSyncData();
  }

  async getSyncData() {
    let projectId = this.props.projectMsg._id;
    let result = await axios.get('/api/plugin/template/get?projectId=' + projectId);
    if (result.data.errcode === 0) {
      if (result.data.data) {
        let templateData = result.data.data.find(it => it.tag === "default")
        if (templateData == null) {
          templateData = result.data.data[0]
        }
        this.setState({
          config_data: templateData
        });
      }
    }
  }

  handleTemplateInput = e => {
    let config_data = this.state.config_data;
    config_data.template_data = e.text;
    this.setState({
      config_data: config_data
    });
  };


  render() {
    const templateEditor = (
      <FormItem {...formItemLayout} label="默认模板">
        <AceEditor
          data={this.state.config_data.template_data}
          onChange={this.handleTemplateInput}
          style={{minHeight: '300px'}}
        />

      </FormItem>
    )
    return (
      <div className="m-panel">
        <Form>
          <div>
            {templateEditor}
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
