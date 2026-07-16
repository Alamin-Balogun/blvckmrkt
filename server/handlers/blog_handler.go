package handlers

import (
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

// blogCommentCount returns the number of approved comments for a blog post.
func blogCommentCount(blogID uint) int64 {
	var count int64
	database.DB.Model(&models.BlogComment{}).
		Where("blog_id = ? AND deleted_at IS NULL", blogID).
		Count(&count)
	return count
}

// buildBlogResponse shapes a Blog row into the JSON the frontend expects.
func buildBlogResponse(b models.Blog, commentCount int64) gin.H {
	return gin.H{
		"id":            b.ID,
		"category_id":   b.CategoryID,
		"category":      b.Category,
		"title":         b.Title,
		"slug":          b.Slug,
		"excerpt":       b.Excerpt,
		"body":          b.Body,
		"cover_image":   b.CoverImage,
		"author_name":   b.AuthorName,
		"author_avatar": b.AuthorAvatar,
		"read_time":     b.ReadTime,
		"is_featured":   b.IsFeatured,
		"status":        b.Status,
		"published_at":  b.PublishedAt,
		"comment_count": commentCount,
		"created_at":    b.CreatedAt,
		"updated_at":    b.UpdatedAt,
		// Alias fields the frontend already uses from mock data
		"date":   formatBlogDate(b.PublishedAt, b.CreatedAt),
		"image":  b.CoverImage,
		"author": gin.H{"name": b.AuthorName, "avatar": b.AuthorAvatar},
	}
}

func formatBlogDate(published *time.Time, created time.Time) string {
	t := created
	if published != nil {
		t = *published
	}
	return t.Format("Jan 2, 2006")
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Blog Categories
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/blog/categories
func GetBlogCategories(c *gin.Context) {
	var cats []models.BlogCategory
	database.DB.Where("deleted_at IS NULL").Order("sort_order ASC, name ASC").Find(&cats)
	if cats == nil {
		cats = []models.BlogCategory{}
	}
	utils.OK(c, "Categories fetched", gin.H{"categories": cats})
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Blog Posts
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/blog/posts
// Query params: category (slug), search, page, limit
// Returns published posts + the featured post separately.
func ListBlogPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
	if page < 1 {
		page = 1
	}
	if limit > 50 {
		limit = 50
	}
	offset := (page - 1) * limit

	q := database.DB.Model(&models.Blog{}).
		Where("blogs.status = ? AND blogs.deleted_at IS NULL", models.BlogPublished).
		Preload("Category")

	if cat := c.Query("category"); cat != "" {
		q = q.Joins("JOIN blog_categories bc ON bc.id = blogs.category_id").
			Where("bc.slug = ? AND bc.deleted_at IS NULL", cat)
	}
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		q = q.Where("blogs.title LIKE ? OR blogs.excerpt LIKE ?",
			"%"+search+"%", "%"+search+"%")
	}

	// Exclude featured post from paginated list (it appears separately)
	var featured models.Blog
	database.DB.
		Where("is_featured = ? AND status = ? AND deleted_at IS NULL", true, models.BlogPublished).
		Preload("Category").
		First(&featured)

	var total int64
	q.Where("blogs.is_featured = ?", false).Count(&total)

	var posts []models.Blog
	q.Where("blogs.is_featured = ?", false).
		Order("blogs.published_at DESC, blogs.created_at DESC").
		Offset(offset).Limit(limit).
		Find(&posts)

	// Build response list with comment counts
	postList := make([]gin.H, 0, len(posts))
	for _, p := range posts {
		postList = append(postList, buildBlogResponse(p, blogCommentCount(p.ID)))
	}

	var featuredResp interface{}
	if featured.ID > 0 {
		featuredResp = buildBlogResponse(featured, blogCommentCount(featured.ID))
	}

	utils.OK(c, "Posts fetched", gin.H{
		"posts":    postList,
		"featured": featuredResp,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    int(math.Ceil(float64(total) / float64(limit))),
	})
}

// GET /api/blog/posts/:slug
func GetBlogPost(c *gin.Context) {
	slug := c.Param("slug")

	var blog models.Blog
	if err := database.DB.
		Where("(slug = ? OR id = ?) AND status = ? AND deleted_at IS NULL",
			slug, slug, models.BlogPublished).
		Preload("Category").
		First(&blog).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	utils.OK(c, "Post fetched", buildBlogResponse(blog, blogCommentCount(blog.ID)))
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Blog Comments (read)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/blog/posts/:slug/comments
func ListBlogComments(c *gin.Context) {
	slug := c.Param("slug")

	var blog models.Blog
	if err := database.DB.
		Where("(slug = ? OR id = ?) AND deleted_at IS NULL", slug, slug).
		First(&blog).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	var comments []models.BlogComment
	database.DB.Where("blog_id = ? AND deleted_at IS NULL", blog.ID).
		Order("created_at DESC").
		Find(&comments)

	// Batch-fetch user names
	userIDs := make([]uint, 0, len(comments))
	seen := map[uint]bool{}
	for _, cm := range comments {
		if !seen[cm.UserID] {
			userIDs = append(userIDs, cm.UserID)
			seen[cm.UserID] = true
		}
	}
	var users []models.User
	if len(userIDs) > 0 {
		database.DB.Where("id IN ?", userIDs).Find(&users)
	}
	userMap := map[uint]gin.H{}
	for _, u := range users {
		name := u.FirstName
		if u.LastName != "" {
			name += " " + string(u.LastName[0]) + "."
		}
		userMap[u.ID] = gin.H{
			"name":   name,
			"avatar": u.AvatarURL,
		}
	}

	result := make([]gin.H, 0, len(comments))
	for _, cm := range comments {
		user := userMap[cm.UserID]
		result = append(result, gin.H{
			"id":         cm.ID,
			"blog_id":    cm.BlogID,
			"user_id":    cm.UserID,
			"user":       user,
			"body":       cm.Body,
			"created_at": cm.CreatedAt,
		})
	}

	utils.OK(c, "Comments fetched", gin.H{
		"comments": result,
		"total":    len(result),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// USER — Post a comment (any logged-in user)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/user/blog/:slug/comments
func CreateBlogComment(c *gin.Context) {
	userID := c.GetUint("userID")
	slug := c.Param("slug")

	var blog models.Blog
	if err := database.DB.
		Where("(slug = ? OR id = ?) AND status = ? AND deleted_at IS NULL",
			slug, slug, models.BlogPublished).
		First(&blog).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	var req struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Comment body is required", nil)
		return
	}

	body := strings.TrimSpace(req.Body)
	if len(body) < 2 {
		utils.BadRequest(c, "Comment is too short", nil)
		return
	}
	if len(body) > 2000 {
		utils.BadRequest(c, "Comment must be under 2000 characters", nil)
		return
	}

	comment := models.BlogComment{
		BlogID: blog.ID,
		UserID: userID,
		Body:   body,
	}
	if err := database.DB.Create(&comment).Error; err != nil {
		utils.InternalError(c, "Failed to post comment")
		return
	}

	// Fetch user for response
	var user models.User
	database.DB.First(&user, userID)
	name := user.FirstName
	if user.LastName != "" {
		name += " " + string(user.LastName[0]) + "."
	}

	utils.Created(c, "Comment posted", gin.H{
		"id":         comment.ID,
		"blog_id":    comment.BlogID,
		"user_id":    comment.UserID,
		"user":       gin.H{"name": name, "avatar": user.AvatarURL},
		"body":       comment.Body,
		"created_at": comment.CreatedAt,
	})
}

// DELETE /api/user/blog/comments/:id   — user can delete their own comment
func DeleteOwnBlogComment(c *gin.Context) {
	userID := c.GetUint("userID")
	commentID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := database.DB.
		Where("id = ? AND user_id = ?", commentID, userID).
		Delete(&models.BlogComment{})

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Comment not found or not yours")
		return
	}
	utils.OK(c, "Comment deleted", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Blog Categories CRUD
// ─────────────────────────────────────────────────────────────────────────────

func AdminListBlogCategories(c *gin.Context) {
	var cats []models.BlogCategory
	database.DB.Unscoped().Order("sort_order ASC, name ASC").Find(&cats)
	utils.OK(c, "Categories fetched", gin.H{"categories": cats, "total": len(cats)})
}

func AdminCreateBlogCategory(c *gin.Context) {
	var req struct {
		Name        string `json:"name"         binding:"required"`
		Slug        string `json:"slug"         binding:"required"`
		Color       string `json:"color"`
		BgColor     string `json:"bg_color"`
		BorderColor string `json:"border_color"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "name and slug are required", nil)
		return
	}
	cat := models.BlogCategory{
		Name:        strings.TrimSpace(req.Name),
		Slug:        strings.ToLower(strings.TrimSpace(req.Slug)),
		Color:       req.Color,
		BgColor:     req.BgColor,
		BorderColor: req.BorderColor,
		SortOrder:   req.SortOrder,
	}
	if err := database.DB.Create(&cat).Error; err != nil {
		utils.InternalError(c, "Failed to create category")
		return
	}
	utils.Created(c, "Category created", cat)
}

func AdminUpdateBlogCategory(c *gin.Context) {
	var cat models.BlogCategory
	if err := database.DB.First(&cat, c.Param("id")).Error; err != nil {
		utils.NotFound(c, "Category not found")
		return
	}
	var req struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Color       string `json:"color"`
		BgColor     string `json:"bg_color"`
		BorderColor string `json:"border_color"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}
	updates := map[string]interface{}{"sort_order": req.SortOrder}
	if req.Name != "" {
		updates["name"] = strings.TrimSpace(req.Name)
	}
	if req.Slug != "" {
		updates["slug"] = strings.ToLower(strings.TrimSpace(req.Slug))
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}
	if req.BgColor != "" {
		updates["bg_color"] = req.BgColor
	}
	if req.BorderColor != "" {
		updates["border_color"] = req.BorderColor
	}
	database.DB.Model(&cat).Updates(updates)
	database.DB.First(&cat, cat.ID)
	utils.OK(c, "Category updated", cat)
}

func AdminDeleteBlogCategory(c *gin.Context) {
	result := database.DB.Delete(&models.BlogCategory{}, c.Param("id"))
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Category not found")
		return
	}
	utils.OK(c, "Category deleted", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Blog Posts CRUD
// ─────────────────────────────────────────────────────────────────────────────

func AdminListBlogPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit > 100 {
		limit = 100
	}

	q := database.DB.Model(&models.Blog{}).Preload("Category")

	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		q = q.Where("title LIKE ?", "%"+search+"%")
	}

	var total int64
	q.Count(&total)

	var posts []models.Blog
	q.Order("created_at DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&posts)

	result := make([]gin.H, 0, len(posts))
	for _, p := range posts {
		r := buildBlogResponse(p, blogCommentCount(p.ID))
		// Admin sees body too (for editing)
		result = append(result, r)
	}

	utils.OK(c, "Posts fetched", gin.H{
		"posts": result,
		"total": total,
		"page":  page,
		"limit": limit,
		"pages": int(math.Ceil(float64(total) / float64(limit))),
	})
}

func AdminGetBlogPost(c *gin.Context) {
	var blog models.Blog
	if err := database.DB.Preload("Category").First(&blog, c.Param("id")).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}
	utils.OK(c, "Post fetched", buildBlogResponse(blog, blogCommentCount(blog.ID)))
}

func AdminCreateBlogPost(c *gin.Context) {
	var req struct {
		CategoryID   uint   `json:"category_id"   binding:"required"`
		Title        string `json:"title"         binding:"required"`
		Slug         string `json:"slug"`
		Excerpt      string `json:"excerpt"       binding:"required"`
		Body         string `json:"body"          binding:"required"`
		CoverImage   string `json:"cover_image"`
		AuthorName   string `json:"author_name"`
		AuthorAvatar string `json:"author_avatar"`
		ReadTime     string `json:"read_time"`
		IsFeatured   bool   `json:"is_featured"`
		Status       string `json:"status"` // "draft" | "published"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "category_id, title, excerpt and body are required", nil)
		return
	}

	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = utils.Slugify(req.Title)
	}

	status := models.BlogDraft
	if req.Status == "published" {
		status = models.BlogPublished
	}

	var publishedAt *time.Time
	if status == models.BlogPublished {
		now := time.Now()
		publishedAt = &now
	}

	readTime := req.ReadTime
	if readTime == "" {
		readTime = "5 min read"
	}

	// If marking as featured, unfeature all other posts first
	if req.IsFeatured {
		database.DB.Model(&models.Blog{}).
			Where("is_featured = ?", true).
			Update("is_featured", false)
	}

	blog := models.Blog{
		CategoryID:   req.CategoryID,
		Title:        strings.TrimSpace(req.Title),
		Slug:         slug,
		Excerpt:      strings.TrimSpace(req.Excerpt),
		Body:         req.Body,
		CoverImage:   req.CoverImage,
		AuthorName:   strings.TrimSpace(req.AuthorName),
		AuthorAvatar: req.AuthorAvatar,
		ReadTime:     readTime,
		IsFeatured:   req.IsFeatured,
		Status:       status,
		PublishedAt:  publishedAt,
	}

	if err := database.DB.Create(&blog).Error; err != nil {
		// Slug collision — append ID suffix
		blog.Slug = slug + "-" + strconv.Itoa(int(time.Now().Unix()))
		if err2 := database.DB.Create(&blog).Error; err2 != nil {
			utils.InternalError(c, "Failed to create post")
			return
		}
	}

	database.DB.Preload("Category").First(&blog, blog.ID)
	utils.Created(c, "Post created", buildBlogResponse(blog, 0))
}

func AdminUpdateBlogPost(c *gin.Context) {
	var blog models.Blog
	if err := database.DB.First(&blog, c.Param("id")).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	var req struct {
		CategoryID   uint   `json:"category_id"`
		Title        string `json:"title"`
		Slug         string `json:"slug"`
		Excerpt      string `json:"excerpt"`
		Body         string `json:"body"`
		CoverImage   string `json:"cover_image"`
		AuthorName   string `json:"author_name"`
		AuthorAvatar string `json:"author_avatar"`
		ReadTime     string `json:"read_time"`
		IsFeatured   *bool  `json:"is_featured"`
		Status       string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.CategoryID > 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.Title != "" {
		updates["title"] = strings.TrimSpace(req.Title)
	}
	if req.Slug != "" {
		updates["slug"] = strings.TrimSpace(req.Slug)
	}
	if req.Excerpt != "" {
		updates["excerpt"] = strings.TrimSpace(req.Excerpt)
	}
	if req.Body != "" {
		updates["body"] = req.Body
	}
	// Always save image/author/readtime even if empty (allows clearing)
	updates["cover_image"]   = req.CoverImage
	updates["author_name"]   = strings.TrimSpace(req.AuthorName)
	updates["author_avatar"] = req.AuthorAvatar
	if req.ReadTime != "" {
		updates["read_time"] = req.ReadTime
	}
	if req.IsFeatured != nil {
		if *req.IsFeatured {
			// Unfeature all others first
			database.DB.Model(&models.Blog{}).
				Where("is_featured = ? AND id != ?", true, blog.ID).
				Update("is_featured", false)
		}
		updates["is_featured"] = *req.IsFeatured
	}
	if req.Status == "published" || req.Status == "draft" {
		updates["status"] = req.Status
		if req.Status == "published" && blog.PublishedAt == nil {
			now := time.Now()
			updates["published_at"] = &now
		}
	}

	database.DB.Model(&blog).Updates(updates)
	database.DB.Preload("Category").First(&blog, blog.ID)
	utils.OK(c, "Post updated", buildBlogResponse(blog, blogCommentCount(blog.ID)))
}

func AdminDeleteBlogPost(c *gin.Context) {
	result := database.DB.Delete(&models.Blog{}, c.Param("id"))
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Post not found")
		return
	}
	utils.OK(c, "Post deleted", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Blog Comments CRUD
// ─────────────────────────────────────────────────────────────────────────────

func AdminListBlogComments(c *gin.Context) {
	blogID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var comments []models.BlogComment
	database.DB.Where("blog_id = ? AND deleted_at IS NULL", blogID).
		Order("created_at DESC").
		Find(&comments)

	// Batch-fetch user info
	userIDs := make([]uint, 0, len(comments))
	seen := map[uint]bool{}
	for _, cm := range comments {
		if !seen[cm.UserID] {
			userIDs = append(userIDs, cm.UserID)
			seen[cm.UserID] = true
		}
	}
	var users []models.User
	if len(userIDs) > 0 {
		database.DB.Where("id IN ?", userIDs).Find(&users)
	}
	userMap := map[uint]gin.H{}
	for _, u := range users {
		name := u.FirstName
		if u.LastName != "" {
			name += " " + string(u.LastName[0]) + "."
		}
		userMap[u.ID] = gin.H{"name": name, "avatar": u.AvatarURL}
	}

	result := make([]gin.H, 0, len(comments))
	for _, cm := range comments {
		result = append(result, gin.H{
			"id":         cm.ID,
			"blog_id":    cm.BlogID,
			"user_id":    cm.UserID,
			"user":       userMap[cm.UserID],
			"body":       cm.Body,
			"created_at": cm.CreatedAt,
		})
	}
	utils.OK(c, "Comments fetched", gin.H{"comments": result, "total": len(result)})
}

func AdminDeleteBlogComment(c *gin.Context) {
	result := database.DB.Delete(&models.BlogComment{}, c.Param("commentId"))
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Comment not found")
		return
	}
	utils.OK(c, "Comment deleted", nil)
}