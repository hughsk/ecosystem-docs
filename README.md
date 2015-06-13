# ecosystem-docs
![](http://img.shields.io/badge/stability-stable-orange.svg?style=flat)
![](http://img.shields.io/npm/v/ecosystem-docs.svg?style=flat)
![](http://img.shields.io/npm/dm/ecosystem-docs.svg?style=flat)
![](http://img.shields.io/npm/l/ecosystem-docs.svg?style=flat)

Aggregate and store a collection of data for GitHub repositories, intended for use with documenting package ecosystems on npm.

This makes it easier to write your own version of
[stackgl/packages](http://stack.gl/packages), with the added
bonus of being more pleasant to work with and using a better
caching strategy.

## Usage

[![NPM](https://nodei.co/npm/ecosystem-docs.png)](https://nodei.co/npm/ecosystem-docs/)

```
Usage:
  ecosystem-docs <command> {OPTIONS}

Available Commands:
  sync   Syncs the database with GitHub
  read   Outputs the stored information for the input repositories
  dump   Dumps all of the currently stored information to stdout

Options:
  -d, --data   Location of the leveldb cache. Defaults to ~/.ecosystem-docs
  -h, --help   Display this message
  -t, --token  Pass in a custom GitHub token. Otherwise this will be prompted
               for when first using the tool.
```

When you've first installed the tool, be sure to login with
your GitHub credentials first by running the command once
without any arguments:

``` bash
ecosystem-docs
```

After that, you can pipe a line-delimited list of user/name
repository paths into the tool to sync with GitHub:

``` bash
echo '
hughsk/icosphere
mattdesl/budo
stackgl/glslify
' > repos.txt

cat repos.txt | ecosystem-docs sync
```

And later, pipe a line-delimited list of user/name repository
paths into the tool to read the update data out as
line-delimited JSON:

``` bash
cat repos.txt | ecosystem-docs read
{"user":"hughsk","path":"hughsk/icosphere","name":"icosphere","head":"e7c9bfcefac34b5be57d066a50428b30b15e3ac8","readme":"...","contributors":[{"login":"hughsk"},{"login":"kumavis"}],"page":"http://hughsk.io/icosphere/","package":{}}
{"user":"mattdesl","path":"mattdesl/budo","name":"budo","head":"0951e8594d6df0e6ec630fa8cb1bde5d4615fbdf","readme":"...","contributors":[{"login":"mattdesl"},{"login":"yoshuawuyts"},{"login":"thibauts"}],"page":false,"package":{}}
{"user":"stackgl","path":"stackgl/glslify","name":"glslify","head":"81ca203b6dee320508953e2be256250d44871a70","readme":"...","contributors":[{"login":"hughsk"},{"login":"chrisdickinson"},{"login":"mattdesl"},{"login":"mikolalysenko"},{"login":"rippedspine"}],"page":false,"package":{}}
```

Each repository has the following properties:

* `user`: The GitHub user that owns the repository.
* `name`: The name of the GitHub repository.
* `path`: The user/name path of the GitHub repository.
* `head`: The latest recorded commit in that repository.
* `readme`: The contents of the README file, according to GitHub.
* `page`: A resolved link to the GitHub pages URL, or false if it doesn't exist.
* `package`: the latest `package.json` committed to GitHub.
* `contributors`: A list of users who've contributed to the repository on GitHub: all of their associated profile data from the API.

Results are cached to minimise requests to the GitHub API, but
every sync will create at least one API request per repository
supplied. The cache is invalidated whenever a new commit is
pushed to that repository.

## License

MIT. See [LICENSE.md](http://github.com/hughsk/ecosystem-docs/blob/master/LICENSE.md) for details.
