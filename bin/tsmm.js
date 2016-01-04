#!/usr/bin/env node

require('shelljs/global');

var yargs = require('yargs');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var chalk = require('chalk');
var _ = require('underscore');
var readlineSync = require('readline-sync');

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

var installation = {
  _configFile: 'tsmm.json',
  
  _sourceDir: null,
  sourceDir: function() {
    if (installation._sourceDir === null) {
      var config = installation.config.load();
      if (config.source === null || config.source === undefined) {
        installation.error('no source folder found');
      } else {
        installation._sourceDir = config.source;
      }
    }
    return installation._sourceDir;
  },
  
  error: function(msg, fn) {
    console.log();
    if (fn !== undefined) {
      fn();
    }
    console.log(chalk.red('Error: ' + msg));
    if (shell.test('-d', path.join(installation.sourceDir(), 'temp'))) {
      shell.rm('-rf', path.join(installation.sourceDir(), 'temp'));
    }
    shell.exit(1);
  },
  
  checkIfModuleInstalled: function(name) {
    var data = installation.config.load();
    return _.contains(_.map(data.modules, function(e) { return e.name; }), name);
  },
  
  indexOfModule: function(name) {
    var data = installation.config.load();
    return _.indexOf(_.map(data.modules, function(e) { return e.name; }), name);
  },
  
  package: {
    load: function() {
      if (shell.test('-f', 'package.json')) {
        return JSON.parse(shell.cat('package.json'));
      }
      return false;
    }
  },
  
  config: {
    load: function() {
      if (shell.test('-f', installation._configFile)) {
        return JSON.parse(shell.cat(installation._configFile));
      }
      
      console.log(chalk.red('Error: no config file found'));
      var src = readlineSync.question('please enter the source directory of your TypeScript files: ', {defaultInput: 'src'});
      if (!shell.test('-d', src)) {
        shell.mkdir(src);
      }
      
      var data = { source: src, modules: [] };
      installation.config.save(data)
      return data;
    },
    
    save: function(data) {
      JSON.stringify(data, null, 2).to(installation._configFile);
    },
    
    addModule: function(name, repo) {
      var data = installation.config.load();
      if (!installation.checkIfModuleInstalled(name)) {
        data.modules.push({ name: name, repository: repo });
      } else {
        installation.error('module already installed');
      }
      installation.config.save(data);
    },
    
    deleteModule: function(name) {
      var data = installation.config.load();
      if (installation.checkIfModuleInstalled(name)) {
        data.modules = _.filter(data.modules, function(m) {
          return m.name !== name;
        });
      } else {
        installation.error('module not installed');
      }
      installation.config.save(data);
    }
  },
  
  install: function(yargs) {
    var repo = yargs.argv._[1];
    console.log();
    console.log(chalk.yellow('installing') + ' module from ' + repo);
    console.log();
    
    if (shell.exec('git clone ' + repo + ' ' + path.join(installation.sourceDir(), 'temp')).code !== 0) {
      installation.error('git clone failed');
    } else {
      var pkg = null;
      if (shell.test('-f', path.join(installation.sourceDir(), 'temp/package.json'))) {
        pkg = JSON.parse(shell.cat(path.join(installation.sourceDir(), 'temp/package.json')));
        
        if (pkg === null || pkg === undefined) {
          installation.error('no package.json found in repository');
        } else if (pkg.name === undefined) {
          installation.error('no name in package.json found');
        } else {
          shell.echo('module name: ' + chalk.yellow(pkg.name));
          installation.config.addModule(pkg.name, repo);
          var destPath = path.join(installation.sourceDir(), pkg.name);
          
          if (shell.test('-d', destPath)) {
            shell.rm('-rf', destPath);
          }
          
          shell.mkdir(destPath);
          shell.mv(path.join(installation.sourceDir(), 'temp') + '/src/**', destPath);
          shell.rm('-rf', path.join(installation.sourceDir(), 'temp'));
          
          console.log();
          console.log(chalk.green('successfully installed module'));
        }
      } else {
        installation.error('no package.json found in repository');
      }
    }
  },
  
  update: function(yargs) {
    var module = yargs.argv._[1];
    if (module !== undefined) {
      var repo = _.find(installation.config.load().modules, function(m) { return m.name === module; });
      
      if (repo !== null && repo !== undefined && repo.repository !== undefined) {
        repo = repo.repository;
        
        console.log();
        console.log(chalk.yellow('updating') + ' ' + module + ' from ' + repo);
        console.log();
        
        if (shell.exec('git clone ' + repo + ' ' + path.join(installation.sourceDir(), 'temp')).code !== 0) {
          installation.error('git clone failed');
        } else {
          var pkg = null;
          if (shell.test('-f', path.join(installation.sourceDir(), 'temp/package.json'))) {
            pkg = JSON.parse(shell.cat(path.join(installation.sourceDir(), 'temp/package.json')));
            
            if (pkg === null || pkg === undefined) {
              installation.error('no package.json found in repository');
            } else if (pkg.name === undefined) {
              installation.error('no name in package.json found');
            } else {
              shell.echo('module name: ' + chalk.yellow(pkg.name));
              var destPath = path.join(installation.sourceDir(), pkg.name);
              
              if (shell.test('-d', destPath)) {
                shell.rm('-rf', destPath);
              }
              
              shell.mkdir(destPath);
              shell.mv(path.join(installation.sourceDir(), 'temp') + '/src/**', destPath);
              shell.rm('-rf', path.join(installation.sourceDir(), 'temp'));
              
              console.log();
              console.log(chalk.green('successfully updated ' + module + ' module'));
            }
          } else {
            installation.error('no package.json found in repository');
          }
        }
      } else {
        installation.error('module ' + module + ' not found in '+ installation._configFile);
      }
    } else {
      installation.error('wrong usage', function() {
        console.log(chalk.yellow('Usage: tmm update [module]'));
        console.log();
      });
    }
  },
  
  uninstall: function(yargs) {
    var module = yargs.argv._[1];
    if (module !== undefined) {
      console.log();
      console.log(chalk.yellow('uninstalling') + ' ' + module + ' module');
      console.log();
      
      if (installation.checkIfModuleInstalled(module)) {
        if (shell.test('-d', path.join(installation.sourceDir(), module))) {
          shell.rm('-rf', path.join(installation.sourceDir(), module));
        } else {
          console.log(chalk.yellow('Info: directory already deleted'));
        }
        
        installation.config.deleteModule(module);
        console.log(chalk.green('successfully uninstalled module'));
      } else {
        installation.error('module not installed');
      }
    } else {
      installation.error('wrong usage', function() {
        console.log(chalk.yellow('Usage: tmm uninstall [module]'));
        console.log();
      });
    }
  },
  
  list: function(yargs) {
    var data = installation.config.load();
    var pkg = installation.package.load();
    
    if (pkg) {
      if (data.modules !== undefined && data.modules.length > 0) {
        console.log();
        if (pkg.name !== undefined) {
          console.log(pkg.name);
        } else {
          console.log(shell.pwd());
        }

        console.log(_.map(data.modules, function(e) {
          if (e.name === _.last(data.modules).name) {
            return ' \u2517 ' + e.name;
          }
          return ' \u2520 ' + e.name;
        }).join('\n'));
        
        console.log();
        console.log(chalk.green(data.modules.length + ' module' + (data.modules.length > 1?'s':'') + ' installed'));
      } else {
        installation.error('no modules installed');
      }
    } else {
      installation.error('not supported environment', function() {
        console.log(chalk.yellow('Info: ') + 'package.json not found');
      });
    }
  }
}

var argv = yargs.usage('Usage: tmm <command> [options]')
    .command('install', 'installs module from given repository', installation.install)
    .command('uninstall', 'uninstalls module', installation.uninstall)
    .command('update', 'update module', installation.update)
    .command('list', 'list all installed modules', installation.list)
    .demand(1, 'must provide a valid command')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2015')
    .argv;
