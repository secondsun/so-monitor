# Stack Exchange Monitor

This project polls Stack Exchange for questions with issues and creates JIRA tickets from them.

# Configuration

You will need to create a stack exchange app to get a key. After that fill in the [config.json](config.sample.json) file.

You will also need a JIRA instance with the REST api enabled to post your issues to.

Finally, you will need to run: 

`npm install` to get everything running

# Running

`node application.js`
