var JiraApi = require('jira').JiraApi;
var q = require('q');

var Jira = function (config) {

    var jira_config = config.jira_connection;
    
    var jira = new JiraApi(jira_config.schema, jira_config.host, jira_config.port, jira_config.username, jira_config.password, jira_config.version);

    this.createIssue = createIssue;
    this.updateIssue = updateIssue;
    this.findIssue = findIssue;

    function findIssue(issue) {
        
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