/**
 * (c) 2016
 *
 * cid - a simple Github ci utilizing docker
 **/

'use strict';

const githubhook = require('githubhook'),
      dockerode  = require('dockerode'),
      async      = require('async');

// instancing
const github = githubhook({});
const docker = new dockerode();

// config
const dockerImage = 'programmingandlogic/nvm:latest';
const org         = 'programmingandlogic';


/**
 * Run the tests.
 *
 * @param {String} repo, repository
 * @param {String} cb callback, callback.
 * @returns {undefined}
 **/
const runTests = function(repo, cb) {
  /* docker.listContainers(function (err, containers) {
    console.log(containers);
  });
  */

  // Run the Test setup w/ async.
  async.waterfall([

    /**
     * Identify the CI image.
     **/
    function(next) {
      let found = false;

      // find the ci image.
      docker.listImages((err, images) => {
        images.filter((obj) => {
          if(obj.RepoTags.indexOf(dockerImage) !== -1) {
            if(!found) { // failsafe
              found = true;
              console.log('found test image:', obj.Id);

              return next(null, obj);
            }
          }
        });

        if(!found) {
          return next('Failed to find a CI image.');
        }
      });
    },

    /**
     * Create a new CI container.
     **/
    function(image, next) {
      console.log('create container');
      docker.createContainer({Image: dockerImage, name: repo, Env: ['REPO='+repo, 'ORG='+org]}, function (err, container) {
        if(err) {
          return next('Failed to create container:\n'+err);
        }

        /**
         * Attach to the Container
         **/
        container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
          container.modem.demuxStream(stream, process.stdout, process.stderr);
        });

        /**
         * Start the container
         **/
        container.start(function (err) {
          if(err) {
            return next('Failed to start the CI Container.')
          }

          /**
           * Wait for the CI to run
           **/
          container.wait(function(err) {
            if(err) {
              return next('Failed to wait for CI to init.');
            }

            /**
             * Cleanup the container
             **/
            container.remove(function(err) {
              if(err){
                return next('Failed to remove CI container!');
              }
            })
          });
        });
      });
    }
  ], function(err) {
    if(err) {
      return console.log(err);
    }

    return cb(err);
  });
}

runTests('collect-newspaper-jaredallard', 'master')



// Start the webhook handler.
/*
github.listen();

github.on('*', (event, repo, ref, data) => {
  if(event === 'push' || event === 'pull_request') {
    return runTests(repo, ref, data);
  }
});
*/
