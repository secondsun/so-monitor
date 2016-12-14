var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');


var cron = require('node-schedule');


// list the endpoints which you want to make securable here
var securableEndpoints;
securableEndpoints = [];

var app = express();

// Enable CORS for all requests
app.use(cors());

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

// allow serving of static files from the public directory
//app.use(express.static(__dirname + '/public'));

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

cron.scheduleJob('*/5 * * * * *', function () {

  var config = require("./config.json")

  var stackexchange = require('stackexchange');
  var options = { version: 2.2 };
  var context = new stackexchange(options);

  var issueUtils = require("./monitor/issue_utils.js")(config);
  var jiraApi = require("./monitor/jira.js")(config);

  var stackexchange_query = config.stackexchange_query;

  stackexchange_query.tagged.forEach(function (tag) {
    var filter = {
      key: stackexchange_query.key,
      pagesize: stackexchange_query.pagesize,
      tagged: tag,
      sort: stackexchange_query.sort,
      order: stackexchange_query.order,
      filter: stackexchange_query.filter
    };

    // Get all the questions (http://api.stackexchange.com/docs/questions) 
    context.questions.questions(filter, function (err, results) {
      if (err) throw err;

      results.items.forEach(function (item) {

        jiraApi.findStackOverflowQuestion(item.question_id).then(function (result) {
          if (result.issues.length == 0) { //create issue
            var issue = issueUtils.createIssue(item);
            return jiraApi.createIssue(issue).then(function (response) {
              console.log("✔ Created Ticket - " + config.jira_connection.schema + "://" + config.jira_connection.host + "/browse/" + response.key + " - " + response.self);
              return jiraApi.updateIssue(response.key, { "update": { "labels": [{ "add": 'team-developer-experience' }] } });
            }).then(function () {
              console.log("✔ Added Label team-developer-experience");
            });
          } else { //check if answered and close
            if (item.is_answered && result.issues[0].fields.status.name === "Open") {
              console.log("✔ Item answered.  Closing " + result.issues[0].key);
              return jiraApi.closeIssue(result.issues[0].key).then(function () {
                console.log("✔ " + result.issues[0].key + " Closed ");
              });
            }
          }
        }).catch(function (err) {
          console.log('✘ We have an error - %j', (err));
          console.log('✘ We have an error - %s', (err));
        });

      });

    });

  });
});

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.listen(port, host, function () {
  console.log(process.env.FH_MONGODB_CONN_URL);
});


