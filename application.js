var config = require("./config.json")

var stackexchange = require('stackexchange');
var options = { version: 2.2 };
var context = new stackexchange(options);

var issueUtils = require("./monitor/issue_utils.js")(config);
var jiraApi = require("./monitor/jira.js")(config);

var stackexchange_query = config.stackexchange_query;

var filter = {
  key: stackexchange_query.key,
  pagesize: stackexchange_query.pagesize,
  tagged: stackexchange_query.tagged,
  sort: stackexchange_query.sort,
  order: stackexchange_query.order,
  filter: stackexchange_query.filter
};

// Get all the questions (http://api.stackexchange.com/docs/questions) 
context.questions.questions(filter, function (err, results) {
  if (err) throw err;

  results.items.forEach(function (item) {
    var issue = issueUtils.createIssue(item);
    
    jiraApi.createIssue(issue).then(function (response) {
      console.log("✔ Created Ticket - " + config.jira_connection.schema + "://" + config.jira_connection.host + "/browse/" + response.key + " - " + response.self);
      return jiraApi.updateIssue(response.key, { "update": { "labels": [{ "add": 'team-developer-experience' }] } });
    }).then(function (err) {
      console.log("✔ Added Label team-developer-experience");
    }).catch(function (err) {
      console.log('✘ We have an error - ' + (err));
    });

  });

});
