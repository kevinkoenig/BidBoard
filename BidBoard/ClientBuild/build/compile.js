"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var sassGlob = require("gulp-sass-glob");
var rewrite = require("gulp-rewrite-css");
var concat = require("gulp-concat");
var lazypipe = require("lazypipe");
var gulpif = require("gulp-if");
var uglify = require("gulp-uglify-es").default;
var cleancss = require("gulp-clean-css");
var sourcemaps = require("gulp-sourcemaps");
var path = require("path");
var autoprefixer = require("gulp-autoprefixer");
var build = require("./build");
var args = Object.assign({
    "prod": false
});

if (args["prod"] !== false) {
    build.config.debug = false;
    build.config.compile.jsUglify = true;
    build.config.compile.cssMinify = true;
}

module.exports = {
    config: Object.assign({}, {
        debug: true,
        compile: {
            jsUglify: false,
            cssMinify: false,
            jsSourcemaps: true,
            cssSourcemaps: true,
            autoprefixer: true,
            seedOnly: false
        },
        "path": {
            "src": "./src",
            "node_modules": "./node_modules"
        },
        "dist": {
            "theme": {
                "path": "./dist"
            }
        }
    }, build.config),
    objectBuildTree: function (array, funcname, userdata) {
        if (!array || typeof array !== "object") {
            return false;
        }
        if (typeof funcname !== "function") {
            return false;
        }
        for (var key in array) {
            if (Object.prototype.toString.call(array[key]) === "[object Object]") {
                var funcArgs = [array[key], funcname];
                if (arguments.length > 2) {
                    funcArgs.push(userdata);
                }
                if (module.exports.objectBuildTree.apply(null, funcArgs) === false) {
                    return false;
                }
            }
            try {
                if (arguments.length > 2) {
                    funcname(array[key], key, userdata);
                } else {
                    funcname(array[key], key);
                }
            } catch (e) {
                console.log(e);
                return false;
            }
        }
        return true;
    },
    jsOutput: function () {
        var config = this.config.compile;
        return lazypipe()
            .pipe(function () {
                return gulpif(config.jsSourcemaps, sourcemaps.init({
                    loadMaps: true,
                    debug: config.debug
                }));
            })
            .pipe(function () {
                return gulpif(config.jsUglify, uglify());
            })
            .pipe(function () {
                return gulpif(config.jsSourcemaps, sourcemaps.write("./"));
            });
    },
    cssOutput: function () {
        var config = this.config.compile;
        return lazypipe()
            .pipe(function () {
		        return gulpif(config.cssSourcemaps, sourcemaps.init({loadMaps: true, debug: config.debug}));
	        })
            .pipe(function () {
                return gulpif(config.cssMinify, cleancss({
                    debug: config.debug
                }));
            })
            .pipe(function () {
                return gulpif(config.autoprefixer, autoprefixer());
            })
            .pipe(function () {
                return gulpif(config.cssSourcemaps, sourcemaps.write("./"));
            });
    },
    outputStream: function (path, outputFile) {
        if (typeof outputFile === "undefined") outputFile = "";
        var piping = lazypipe();
        var outputPaths = [];
        var regex = new RegExp(/\{\$.*?\}/);
        var matched = path.match(regex);
        if (matched) {
            for (var app in build.config.dist) {
                if (!build.config.dist.hasOwnProperty(app)) continue;
                var output = build.config.dist[app].path;
                outputPaths.push(path.replace(matched[0], output).replace(outputFile, ""));
            }
        }
        outputPaths.forEach(function (output) {
            (function (_output) {
                piping = piping.pipe(function () {
                    return gulp.dest(_output);
                });
            })(output);
        });
        return piping;
    },
    streamPath: function (path) {
        var regex = new RegExp(/\{\$(.*?)\}/);
        var dot = function (obj, i) {
            return obj[i];
        };
        var matched = path.match(regex);
        if (matched) {
            var realpath = matched[1].split(".").reduce(dot, build);
            path = path.replace(matched[0], realpath);
            return path;
        }
        return path;
    },
    streamPaths: function (paths) {
        paths.forEach(function (path, i) {
            paths[i] = module.exports.streamPath(path);
        });
    },
    cssRewritePaths: function (folder) {
        var imgRegex = new RegExp(/\.(gif|jpg|jpeg|tiff|png|ico)$/i);
        //var fontRegex = new RegExp(/\.(otf|eot|svg|ttf|woff|woff2)$/i);
        var config = this.config;
        return lazypipe().pipe(function () {
            // rewrite css relative path
            return rewrite({
                destination: folder,
                debug: config.debug,
                adaptPath: function (ctx) {
                    var isCss = ctx.sourceFile.match(/\.[css]+$/i);
                    // process css only
                    if (isCss[0] === ".css") {
                        var pieces = ctx.sourceDir.split("\\");
                        var vendor = pieces[pieces.indexOf("node_modules") + 1];
                        if (pieces.indexOf("node_modules") === -1) {
                            vendor = pieces[pieces.indexOf("vendors") + 1];
                        }
                        var file = module.exports.baseName(ctx.targetFile);
                        var extension = "webfonts/";
                        if (imgRegex.test(file)) {
                            extension = "img/";
                        }
                        return path.join(extension, file);
                    }
                }
            });
        });
    },
    baseName: function (path) {
        var maybeFile = path.split("/").pop();
        if (maybeFile.indexOf(".") !== -1) {
            return maybeFile;
        }
        return "";
    },
    bundle: function (bundle) {
        var _self = this;
        var tasks = [];
        if (typeof bundle.src !== "undefined" && typeof bundle.bundle !== "undefined") {
            // images and fonts for vendor
            if ("required" in bundle.src && "optional" in bundle.src) {
                var vendors = {};
                for (var key in bundle.src) {
                    if (!bundle.src.hasOwnProperty(key)) continue;
                    vendors = Object.assign(vendors, bundle.src[key]);
                }
                for (var vendor in vendors) {
                    if (!vendors.hasOwnProperty(vendor)) continue;
                    var vendorObj = vendors[vendor];
                    for (var type in vendorObj) {
                        if (!vendorObj.hasOwnProperty(type)) continue;
                        _self.streamPaths(vendorObj[type]);
                        switch (type) {
                            case "fonts":
                                gulp.src(vendorObj[type])
                                    .pipe(_self.outputStream(bundle.bundle.fonts)());
                                break;
                            case "images":
                                gulp.src(vendorObj[type])
                                    .pipe(_self.outputStream(bundle.bundle.images)());
                                break;
                            case "json":
                                gulp.src(vendorObj[type])
                                    .pipe(_self.outputStream(bundle.bundle.json)());
                                break;
                            case "media":
                                gulp.src(vendorObj[type])
                                    .pipe(_self.outputStream(bundle.bundle.media)());
                                break;
                        }
                    }
                }
            }
            if (!("styles" in bundle.src) && !("scripts" in bundle.src)) {
                var src = {
                    styles: [],
                    scripts: []
                };
                _self.objectBuildTree(bundle.src, function (paths, type) {
                    switch (type) {
                        case "styles":
                        case "scripts":
                            src[type] = src[type].concat(paths);
                            break;
                    }
                });
                bundle.src = src;
            }
            for (var type in bundle.src) {
                if (!bundle.src.hasOwnProperty(type)) continue;
                if (Object.prototype.toString.call(bundle.src[type]) !== "[object Array]") continue;
                if (typeof bundle.bundle[type] === "undefined") continue;
                _self.streamPaths(bundle.src[type]);
                var outputFile = _self.baseName(bundle.bundle[type]);
                switch (type) {
                    case "styles":
                        gulp.src(bundle.src[type])
                        //							.pipe(_self.cssRewritePaths(bundle.bundle[type])())
                            .pipe(concat(outputFile))
                            .pipe(sourcemaps.init())
                            .pipe(sassGlob())
                            .pipe(sass({
                                errLogToConsole: true
                            }).on("error", sass.logError))
                            .pipe(_self.cssOutput()())
                            .pipe(_self.outputStream(bundle.bundle[type], outputFile)());
                        break;
                    case "scripts":
                        return gulp.src(bundle.src[type])
                            .pipe(concat(outputFile))
                            .pipe(_self.jsOutput()())
                            .pipe(_self.outputStream(bundle.bundle[type], outputFile)());
                    default:
                        break;
                }
            }
        }
        return tasks;
    },
    output: function (bundle) {
        var _self = this;
        if (typeof bundle.src !== "undefined" && typeof bundle.output !== "undefined") {
            for (var type in bundle.src) {
                if (!bundle.src.hasOwnProperty(type)) continue;
                _self.streamPaths(bundle.src[type]);
                switch (type) {
                    case "styles":
                        gulp.src(bundle.src[type])
                            .pipe(sassGlob())
                            .pipe(sass({
                                errLogToConsole: true
                            }).on("error", sass.logError))
                            .pipe(_self.outputStream(bundle.output[type])());
                        break;
                    default:
                        gulp.src(bundle.src[type])
                            .pipe(_self.outputStream(bundle.output[type])());
                        break;
                }
            }
        }
    },
};