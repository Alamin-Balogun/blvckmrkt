package handlers

import (
	"encoding/json"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// GET /api/pages/:slug — public, no auth required
func PublicGetSitePage(c *gin.Context) {
    slug := c.Param("slug")

    var page models.SitePage
    if err := database.DB.Where("slug = ?", slug).First(&page).Error; err != nil {
        // Page not saved yet — return empty content, not an error
        utils.OK(c, "Page fetched", gin.H{
            "slug":    slug,
            "content": map[string]interface{}{},
        })
        return
    }

    var content map[string]interface{}
    if err := json.Unmarshal([]byte(page.ContentJSON), &content); err != nil {
        content = map[string]interface{}{}
    }

    utils.OK(c, "Page fetched", gin.H{
        "slug":    page.Slug,
        "content": content,
    })
}