'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const axios = require('axios');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add('Welcome to my agent!');
  }
 
  function fallback(agent) {
    agent.add("I didn't understand");
    agent.add("I'm sorry, can you try again?");
  }
  
  function getAttendees(agent) {
    const eventTitle = agent.parameters["Event"];
    
    if (eventTitle === "" || eventTitle === undefined) {
      agent.add("Sorry, I don't understand.");
    }
    
    const baseUrl = "https://dowchirp.azurewebsites.net";

    return axios({
      url: baseUrl+"/issue",
      method: 'get',
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }).then( events => {
        
        if (events.data.length <= 0) {
            return Promise.reject({message: "No Events Exist"})
        }
        
        let event = events.data.find(el => {
            return el.title.toLowerCase() == eventTitle.toLowerCase()
        });
        
        if (!event || !event["number"]) {
            agent.add(`${eventTitle} does not exist.`);
        } else {
            return axios({
              url: baseUrl+`/issue/comments/${event["number"]}`,
              method: 'get',
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }).then( people => {
                let usernames = people.data.map(el => JSON.parse(el.body)).map(attendee => `${attendee.first_name} ${attendee.last_name}`) || [];
                
                if (usernames.length > 0) {
                    agent.add(`The attendees were ${usernames.join(', ')}.`);
                } else {
                    agent.add('There were no attendees.');
                }
            })
        }
    }).catch(err => {
        agent.add(err.message);
    }).then(() => {
        return Promise.resolve(agent)
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Get attendees', getAttendees);
  agent.handleRequest(intentMap);
});
