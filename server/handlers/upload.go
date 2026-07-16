// handlers/upload.go
package handlers

import (
	"bytes"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

type cloudinaryResponse struct {
	SecureURL string `json:"secure_url"`
	PublicID  string `json:"public_id"`
	Format    string `json:"format"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Bytes     int    `json:"bytes"`
	Error     *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

var allowedFolders = map[string]bool{
	"avatars":    true,
	"brands":     true,
	"products":   true,
	"banners":    true,
	"receipts":   true,
	"categories": true,
	"blog":       true,
}

// UploadImage handles general image uploads
// POST /api/upload?folder=products
// Body: multipart/form-data — accepts field name "image" OR "file"
func UploadImage(c *gin.Context) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		utils.InternalError(c, "Image upload not configured — add Cloudinary env vars to .env")
		return
	}

	folder := c.DefaultQuery("folder", "products")
	if !allowedFolders[folder] {
		folder = "products"
	}
	cloudFolder := "blvckmrkt/" + folder

	// Parse multipart body first
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		utils.BadRequest(c, "Request must be multipart/form-data", nil)
		return
	}

	// Accept both "image" (ImageUpload.jsx) and "file" (brand api.js uploadProductImage)
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		file, header, err = c.Request.FormFile("file")
	}
	if err != nil {
		utils.BadRequest(c, "No image found — send file as field 'image' or 'file'", nil)
		return
	}
	defer file.Close()

	// Read all bytes
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		utils.InternalError(c, "Failed to read image")
		return
	}

	// Detect content type — sniff bytes as fallback
	contentType := strings.TrimSpace(strings.Split(header.Header.Get("Content-Type"), ";")[0])
	if contentType == "" || contentType == "application/octet-stream" {
		peek := fileBytes
		if len(peek) > 512 {
			peek = peek[:512]
		}
		contentType = strings.TrimSpace(strings.Split(http.DetectContentType(peek), ";")[0])
	}

	if !allowedMimeTypes[contentType] {
		utils.BadRequest(c, "Invalid file type ("+contentType+"). Allowed: JPEG, PNG, WebP, GIF", nil)
		return
	}

	// Size check
	const maxSize = 5 * 1024 * 1024
	if len(fileBytes) > maxSize {
		utils.BadRequest(c, "File too large. Maximum size is 5MB", nil)
		return
	}

	// Build Cloudinary signed upload request
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	sigStr := fmt.Sprintf("folder=%s&timestamp=%s%s", cloudFolder, timestamp, apiSecret)
	sig := fmt.Sprintf("%x", sha1.Sum([]byte(sigStr)))

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	_ = w.WriteField("folder", cloudFolder)
	_ = w.WriteField("timestamp", timestamp)
	_ = w.WriteField("api_key", apiKey)
	_ = w.WriteField("signature", sig)
	fw, _ := w.CreateFormFile("file", header.Filename)
	fw.Write(fileBytes)
	w.Close()

	uploadURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName)
	httpReq, _ := http.NewRequest("POST", uploadURL, &buf)
	httpReq.Header.Set("Content-Type", w.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		utils.InternalError(c, "Failed to reach Cloudinary — check your internet connection")
		return
	}
	defer resp.Body.Close()

	var result cloudinaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		utils.InternalError(c, "Failed to parse Cloudinary response")
		return
	}

	if result.Error != nil {
		utils.BadRequest(c, "Cloudinary error: "+result.Error.Message, nil)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"url":       result.SecureURL,
			"public_id": result.PublicID,
			"format":    result.Format,
			"width":     result.Width,
			"height":    result.Height,
			"size":      result.Bytes,
		},
	})
}

// UploadReceipt handles payment receipt uploads (bank transfer proof)
// POST /api/upload/receipt
func UploadReceipt(c *gin.Context) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		utils.InternalError(c, "Receipt upload not configured")
		return
	}

	// Parse multipart
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		utils.BadRequest(c, "Request must be multipart/form-data", nil)
		return
	}

	file, header, err := c.Request.FormFile("receipt")
	if err != nil {
		utils.BadRequest(c, "No receipt file found - send as 'receipt'", nil)
		return
	}
	defer file.Close()

	// Read file
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		utils.InternalError(c, "Failed to read receipt file")
		return
	}

	// Detect content type
	contentType := strings.TrimSpace(strings.Split(header.Header.Get("Content-Type"), ";")[0])
	if contentType == "" || contentType == "application/octet-stream" {
		peek := fileBytes
		if len(peek) > 512 {
			peek = peek[:512]
		}
		contentType = strings.TrimSpace(strings.Split(http.DetectContentType(peek), ";")[0])
	}

	// Allow images and PDFs
	allowedTypes := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"image/jpg":       true,
		"application/pdf": true,
	}

	if !allowedTypes[contentType] {
		utils.BadRequest(c, "Invalid file type. Allowed: JPG, PNG, PDF", nil)
		return
	}

	// Size check (5MB)
	const maxSize = 5 * 1024 * 1024
	if len(fileBytes) > maxSize {
		utils.BadRequest(c, "File too large. Maximum size is 5MB", nil)
		return
	}

	// Upload to Cloudinary
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	folder := "blvckmrkt/receipts"
	sigStr := fmt.Sprintf("folder=%s&timestamp=%s%s", folder, timestamp, apiSecret)
	sig := fmt.Sprintf("%x", sha1.Sum([]byte(sigStr)))

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	_ = w.WriteField("folder", folder)
	_ = w.WriteField("timestamp", timestamp)
	_ = w.WriteField("api_key", apiKey)
	_ = w.WriteField("signature", sig)

	fw, _ := w.CreateFormFile("file", header.Filename)
	fw.Write(fileBytes)
	w.Close()

	// Use 'auto' resource type to support both images and PDFs
	uploadURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/auto/upload", cloudName)
	httpReq, _ := http.NewRequest("POST", uploadURL, &buf)
	httpReq.Header.Set("Content-Type", w.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		utils.InternalError(c, "Failed to upload receipt")
		return
	}
	defer resp.Body.Close()

	var result cloudinaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		utils.InternalError(c, "Failed to parse upload response")
		return
	}

	if result.Error != nil {
		utils.BadRequest(c, "Upload error: "+result.Error.Message, nil)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"url":     result.SecureURL,
		"data": gin.H{
			"url":       result.SecureURL,
			"public_id": result.PublicID,
			"format":    result.Format,
		},
	})
}