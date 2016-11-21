var Botkit = require('botkit');
var request = require('request');
var process = require('child_process');
var TestRail = require('node-testrail');
var testrail = new TestRail('https://ichef.testrail.com/', 'ichefrobot@gmail.com', 'iCHEF0000');
var _bots = {};
var version = null;
var runId = null;

var controller = Botkit.slackbot({
  interactive_replies: false,
  json_file_store: './db_slackbutton_bot/'
}).configureSlackApp(
  {
    clientId: '2151498087.96941144311',
    clientSecret: '3f922dfc2e2f83131988ad5f2d6f8263',
    scopes: ['bot']
  }
)

function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

function startRTM(bot) {
  bot.startRTM(function(err) {
    if (!err) {
      trackBot(bot);
    }
  })
}

controller.setupWebserver('3000', function(err, webserver) {
  controller.createWebhookEndpoints(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, function(err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    }
    else {
      res.send('Success!');
    }
  })
})

controller.on('create_bot', function(bot, config) {
  if (_bots[bot.config.token]) {
  }
  else {
    startRTM(bot)
  }
})

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected!');
})

controller.on('rtm_close', function(bot, err) {
  console.log('/* --- Restarting bot ---- */');
  if (err) {
    console.error(err);
  }
  startRTM(bot);
})

controller.hears('^help', 'direct_message,direct_mention,mention', function(bot, message) { 
   bot.reply(message, {
    attachments: [{
      title: 'What do you want to do ?',
      callback_id: 'help',
      attachment_type: 'default',
      color: '#001405',
      actions: [
        {
          'name': 'buildJenkins',
          'value': 'buildJenkins',
          'text': 'Build Jenkins',
          'type': 'button'
        },
        {
          'name': 'jenkinsResult',
          'value': 'jenkinsResult',
          'text': 'Jenkins Result',
          'type': 'button'
        },
        {
          'name': 'testrailReport',
          'value': 'testrailReport',
          'text': 'Testrail Report',
          'type': 'button'
        },
        {
          'name': 'signOff',
          'value': 'signOff',
          'text': 'Sign Off',
          'type': 'button'
        }
      ]
    }]
  })
})

controller.on('interactive_message_callback', function(bot, message) {
  switch (message.actions[0].name) {
    case 'buildJenkins': {
      bot.replyInteractive(message, {
        attachments: [{
          title: 'Which task do you want to build ?',
          callback_id: 'interactive',
          attachment_type: 'default',
          color: '#001405',
          actions: [
            {
              'name': 'buildautotest',
              'value': 'autotest',
              'text': 'Auto Test',
              'type': 'button'
            },
            {
              'name': 'check_build_deploy',
              'value': 'check_build_deploy',
              'text': 'Check Build Deploy',
              'type': 'button'
            }
          ]
        }]
      })
      break;
    }

    case 'buildautotest': {
      buildJenkins(bot, message, message.actions[0].value)
      break;
    }

    case 'check_build_deploy': {
      buildJenkins(bot, message, message.actions[0].value)
      break;
    }
/*------------------------------------------------------------*/
    case 'jenkinsResult': {
       bot.replyInteractive(message, {
        attachments: [{
          title: 'Which result do you want to know ?',
          callback_id: 'interactive',
          attachment_type: 'default',
          color: '#001405',
          actions: [
            {
              'name': 'autotestresult',
              'value': 'autotest',
              'text': 'Auto Test',
              'type': 'button'
            }
          ]
        }]
      })
      break;
    }

    case 'autotestresult': {
      jenkinsResult(bot, message, message.actions[0].value)
      break;
    }
/*------------------------------------------------------------*/
    case 'testrailReport': {
       bot.replyInteractive(message, {
        attachments: [{
          title: 'Which report do you want to see ?',
          callback_id: 'interactive',
          attachment_type: 'default',
          color: '#001405',
          actions: [
            {
              'name': 'smoke',
              'value': 'smoke',
              'text': 'Smoke',
              'type': 'button'
            },
            {
              'name': 'regression',
              'value': 'regression',
              'text': 'Regression',
              'type': 'button'
            },
          ]
        }]
      })
      break;
    }

    case 'smoke': {
      testrailReport(bot, message, message.actions[0].value)
      break;
    }

    case 'regression': {
      testrailReport(bot, message, message.actions[0].value)
      break;
    }
/*------------------------------------------------------------*/
    case 'signOff': {
       bot.replyInteractive(message, {
        attachments: [{
          title: 'Which result do you want to signOff ?',
          callback_id: 'interactive',
          attachment_type: 'default',
          color: '#001405',
          actions: [
            {
              'name': 'autotestresult',
              'value': 'autotest',
              'text': 'Auto Test',
              'type': 'button'
            }
          ]
        }]
      })
      break;
    }

    default:
      break;
  }
})
/*------------------------------------------------------------*/

