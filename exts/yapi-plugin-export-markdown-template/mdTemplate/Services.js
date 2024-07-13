import React, {PureComponent as Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import {getToken} from '../../../client/reducer/modules/project.js'
import './Services.scss';
import {withRouter} from "react-router-dom";
import axios from "axios";
import {message} from "antd";
import copy from "copy-to-clipboard";

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
      render_data: {}
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
    let render_vide = [];
    if (this.state.render_data) {
      render_vide.push(<pre key="md"><span className='btn-pre-copy' onClick={()=>this.preCopy(this.state.render_data.data)}>复制代码</span>{this.state.render_data.data + "\n"}</pre>)

    }
    console.log(render_vide)
    return (
      <div className="project-services">
        <section className="news-box m-panel">
          <div className="token">
            {render_vide}
          </div>
        </section>
      </div>
    );
  }
}


module.exports = withRouter(MDTemplateServices);
