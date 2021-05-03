let project_folder = require("path").basename(__dirname); // Конечная папка выгрузки проекта. Финальные файлы проекта //
let source_folder = "#src";	// Папка с исходными файлами. Черновые файлы проекта //

let fs = require('fs');

// Указываем пути исходных и конечных папок //

let path = {
	build:{
		html: project_folder + "/",	// Конечная папка html //
		css: project_folder + "/css/",	// Конечная папка css //
		js: project_folder + "/js/",	// Конечная папка js //
		img: project_folder + "/img/",	// Конечная папка img //
		fonts: project_folder + "/fonts/",	// Конечная папка fonts //
	},
	src: {
		html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],	// Исходная папка html //
		css: source_folder + "/scss/style.scss",	// Исходная папка css //
		js: source_folder + "/js/script.js",	// Исходная папка js //
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",	// Исходная папка img //
		fonts: source_folder + "/fonts/*.ttf",	// Исходная папка Fonts //
	},
	watch: {
		html: source_folder + "/**/*.html",	// "Прослушка файла html" //
		css: source_folder + "/scss/**/*.scss",	// "Прослушка файла css" //
		js: source_folder + "/js/**/*.js",	// "Прослушка файла js" //
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"	// "Прослушка файла img" //
	},
	clean: "./" + project_folder + "/"	// Удаление папки dist каждый раз, когда запускаем Gulp //
}

// Обьявляем переменные //

let { src, dest } = require('gulp'),
	gulp = require('gulp'),	// Gulp //
	browsersync = require("browser-sync").create(),	// Обновление страницы браузера //
	fileinclude = require("gulp-file-include"),	// Сборка html-файлов в один //
	del = require("del"),
	scss = require("gulp-sass"),
	autoprefixer = require("gulp-autoprefixer"),	// Установка автопрефиксов //
	group_media = require("gulp-group-css-media-queries"),	// Группируем медиа-запросы в конец файла //
	clean_css = require("gulp-clean-css"),
	rename = require("gulp-rename"),
	uglify = require("gulp-uglify-es").default,
	imagemin = require("gulp-imagemin"),	// Оптимизация картинок //
	webp = require("gulp-webp"),
	webphtml = require("gulp-webp-html"),
	webpcss = require("gulp-webp-css"),
	ttf2woff = require("gulp-ttf2woff"),	// Конвертация шрифтов ttf в woff //
	ttf2woff2 = require("gulp-ttf2woff2"),	// Конвертация шрифтов ttf в woff2 //
	fonter = require("gulp-fonter");	// Подключение шрифтов //

function browserSync(params) {
	browsersync.init({
		server: {
			baseDir: "./" + project_folder + "/"
		},
		port: 3000,
		notify: false
	});
}

function html() {
return src(path.src.html)
		.pipe(fileinclude())
		.pipe(webphtml())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function css() {
	return src(path.src.css)
		.pipe(
			scss({
				outputStyle: "expanded"
			})
		)
		.pipe(
			group_media()
		)
		.pipe(
			autoprefixer({
				overrideBrowserlist: ["last 5 versions"],
				cascade: true
			})
		)
		.pipe(
			webpcss({
				webpClass: '.webp',
				noWebpClass: '.no-webp'
			})
		)
		.pipe(dest(path.build.css))
		.pipe(clean_css())
		.pipe(
			rename({
				extname: ".min.css"
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

function js() {
	return src(path.src.js)
			.pipe(fileinclude())
			.pipe(dest(path.build.js))
			.pipe(
				uglify()
			)
			.pipe(
				rename({
					extname: ".min.js"
				})
			)
			.pipe(dest(path.build.js))
			.pipe(browsersync.stream());
	}

function images() {
	return src(path.src.img)
		.pipe(
			webp({
				quality: 70
			})
		)
		.pipe(dest(path.build.img))
		.pipe(src(path.src.img))
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3 //0 to 7
			})
		)
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream());
	}

function fonts() {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts))
	return 	src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', function() {
	return src([source_folder + '/fonts/*.otf'])
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(dest(source_folder + '/fonts/'));
});

function fontStyle (params) {
	let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

function cb() {

}

function watchFiles(params) {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

function clean(params) {
	return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontStyle);
let watch = gulp.parallel(watchFiles, build, browserSync);

exports.fontStyle = fontStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
