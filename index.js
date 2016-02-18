const fs = require('fs');

const frontmatter = require('frontmatter');
const md = require('marked');
const hbs = require('handlebars');
const _ = require('lodash');

const FILE_TEST = '../sq2/sass/modifiers/_text.scss';

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


function addBlock(block) {
	var catKey = _.camelCase(block.category),
		category = DocumentView[catKey]

	if ( !category ) {
		console.warn('creating category: ', block.category)
		DocumentView[catKey]  = {
			title: block.category,
			fileName: _.snakeCase(block.category),
			blocks: []
		}
	}

	category.blocks.append(block);

	console.log(DocumentView);
}

function getExampleHtml(exampleString) {
	return {
		html: "lol",
		code: "omg"
	}
}

function parseDocComment(comment) {
	var cleanComment = _.trim(comment.replace(/\/\*doc/, '').replace(/\*\//, ''));
		C = frontmatter(cleanComment);
		block = {};
	
	block["name"] = C.data.name;
	block["title"] = C.data.title;
	block["category"] = C.data.category || C.data.parent;
	block["description"] = C.content
	// TODO: extract html_example from C.content

	console.log(block);

	//addBlock(block);
}

// replace array with real file list
[FILE_TEST].forEach(function(file) {
	var content = fs.readFileSync(file, "utf8"),
		comments = content.match(/\/\*doc\n(.|\n)*?\n\*\//g);

		parseDocComment(comments[2]);
		//comments.forEach(parseDocComment);
});


