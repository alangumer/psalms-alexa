/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID = null; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var token = '';

var request = require("request");
var striptags = require("striptags");
var psalms = require('./psalms-alexa.json');


/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var Bible = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Bible.prototype = Object.create(AlexaSkill.prototype);
Bible.prototype.constructor = Bible;

Bible.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    //console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Bible.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    //console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var message = 'Welcome to Psalms by theme. You can say, give me worship psalms, or just give me psalms';
    response.tellWithCard(message, "Psalms by theme", message);
};

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
Bible.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    //console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Bible.prototype.intentHandlers = {
    "GetNewQuotationIntent": function (intent, session, response) {
        handleNewQuotationRequest(intent, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say tell me blessing psalms, or, you can say exit... What can I help you with?", "What can I help you with?");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};


function handleNewQuotationRequest(intent, response) {
    //intent.handler or intent.context
    var theme = (intent.slots.Theme && intent.slots.Theme.value) ? intent.slots.Theme.value : getRandomTheme();
    console.log('theme', theme);
    
    getPsalmsAPI(theme, function(error, passages) {
      
      if (error) response.tellWithCard(error, "Service error", error);
      
      var passagesString = '';
      for (var i = 0; i < passages.length; i++) {
        passagesString += "<p>" + striptags(passages[0].text) + "</p>";
      }
      // Create speech output
      var speechOutput = "<speak> Here's your psalms: " + passagesString + "</speak>";
      var cardTitle = "Psalms by theme";
      response.tellWithCard({type: 'SSML', speech: speechOutput}, cardTitle, striptags(passages[0].text));
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the skill.
    var bible = new Bible();
    bible.execute(event, context);
};


var options = {
  method: 'GET',
  url: 'https://bibles.org/v2/passages.js',
  qs: { 'q[]': 'john 3:1-5', version: 'eng-KJVA' },
  headers: {
    'cache-control': 'no-cache',
    authorization: 'Basic ' + token
  }
};

function getPsalmsByTheme (theme) {
  var psalmsQuery = null;
  for (var i = 0; i < psalms.length; i++) {
    if (psalms[i].title.toLowerCase() == theme.toLowerCase()) {
      var psalmsQuery = '';
      for (var j = 0; j < psalms[i].content.length; j++) {
        psalmsQuery += 'psalm ' + psalms[i].content[j];
        if ( j != (psalms[i].content.length - 1) ) {
          psalmsQuery += ',';
        }
      }
    }
  }
  if (!psalmsQuery) {
    return getPsalmsByTheme(getRandomTheme());
  } else {
    return psalmsQuery;
  }
}

function getRandomTheme() {
  var index = Math.floor(Math.random() * psalms.length);
  return psalms[index].title;
}

function getPsalmsAPI( theme, callback ) {
  options.qs['q[]'] = getPsalmsByTheme( theme );
  
  request(options, function (error, response, body) {
    if (error) callback(new Error(error));
  
    console.log('response-->', options.qs['q[]'], options, JSON.parse(body).response.search.result.passages[0].text);
    callback(null, JSON.parse(body).response.search.result.passages);
  });
}