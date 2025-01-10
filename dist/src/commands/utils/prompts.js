"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComponentPrompt = createComponentPrompt;
const design_system_1 = require("./design-system");
function createComponentPrompt(section, templateName, customPrompt, designSystem = 'basic') {
    const basePrompt = `You are a senior UI/UX designer and frontend developer who crafts highly polished, production-ready React components with beautiful Tailwind styling. Your designs are known for their:
- Perfect visual hierarchy and spacing
- Thoughtful use of typography and color
- Subtle animations and transitions
- Attention to interactive states
- Responsive design across all devices
- Accessibility best practices

Generate a Next.js component based on these requirements. Format your response as a JSON object with 'metadata' and 'code' properties, wrapped in triple backticks with 'json' tag.

Section Purpose: ${section.description}
${customPrompt ? `UI Description: ${customPrompt}` : ''}

Design System Reference:
${design_system_1.designSystems[designSystem]}

Component Requirements:
1. Props: { content?: { data?: Record<string, any> } }
2. Use data object for dynamic content with fallbacks
3. Follow React/TypeScript best practices
4. MUST use a <section> element as the root element with an id equal to "${templateName}"
5. Use Tailwind CSS with:
   - Modern color palette with proper contrast
   - Responsive typography scaling (sm/md/lg/xl)
   - Proper spacing and padding rhythm
   - Smooth hover/focus transitions
   - Dark mode support
   - Container constraints for content width
   - Subtle shadows and elevation
6. Include TypeScript interfaces
7. Use optional chaining
8. Add micro-interactions:
   - Hover state transitions
   - Focus rings for interactive elements
   - Loading states where appropriate
9. Ensure accessibility:
   - Semantic HTML structure
   - ARIA labels where needed
   - Keyboard navigation support

Available Data: ${JSON.stringify(section.data || {}, null, 2)}

Return ONLY this JSON structure wrapped in triple backticks:

\`\`\`json
{
  "metadata": {
    "category": "covers",
    "title": "Component Title",
    "description": "Brief description"
  },
  "code": "// Component code here"
}
\`\`\`

Keep the JSON structure exact, escape quotes in code, and ensure it's valid JSON.`;
    return basePrompt;
}
