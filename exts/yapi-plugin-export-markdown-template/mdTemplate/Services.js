import React, {Fragment, PureComponent as Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import {getToken} from '../../../client/reducer/modules/project.js'
import './Services.scss';
import {withRouter} from "react-router-dom";
import axios from "axios";
import {message, Card, Button} from "antd";
import copy from "copy-to-clipboard";
import MarkdownIt from "markdown-it";
import "github-markdown-css/github-markdown-light.css"

@connect(
  state => {
    return {
      token: state.project.token
    }
  },
  {
    getToken
  }
)
class MDTemplateServices extends Component {
  static propTypes = {
    projectId: PropTypes.number,
    token: PropTypes.string,
    getToken: PropTypes.func,
    match: PropTypes.object
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      render_data: {},
      isHtml: true
    }
  }

  componentDidMount() {
    this.getSyncData();
  }

  async getSyncData() {
    let interfaceId = this.props.match.params.actionId;
    let result = await axios.get(`/api/plugin/mdConfig/gen?interfaceId=${interfaceId}`);
    if (result.data) {
      this.setState({
        render_data: result.data
      });
    }
  }

  async preCopy(code) {
    copy(code)
    message.success("复制成功")
  }

  render() {
    let mdContent = [];
    let htmlContent = [];
    if (this.state.render_data && this.state.render_data.data) {
      mdContent = (<pre key="md"><span className='btn-pre-copy'
                                       onClick={() => this.preCopy(this.state.render_data.data)}>复制Markdown</span>{this.state.render_data.data + "\n"}</pre>)
      htmlContent = (
        <div className={"markdown-body"}
             dangerouslySetInnerHTML={{__html: MarkdownIt().render(this.state.render_data.data || "")}}></div>
      )
    }
    const extraContent = (
      <Fragment>
        <Button size={"small"} type={"link"} icon="copy"
                onClick={() => this.preCopy(this.state.render_data.data)}>拷贝原文</Button>

        <Button size={"small"} type={"link"} icon="table"
                onClick={() => {
                  this.setState({
                    isHtml: !this.state.isHtml
                  })
                }}>显示{this.state.isHtml ? '原文' : 'Markdown'}</Button>
      </Fragment>
    )
    return (
      <Card size={"small"} bordered={false} extra={extraContent}>
        {this.state.isHtml ? htmlContent : mdContent}
      </Card>
    );
  }
}


module.exports = withRouter(MDTemplateServices);
