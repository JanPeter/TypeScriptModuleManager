# TypeScript Module Manager

Downloads temporary a repository to your working directory and copies the src directory to your local source directory.

## Example

Working directory:

    ┣ lib/
    ┣ node_modules/
    ┣ src/
    ┣━━ main.ts
    ┣ test/
    ┣ typings/
    ┣ gulpfile.js
    ┣ package.json
    ┣ tsconfig.json
    ┣ tsd.json
    ┗ tslint.json

Now I want to use my sqlite wrapper module I wrote for another project.

    tsmm install https://github.com/JanPeter/TypeScriptSQLite.git

While the installation is running, I'll be asked for my source directory, in my case `src`.
After the installation my working directory will look like this:

    ┣ lib/
    ┣ node_modules/
    ┣ src/
    ┣━┓ tssqlite/
    ┃ ┗━━ sqlite.ts
    ┣━━ main.ts
    ┣ test/
    ┣ typings/
    ┣ gulpfile.js
    ┣ package.json
    ┣ tsconfig.json
    ┣ tsd.json
    ┣ tsmm.json
    ┗ tslint.json

## Installation

Install the module manager via npm.

    npm install -g tsmm

## Config

When you first run the `tsmm install [repository]` command you will be asked where your source dierctory is. After that the module manager will create a tsmm.json file in your root directory. It is used to remember your installed modules.

### Sample config file

    {
      "source": "src",
      "modules": [
        {
          "name": "tssqlite",
          "repository": "https://github.com/JanPeter/TypeScriptSQLite.git"
        }
      ]
    }

## Usage

### Install

Downloads the given repository and copies the src directory into your local `src/[package.name]` directory. Then it deletes the downloaded repository.

    tsmm install [repository]

### List

Prints every installed package in your working node application.

    tsmm list
    
### Update

Executes the installation command again. But you don't have to enter the repository url again. Only the name of the package.

    tsmm update [package.name]

### Uninstall

Deletes the module from your local source directory and removes the module from the config file.

    tsmm uninstall [package.name]
    
