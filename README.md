# [gulp](https://github.com/gulpjs/gulp)-[amdclean](https://github.com/gfranko/amdclean)
Use AMDClean as a gulp task. 

## Install
```sh
npm install git+https://git@github.com/MatthijsMud/grunt-amdclean.git --save-dev
```

## Usage
This plugin strips AMD definitions from the provided file(s). It is assumed that all modules in the file have a name associated with them. The [optimizer of Require.js](https://github.com/requirejs/r.js) takes care of this, so it is adviced to run a task before this one that takes care of it. [gulp-requirejs-optimize]() is a plugin for gulp that can do that.

AMDClean's [documentation](https://github.com/gfranko/amdclean#faq) indicates that minified code is likely to cause issues. Hence the optimization step of requirejs should be skipped. It should instead be run after this task. This also allows for mangling the generated names, possibly making the output even smaller.
> Make sure you are not pointing to minified files when building with AMDclean. This will definitely cause issues.

```js
var gulp = require("gulp");
var requirejsOptimize = require("gulp-requirejs-optimize");
var amdclean = require("gulp-amdclean");
var uglify = require("gulp-uglify");

gulp.task("default", function()
{
	return gulp.src("src/modules/*.js")
	.pipe(requirejsOptimize({ optimize: false }))
	.pipe(amdclean({}))
	.pipe(uglify())
	.pipe(gulp.dest("dist"));
});
```

The contents of the entire file are necessary for transforming it. As such it does not work with streams.

### Options
Most [options of amdclean](https://github.com/gfranko/amdclean#options) are supported by this gulp plugin. The options can either be provided as a plain object, or by a function which is invoked with the file which is being processed. In case of the latter, it is assumed that the function returns a plain object.

Exceptions include `filePath` and `code`; gulp already provides the content of the files that are to be processed.

### Source maps
When used in combination with [gulp-sourcemaps](https://github.com/gulp-sourcemaps/gulp-sourcemaps), this plugin takes care of setting specific options that are needed to generate the source maps. This might clash with some options that are somewhat likely to be set. 

According to AMDClean's documentation, the `wrap` option should not be used when generating source maps. For this reason, the value gets changed to `false`. If a wrapper is desired, use another plugin for that purpose instead.
> Do not use wrap together with escodegen.sourceMapWithCode since it breaks the logic.

Options for [esprima](https://github.com/jquery/esprima/) and [escodegen](https://github.com/estools/escodegen) are set for a similar reason. In this case the options `esprima.source`, `escodegen.sourceMap` and `escodegen.sourceMapWithCode` are affected. As two of those options are specifically used for generating source maps, this shouldn't come as a surprise.

### Known issues
- If `gulp-amdclean` does not get generated source maps from a previous step, but is instructed to generate them, it generates an error instead. This shouldn't be too big a problem, given it is intended to be used after various files have been concatenated by the optimizer of Require.js.
