/**
 * HTML Sanitization utilities for site content management
 * Prevents XSS attacks while allowing safe HTML for content editing
 */
// Allowed HTML tags for content
const ALLOWED_TAGS = new Set([
    // Structural
    'div', 'span', 'p', 'br', 'hr',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Text formatting
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'small', 'mark', 'abbr', 'cite', 'q', 'blockquote',
    // Links and media (controlled)
    'a', 'img',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Semantic
    'article', 'section', 'aside', 'header', 'footer', 'nav', 'main',
    'figure', 'figcaption', 'details', 'summary',
    // Code
    'pre', 'code', 'kbd', 'samp', 'var',
]);
// Allowed attributes per tag
const ALLOWED_ATTRIBUTES = {
    '*': new Set(['class', 'id', 'style', 'title', 'dir', 'lang', 'aria-label', 'aria-hidden', 'role']),
    'a': new Set(['href', 'target', 'rel', 'download']),
    'img': new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
    'table': new Set(['border', 'cellpadding', 'cellspacing']),
    'td': new Set(['colspan', 'rowspan', 'align', 'valign']),
    'th': new Set(['colspan', 'rowspan', 'align', 'valign', 'scope']),
    'ol': new Set(['start', 'type', 'reversed']),
    'li': new Set(['value']),
    'blockquote': new Set(['cite']),
    'abbr': new Set(['title']),
    'time': new Set(['datetime']),
    'col': new Set(['span']),
    'colgroup': new Set(['span']),
};
// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
    // Script tags and content
    /<script[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    // Event handlers
    /\s*on\w+\s*=\s*["'][^"']*["']/gi,
    /\s*on\w+\s*=\s*[^\s>]+/gi,
    // JavaScript URLs
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:/gi,
    // Dangerous protocol handlers
    /href\s*=\s*["']?\s*(javascript|vbscript|data):/gi,
    // iframes (unless whitelisted)
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<iframe[^>]*>/gi,
    // Object/embed/applet
    /<object[\s\S]*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<applet[\s\S]*?<\/applet>/gi,
    // Form elements (prevent form hijacking)
    /<form[\s\S]*?<\/form>/gi,
    /<input[^>]*>/gi,
    /<button[\s\S]*?<\/button>/gi,
    /<select[\s\S]*?<\/select>/gi,
    /<textarea[\s\S]*?<\/textarea>/gi,
    // SVG with scripts
    /<svg[^>]*onload[^>]*>/gi,
    // Meta tags
    /<meta[^>]*>/gi,
    // Link tags
    /<link[^>]*>/gi,
    // Base tags
    /<base[^>]*>/gi,
    // Style tags with expressions
    /expression\s*\(/gi,
    /-moz-binding/gi,
    /behavior\s*:/gi,
];
// CSS properties to sanitize in style attributes
const DANGEROUS_CSS = [
    /expression\s*\(/gi,
    /-moz-binding/gi,
    /behavior\s*:/gi,
    /url\s*\(\s*["']?\s*javascript:/gi,
    /position\s*:\s*fixed/gi, // Prevent overlay attacks
];
/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html Raw HTML input
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    let sanitized = html;
    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }
    // Sanitize style attributes
    sanitized = sanitizeStyleAttributes(sanitized);
    // Ensure links are safe
    sanitized = sanitizeLinks(sanitized);
    // Remove empty tags that could be used for attacks
    sanitized = sanitized.replace(/<(\w+)[^>]*><\/\1>/gi, (match, tag) => {
        const lowerTag = tag.toLowerCase();
        // Keep some empty tags that are valid
        if (['br', 'hr', 'img', 'td', 'th', 'p', 'div', 'span', 'li'].includes(lowerTag)) {
            return match;
        }
        return '';
    });
    return sanitized.trim();
}
/**
 * Sanitize style attributes
 */
function sanitizeStyleAttributes(html) {
    return html.replace(/style\s*=\s*["']([^"']*)["']/gi, (match, styleContent) => {
        let sanitizedStyle = styleContent;
        for (const pattern of DANGEROUS_CSS) {
            sanitizedStyle = sanitizedStyle.replace(pattern, '');
        }
        return `style="${sanitizedStyle}"`;
    });
}
/**
 * Sanitize links to prevent malicious URLs
 */
function sanitizeLinks(html) {
    return html.replace(/<a\s+([^>]*)>/gi, (match, attributes) => {
        // Add rel="noopener noreferrer" to external links
        let sanitizedAttrs = attributes;
        // Check if it's an external link
        const hrefMatch = attributes.match(/href\s*=\s*["']([^"']*)["']/i);
        if (hrefMatch) {
            const href = hrefMatch[1];
            // If external link, ensure safe attributes
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                if (!sanitizedAttrs.includes('rel=')) {
                    sanitizedAttrs += ' rel="noopener noreferrer"';
                }
                if (!sanitizedAttrs.includes('target=')) {
                    sanitizedAttrs += ' target="_blank"';
                }
            }
        }
        return `<a ${sanitizedAttrs}>`;
    });
}
/**
 * Validate content length and format
 */
export function validateContent(content, maxLength = 100000) {
    if (!content) {
        return { valid: true }; // Empty content is valid for some pages
    }
    if (typeof content !== 'string') {
        return { valid: false, error: 'El contenido debe ser texto' };
    }
    if (content.length > maxLength) {
        return { valid: false, error: `El contenido excede el límite de ${maxLength} caracteres` };
    }
    return { valid: true };
}
/**
 * Generate a diff between two content versions (simplified)
 */
export function generateContentDiff(oldContent, newContent) {
    if (!oldContent)
        return '[Contenido inicial]';
    if (oldContent === newContent)
        return '[Sin cambios]';
    const oldLength = oldContent.length;
    const newLength = newContent.length;
    const lengthDiff = newLength - oldLength;
    const summary = lengthDiff >= 0
        ? `+${lengthDiff} caracteres`
        : `${lengthDiff} caracteres`;
    // Find first difference position
    let firstDiff = 0;
    const minLength = Math.min(oldLength, newLength);
    while (firstDiff < minLength && oldContent[firstDiff] === newContent[firstDiff]) {
        firstDiff++;
    }
    // Get context around first change
    const contextStart = Math.max(0, firstDiff - 50);
    const contextEnd = Math.min(newLength, firstDiff + 50);
    const changedContext = newContent.substring(contextStart, contextEnd);
    return `${summary} | Cambio cerca de posición ${firstDiff}: "...${changedContext}..."`;
}
export default {
    sanitizeHTML,
    validateContent,
    generateContentDiff,
};
