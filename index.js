var amdclean = require("amdclean");
var applySourceMap = require("vinyl-sourcemaps-apply");
var chalk = require("chalk");
var log = require("fancy-log");
var merge = require("deepmerge");
var through = require("through2");

var PLUGIN_NAME = "gulp-amdclean";

var defaultOptions = {
	escodegen: {},
	esprima: {}
};

module.exports = function(options)
{
	
	var optionsGenerator = null;
	if (typeof options === "function")
	{
		// Gulp plugins typically allow a user to provide a function which generates
		// options based on the provided file; do so as well.
		optionsGenerator = options;
	}
	else
	{
		// Also support simply passing a "plain" object for the options, in case
		// dynamic settings aren't required.
		optionsGenerator = function()
		{
			return options || {};
		}
	}
	
	return through.obj(function(file, encoding, next)
	{
		
		// Nothing to be done for a non-existant file.
		if (file.isNull())
		{
			return next(null, file);
		}
		
		// The plugin provides the entire content of a file to a function which
		// processes it. Streams aren't ideal for this. Gulp also discourages 
		// turning the stream into a buffer, so create an error instead.
		if (file.isStream())
		{
			return next(new Error("Streams are not supported.", PLUGIN_NAME));
		}
		
		log(PLUGIN_NAME, chalk.magenta(file.path));
		
		// Mix any default options with the ones provided by the user of the plugin.
		// Copy the options to make it less likely for side effects to occur.
		// NOTE: The generated options object should not be null.
		var options = merge(defaultOptions, optionsGenerator(file));
		
		// AMDClean works by either providing a the contents of a file in the "code"
		// options, or by giving the name to the file with "filePath". The content
		// is provided already, without the need to save intermediate files, so the
		// "code" option is chosen.
		options.code = String(file.contents);
		
		// Typical check when using "gulp-sourcemaps".
		if (file.sourceMap)
		{
			// TODO: Warn users about options that are about to be changed.
			if (options.wrap){ log.warn(chalk.yellow(PLUGIN_NAME), "Option \"wrap\" should be used when generating source maps."); }
			
			
			// Provide the sourcemap that has already been generated.
			options.sourceMap = file.sourceMap;
			// AMDClean's documentation indicates that wrap should be disabled when
			// generating source maps.
			options.wrap = false;
			// Escodegen (used by amdclean), does not generate sourcemaps, unless
			// certain options are set.
			options.escodegen = merge(options.escodegen, {
				// Needs to be set for the sourcemap to be generated. Setting it to a
				// string would cause issues where the file could not be found.
				sourceMap: true,
				// Generate the source map separate from the source code, rather than
				// including it in the generated source file.
				sourceMapWithCode: true
			});
		}
		
		try
		{
			// For some reason the output from "amdclean.clean" changes from a single
			// string, to an object with a "code" and "sourceMap" property. These
			// cases need to be handled separatly.
			if (options.sourceMap)
			{
				// TODO: Solve issues with generating source maps as first plugin.
				// Some issues occur when this is the first plugin to generate a
				// sourcemap, but functions otherwise.
				
				var result = amdclean.clean(options);
				
				// Override the content of the file with the newly generated code; 
				// using the plugin would be useless otherwise.
				file.contents = Buffer.from(result.code);
				
				// In the context of "gulp-sourcemaps", it is assumed that a source map
				// is output as well.
				var map = JSON.parse(result.map.toString());
				map.file = file.path;
				applySourceMap(file, map);
			} 
			else 
			{
				file.contents = Buffer.from(amdclean.clean(options));
			}
		}
		catch (error)
		{
			log.error(PLUGIN_NAME, error, options.esprima);
			// Continuing with wrong output isn't too good an idea.
			return next(error);
		}
		
		// Indicate the file has been successfully generated.
		return next(null, file);
	});
};
