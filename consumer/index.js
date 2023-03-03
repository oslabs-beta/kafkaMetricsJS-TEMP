const endBatchProcess = require('./endBatchProcess');
const heartbeat = require('./heartbeat');
const { initialConnectionAge, successfulConnectionAge } = require('./connect');
const { requestEvents } = require('./request');
const requestTimeoutRate = require('./request_timeout');
const requestQueueSize = require('./requestQueueSize');
const totalPartitions = require('./group_join');
const consumerDisconnect = require('./disconnect');
const fs = require('fs');

function getConsumerData(promise, consumer, client) {
  // consumer.then(data => {
  //   console.log('data', data);
  // })
  // setInterval((data) => {
  //   fs.appendFile('/Users/admin/Desktop/osp/project/kafkajs-test/db.text', data, ((err) => {
  //     if (err) {
  //       console.log('err: ', err);
  //     } else {
  //       console.log('success: ', data);
  //     }
  //   }))
  // }, 5000, consumer.metrics.totalRequests.toString());
  if (client.metrics.options.visualize) {

    const Redis = require('redis');

    const redisClient = Redis.createClient({
      url: 'rediss://red-cg11tq4eoogv676437bg:Y2IG87W5lT5sONA63l61QGxzdtx0FGh6@ohio-redis.render.com:6379',
    });

    // const redisClient = Redis.createClient({
    //   socket: {
    //     host: 'ohio-redis.render.com',
    //     port: '6379',
    //   },
    //   password: 'Y2IG87W5lT5sONA63l61QGxzdtx0FGh6',
    //   legacyMode: true,
    // });

    const stupidFunc = async (client) => {
      await client.connect();

      await client.set('key', 'value');
      const value = await client.get('key');
      await client.disconnect();  
    }

    redisClient.on('error', err => {
      console.log('err', err);
    })

    stupidFunc(redisClient);

    // setTimeout( async (client) => {
    //   await client.set('totalRequests', consumer.metrics.totalRequests.toString());
    // }, 10000, redisClient);
    // const redisClient = Redis.createClient({
    //   socket: {
    //     host: 'ohio-redis.render.com',
    //     port: '6379',
    //   },
    //   password: 'Y2IG87W5lT5sONA63l61QGxzdtx0FGh6',
    //   legacyMode: true,
    // })
    // setInterval(() => {
    //   fs.appendFile('/Users/admin/Desktop/osp/project/kafkajs-test/db.text', consumer.metrics.totalRequests.toString(), (err) => {
    //     if (err) {
    //       console.log('err: ', err);
    //     } else {
    //       console.log('success: ', consumer.metrics.totalRequests)
    //     }
    //   })
    // }, 5000);
  }
}

// function setVisualizer(dumbThing, consumer) {
//   setTimeout(getConsumerData, 0, consumer);
// }


function metricize(consumer, client) {
  // create empty metrics property on consumer
  consumer.metrics = {
    name: null,
    memberId: null, // set within group_join.js, reset on disconnect in disconnect.js
    isConnected: false,
    lastHeartbeat: 0, // updated within heartbeat.js, reset on disconnect in disconnect.js
    lastHeartbeatDuration: 0, // updated within heartbeat.js, reset on disconnect in disconnect.js
    longestHeartbeatDuration: 0, // updated within heartbeat.js, reset on disconnect in disconnect.js
    // the options object inside consumer.metrics contains properties for event emitters that aren't useful for the developer to view (i.e. flag on-and-off properties for conditionals)
    messagesConsumed: 0, // updated within endBatchProcess.js
    offsetLag: null, // updated within endBatchProcess.js
    totalRequests: 0, // updated within request.js
    requestRate: 0, // updated within request.js
    timeoutRate: 0, // updated within request_timeout.js
    totalRequestTimeouts: 0, //updated within request_timeout.js
    totalPartitions: 0, // updated within group_join.js
    // turns on logging every heartbeat
    heartbeatLogOn: function () {
      consumer.metrics.options.heartbeat.logOn = true;
    },
    // turns off logging every heartbeat
    heartbeatLogOff: function () {
      consumer.metrics.options.heartbeat.logOn = false;
    },
    // creates a breakpoint at the input interval
    heartbeatBreakpoint: function (interval) {
      consumer.metrics.options.heartbeat.breakpoint = interval;
    },
    // ends a previously-input breakpoint at the inputted interval
    heartbeatBreakpointOff: function () {
      consumer.metrics.options.heartbeat.breakpoint = null;
    },
    setOffsetLagBreakpoint: function (interval) {
      consumer.metrics.options.offsetLagBreakpoint = interval;
    },
    offsetLagBreakpointOff: function () {
      consumer.metrics.options.offsetLagBreakpoint = null;
    },
    requestPendingDurationlogOn: function () {
      consumer.metrics.options.requestPendingDuration.logOn = true;
    },
    requestPendingDurationlogOff: function () {
      consumer.metrics.options.requestPendingDuration.logOn = false;
    },
    requestPendingDurationBreakpoint: function (interval) {
      consumer.metrics.options.requestPendingDuration.breakpoint = interval;
    },
    requestPendingDurationBreakpointOff: function () {
      consumer.metrics.options.requestPendingDuration.breakpoint = null;
    },
    // turns request queue size logging on
    requestQueueSizelogOn: function () {
      consumer.metrics.options.requestQueueSize.logOn = true;
    },
    // turns off logging request queue size
    requestQueueSizelogOff: function () {
      consumer.metrics.options.requestQueueSize.logOn = false;
    },
    //creates a breakpoint at the input interval
    requestQueueSizeBreakpoint: function (interval) {
      consumer.metrics.options.requestQueueSize.breakpoint = interval;
    },
    // ends a previously-input breakpoint at the inputted interval
    requestQueueSizeBreakpointOff: function () {
      consumer.metrics.options.requestQueueSize.breakpoint = null;
    },
    latencyOffsetFetch: [], // sends the developer the current history and pattern of offsetfetch latency in requestPendingDuration.js
    // currentQueueSizeHistory: [], // sends the developer the current history and pattern of queuesizehistroy in requestQueueSize.js
    options: {
      heartbeat: {
        logOn: false, // set within heartbeat.js
        breakpoint: null, // set within heartbeat.js
        offsetLagBreakpoint: null, // set within endBatchProcess.js
      },
      requestPendingDuration: {
        logOn: false, //set within requestPendingDuration.js
        breakpoint: null, //set within requestPendingDuration.js
      },
      requestQueueSize: {
        logOn: false, //set within requestQueueSize.js
        breakpoint: null, //set within requestQueueSize.js
      },
    },
  };
  // run functions to create metrics for consumer instrumentation events
  endBatchProcess(consumer);
  initialConnectionAge(consumer);
  successfulConnectionAge(consumer, client);
  consumerDisconnect(consumer, client);
  requestEvents(consumer);
  requestTimeoutRate(consumer);
  totalPartitions(consumer);
  heartbeat(consumer);
  requestQueueSize(consumer);
  const vanillaConsumerConnect = consumer.connect;
  consumer.connect = function WrapConsumerConnect() {
    return getConsumerData(vanillaConsumerConnect.apply(this, arguments), this, client);
  }
  return consumer;
}
module.exports = metricize;
