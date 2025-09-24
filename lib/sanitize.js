import DOMPurify from "isomorphic-dompurify";

// Configuration for different content types
const SANITIZE_CONFIGS = {
	// For rich text editor content (more permissive for authoring)
	editor: {
		ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "a", "img", "div", "span"],
		ALLOWED_ATTR: ["href", "title", "alt", "src", "width", "height", "class", "style"],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
		FORBID_TAGS: ["script", "object", "embed", "form", "input", "button"],
		FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur"],
	},

	// For displaying chapter content (more restrictive)
	display: {
		ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "a", "img", "div", "span"],
		ALLOWED_ATTR: ["href", "title", "alt", "src", "class"],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
		FORBID_TAGS: ["script", "object", "embed", "form", "input", "button"],
		FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur", "style"],
	},

	// For comments and user input (most restrictive)
	comments: {
		ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "a", "code"],
		ALLOWED_ATTR: ["href", "title"],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
		FORBID_TAGS: ["script", "object", "embed", "form", "input", "button", "img"],
		FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur", "style"],
	},
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @param {string} type - The sanitization level: 'editor', 'display', or 'comments'
 * @returns {string} - Sanitized HTML content
 */
export function sanitizeHtml(html, type = "display") {
	if (!html || typeof html !== "string") {
		return "";
	}

	const config = SANITIZE_CONFIGS[type] || SANITIZE_CONFIGS.display;

	// Additional security: Remove any remaining script tags and event handlers
	const sanitized = DOMPurify.sanitize(html, {
		...config,
		// Always remove these dangerous elements
		FORBID_TAGS: [...(config.FORBID_TAGS || []), "script", "object", "embed"],
		// Always remove event handlers
		FORBID_ATTR: [...(config.FORBID_ATTR || []), "on*"],
		// Return a clean DOM
		RETURN_DOM: false,
		RETURN_DOM_FRAGMENT: false,
		RETURN_DOM_IMPORT: false,
	});

	return sanitized;
}

/**
 * Create sanitized HTML for React dangerouslySetInnerHTML
 * @param {string} html - The HTML content to sanitize
 * @param {string} type - The sanitization level
 * @returns {object} - Object with __html property for React
 */
export function createSanitizedHtml(html, type = "display") {
	return {
		__html: sanitizeHtml(html, type),
	};
}

/**
 * Validate and sanitize user input before saving to database
 * @param {string} content - User input content
 * @param {string} type - Content type for appropriate sanitization
 * @returns {string} - Cleaned content safe for storage
 */
export function sanitizeForStorage(content, type = "editor") {
	// First pass: Basic sanitization
	let cleaned = sanitizeHtml(content, type);

	// Additional validation for storage
	if (cleaned.length > 1000000) {
		// 1MB limit
		throw new Error("Content too large");
	}

	// Remove excessive whitespace
	cleaned = cleaned.replace(/\s{3,}/g, "  ");

	return cleaned;
}
