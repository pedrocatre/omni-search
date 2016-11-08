module.exports = function( grunt ) {

	grunt.initConfig( {

		// Import package manifest
		pkg: grunt.file.readJSON( "package.json" ),

		// Banner definitions
		meta: {
			banner: "/*\n" +
				" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
				" *  <%= pkg.description %>\n" +
				" *  <%= pkg.homepage %>\n" +
				" *\n" +
				" *  Made by <%= pkg.author.name %>\n" +
				" *  Under <%= pkg.license %> License\n" +
				" */\n"
		},

		serve: {
			options: {
				port: 9006
			}
		},

		// Concat definitions
		concat: {
			options: {
				banner: "<%= meta.banner %>"
			},
			dist: {
				src: [ "src/omni.search.js" ],
				dest: "dist/js/omni.search.js"
			}
		},

		// Lint definitions
		jshint: {
			files: [ "src/omni.search.ts", "test/**/*" ],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		jscs: {
			src: "src/**/*.ts",
			options: {
				config: ".jscsrc"
			}
		},

		// Minify definitions
		uglify: {
			dist: {
				src: [ "dist/js/omni.search.js" ],
				dest: "dist/js/omni.search.min.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},

		// Compile SASS
		sass: {
			dist: {
				files: [{
					expand: true,
					cwd: 'src/css',
					src: ['*.scss'],
					dest: 'dist/css',
					ext: '.css'
				}]
			}
		},

		// Minify css
		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: 'src/css',
					src: ['*.css', '!*.min.css'],
					dest: 'dist/css',
					ext: '.min.css'
				}]
			}
		},

		// karma test runner
		karma: {
			unit: {
				configFile: "karma.conf.js",
				background: true,
				singleRun: false,
				browsers: [ "PhantomJS", "Firefox" ]
			},

			//continuous integration mode: run tests once in PhantomJS browser.
			travis: {
				configFile: "karma.conf.js",
				singleRun: true,
				browsers: [ "PhantomJS" ]
			}
		},

		// watch for changes to source
		// Better than calling grunt a million times
		// (call 'grunt watch')
		watch: {
			files: [ "src/*", "test/**/*" ],
			tasks: [ "default" ]
		},

		concurrent: {
			serve: ['serve', 'shell:e2eTest']
		},

		shell: {
			typescript: {
				command: 'tsc src/omni.search.ts'
			}
		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-concat" );
	grunt.loadNpmTasks( "grunt-contrib-uglify" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-karma" );
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-shell-spawn');
	grunt.loadNpmTasks('grunt-serve');

	grunt.registerTask( "travis", [ "karma:travis" ] );
	grunt.registerTask( "build", [ "shell:typescript", "sass", "cssmin", "concat", "uglify" ] );
	grunt.registerTask( "default", [ "build", "karma:unit:run" ] );
};