controller.hears('^build (.*)', 'direct_message,direct_mention,mention',function (bot,message) {
  var jobName = message.match[1].toLowerCase()
  buildJenkins(bot, message, jobName)
})

controller.hears('^get (.*) result','direct_message,direct_mention,mention',function (bot, message) {
  var jobName = message.match[1].toLowerCase()
  jenkinsResult(bot, message, jobName)
})

controller.hears('^get (.*) report','direct_message,direct_mention,mention', function (bot, message) {  
  var jobName = message.match[1].toLowerCase()
  testrailReport(bot, message, jobName)
})

controller.hears('^sign off( (.+))?', 'direct_message,direct_mention,mention', function(bot, message) {
  version = message.match[1]
  signOff(bot, message, version)
})

controller.hears('','direct_message,direct_mention,mention',function (bot, message) {  
  bot.reply(message,'Fuck you!')
  bot.reply(message,'You can use "help"')
})

/*------------------------------------------------------------*/

function signOff(bot, message, version) {
  //version = message.match[1];
  bot.reply(message, {
    attachments: [{
      title: 'Do you really want to sign off ' + version + ' ?',
      //fallback: "Couldn't reply.",
      callback_id: 'sign',
      attachment_type: 'default',
      color: '#001405',
      actions: [
        {
          'name': 'yes',
          'value': 'yes',
          'text': 'Yes',
          'type': 'button'
        },
        {
          'name': 'no',
          'value': 'no',
          'text': 'No',
          'type': 'button'
        }
      ]
    }]
  })
}

function buildJenkins(bot, message, jobName) {
  console.log(jobName);
  var jobUrl = 'http://192.168.5.1:8080/job/' + jobName + '/build?token=' + jobName;
  request(jobUrl, function () {
    if (jobName === 'autotest' || jobName === 'monkeytest' || jobName === 'check_build_deploy') {
      var str = 'OK! Let me build the ' + jobName
        bot.reply(message, str)
    } 
    else {
        bot.reply(message, 'Sorry, I can\'t find the ' + jobName + '. >_<!!')
    }
  })
}

function jenkinsResult(bot, message, jobName) {
  console.log(jobName)
  var jenkinsUrl = 'http://192.168.5.1:8080/job/' + jobName + '/449/testReport/api/json?pretty=true'
  request(jenkinsUrl, function(err, responce, body) {
    if (!err && responce.statusCode === 200) {
      var jenkinsBuildJson = JSON.parse(body)
      var replyWithAttachments = {
        "attachments": [
          {
            "fallback": "Required plain-text summary of the attachment.",
            "color": "#001405",
            "title": "The last build robot result of " + jobName,
            "title_link": 'http://192.168.5.1:8080/job/' + jobName + '/lastBuild/testReport',
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
              }
            ]
          }
        ]
      }
      bot.reply(message, replyWithAttachments)
    }
    else{
      bot.reply(message, 'The job was aborted')
    }
  })
}

function testrailReport(bot, message, jobName) {
  var num = null
  if (jobName === 'smoke') {
    num = 6
    testrail.getRuns(num, function(jsonString) {
      var testRun = JSON.parse(jsonString)
      runId = testRun[0].id
      process.exec('open -a "Google Chrome" https://ichef.testrail.com/index.php?/runs/view/' + runId, function(err) {
        if (err) {
        console.log('\n' + err)
        }
      })
    })
  }
  else if (jobName === 'regression') {
    num = 3
    testrail.getRuns(num, function(jsonString) {
      var testRun = JSON.parse(jsonString)
      runId = testRun[0].id
      process.exec('open -a "Google Chrome" https://ichef.testrail.com/index.php?/runs/view/7', function(err) {
        if (err) {
        console.log('\n' + err)
        }
      })
    })
  }
  else {
    bot.reply(message, 'Sorry, I can\'t get the ' + jobName + 'report. >_<!!')
    bot.reply(message, 'You can get smoke or regression report')
  }
}
