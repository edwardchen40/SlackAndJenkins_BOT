var Botkit = require('botkit');
var request = require('request');
var controller = Botkit.slackbot();
var bot = controller.spawn({
  token:''
})
bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears(["keyword","^pattern$"],["direct_message","direct_mention","mention","ambient"],function(bot,message) {
  bot.reply(message,'You used a keyword!');
});

controller.hears('open the (.*) doors', ["direct_message","direct_mention","mention","ambient"],function(bot,message) { 
    var doorType = message.match[1]; //match[1] is the (.*) group. match[0] is the entire group (open the (.*) doors).
     if (doorType === 'pod bay')
     {
        return bot.reply(message, 'I\'m sorry. I\'m afraid I can\'t do that.'); 
    }  
    return bot.reply(message, 'Okay');
});

controller.hears('build (.*)', ["direct_message","direct_mention","mention","ambient"],function(bot,message) {
  var job_name = message.match[1];
  console.log(job_name)
  var job_url = ''+job_name+'/build?token=autotest';
  request(job_url, function () {
        if (job_name === 'AutoTest') {
          var str = 'Go Jenkins'
          bot.reply(message, str)
        } 
        else {
          return bot.reply(message, 'error, maybe the job *'+job_name+'* not found. I am sorry for that. >_<!!')
        }
    })
})
