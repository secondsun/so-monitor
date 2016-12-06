// var mbaasApi = require('fh-mbaas-api');
// var express = require('express');
// var mbaasExpress = mbaasApi.mbaasExpress();
// var cors = require('cors');
var config = require("./config.json")
var stackexchange = require('stackexchange');
var issueUtils = require("./monitor/issue_utils.js")(config);
var options = { version: 2.2 };
var context = new stackexchange(options);

var jira_config = config.jira_connection;
var stackexchange_query = config.stackexchange_query;


JiraApi = require('jira').JiraApi;

var jira = new JiraApi(jira_config.schema, jira_config.host, jira_config.port, jira_config.username, jira_config.password, jira_config.version);

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

    jira.addNewIssue(issue, function (err, response) {
      if (err) {
        console.log('✘ We have an error - ' + JSON.stringify(err));
      } else if (response.self !== undefined) {

        console.log("✔ Created Ticket - " + jira_config.schema + "://" + jira_config.host + "/browse/" + response.key + " - " + response.self); // key = Issue ID, self = Link to Jira Issue
        jira.updateIssue(response.key, { "update": { "labels": [{ "add": 'team-developer-experience' }] } }, function (err, response) {
          if (err) {
            console.log('✘ We have an error - ' + JSON.stringify(err));
          } else {
            console.log("✔ Added Label team-developer-experience");
          }

        });
      }

    });
  });

});
