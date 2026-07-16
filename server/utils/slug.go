package utils

import (
	"regexp"
	"strings"
)

// Slugify converts a string to a URL-safe slug.
// e.g. "Corteiz Brand" → "corteiz-brand"
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	// Replace spaces and underscores with hyphens
	s = regexp.MustCompile(`[\s_]+`).ReplaceAllString(s, "-")
	// Remove any character that isn't alphanumeric or hyphen
	s = regexp.MustCompile(`[^a-z0-9\-]`).ReplaceAllString(s, "")
	// Collapse multiple hyphens
	s = regexp.MustCompile(`-+`).ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}