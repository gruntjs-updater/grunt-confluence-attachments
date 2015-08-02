# grunt-confluence-attachments

> Grunt plugin to upload attachments to confluence pages

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-confluence-attachments --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-confluence-attachments');
```

## The "confluence_attachments" task

### Overview
In your project's Gruntfile, add a section named `confluence_attachments` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  confluence_attachments: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.baseUrl
Type: `String`

Required
The base url of the confluence server (e.g. 'https://myserver.com')

#### options.pageId
Type: `String`

Required
Upload destination: the id of a confluence page.


### Usage Examples

#### Upload
Attach all files in a folder to the confluence page which id is 12345

```js
grunt.initConfig({
  confluence_attachments: {
    options: {
      baseUrl: 'https://myserver.com',
      pageId: '12345'
    },
    src: 'path/to/folder/*',
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
