require([
  'gitbook',
  'jquery'
], function (gitbook, $) {
  function ElasticsearchEngine(config) {
    this.name = 'ElasticsearchEngine';
    this.config = config.elasticsearch
  }

  ElasticsearchEngine.prototype.init = function () {
    return Promise.resolve()
  };

  ElasticsearchEngine.prototype.search = function (q, offset, length) {
    var query = {
      "bool": {
        "should": [
          {
            "bool": {
              "must": []
            }
          },
          {
            "bool": {
              "must": []
            }
          },
          {
            "bool": {
              "must": []
            }
          }
        ]
      }
    }
    q.split(' ').forEach(word => {
      word = word.trim()
      if (word === "") {
        return
      }
      query.bool.should[0].bool.must.push({
        "term": {
          "body": word,
        }
      })
      query.bool.should[1].bool.must.push({
        "term": {
          "keywords": word,
        }
      })
      query.bool.should[2].bool.must.push({
        "term": {
          "title": word,
        }
      })
    })
    var headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
    if (this.config.apiKey) {
      headers["Authorization"] = "ApiKey " + this.config.apiKey
    }

    return $.Deferred(defer => {
      fetch(this.config.host + "/" + this.config.index + "/_search", {
        headers: headers,
        mode: "cors",
        method: "POST",
        body: JSON.stringify({
          "query": query,
          "highlight": {
            "fields": {
              "body": {}
            }
          }
        })
      })
      .then(response => {
        if (!response.ok) {
          console.log("error")
          return
        }
        return response;
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
    }).promise();
  };

  gitbook.events.bind('start', function (e, config) {
    var engine = gitbook.search.getEngine();
    if (!engine) {
      gitbook.search.setEngine(ElasticsearchEngine, config);
    }
  });
});
