# AdventOfCodeIBMCloudSlackBot
Uses IBM Cloud's Free Functions+Periodic Trigger+Cloudant to send messages before the next day begins at 11:50 PM EST

Since IBM Functions and Cloudant have a free tier, it shouldn't cost you anything to host your advent of code leader board,
at least I hope so otherwise my Christmas wishlists might be taking a hit.

# Setup

```
npm install --save @ibm-cloud/cloudant

# unfortunately, you will need to go to ibm cloud to setup cloudant
# there are no convenient commands to set it up from the CLI

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
