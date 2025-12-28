/**
 * Format a single line by removing markdown symbols
 */
export const formatLine = (text) => {
  if (!text) return '';

  let formatted = text;

  // Remove bold markers (**text** or __text__)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '$1');
  formatted = formatted.replace(/__(.+?)__/g, '$1');

  // Remove italic markers (*text* or _text_)
  formatted = formatted.replace(/\*([^*]+?)\*/g, '$1');
  formatted = formatted.replace(/_([^_]+?)_/g, '$1');

  // Remove code backticks (`code`)
  formatted = formatted.replace(/`(.+?)`/g, '$1');

  return formatted.trim();
};

/**
 * Split summary into sections for better display
 */
export const splitSummaryIntoSections = (text) => {
  if (!text) return [];

  const sections = [];
  const lines = text.split('\n');
  let currentSection = { title: '', content: '' };

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Check if line looks like a header (starts with ###, ##, or #)
    const headerMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);

    if (headerMatch) {
      // Save previous section if it has content
      if (currentSection.title || currentSection.content) {
        sections.push({ ...currentSection });
      }

      // Start new section
      currentSection = {
        title: headerMatch[1].trim(),
        content: ''
      };
    } else if (trimmedLine) {
      // Add to current section content
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  });

  // Add the last section
  if (currentSection.title || currentSection.content) {
    sections.push(currentSection);
  }

  return sections;
};
