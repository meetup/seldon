const fs = require('fs');

const frontmatter = require('frontmatter');
const marked = require('marked');
const hbs = require('handlebars');
const _ = require('lodash');
const escapeHtml = require('html-escape');

const FILE_TEST = '../sq2/sass/ui-components/_tabs.scss';

const TEMPL_EXAMPLE = fs.readFileSync('templates/example.hbs', "utf8");

marked.setOptions({
	gfm: true,
	highlight: false,
	tables: true
})


var DocumentView = {};


function addBlock(block) {
	var catKey = _.camelCase(block.category);

	if ( !DocumentView[catKey] ) {
		DocumentView[catKey]  = {
			title: block.category,
			fileName: _.snakeCase(block.category) + '.html',
			blocks: []
		}
	}

	DocumentView[catKey].blocks.push(block);
}

// returns a new component description string
// with `html_example` code blocks replaced
// inline with rendered/escaped output
function renderHtmlExamples(blockDescription) {
	return new String(
		blockDescription.replace(/```html_example\n(.|\n)*?\n```/g, function(match) {
			var example = _.trim(match.replace(/html_example/, '').replace(/```/, '')),
				template = hbs.compile(TEMPL_EXAMPLE);

			return template({
				html: example,
				escapedHtml: escapeHtml(example)
			});
		})
	);
}

function parseDocComment(comment) {
	var cleanComment = _.trim(comment.replace(/\/\*doc/, '').replace(/\*\//, ''));
		C = frontmatter(cleanComment),
		block = {};

	if ( !C.data ) {
		return;
	}
	
	block["name"] = C.data.name;
	block["title"] = C.data.title;
	block["category"] = C.data.category;
	block["description"] = marked( renderHtmlExamples(C.content) );

	addBlock(block);
}

// replace array with real file list
[FILE_TEST].forEach(function(file) {
	var content = fs.readFileSync(file, "utf8"),
		comments = content.match(/\/\*doc\n(.|\n)*?\n\*\//g);

		comments.forEach(parseDocComment);
		console.dir(DocumentView['uiComponents'].blocks);
});
