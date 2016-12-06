// var mbaasApi = require('fh-mbaas-api');
// var express = require('express');
// var mbaasExpress = mbaasApi.mbaasExpress();
// var cors = require('cors');
var config = require("./config.json")
var stackexchange = require('stackexchange');
var J2M = require('j2m');
var options = { version: 2.2 };
var context = new stackexchange(options);

var jira_config = config.jira_connection;
var stackexchange_query = config.stackexchange_query;
var issue_template = config.issue_template;

JiraApi = require('jira').JiraApi;

var jira = new JiraApi(jira_config.schema, jira_config.host, jira_config.port, jira_config.username, jira_config.password, jira_config.version);

//

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

  var body = J2M.toJ(results.items[0].body);
  body = body.replace(/\[[\/]*p\]/g, '');
  body = body.replace(/\[[\/]*pre\]/g, '');
  body = body.replace(/\[\/*code\]/g, '{code}');
  body = body.replace(/\[a[^\]]* href="([^"]*)"[^\]]*\]([^\[]*)\[\/a\]/g, '[$2|$1]');
  console.log(body);

  var issue = {
    "fields": {
      "project": {
        "id": issue_template.project_id

      },
      "summary": results.items[0].title,
      "description": "{quote}" + body + "{quote} \n\n" + results.items[0].link,
      "issuetype": {
        "name": "Task"
      },
      "priority": {
        "name": "Minor"
      }
    }
  };

  jira.addNewIssue(issue, function (err, response) {
    if (err) {
      console.log('✘ We have an error - ' + JSON.stringify(err));
    } else if (response.self !== undefined) {

      console.log("✔ Created Ticket - " + jira_config.schema + "://" + jira_config.host + "/" + response.key + " - " + response.self); // key = Issue ID, self = Link to Jira Issue
      jira.updateIssue(response.key, { "update": { "labels": [{ "add": 'team-developer-experience' }] } }, function (err, response) {
        if (err) {
          console.log('✘ We have an error - ' + JSON.stringify(err));
        } else {
          console.log("✔ Added Label team-developer-experience");
        }
        process.exit(0);
      });
    }



  });
});
