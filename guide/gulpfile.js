//Creado por Santiago Barcehtta y Hernan Mammana; continuado por Alexis De los Santos (tareas "includeComponents", "loremInfo", "compile")

var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var fs = require('fs');
var components = require('ui-mails_components');
var _ = require('lodash');

var src = {
  'base' : 'src/',
  'styles' : ['src/styles', components.styles],
  'images' : ['src/images', components.images],
  'html': 'src/html',
  'content': 'src/content',
  'components': ['src/components',components.base, components.atoms,components.banners, components.otros]
}
var build = {
    'base' : 'build',
    'styles' : 'build/styles',
    'images' : 'build/images',
    'scripts': 'build/scripts',
    'compiled': 'build/templates/compiled',
    'rsys': 'build/templates/compiled/rsys',
    'html': 'build/html'
}

var dist = {
    'base' : 'dist'
}

gulp.task('compileHb', function () {
  // Hacer variable el archivo de datos
  // Acá en lugar de leer un archivo se puede hacer una llamada a una api con algun módulo externo
  var templateData = JSON.parse(fs.readFileSync(src.content + '/content.json')),
	options = {
		ignorePartials: true, //ignores the unknown footer2 partial in the handlebars template, defaults to false
    batch : src.components,
    compile : {
      'noEscape': true
    },
		// partials : {
		// 	footer : '<footer>{{{banner_mobile_title}}}</footer>'
		// },
		helpers : {
			attrs : function(context, options){
        var attrs = _.keys(options.hash).map(function(key) {
          return key + '="' + options.hash[key] + '"';
        }).join(" ");

        console.log(attrs);

        return attrs;
			}
		}
	}

  try {
    return gulp.src(src.html + '/**/*.html')
  		.pipe($.compileHandlebars(templateData, options))
  		.pipe(gulp.dest(build.html));
  } catch (e) {
    console.log("funciona!", e.toString());
  }

});

gulp.task('serve', ['build'], function() {

    browserSync.init({
        server: build.base + "/html"
    });

    Object.keys(src.styles).forEach(function (item) {
        gulp.watch(item + '/**/*.scss', ['scssBuild']).on('change', reload);
    })

    gulp.watch(src.base + '/components/**/*.handlebars', ['build']).on('change', reload);

    Object.keys(src.components).forEach(function (item) {
      gulp.watch(item + '/**/*.handlebars', ['build']).on('change', reload);
    })

    gulp.watch(src.content + '/**/*.json', ['compile']).on('change', reload);
    gulp.watch(src.html + '/**/*.html', ['build']).on('change', reload);
});


gulp.task('serve:dist', ['build','dist'], function() {

    browserSync.init({
        server: dist.base
    });

    Object.keys(src.styles).forEach(function (item) {
        gulp.watch(item + '/**/*.scss', ['scssBuild', 'dist']).on('change', reload);
    })

    gulp.watch(src.base + '/components/**/*.handlebars', ['build']).on('change', reload);
    Object.keys(src.components).forEach(function (item) {
      gulp.watch(item + '/**/*.handlebars', ['dist']).on('change', reload);
    })

    gulp.watch(src.content + '/**/*.json', ['compile']).on('change', reload);
    gulp.watch(src.html + '/**/*.html', ['dist']).on('change', reload);
});

// Compile scss into CSS & auto-inject into browsers
gulp.task('scssBuild', function() {
    Object.keys(src.styles).forEach(function(item) {
        console.log(item, src.styles[item]);
        return gulp.src(src.styles[item] + '/**/*')
            .pipe($.sass({
              onError: console.error.bind(console, 'Sass error:')
            }))
            .pipe($.sourcemaps.write('maps'))
            .pipe(gulp.dest(build.styles))
            .pipe(browserSync.stream());
    });
});

// Optimiza y copia las imagenes a ./build/images
gulp.task('imageBuild', function() {
  return gulp.src(src.base + '/images/**/**.*')
         .pipe(gulp.dest(build.images))
});

// Inline CSS
gulp.task('inlineDist', function() {

    return gulp.src(build.html + '/*.html')
        .pipe($.inlineCss({
            preserveMediaQueries: true,
            applyStyleTags: true,
            applyLinkTags: true,
            removeStyleTags: false,
            removeLinkTags: false
        }))
        .pipe($.replace('../images/',''))
        .pipe(gulp.dest(dist.base));
});

gulp.task('prebuild', function () {

})

gulp.task('build', function () {
  runSequence(
    'scssBuild', 'imageBuild', 'compileHb'
  )
})

gulp.task('dist',['build'], function () {
  runSequence(
    'inlineDist'
  )
  // aca
  //  - subir imágenes a swift
  //  - reemplazar paths por urls
  //  - generar una versión minificada
})
