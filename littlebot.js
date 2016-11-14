var Botkit = require('botkit');
var request = require('request');

var controller = Botkit.slackbot({
  interactive_replies: false,
  json_file_store: './db_slackbutton_bot/',
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
  }
);

var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

function startRTM(bot, config) {
  bot.startRTM(function(err) {
    if (!err) {
        trackBot(bot);
    }
  });
}

controller.setupWebserver('3000',function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);
  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } 
    else {
      res.send('Success!');
    }
  });
});

controller.on('create_bot',function(bot,config) {
  if (_bots[bot.config.token]) {
  } 
  else {
    startRTM(bot, config);
  }
});

controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',startRTM);

controller.hears('^help', 'direct_message,direct_mention,mention', function(bot, message) { 
    var reply_with_attachments = {
        "attachments": [
            {
              "pretext": "Here are all commands.",
              "color": "#36a64f",
              "fields": [
                  {
                      "title": "build deploy",
                  },
                  {
                      "title": "test [job name]",
                  },
                  {
                      "title": "my name is [your name]",
                  },
                  {
                      "title": "get [job name] result",
                  },
                  {
                      "title": "sign off",
                  },
                  {
                      "title": "hi or hello",
                  }
              ]
            }
        ]
    }
    bot.reply(message, reply_with_attachments)
});

controller.hears('^sign off', 'direct_message,direct_mention,mention', function(bot, message) {
  bot.reply(message, {
    "text": "Do you really want to sing off?",
    "attachments": [{
      "fallback": "Couldn't reply.",
      "callback_id": "sign",
      "attachment_type": 'default',
      "actions": [
        {
          "name": "yes",
          "value": "yes",
          "text": "Yes",
          "type": "button"
        },
        {
          "name": "no",
          "value": "no",
          "text": "No",
          "type": "button"
        }
      ]
    }]
  });
});

controller.on('interactive_message_callback', function(bot, message) {
  if (message.callback_id == "sign") {
    const name = message.actions[0].name;
    const value = message.actions[0].value;
    var text = ""
    if (name == "yes") {
      text = '<@'+message.user+'> sign off!!'
    } 
    else {
      text = "That's too bad!!"
    }
    bot.replyInteractive(message, {"text": text});
  }
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears('^build deploy', 'direct_message,direct_mention,mention',function(bot,message) {
  var job_name = 'Check_Build_Deploy';
  console.log(job_name)
  var job_url = 'http://192.168.5.1:8080/job/'+job_name+'/build?token=build_deploy';
  request(job_url, function () {
    var str = 'OK! Let me build the '+job_name
    bot.reply(message, str)
  })
})

controller.hears('^test (.*)', 'direct_message,direct_mention,mention',function(bot,message) {
  var job_name = message.match[1].toLowerCase();
  console.log(job_name)
  var job_url = 'http://192.168.5.1:8080/job/'+job_name+'/build?token='+job_name;
  request(job_url, function () {
        if (job_name == 'autotest' || job_name =='monkeytest') {
          var str = 'OK! Let me test the '+job_name
          bot.reply(message, str)
        } 
        else {
          bot.reply(message, 'Sorry, I can\'t find the '+job_name+'. >_<!!')
        }
    })
})

controller.hears('^get (.*) result','direct_message,direct_mention,mention',function(bot, message) {
  var job_name = message.match[1].toLowerCase();
  var jenkins_url = 'http://192.168.5.1:8080/job/'+job_name+'/lastBuild/testReport/api/json';
  request(jenkins_url, function(error, responce, body) {
    if(!error && responce.statusCode === 200) {
      var jenkinsBuildJson = JSON.parse(body);
      var reply_with_attachments = {
        "attachments": [
                {
                    "fallback": "Required plain-text summary of the attachment.",
                    "color": "#55699e",
                    "title": "The last build robot result of " + job_name,
                    "title_link": 'http://192.168.5.1:8080/job/'+job_name+'/lastBuild/testReport',
                    "fields": [
                        {
                            "title": "Failed Cases",
                            "value": jenkinsBuildJson.failCount,
                            "short": true
                        },
                        {
                            "title": "Passed Cases",
                            "value": jenkinsBuildJson.childReports[0].result.passCount,
                            "short": true
                        },
                    ]
                }
            ]
      }
      bot.reply(message, reply_with_attachments)
    }
  })
  // process.exec('open -a /Applications/Safari.app http://www.google.com',function (err,stdout,stderr) {
  //   if (err) {
  //       console.log("\n"+stderr);
  //   } else {
  //       console.log(stdout);
  //   }
  // });
})

controller.hears('','direct_message,direct_mention,mention',function(bot, message) {  
   bot.reply(message,'Fuck you!');
   bot.reply(message,'You can use "help"');
})
