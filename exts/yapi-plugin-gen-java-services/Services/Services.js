import React, {PureComponent as Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import {getToken} from '../../../client/reducer/modules/project.js'
import './Services.scss';
import {withRouter} from "react-router-dom";
import axios from "axios";
import {message} from "antd";

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
class Services extends Component {
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
    let projectId = this.props.match.params.id;
    let interfaceId = this.props.match.params.actionId;
    let result = await axios.get(`/api/plugin/codeGen?projectId=${projectId}&interfaceId=${interfaceId}`);
    if (result.data) {
      this.setState({
        render_data: result.data
      });
    }
  }
  async preCopy(code) {
    await navigator.clipboard.writeText(code)
    message.success("复制成功")
  }
  render() {
    let render_vide = [];
    if (this.state.render_data) {
      Object.keys(this.state.render_data)
      Object.keys(this.state.render_data).forEach((tag) => {
        render_vide.push(<h5 key={tag + "_desc"}>{tag}</h5>)
        render_vide.push(<pre key={tag + "_code"}><span className='btn-pre-copy' onClick={()=>this.preCopy(this.state.render_data[tag])}>复制代码</span>{this.state.render_data[tag] + "\n"}</pre>)
      });
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


module.exports = withRouter(Services);
