const debug    = require('debug')('ecosystem-docs')
const sublevel = require('level-sublevel')
const map      = require('map-limit')
const request  = require('request')
const ghauth   = require('ghauth')
const mkdirp   = require('mkdirp')
const after    = require('after')
const level    = require('level')
const path     = require('path')

module.exports = syncDocs

function syncDocs(repoList, options, done) {
  options = options || {}

  const db      = require('./db')(options.data)
  const repos   = db.repos
  const heads   = db.heads
  const token   = options.token
  const headers = {
    'user-agent': 'ecosystem-docs',
    'authorization': 'token ' + token
  }

  map(mapRepos(repoList), 10, function(repo, next) {
    needsUpdate(repo, function(err, yep) {
      if (err) return next(err)
      if (yep) return updateRepo(repo, next)
      debug('Repo up to date %s', repo.path)
      next()
    })
  }, done)

  function updateRepo(repo, next) {
    debug('Updating repo %s', repo.path)

    var bump = after(4, save)

    getPages(repo, bump)
    getReadme(repo, bump)
    getPackage(repo, bump)
    getContributors(repo, bump)

    function save(err) {
      if (err) return next(err)

      repos.put(repo.path, repo, function(err) {
        if (err) return next(err)
        heads.put(repo.path, repo.head, function(err) {
          return next(err, repo)
        })
      })
    }
  }

  function getReadme(repo, next) {
    const uri = 'https://api.github.com/repos/'+repo.path+'/readme'

    request.get(uri, {
      json: true,
      headers: headers
    }, function(err, res, data) {
      if (err) return next(err)
      repo.readme = new Buffer(data.content, 'base64').toString('utf8')
      next()
    })
  }

  function getContributors(repo, next, second) {
    const uri = 'https://api.github.com/repos/'+repo.path+'/contributors'

    request.get(uri, {
      json: true,
      headers: headers
    }, function(err, res, data) {
      if (err) return next(err)

      if (!Array.isArray(data)) {
        if (!second) {
          return getContributors(repo, next, true)
        } else {
          return next(new Error('No contributor stats available for this repository?'))
        }
      }

      data = data.sort(function(a, b) {
        return b.contributions - a.contributions
      })

      repo.contributors = data
      next()
    })
  }

  function getPages(repo, next) {
    const page = 'http://'+repo.user+'.github.io/'+repo.name

    request.head(page, function(err, res) {
      var hit   = !err && res.statusCode !== 404
      repo.page = hit && res.request.href
      next()
    })
  }

  function getPackage(repo, next) {
    const uri = 'https://api.github.com/repos/'+repo.path+'/contents/package.json'

    request.get(uri, {
      json: true,
      headers: headers
    }, function(err, res, data) {
      if (err) return next(err)
      if (data.message === 'Not Found') return next(null, {})

      var json = new Buffer(data.content, 'base64').toString('utf8')

      try {
        json = JSON.parse(json.trim())
      } catch(e) {
        json = {}
      }

      return next(null, repo.package = json)
    })
  }

  function needsUpdate(repo, next) {
    const uri = 'https://api.github.com/repos/'+repo.path+'/git/refs'

    request.get(uri, {
      json: true,
      headers: headers
    }, function(err, res, data) {
      if (err) return next(err)

      debug('Requests remaining: %s', res.headers['x-ratelimit-remaining'])
      debug('Limit resets at: %s', new Date(1000*res.headers['x-ratelimit-reset']))

      if (data.message) return next(new Error(data.message))

      var latest = repo.head = data[0].object.sha

      heads.get(repo.path, function(err, head) {
        head = head || ''
        next(null, head !== latest)
      })
    })
  }
}

function mapRepos(repos) {
  return repos.map(function(repo) {
    var vals = repo.split('/')
    var user = vals[0]
    var name = vals[1]

    return {
      user: user,
      path: repo,
      name: name
    }
  })
}
