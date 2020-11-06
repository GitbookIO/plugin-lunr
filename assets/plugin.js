require([
  'gitbook',
  'jquery'
], function (gitbook, $) {
  function ElasticsearchEngine(config) {
    this.name = 'ElasticsearchEngine';
    this.config = config.elasticsearch
    this.timeout = null
  }

  ElasticsearchEngine.prototype.init = function () {
    return Promise.resolve()
  };

  ElasticsearchEngine.prototype.search = function (q, offset, length) {
    var headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
    if (this.config.apiKey) {
      headers["Authorization"] = "ApiKey " + this.config.apiKey
    }
    var maxResults = 20
    if (this.config.maxResults) {
      maxResults = this.config.maxResults
    }

    return $.Deferred(defer => {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        fetch(this.config.host + "/" + this.config.index + "/_search", {
          headers: headers,
          mode: "cors",
          method: "POST",
          body: JSON.stringify({
            "query": {
              "multi_match": {
                "fields": ["title", "keywords", "body"],
                "query": q,
                "operator": "and"
              },
            },
            "highlight": {
              "fields": {
                "body": {}
              }
            },
            "size": maxResults
          })
        })
        .then(response => {
          if (!response.ok) {
            console.error("Request failed: [" + response.status + "] " + response.statusText)
            defer.reject("[" + response.status + "] " + response.statusText)
            return Promise.reject("[" + response.status + "] " + response.statusText);
          }
          return Promise.resolve(response);
        })
        .then(response => response.json())
        .then(data => {
          return data.hits.hits.map(item => {
            var body = ""
            if (item.highlight != null) {
              item.highlight.body.forEach(b => {
                body += '<p>' + b + '</p>\n'
              })
            } else {
              body = item._source.body.substr(0, 100)
            }

            return {
              title: item._source.title,
              url: item._source.url,
              body: body
            };
          })
        })
        .then(results => {
          defer.resolve({
            query: q,
            results: results.slice(0, length),
            count: results.length
          })
        })
      }, 100);
    }).promise();
  };

  gitbook.events.bind('start', function (e, config) {
    var engine = gitbook.search.getEngine();
    if (!engine) {
      gitbook.search.setEngine(ElasticsearchEngine, config);
    }
  });
});
