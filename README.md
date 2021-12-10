# AdventOfCodeIBMCloudSlackBot
Uses IBM Cloud's Free [Functions](https://cloud.ibm.com/functions/learn/pricing)+Periodic Trigger+[Cloudant](https://www.ibm.com/cloud/cloudant/pricing) to send messages before the next day begins at 11:50 PM EST. Also since it runs once a day, it meets AoC's request to not exceed 1 request per 15 minutes.

Sends a message that looks like:
```
  1   +2 18 User 1  |  1       419 User 1
  2   -1 18 User 2  |  2  +1   414 User 2
  3   -1 18 User 3  |  3  -1   397 User 3
```
shows the current ranks and the changes since yesterday. Saves the ranks from each day in Cloudant so you can go through the history if you want to.


Since IBM Functions and Cloudant have a free tier, it shouldn't cost you anything to host your advent of code leaderboard,
at least I hope so otherwise my Christmas wishlist might be taking a hit.

I don't expect to exceed the free tier (as of Dec. 9 2021) from browsing their site

* 400,000 GB-s for my functions
* 20 reads/sec
* 10 writes/sec
* 5 global queries/sec 
* 1 GB storage

because this only consumes:

1. 1 function per day (didn't benchmark memory or time)
2. 1 cloudant read per day to obtain the previous day's leaderboard
3. 1 cloudant write per day to save the current day's leaderboard for the next day to use
4. Each 25 member leaderboard saved as is from AOC consumes 9KB

# Setup
Step 1: Slack

1. Go to the workflow build. Easiest way is to type `/workflow` in chat and autocomplete popup will give a `Open Workflow Builder` option
2. Create
3. Give it a name
4. Webhook `ADVANCED`
5. Add Variable `dayNum` with Data type text
6. Add Variable `leaderboard` with Data type text
7. Add step
8. Send a message
9. Use the variables in the text editor to design the message however you want. Make sure to put the leaderboard variable inside \`\`\` otherwise it won't render correctly
10. Select a #channel to send to

Step 2: Cloudant

1. Create a cloudant database free tier
2. Go to that database and add a record for the current day (suppose today is day 5)
```
{
  "_id": "2021-12-05,
  "payload": <leaderboard json from advent of code>
}
```


Step 3: IBM Cloud Function
```
npm install --save @ibm-cloud/cloudant


zip -r advent_of_code_update.zip index.js node node_modules

# if creating for the first time
ibmcloud fn action create advent_of_code_update advent_of_code_update.zip --kind nodejs:12
# if updating
ibmcloud fn action update advent_of_code_update advent_of_code_update.zip --kind nodejs:12

# go into functions on cloud.ibm.com
# find the above action you created
# on the left panel go to "Connected Triggers"
# "Add Trigger"
# Perioidic - Trigger an action based on time.
# every day 4:50am (which is 1150EST)
# make sure to delete the trigger when the contest is over
```
