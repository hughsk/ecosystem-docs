const sublevel = require('level-sublevel')
const userhome = require('userhome')
const mkdirp   = require('mkdirp')
const level    = require('level')

module.exports = function(location) {
  mkdirp.sync(location)

  const db = sublevel(level(location, {
    valueEncoding: 'json'
  }))

  db.repos = db.sublevel('repos')
  db.heads = db.sublevel('heads')

  return db
}
