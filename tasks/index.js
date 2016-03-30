import babelPlugin from 'rollup-plugin-babel';

import registerBuildTask from './builds';
import registerDataTask from './data';
import registerDataCollectTask from './data-collect';
import registerDataDedupeTask from './data-dedupe';
import registerDataDownloadTask from './data-download';
import registerDataMetaTask from './data-meta';
import registerDataPackTask from './data-pack';
import registerDataTestsTask from './data-tests';
import registerDataTestsLegacyTask from './data-tests-legacy';
import registerDataZicTask from './data-zic';
import registerDataZdumpTask from './data-zdump';

const nodeunit = {
	zones : [
		"tests/zones/**/*.js"
	],
	core : [
		"tests/moment-timezone/*.js"
	]
};

const build = {
	'moment-timezone-with-data'           : true,
	'moment-timezone-with-data-2010-2020' : [2010, 2020]
};

const uglify = {
	all: {
		files: {
			'builds/moment-timezone.min.js'              : 'builds/moment-timezone.js',
			'builds/moment-timezone-utils.min.js'        : 'builds/moment-timezone-utils.js',
			'builds/moment-timezone-all-years.min.js'    : 'builds/moment-timezone-all-years.js',
			'builds/moment-timezone-without-data.min.js' : 'builds/moment-timezone-without-data.js'
		}
	},
	options: {
		report: 'gzip'
	}
};

const jshint = {
	all: 'moment-timezone.js'
};

const clean = {
	data: ['temp']
};

const rollup = {
	options: {
		format: 'umd',
		globals: {
			moment: 'moment'
		},
		moduleName: 'moment',
		plugins: [babelPlugin({
			babelrc: false,
			compact: false,
			presets: ['es2015-loose-rollup'],
			exclude: 'node_modules/**'
		})]
	},
	umd: {
		files: [{
			expand: true,
			cwd: 'src',
			src: 'moment-timezone*.js',
			dest: 'builds'
		}]
	}
};

const babel = {
	options: {
		presets: ['es2015-loose'],
		plugins: ['transform-es2015-modules-commonjs']
	},
	tests: {
		files: [{
			expand: true,
			src: '{test,src}/**/*.js',
			dest: 'temp'
		}]
	}
};

export default grunt => {
	grunt.initConfig({
		babel,
		build,
		clean,
		jshint,
		nodeunit,
		rollup,
		uglify
	});

	registerBuildTask(grunt);
	registerDataTask(grunt);
	registerDataCollectTask(grunt);
	registerDataDedupeTask(grunt);
	registerDataDownloadTask(grunt);
	registerDataMetaTask(grunt);
	registerDataPackTask(grunt);
	registerDataTestsTask(grunt);
	registerDataTestsLegacyTask(grunt);
	registerDataZicTask(grunt);
	registerDataZdumpTask(grunt);

	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-rollup');

	grunt.registerTask('release', [
		'jshint',
		'data',
		'nodeunit',
		'build',
		'uglify'
	]);

	grunt.registerTask('default', [
		'jshint',
		'nodeunit'
	]);
};
