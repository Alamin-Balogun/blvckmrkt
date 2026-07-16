package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type APIError struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Errors  map[string]string `json:"errors,omitempty"`
}

func OK(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Message: message, Data: data})
}

func Created(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{Success: true, Message: message, Data: data})
}

func BadRequest(c *gin.Context, message string, errs map[string]string) {
	c.JSON(http.StatusBadRequest, APIError{Success: false, Message: message, Errors: errs})
}

func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, APIError{Success: false, Message: message})
}

func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, APIError{Success: false, Message: message})
}

func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, APIError{Success: false, Message: message})
}

func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, APIError{Success: false, Message: message})
}

func InternalError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, APIError{Success: false, Message: message})
}