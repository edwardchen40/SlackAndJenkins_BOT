# SlackAndJenkins_BOT

## Bot Configuration
1. Go to https://yourteam.slack.com/apps
2. Search input for "Bots"
3. Add Configurations
4. Give Bot a username and click the "Add bot integration"
5. There is a API Token and keep in mind

## Jenkins
1. Install Build Authorization Token Root Plugin
2. Select trigger builds remotely and add a token 
3. And you can trigger the URL (JENKINS_URL/job/jobname/build?token=TOKEN_NAME)

## Bot Script
1. git clone slack-bot
2. cd slack-bot
3. npm init
4. npm install --save botkit
5. vim bot.js and paste the slack's API Token
6. job_url Insert your Jenkins's URL
