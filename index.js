const { CloudantV1 } = require('@ibm-cloud/cloudant');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');
const https = require('https'); 
const http = require('http'); 

const prefix = function(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
        result = result + " ";
    }
    return result;
}

const makeLeaderboard = function(oldLeaderboard, newLeaderboard) {
    const members = [];

    Object.keys(newLeaderboard).forEach(memberId => {
        const memberInfo = newLeaderboard[memberId];
        const localScore = memberInfo['local_score'];
        const lastStarTs = memberInfo['last_star_ts'];
        const currentDayStars = memberInfo['stars'];
        const memberName = memberInfo.name ?
            memberInfo.name
            : "Anonymous " + memberId;
        
        const previousDayLocalScore = oldLeaderboard[memberId] ?
            oldLeaderboard[memberId]['local_score']
            : 0;
        const previousDayStars = oldLeaderboard[memberId] ?
            oldLeaderboard[memberId]['stars']
            : 0;
        const previousDayLastStarTimestamp = oldLeaderboard[memberId] ?
            oldLeaderboard[memberId]['last_star_ts']
            : 0;

        members.push({
            memberId: memberId,
            memberName: memberName,
            currentDayLocalScore: localScore,
            currentDayStars: currentDayStars,
            currentDayLastStarTimestamp: lastStarTs,
            previousDayLocalScore: previousDayLocalScore,
            previousDayStars: previousDayStars,
            previousDayLastStarTimestamp: previousDayLastStarTimestamp,
        });
    });

    // sort according to the previous day local score
    members.sort( (first, second) => {
        const delta = second.previousDayLocalScore - first.previousDayLocalScore;
        if (delta != 0) {
            return delta;
        }
        return first.previousDayLastStarTimestamp - second.previousDayLastStarTimestamp
    });
    for (let rank = 1; rank <= members.length; rank++) {
        const member = members[rank-1];
        // look up the member in the old leader board for previous rank
        const oldRank = oldLeaderboard[member.memberId] ?
            rank
            : 0;
        member.oldRankByLocalScore = oldRank;
    }
    
    // sort according to the latest local score
    members.sort( (first, second) => {
        const delta = second.currentDayLocalScore - first.currentDayLocalScore;
        if (delta != 0) {
            return delta;
        }
        return first.currentDayLastStarTimestamp - second.currentDayLastStarTimestamp
    });
    for (let rank = 1; rank <= members.length; rank++) {
        members[rank-1].newRankByLocalScore = rank;
    };
    let byLocalScore = [];
    members.forEach((member) => {
        const rankDigits = member.newRankByLocalScore.toString().length;
        let result = "";
        result = result + (prefix(3-rankDigits));
        result = result + member.newRankByLocalScore;
        let delta = "";
        if (member.newRankByLocalScore > member.oldRankByLocalScore) {
            delta = "-" + (member.newRankByLocalScore - member.oldRankByLocalScore)
        } else if (member.newRankByLocalScore < member.oldRankByLocalScore) {
            delta = "+" + (member.oldRankByLocalScore - member.newRankByLocalScore)
        }
        const deltaDigits = delta.toString().length;
        result = result + " ";
        result = result + (prefix(4-deltaDigits));
        result = result + delta;

        result = result + " ";
        const starsDigits = member.currentDayLocalScore.toString().length;
        result = result + (prefix(4-starsDigits));
        result = result + member.currentDayLocalScore;

        result = result + " ";
        result = result + member.memberName;
        byLocalScore.push(result);
    });

    // sort according to the previous day stars
    members.sort( (first, second) => {
        const delta = second.previousDayStars - first.previousDayStars;
        if (delta != 0) {
            return delta;
        }
        return first.previousDayLastStarTimestamp - second.previousDayLastStarTimestamp
    });
    for (let rank = 1; rank <= members.length; rank++) {
        const member = members[rank-1];
        // look up the member in the old leader board for previous rank
        const oldRank = oldLeaderboard[member.memberId] ?
            rank
            : 0;
        member.oldRankByStars = oldRank;
    }

    // sort according to the latest stars
    members.sort( (first, second) => {
        const delta = second.currentDayStars - first.currentDayStars;
        if (delta != 0) {
            return delta;
        }
        return first.currentDayLastStarTimestamp - second.currentDayLastStarTimestamp
    });
    for (let rank = 1; rank <= members.length; rank++) {
        members[rank-1].newRankByStars = rank;
    };
    let longestMemberName = 0;
    members.forEach((member) => {
        if (member.memberName.length > longestMemberName) {
            longestMemberName = member.memberName.length;
        }
    });
    let byStars = [];
    members.forEach((member) => {
        const rankDigits = member.newRankByStars.toString().length;
        let result = "";
        result = result + (prefix(3-rankDigits));
        result = result + member.newRankByStars;
        let delta = "";
        if (member.newRankByStars > member.oldRankByStars) {
            delta = "-" + (member.newRankByStars - member.oldRankByStars)
        } else if (member.newRankByStars < member.oldRankByStars) {
            delta = "+" + (member.oldRankByStars - member.newRankByStars)
        }
        const deltaDigits = delta.toString().length;
        result = result + " ";
        result = result + (prefix(4-deltaDigits));
        result = result + delta;

        result = result + " ";
        const starsDigits = member.currentDayStars.toString().length;
        result = result + (prefix(2-starsDigits));
        result = result + member.currentDayStars;

        result = result + " ";
        result = result + member.memberName;
        result = result + (prefix(longestMemberName-member.memberName.length));
        byStars.push(result);
    });

    let result = "";
    for (let i = 0; i < byStars.length; i++) {
        result = result + byStars[i];
        result = result + "|";
        result = result + byLocalScore[i];
        result = result + "\n";
    }

    return result;
}

function doRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      res.setEncoding('utf8');
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        resolve({
            statusCode: res.statusCode,
            body: responseBody,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
        console.log('writing data');
        req.write(data);
    }
    req.end();
  });
}
function doRequestHttp(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      res.setEncoding('utf8');
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        resolve({
            statusCode: res.statusCode,
            body: responseBody,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
        console.log('writing data');
        req.write(data);
    }
    req.end();
  });
}

const toYYYYMMDD = function(date) {
    const monthNum = date.getMonth() + 1; // getMonth is 0 to 11
    const month = monthNum < 10
        ? "0" + monthNum.toString()
        : monthNum.toString();
    const dateOfMonth = date.getDate() < 10
        ? "0" + date.getDate().toString()
        : date.getDate().toString();
    return date.getFullYear() 
        + "-" + month
        + "-" + dateOfMonth;
}

/**
 * args.apiKey
 * args.dbName
 * args.dbUrl
 * args.privateLeaderboardUrl
 * args.privateLeaderboardCookie
 * args.slackWebhookUrl
 */
const main = async function(args) { 

    // Get the previous leaderboard:
    // See https://www.npmjs.com/package/@ibm-cloud/cloudant for samples
    // on sending requests.
    const authenticator = new IamAuthenticator({
      apikey: args.apiKey
    });
    const service = new CloudantV1({
      authenticator: authenticator
    });
    service.setServiceUrl(args.dbUrl);
    const currentDate = new Date();
    const previousDate = new Date();
    // this reduces the day by 1
    previousDate.setDate(previousDate.getDate() - 1);
    console.log(`currentDate=${currentDate}`);
    console.log(`previousDate=${previousDate}`);
    const currentDateStr = toYYYYMMDD(currentDate);
    const previousDateStr = toYYYYMMDD(previousDate);
    console.log(`currentDateStr=${currentDateStr}`);
    console.log(`previousDateStr=${previousDateStr}`);
    const getDocParams = {
        db: args.dbName,
        docId: previousDateStr
    };
    console.log(`getDocParams ${JSON.stringify(getDocParams)}`);
    const previousLeaderboardResponse = await service.getDocument(getDocParams);
    console.log(`previousLeaderboardResponse: ${JSON.stringify(previousLeaderboardResponse)}`);
    const previousLeaderboard = await previousLeaderboardResponse.result;

    // Get the latest leaderboard:
    const leaderBoardUrl = new URL(args.privateLeaderboardUrl); 
    const leaderBoardOptions = {
      method: 'GET',
      headers: {
          "Cookie": args.privateLeaderboardCookie
      }
    };

    let leaderBoardResponse = await doRequest(leaderBoardUrl, leaderBoardOptions);
    console.log(`leaderBoardResponse: ${JSON.stringify(leaderBoardResponse)}`);
    console.log(`statusCode: ${leaderBoardResponse.statusCode}`);
    console.log(`body: ${leaderBoardResponse.body}`);
    const leaderboard = JSON.parse(leaderBoardResponse.body);

    // Write a new document to the database
    const doc = {
        db: args.dbName,
        document: {
            _id: currentDateStr,
            payload: leaderboard,
        }
    };
    const createDocResponse = await service.postDocument(doc);
    console.log(`createDocResponse=${JSON.stringify(createDocResponse)}`);

    // Sending to slack
    // Runs at 11:50pm EST which is the next day in UTC
    // So convenient to use the 'previous day'
    const data = JSON.stringify({
        dayNum: previousDateStr,
        leaderboard: makeLeaderboard(previousLeaderboard.payload.members, leaderboard.members)
    });
    console.log(`data=${data}`);
    const slackWebhookUrl = new URL(args.slackWebhookUrl); 
    const slackWebhookOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': new Buffer.from(data, "utf-8").length,
        }
    };
    const slackResponse = args.slackWebhookUrl.startsWith("https:")
        ? await doRequest(slackWebhookUrl, slackWebhookOptions, data)
        : await doRequestHttp(slackWebhookUrl, slackWebhookOptions, data);
    console.log(`slackResponse: ${JSON.stringify(slackResponse)}`)

    return {status: "SUCCESS"};
};

exports.main = main;
exports.makeLeaderboard = makeLeaderboard;
