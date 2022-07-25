var fs = require('fs');
var path = require('path');
var lunr = require('lunr');
var Entities = require('html-entities').AllHtmlEntities;

var Html = new Entities();

// Called with the `this` context provided by Gitbook
function getSearchIndex(context) {
    // Create search index
    var ignoreSpecialCharacters = context.config.get('pluginsConfig.lunr.ignoreSpecialCharacters') || context.config.get('lunr.ignoreSpecialCharacters');
    return lunr(function () {
        this.ref('url');

        this.field('title', { boost: 10 });
        this.field('keywords', { boost: 15 });
        this.field('body');

        if (!ignoreSpecialCharacters) {
            // Don't trim non words characters (to allow search such as "C++")
            this.pipeline.remove(lunr.trimmer);
        }
    });
}

// Map of Lunr ref to document
var searchIndexEnabled = true;
var indexSize = 0;

module.exports = {
    book: {
        assets: './assets',
        js: [
            'lunr.min.js', 'search-lunr.js'
        ]
    },

    hooks: {
        // Index each page
        'page': function(page) {
            if (this.output.name != 'website' || !searchIndexEnabled || page.search === false) {
                return page;
            }

            var text, maxIndexSize;
            maxIndexSize = this.config.get('pluginsConfig.lunr.maxIndexSize') || this.config.get('lunr.maxIndexSize');

            this.log.debug.ln('index page', page.path);

            text = page.content;
            // Decode HTML
            text = Html.decode(text);
            // Strip HTML tags
            text = text.replace(/(<([^>]+)>)/ig, '');

            indexSize = indexSize + text.length;
            if (indexSize > maxIndexSize) {
                this.log.warn.ln('search index is too big, indexing is now disabled');
                searchIndexEnabled = false;
                return page;
            }

            var keywords = [];
            if (page.search) {
                keywords = page.search.keywords || [];
            }

            // Add to index
            var doc = {
                url: this.output.toURL(page.path),
                title: page.title,
                summary: page.description,
                keywords: keywords.join(' '),
                body: text
            };

            var documentsStore = {};
            documentsStore[doc.url] = doc;

            var targetFile = path.resolve(this.output.root(), 'search_index.json');
            var targetJSON = JSON.parse(fs.existsSync(targetFile) ? fs.readFileSync(targetFile, { encoding: 'utf8' }) : '{"index":{},"store":{}}');

            var searchIndex = targetJSON.index.documentStore ?
                lunr.Index.load(targetJSON.index)
                : getSearchIndex(this);

            searchIndex.remove(doc);
            searchIndex.add(doc);

            this.output.writeFile('search_index.json', JSON.stringify({
                index: searchIndex,
                store: Object.assign(targetJSON.store, documentsStore)
            }));

            return page;
        }
    }
};

