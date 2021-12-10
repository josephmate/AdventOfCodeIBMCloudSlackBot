var index = require('./index');

index.main(
    {
        apiKey: "<your ibm cloud api key>",
        dbName: "<your cloudant db instance name>",
        dbUrl: "<your cloud db url>",
        privateLeaderboardUrl: "<your aoc private leaderboard url>",
        privateLeaderboardCookie: "<your logged in aoc cookie. you can get it from developer tools in your browser>",
        slackWebhookUrl: "<slack webhook builder url take accepts { dayNum: "", leaderboard:""}>",
    }
);
