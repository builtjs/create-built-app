# Create Built App

The official command line tool for creating Built.JS themes, plugins and sites


## Usage
Publishing to Built Studio:
```bash
npx create-built-app publish
```

Updating theme (if adding or removing plugins in theme.json):
```bash
npx create-built-app update
```


## Using the Library Locally
Follow the steps below:

### Steps

1. **Create a global symlink to your library:**
Run the following command in your library folder:
```bash
npm link
```
This will create a global symlink to your library.

2. **Make Changes:** 
Edit the TypeScript files in your local library.

3. **Watch and Compile the Changes:** 
Run this to continuously watch for changes to the TypeScript files and recompile:
```bash
npm run watch
```

4. **Navigate to the project where you want to use the library:**
```bash
cd /path/to/your/local/project
```
Then link the global symlink to your project:
```bash
npm link create-built-app
```

NOTE: For each update you make, run this command again.

5. **Run your command:**
```bash
npx create-built-app publish
```

To unlink:
```bash
npm unlink -g create-built-app
```
