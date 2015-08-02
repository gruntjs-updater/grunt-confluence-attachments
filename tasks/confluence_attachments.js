/*
 * grunt-confluence-attachments
 * https://github.com/Richard-Walker/grunt-confluence-attachments
 *
 * Copyright (c) 2015 Richard Walker
 * Licensed under the GPL-3.0 license.
 */

// TODO: handle cookie expiration

'use strict';

module.exports = function(grunt) {

  var rest = require('restler');
  var readlineSync = require('readline-sync');
  var fs = require("fs");

  var cookieFile = '.grunt/confluence_attachments/cookies.txt';


  //
  // CONFLUENCE ATTACHMENTS (main task, public)
  //

  grunt.registerMultiTask('confluence_attachments', 'Upload attachments to confluence pages', function() {

    if (this.options().baseUrl == null) { grunt.fail.fatal('Option "baseUrl" is not defined'); }

    grunt.config('__confluence_upload', { main: this.data });
    grunt.config('__confluence_upload_one.options', this.options());
    
    grunt.task.run([
      '__confluence_get_cookie',
      '__confluence_upload'
    ]);

  });


  //
  // GET COOKIE (private task)
  //

  grunt.registerTask('__confluence_get_cookie', 'get cookies if not already done', function() {
    var done = this.async();

    if (grunt.file.exists(cookieFile)) {
      
      grunt.config('confluence_attachments._cookie', grunt.file.read(cookieFile));
      console.log('Cookie file found, authentication skipped');
      done(true);

    } else {
 
      var username = readlineSync.question('Confluence login: ');
      var password = readlineSync.question('Password: ', { hideEchoBack: true });

      rest.post('https://share.emakina.net/dologin.action', {
        data: {
          os_username : username,
          os_password : password,
          os_cookie: true
        },
      }).on('complete', function(data, response) {

        if (response.statusCode === 200) {
          var loginResult = response.headers['x-seraph-loginreason'];
          if (loginResult === 'OK') {
            var cookie = response.headers['set-cookie'].join('; ');
            grunt.file.write(cookieFile, cookie);
            grunt.config('confluence_attachments._cookie', cookie);
            console.log('Login succesful, cookie set');
            done(true);
          } else {
            grunt.fail.fatal('Confluence login failed (reason: ' + loginResult + ')' );
            done(false);
          }
        } else {
          console.log(data);
          grunt.fail.fatal('Confluence login failed (code ' + response.statusCode + ')' );
          done(false);
        }

      });
    
    }
  });


  //
  // UPLOAD ATTACHMENTS (private task)
  //

  grunt.registerMultiTask('__confluence_upload', 'upload attachments defined in options', function() {
    
    grunt.task.requires('__confluence_get_cookie');

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {

      // Filter sources
      var sources = f.src.filter(function(filepath) {
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else if (grunt.file.isDir(filepath)) {
          return false;
        } else {
          return true;
        }
      });

      // Queue upload tasks
      sources.forEach(function (src) {
        grunt.task.run('__confluence_upload_one:' + src + ':' + f.dest);
      });

    });

  });


  //
  // UPLOAD A SINGLE ATTACHMENT (private task)
  //

  grunt.registerTask('__confluence_upload_one', 'upload a single attachment', function(src, dest) {
    var done = this.async();

    var options = this.options({
      comment: 'Grunt upload (grunt-confluence-attachments plugin)'
    });

    console.log('Uploading ' + src + ' to ' + dest + '...');

    var pageId = dest.split('/').shift();
    var cookie = grunt.config('confluence_attachments._cookie');
    var filename = src.split('/').pop();
    var url = options.baseUrl + '/rest/api/content/' + pageId + '/child/attachment';
    var fileSize = fs.statSync(src).size;
    var file = rest.file(src, null, fileSize, null, null);
    
    var postOptions = {
      rejectUnauthorized: false,
      headers: {
        'Cookie': cookie,
        'X-Atlassian-Token': 'nocheck'
      },          
      multipart: true,
      data: {
        comment: options.comment,
        minorEdit: 'true',
        file: file
      }
    };
    
    var getOptions = {
      headers: {
        'Cookie': cookie
      }
    };

    // Checking if file with same name is already attached
    rest.get(url + '?filename=' + filename, getOptions).on('complete', function(data, response) {
      
      if (response.statusCode !== 200) {
        console.log(data);
        grunt.fail.fatal('Error checking attachment (code ' + response.statusCode + ')');
        done(false);
      } else {

        if (data.results.length === 0) {

          // If not already attached, POST attachment
          rest.post(url, postOptions).on('complete', function(data, response) {
            if (response.statusCode !== 200) {
              console.log(data);
              grunt.fail.fatal('Error posting attachment (code ' + response.statusCode + ')');
              done(false);
            } else {
              done(true);
            }
          });
        } else {

          // If already attached, POST a new version
          rest.post(url + '/' + data.results[0].id + '/data', postOptions).on('complete', function(data, response) {
            if (response.statusCode !== 200) {
              console.log(data);
              grunt.fail.fatal('Error posting new version of attachment (code ' + response.statusCode + ')');
              done(false);
            } else {
              done(true);
            }
          });
        }
      }
    });
  });
};
