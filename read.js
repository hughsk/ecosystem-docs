const map = require('map-limit')

module.exports = read

function read(repoList, options, done) {
  options = options || {}

  const db    = require('./db')(options.data)
  const repos = db.repos

  map(repoList, 10, function(repo, next) {
    repos.get(repo, next)
  }, done)
}
