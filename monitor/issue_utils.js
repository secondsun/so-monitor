var J2M = require('j2m');

var IssueUtils = function (config) {

    this.formatQuestion = formatQuestion;
    this.createIssue = createIssue;
    this.issue_template = config.issue_template;

    /**
     * @param question : String the question body from stack overflow.
     * @returns the question in a JIRA compatible markdown. 
     */
    function formatQuestion(question) {
        var body = J2M.toJ(question);
        
        body = body.replace(/\[[\/]*p\]/g, '');
        body = body.replace(/\[[\/]*pre\]/g, '');
        body = body.replace(/\[\/*code\]/g, '{code}');
        body = body.replace(/\[a[^\]]* href="([^"]*)"[^\]]*\]([^\[]*)\[\/a\]/g, '[$2|$1]');
        return body;
    }

    function createIssue(stackexchangeItem) {
        
        var body = formatQuestion(stackexchangeItem.body);

        var issue = {
            "fields": {
                "project": {
                    "id": this.issue_template.project_id

                },
                "summary": stackexchangeItem.title,
                "description": "{quote}" + body + "{quote} \n\n" + stackexchangeItem.link,
                "issuetype": {
                    "name": "Task"
                },
                "priority": {
                    "name": "Minor"
                }
            }
        };
        return issue;
    }

}

var init = function (config) {
    return new IssueUtils(config)
}

module.exports = init;