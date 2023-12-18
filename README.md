# Create Built App

The official command line tool for creating Built.JS themes, plugins and sites


## Usage
```
npx create-built-app init
```
For building themes or plugins, use:
```
npx create-built-app init --type=theme
```
or
```
npx create-built-app init --type=plugin
```

If you want to install it globally:
```bash
npm install create-built-app -g
```
Then you can do:
```
built init
```

## Development
```
npm run prepare
```
### Install theme
```
node build/src/index.js init --type theme
```
### Install site
```
node build/src/index.js init --type site
```
