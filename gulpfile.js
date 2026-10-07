////////////////////////////////
// Setup
////////////////////////////////

// Gulp and package
const {src, dest, parallel, series, watch} = require('gulp');
const pjson = require('./package.json');

// Plugins
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const tildeImporter = require('node-sass-tilde-importer');
const cssnano = require('cssnano');
const imagemin = require('gulp-imagemin');
const pixrem = require('pixrem');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const reload = browserSync.reload;
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
const spawn = require('child_process').spawn;
const uglify = require('gulp-uglify-es').default;
const tailwindcss = require('tailwindcss');

// Relative paths function
function pathsConfig(appName) {
    this.app = `./${pjson.name}`;
    const vendorsRoot = 'node_modules';

    return {
        vendorsJs: [
            `${vendorsRoot}/preline/dist/preline.js`,
            `${vendorsRoot}/lucide/dist/umd/lucide.min.js`,
            `${vendorsRoot}/gumshoejs/dist/gumshoe.polyfills.min.js`,
            `${vendorsRoot}/swiper/swiper-bundle.min.js`,
            `${vendorsRoot}/jarallax/dist/jarallax.min.js`,
        ],
        vendorsCSS: [
            `${vendorsRoot}/swiper/swiper-bundle.min.css`,
            `${vendorsRoot}/jarallax/dist/jarallax.min.css`,
        ],
        app: this.app,
        templates: `${this.app}/templates`,
        css: `${this.app}/static/css`,
        scss: `${this.app}/static/scss`,
        fonts: `${this.app}/static/fonts`,
        images: `${this.app}/static/images`,
        js: `${this.app}/static/js`,
        tailwindConfig: './tailwind.config.js',
    };
}

const paths = pathsConfig();

////////////////////////////////
// Tasks
////////////////////////////////
const processCss = [
    autoprefixer(), // adds vendor prefixes
    pixrem(), // add fallbacks for rem units
];

const minifyCss = [
    cssnano({preset: 'default'}), // minify result
];

// Styles autoprefixing and minification
function styles() {

    return src([`${paths.scss}/style.scss`, `${paths.scss}/icons.scss`])
        .pipe(
            sass({
                importer: tildeImporter,
                includePaths: [paths.scss],
            }).on('error', sass.logError),
        )
        .pipe(plumber()) // Checks for errors
        .pipe(postcss([tailwindcss(paths.tailwindConfig), autoprefixer()]))
        .pipe(dest(paths.css))
        .pipe(rename({suffix: '.min'}))
        .pipe(postcss(minifyCss)) // Minifies the result
        .pipe(dest(paths.css));
}

// Javascript minification
function scripts() {
    return src([`${paths.js}/app.js`, `${paths.js}/swiper.js`])
        .pipe(plumber()) // Checks for errors
        .pipe(uglify()) // Minifies the js
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(paths.js));
}

// Vendor Javascript minification
function vendorScripts() {
    return src(paths.vendorsJs, {sourcemaps: true})
        .pipe(concat('vendors.js'))
        .pipe(dest(paths.js))
        .pipe(plumber()) // Checks for errors
        .pipe(uglify()) // Minifies the js
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(paths.js, {sourcemaps: '.'}));
}

// Vendor CSS minification
function vendorStyles() {
    return src(paths.vendorsCSS, {sourcemaps: true})
        .pipe(concat('vendors.css'))
        .pipe(plumber()) // Checks for errors
        .pipe(postcss(processCss))
        .pipe(dest(paths.css))
        .pipe(rename({suffix: '.min'}))
        .pipe(postcss(minifyCss)) // Minifies the result
        .pipe(dest(paths.css));
}

// Image compression
function imgCompression() {
    return src(`${paths.images}/*`)
        .pipe(imagemin()) // Compresses PNG, JPEG, GIF and SVG images
        .pipe(dest(paths.images));
}

// Watch
function watchPaths() {
    watch(`${paths.scss}/**/*.scss`, styles);
    watch(`${paths.templates}/**/*.html`).on('change', reload);
    watch([`${paths.js}/**/*.js`, `!${paths.js}/**/*.min.js`], scripts).on(
        'change',
        reload,
    );
}

// Generate all assets
const generateAssets = parallel(styles, scripts, vendorScripts, vendorStyles, imgCompression);

// Set up dev environment
const dev = parallel(watchPaths);

exports.default = series(generateAssets, dev);
exports['generate-assets'] = generateAssets;
exports['dev'] = dev;
exports.styles = styles;
