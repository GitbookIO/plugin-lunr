var Entities = require('html-entities').AllHtmlEntities;

var Html = new Entities();

var documentsStore = [];

var searchIndexEnabled = true;

module.exports = {
  book: {
    assets: './assets',
    js: [
      'plugin.js'
    ]
  },

  hooks: {
    // Index each page
    'page': function (page) {
      if (this.output.name !== 'website' || !searchIndexEnabled || page.search === false) {
        return page;
      }
      this.log.debug.ln('index page', page.path);

      var text;
      text = page.content;
      // Decode HTML
      text = Html.decode(text);
      // Strip HTML tags
      text = text.replace(/(<([^>]+)>)/ig, '');

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
      documentsStore.push(doc);

      return page;
    },

    // Write index to disk
    'finish': function () {
      if (this.output.name !== 'website') return;

      this.log.debug.ln('write search index');
      var output = ''
      documentsStore.forEach(store => {
        output += '{ "index" : {} }\n'
        output += JSON.stringify(store) + '\n'
      })
      return this.output.writeFile('search_index.json', output)
    }
  }
};
