var JiraApi = require('jira').JiraApi;
var q = require('q');

var Jira = function (config) {

    var jira_config = config.jira_connection;
    var questionIdField = config.issue_template.tracking_field;

    if (questionIdField.startsWith("customfield_")) {
        questionIdField = "cf[" + questionIdField.split("_")[1] + "]"; 
    }
    
    var jira = new JiraApi(jira_config.schema, jira_config.host, jira_config.port, jira_config.username, jira_config.password, jira_config.version);

    this.createIssue = createIssue;
    this.updateIssue = updateIssue;
    this.closeIssue = closeIssue;
    this.findStackOverflowQuestion = findStackOverflowQuestion;

    function closeIssue(issueKey) {
        return q.npost(jira, "transitionIssue", [issueKey, {transition:{id:jira_config.close_transition}}]);
    }

    function findStackOverflowQuestion(question_id) {
        var jql = "project = " + jira_config.project + " AND " + questionIdField + " = " + question_id;
        return q.npost(jira, "searchJira", [jql, {maxResults:1}]);
    }

    function updateIssue(issueKey, update) {
        return q.npost(jira, "updateIssue", [issueKey, update]);
    }
    
    function createIssue(issue) {
        return q.npost(jira, "addNewIssue", [issue]);
    }

}

var init = function (config) {
    return new Jira(config);
}

module.exports = init;