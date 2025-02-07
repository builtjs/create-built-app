# Create Built App

The official command line tool for creating Built.js themes, plugins and sites.


## Publishing a theme or plugin
The publish command allows you to import a theme or plugin into [Built Studio](https://builtjs.com).
```bash
npx create-built-app publish [options]
```

### Options
- `--type`
  - Specifies the type of entity to publish. Accepted values are `theme` or `plugin` (Default: `theme`).
  - Example:
  ```bash
  npx create-built-app publish --type plugin
  ```

## Updating a theme or plugin

The `update` command applies changes you make to the data files in `public/data` directory of your theme or plugin. It includes options to update screenshots for all sections and specify the port number of the Next.js app.

### Usage

```bash
npx create-built-app update [options]
```

### Options

- `--screenshots`
  - Updates screenshots for all sections in the theme or plugin.
  - Example:
    ```bash
    npx create-built-app update --screenshots
    ```

- `-p, --port <number>`
  - Specifies the port number of the running Next.js app when taking screenshots. This is useful if the app is running on a custom port other than the default (e.g., 3000).
  - Example:
    ```bash
    npx create-built-app update --screenshots --port 4000
    ```

### Creating screenshots
Screenshots of each of the sections of your theme will be used to display the section in [Built Studio](https://builtjs.com). You can automate the creation and hosting of screenshots of your sections:

#### Prerequisites

1. In your Next.js project root, create a `.env` file with your Cloudinary configuration:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-secret-here
```

2. Ensure you have a `public/data/sections.json` file with your sections:
```json
{
  "sections": [
    {
      "name": "heroSection",
      "defaultTemplate": {
        "name": "cover1"
      }
    }
  ]
}
```
3. In `components/templates`, ensure you have a template (React component for the section) which has the id with the `name` of the section's `defaultTemplate`:
```
// ...
export default function Cover1({ content }: Cover1Props) {
  // ...
  return (
    <section id="cover1">
        // ...
    </section>
    )
}
```

## Creating templates
You can automate the creation of templates (React components for sections) using OpenAI API.

### Prerequisites

1. In your Next.js project root, create a `.env` file with your OpenAI configuration:
```
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

2. Ensure you have a `public/data/sections.json` file with your sections:
```json
{
  "sections": [
    {
      "name": "heroSection",
      "description": "A hero section with heading, subheading, and CTA button",
      "templates": []
    }
  ]
}
```
### What it does
1. Finds the section(s) in your project's `sections.json` file
2. Generates Next.js component(s) using OpenAI based on:
   - The section description
   - Custom UI prompt (if provided)
3. Creates the component file(s) in your project's `components/<category>/templates/`
4. Updates your project's `public/data/templates.json` with the new template metadata
5. Updates the section's templates array in `sections.json`

### Usage
Generate templates in two ways:

1. Generate a single template from a section:
**NOTE:** The value of the `--section` flag must equal the `name` of a section in `public/data/sections.json`.
```bash
npx create-built-app create template --section <sectionName>
```

2. Generate templates for all sections:
```bash
npx create-built-app create template
```

### Options

- `--section <name>`: Section name to use as reference (optional)
- `--prompt <description>`: Custom UI description for the template(s)
- `--design-system <type>`: Design system to use (options: 'basic' or 'shadcn', defaults to 'basic')

### Custom UI Descriptions

You can provide custom UI descriptions in two ways:

1. For a single section:
```bash
npx create-built-app create template --section heroSection --prompt "A modern hero section with gradient background, animated text, and floating elements"
```

2. For all sections in theme (applies the same UI style to all generated components):
```bash
npx create-built-app create template --prompt "Modern, minimalist design with subtle animations and rounded corners"
```

### Specifying a design system
Choose between two design systems:

1. Basic (default):
- Custom CSS variables for colors and typography
- Consistent spacing and border radius
- Flexible accent color system
- Comprehensive typography scale

2. shadcn:
```bash
npx create-built-app create template --design-system shadcn
```
- Integration with shadcn/ui components
- Consistent theming with shadcn variables
- Standardized border radius and spacing

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
To unlink:
```bash
npm unlink -g create-built-app
```

### Troubleshooting
If you get:
```
sh: /opt/homebrew/bin/built: Permission denied
```
Do:
```
rm -f /opt/homebrew/bin/built
```
```
npm install -g create-built-app
```
