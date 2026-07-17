package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ipLimiter is a simple in-memory sliding-window limiter keyed by client IP.
// Fine for guarding a specific endpoint on this single-instance deployment —
// would need a shared store (Redis) if this app ever runs multi-instance.
type ipLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
}

func (l *ipLimiter) allow(ip string, max int, window time.Duration) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-window)

	kept := l.requests[ip][:0]
	for _, t := range l.requests[ip] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}

	if len(kept) >= max {
		l.requests[ip] = kept
		return false
	}

	l.requests[ip] = append(kept, now)
	return true
}

// RateLimit blocks a client IP after `max` requests within `window`.
// Intentionally simple — this guards a specific unauthenticated endpoint
// (guest checkout, which can trigger real payment-gateway verification
// calls) from being hammered, not a general-purpose API gateway concern.
func RateLimit(max int, window time.Duration) gin.HandlerFunc {
	limiter := &ipLimiter{requests: make(map[string][]time.Time)}
	return func(c *gin.Context) {
		if !limiter.allow(c.ClientIP(), max, window) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Too many requests. Please wait a moment and try again.",
			})
			return
		}
		c.Next()
	}
}
