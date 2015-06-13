#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    t: 'token',
    h: 'help',
    d: 'data'
  },
  default: {
    data: require('userhome')('.ecosystem-docs')
  }
})

const command = argv._[0]

if (!command) return login()
if (argv.help) return help()
if (argv.h) return help()

const commands = {
  sync: function() {
    if (process.stdin.isTTY) return help()

    const sync  = require('./sync')
    const split = require('split')
    const repos = []

    process.stdin.pipe(split()).on('data', function(repo) {
      if (repo.trim()) repos.push(repo)
    }).once('close', function() {
      sync(repos, {
        token: argv.token,
        data: argv.data
      }, function(err) {
        if (err) throw err
      })
    })
  },
  dump: function() {
    const db = require('./db')(argv.data)

    db.repos.createValueStream()
      .on('data', function(d) {
        console.log(JSON.stringify(d))
      })
  },
  read: function() {
    if (process.stdin.isTTY) return help()

    const read  = require('./read')
    const split = require('split')
    const repos = []

    process.stdin.pipe(split()).on('data', function(repo) {
      if (repo.trim()) repos.push(repo)
    }).once('close', function() {
      read(repos, {
        data: argv.data
      }, function(err, repos) {
        if (err) throw err
        repos.forEach(function(repo) {
          console.log(JSON.stringify(repo))
        })
      })
    })
  }
}

const token = argv.token

if (!(command in commands)) {
  return help()
}
if (argv.token) {
  return commands[command]()
}

auth(function(err, data) {
  if (err) throw err
  argv.token = data.token
  commands[command]()
})

function help() {
  require('fs').createReadStream('help.txt')
    .once('close', function() {
      console.error()
      process.exit(1)
    })
    .pipe(process.stderr)
}

function login() {
  auth(function(err, authData) {
    if (err) throw err
    console.log('Logged in on GitHub as:', authData.user)
    help()
  })
}

function auth(next) {
  require('ghauth')({
    configName: 'ecosystem-docs',
    userAgent: 'ecosystem-docs',
    scopes: ['user']
  }, next)
}
