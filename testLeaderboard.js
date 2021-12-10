var index = require('./index');

const oldLeaderboardJsonFile = process.argv[2];
const newLeaderboardJsonFile = process.argv[3];

const fs = require('fs');

try {
    const oldLeaderboardJsonData = fs.readFileSync(oldLeaderboardJsonFile, 'utf8')
    const newLeaderboardJsonData = fs.readFileSync(newLeaderboardJsonFile, 'utf8')
    
    oldLeaderboard = JSON.parse(oldLeaderboardJsonData);
    newLeaderboard = JSON.parse(newLeaderboardJsonData);
    

    console.log(index.makeLeaderboard(
        oldLeaderboard.payload.members,
        newLeaderboard.payload.members));
} catch (err) {
    console.error(err)
}
