/**
 * (c) 2016
 *
 * cid - a simple Github ci utilizing docker
 **/

const githubhook = require('githubhook'),
      docker     = require('dockerode');

// instancing
const github = githubhook({/* options */});

github.listen();

github.on('*', function (event, repo, ref, data) {
  console.log('event:', event);
  console.log('repo:', repo);
  console.log('ref:', ref);
});
