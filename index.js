const fs = require('fs');
const readline = require('readline');

const toml = require('toml-js');
const md = require('marked');
const hbs = require('handlebars');
const _ = require('lodash');

const FILE_TEST = '../sq2/sass/modifiers/_size.scss';

const tokens = {
	commentStart: '/*doc',
	commentEnd: '*/',
	tomlFence: '---',
	exampleStart: '```html_example',
	exampleEnd: '```'
}

const RE_TOML = new RegExp(tokens.tomlFence+"\n(.|\n)*?\n"+tokens.tomlFence, g);
const RE_EXAMPLE = new RegExp(tokens.exampleStart+"\n(.|\n)*?\n"+tokens.exampleEnd, g);


var DocumentView = {
	catName: {
		title: "Category Title",
		fileName: null,
		blocks: [
			{
				name: "blockName",
				title: "Block Title",
				category: "Category Title",
				description: "html string from markdown",
				example: {
					html: "html string",
					code: "escaped html"
				}
			}
		]
	}
};

function getExampleHtml(exampleString) {
	return {
		html: "lol",
		code: "omg"
	}
}

function addBlock(block) {
	var catKey = _.camelCase(block.category),
		category = DocumentView[catKey]

	if ( !category ) {
		category = {
			title: block.category,
			fileName: _.snakeCase(block.category)
			blocks: []
		}
	}

	category.blocks.append(block);

	console.log(DocumentView);
}

function parseDocComment(commentChunk) {
	var block = {},
		toml = RE_TOML.match(commentChunk)[0],
		example = RE_EXAMPLE.match(commentChunk)[0],
		markdown = commentChunk
				.replace(toml, '')
				.replace(tokens.exampleStart, '')
				.replace(tokens.exampleEnd, '')
				.replace(tokens.commentStart, '')
				.replace(tokens.commentEnd);

	_.merge(block, toml.parse(toml));

	block["example"] = getExampleHtml(example);
	block["description"] = marked(markdown);

	addBlock(block);
}

// replace array with real file list
[FILE_TEST].forEach(function(file) {

	readline.createInterface({
		terminal: false,
		input: fs.createReadStream(file)
	}).on('line', function(line) {

		if (_.startsWith(tokens.commentStart)) {
			// start the chunk
		}
		if (_.startsWith(tokens.commentEnd)) {
			// end the chunk
			// parseDocComment(chunk);
		}
		console.log(file + ' line:', line);
	});

});


