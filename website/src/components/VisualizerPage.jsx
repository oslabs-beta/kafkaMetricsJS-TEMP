import React, { Component } from 'react';
import ChartSection from './ChartSection.jsx';

// MainChartPage renders a loading screen
// When state is ok, it renders ChartSection which displays various metrics charts
class VisualizerPage extends Component {
  constructor(props) {
    super(props);
    this.state = { default: true };
    this.updateState = this.updateState.bind(this);
  }

  componentDidUpdate() {
    if (!this.state.default && !this.state.ok) {
      const clone = JSON.parse(JSON.stringify(this.state));
      this.setState({ ...clone, ok: true });
    }
  }

  componentDidMount() {
    setTimeout(() => {
      fetch('https://www.kafkajsmetrics.com/getData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.props.token }),
      })
        .then((res) => res.json())
        .then((data) => {
          const stateObj = {};
          const metricArr = [];
          let datasets = [];
          let stack;
          const keyArr = Object.keys(data.data);
          keyArr.forEach((el) => {
            const obj = JSON.parse(data.data[el]);
            const tempObj = {};
            tempObj.label = el;
            tempObj.metrics = obj.data;
            stack = Object.keys(tempObj.metrics);
            stack.pop();
            metricArr.push(tempObj);
          });
          while (stack.length) {
            const chartName = stack.pop();
            // eslint-disable-next-line no-loop-func
            metricArr.forEach((obj) => {
              const tempObj = {};
              tempObj.label = obj.label;
              tempObj.data = [obj.metrics[chartName]];
              datasets.push(tempObj);
            });
            stateObj[chartName] = {
              labels: [...Array(10).keys()],
              datasets,
            };
            datasets = [];
          }
          const clone = JSON.parse(JSON.stringify(this.state));
          this.setState({ ...clone, charts: stateObj, default: false });
        })
        .catch((err) => {
          console.log('error in visualizer page /checktoken: ', err);
        });
    }, 3000);
  }

  updateState() {
    fetch('https://www.kafkajsmetrics.com/getData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: this.props.token }),
    })
      .then((res) => res.json())
      .then((data) => {
        const stateObjClone = JSON.parse(JSON.stringify(this.state));
        const metricObj = {};
        let stack;
        const keyArr = Object.keys(data.data);
        keyArr.forEach((el) => {
          const tempObj = {};
          const obj = JSON.parse(data.data[el]);
          metricObj[el] = obj.data;
          tempObj.metrics = obj.data;
          stack = Object.keys(tempObj.metrics);
          stack.pop();
        });
        while (stack.length) {
          const key = stack.pop();
          const dataArr = stateObjClone.charts[key].datasets;
          const labelArr = stateObjClone.charts[key].labels;
          labelArr.push(labelArr.length);
          dataArr.forEach((obj) => {
            if (metricObj[obj.label]) {
              obj.data.push(metricObj[obj.label][key]);
            }
          });
        }
        this.setState({ ...stateObjClone });
      })
      .catch((err) => {
        console.log('err in update state visualizer page', err);
      });
  }

  render() {
    if (!this.state.ok) {
      return (
        <div className="loading-page">
          <h2>Loading!</h2>
          <p>Content should appear shortly. If it does not, please refresh.</p>
        </div>
      );
    }
    return (
      <>
        <ChartSection
          data={this.state.charts}
          updateState={this.updateState}
          type={this.props.type}
        />
      </>
    );
  }
}

export default VisualizerPage;
