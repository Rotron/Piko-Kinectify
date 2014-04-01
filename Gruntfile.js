module.exports = function(grunt) {

grunt.initConfig({
  pkg: grunt.file.readJSON("package.json"),

  watch: {
    browserify: {
      files: ['./web/src/*.js'],
      tasks: ['browserify:dev'],
      options: {
        livereload: true
      }
    }
  },
  browserify: {
    dev: {
      files: {
        './web/js/build.js': './web/src/index.js'
      },
      options: {
        bundleOptions: {debug: true}
      }
    },
    prod: {
      files: {
        './web/js/build.js': './web/src/index.js'
      },
      options: {}
    }
  }
});

  // Load the plugin that provides the tasks.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  // build
  grunt.registerTask('build', ['browserify:prod']);

  grunt.registerTask('br', 'Live Browserify', ['browserify:dev', 'watch:browserify'])

  // Default task(s).
  grunt.registerTask('default', ['build']);
};
