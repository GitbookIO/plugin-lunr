# honkit-plugin-elasticsearch

This plugin provides a backend for the [search](https://github.com/GitbookIO/plugin-search) plugin.

## Usage

Gitbook comes with default search option.
In order to use this plugin, need to disable `lunr` plugins and add `elasticsearch` as bellow:

```
"plugins": [
    "-lunr",
    "elasticsearch"
  ]
```
add the following plugin configurations in book.json

```
{
   "pluginsConfig": {
     "elasticsearch": {
       "host" : "http://your-elasticsearch:9200",
       "index" : "your-index",
       "apiKey" : "your-apikey",
       "maxResult" : 30,
     }
   }
}
```

Building your gitbook will generate a search index file in `_book` directory.
Insert the index file into your elasticsearch.

```
curl -XPOST "http://your-elasticsearch:9200/your-index/_bulk" -H 'Content-Type: application/json' --data-binary @_book/search_index.json
```

### Adding keywords to a page

You can specify explicit keywords for any page. When searching for these keywords, the page will rank higher in the results.

```md
---
search:
    keywords: ['keyword1', 'keyword2', 'etc.']

---

# My Page

This page will rank better if we search for 'keyword1'.
```

### Disabling indexing of a page

You can disable the indexing of a specific page by adding a YAML header to the page:

```md
---
search: false
---

# My Page

This page is not indexed in Elasticsearch.
```

