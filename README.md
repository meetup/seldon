# seldon
Nodejs CSS documentation generator inspired by [hologram](http://trulia.github.io/hologram/).

**This is a work in progress.** This project currently works as a simple node script, but don't expect _unicorns and rainbows_ (yet).

## 1. Use structured comments in your CSS

<pre><code>/*doc
---
title: My Component Title
name: myUniqueComponentName
category: My Category Name
---

**Any** _markdown_ you want can go here.
Github-flavored markdown supported.

```html_example
&lt;p&gt;This is a special fenced code block that does neat things:&lt;p&gt;
&lt;ol&gt;
	&lt;li&gt;Put example code here&lt;li&gt;
	&lt;li&gt;It will be rendered directly to static documentation&lt;li&gt;
	&lt;li&gt;Escaped html will appear under the example&lt;li&gt;
&lt;ol&gt;
```
*/</code></pre>

## 2. Create a Seldon config file

#### config.json
```json
{
   "source": "../sq2/sass/",
   "destination": "build/",
   "templates": {
      "layout": "templates/layout.hbs",
      "example": "templates/example.hbs"
   }
}
```

#### Running Seldon

```sh
$ npm install seldon --save-dev
```

##### Use as a node module

```js
const Seldon = require('seldon');

Seldon.compile('./config.json');
```

##### Use from the command line

```sh
$ node seldon.js /path/to/config/config.json
```


## 3. Seldon creates a view for handlebars

```js
{
	myCategoryName: {
		title: "Category Title",
		blocks: [ //components filed under this category
			{
				title: "My Component Title",
				name: "myUniqueComponentName",
				description: "(html string compiled from markdown, including html_example blocks)"
			}
		]
	}
}
```

## 4. Go forth and template
You can write your own handlebars template to use with the data provided by `seldon`.

-----------------------------------------------

#### Seldon?
This project is named after [Hari Seldon](https://en.wikipedia.org/wiki/Hari_Seldon), a
fictional character in Isaac Asimov's [Foundation](https://en.wikipedia.org/wiki/Foundation_series).

In the series, Seldon is a pivotal figure who appears only in _hologram_ form.

Special thanks to the good folks at Trulia who wrote [hologram](http://trulia.github.io/hologram/), the tool that inspired this project.
