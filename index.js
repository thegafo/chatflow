
var apiai = require('apiai');

/**
 * Chatflow - description
 *
 * @param  {type} dialogflowAccessToken description
 * @return {type}                       description
 */
class Chatflow {
  constructor(dialogflowAccessToken){
    this.dialogflow = new apiai(dialogflowAccessToken);
  }
}

/**
 * Chatflow.prototype.receive - description
 *
 * @param  {type} sessionId description
 * @param  {type} text      description
 * @return {type}           description
 */
Chatflow.prototype.receive = function(user, text, channel) {
  return new Promise((resolve,reject) => {
    if (!channel) channel = 'unknown';
    if (!text || !text.length) return reject(new Error('Text required'));
    var request = this.dialogflow.textRequest(text, {
        sessionId: `${user._id}${channel}`
    });
    var that = this;
    request.on('response', async function(response) {
      var result = response.result;
      var context = {};
      for (var c of result.contexts) context[c.name] = c.parameters;
      var data = {
        intentName: result.metadata.intentName,
        action: result.action,
        speech: result.fulfillment.speech,
        context: context,
        replies: [],
        parameters: result.parameters,
        complete: !result.actionIncomplete,
        sessionId: user._id,
        user: user,
        channel
      };
      if (result.fulfillment.messages.length > 1) {
        var replies = result.fulfillment.messages.filter(m => {
          return m.type === 4 && ('replies' in m.payload)
        });
        if (replies.length) {
          data.replies = replies[0].payload.replies;
        }
      }
      // if there is a complete intent, handle intent
      if (data.intentName && data.complete) {
        try {
          data = await that.handleIntent(data);
          data.handled = false;
          return resolve(data);
        } catch (err) {
          console.log(err.message);
          return reject(new Error(`Error handling intent: ${err.message}`));
        }
      }
      // otherwise respond with recommended response
      else {
        data.handled = false;
        return resolve(data);
      }

    });
    request.on('error', function(error) {
        console.log('dialogflow error', error);
        return reject(error);
    });
    request.end();
  });
}

Chatflow.prototype.setContext = async function(user, data, channel) {
  return new Promise((resolve,reject) => {
    if (!channel) channel = 'unknown';
    var options = {
        sessionId: `${user._id}${channel}`,
    };
    var request = this.dialogflow.contextsRequest(data, options);
    var that = this;
    request.on('response', async function(response) {
      resolve(response);
    });
    request.on('error', function(error) {
        console.log('dialogflow error', error);
        return reject(error);
    });
    request.end();
  });
}

/**
 * handleIntent - handle incoming intent
 *
 * @param  {Object} data
 * @return {Promise}
 */
Chatflow.prototype.handleIntent = async function (data) {
  return data;
};

module.exports = Chatflow;
