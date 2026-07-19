package handlers

import (
	"math"
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

func normalizeCommunityCategory(cat string) string {
	cat = strings.ToLower(strings.TrimSpace(cat))
	if models.CommunityCategories[cat] {
		return cat
	}
	return "general"
}

// communityAuthorMap batch-fetches display info (name/avatar, and brand badge
// info when the author is a brand account) for a set of user IDs — mirrors
// the pattern already used for blog comment authors.
func communityAuthorMap(userIDs []uint) map[uint]gin.H {
	result := map[uint]gin.H{}
	if len(userIDs) == 0 {
		return result
	}

	var users []models.User
	database.DB.Where("id IN ?", userIDs).Find(&users)

	brandUserIDs := make([]uint, 0, len(users))
	for _, u := range users {
		if u.AccountType == models.AccountBrand {
			brandUserIDs = append(brandUserIDs, u.ID)
		}
	}

	brandMap := map[uint]gin.H{}
	if len(brandUserIDs) > 0 {
		var brands []models.Brand
		database.DB.Where("user_id IN ?", brandUserIDs).Find(&brands)
		for _, b := range brands {
			brandMap[b.UserID] = gin.H{
				"brand_name": b.BrandName,
				"slug":       b.Slug,
				"logo_url":   b.LogoURL,
				"verified":   b.VerificationStatus == models.VerificationVerified,
			}
		}
	}

	for _, u := range users {
		name := u.FirstName
		if u.LastName != "" {
			name += " " + string(u.LastName[0]) + "."
		}
		entry := gin.H{
			"user_id":  u.ID,
			"name":     name,
			"avatar":   u.AvatarURL,
			"is_brand": u.AccountType == models.AccountBrand,
		}
		if brand, ok := brandMap[u.ID]; ok {
			entry["brand"] = brand
		}
		result[u.ID] = entry
	}
	return result
}

func buildCommunityPostResponse(p models.CommunityPost, author gin.H, likedByMe bool) gin.H {
	return gin.H{
		"id":            p.ID,
		"user_id":       p.UserID,
		"brand_id":      p.BrandID,
		"category":      p.Category,
		"body":          p.Body,
		"image_url":     p.ImageURL,
		"like_count":    p.LikeCount,
		"comment_count": p.CommentCount,
		"liked_by_me":   likedByMe,
		"author":        author,
		"created_at":    p.CreatedAt,
		"updated_at":    p.UpdatedAt,
	}
}

func buildCommunityCommentResponse(cm models.CommunityComment, author gin.H) gin.H {
	return gin.H{
		"id":         cm.ID,
		"post_id":    cm.PostID,
		"user_id":    cm.UserID,
		"body":       cm.Body,
		"author":     author,
		"created_at": cm.CreatedAt,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC (optional auth) — Feed
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/community/posts
// Query params: category, sort ("newest"|"top"), page, limit
func ListCommunityPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 30 {
		limit = 10
	}
	offset := (page - 1) * limit

	q := database.DB.Model(&models.CommunityPost{}).Where("flagged = ?", false)

	if cat := strings.TrimSpace(c.Query("category")); cat != "" && models.CommunityCategories[cat] {
		q = q.Where("category = ?", cat)
	}

	var total int64
	q.Count(&total)

	order := "created_at DESC"
	if c.Query("sort") == "top" {
		order = "like_count DESC, created_at DESC"
	}

	var posts []models.CommunityPost
	q.Order(order).Offset(offset).Limit(limit).Find(&posts)

	userIDs := make([]uint, 0, len(posts))
	postIDs := make([]uint, 0, len(posts))
	seen := map[uint]bool{}
	for _, p := range posts {
		postIDs = append(postIDs, p.ID)
		if !seen[p.UserID] {
			userIDs = append(userIDs, p.UserID)
			seen[p.UserID] = true
		}
	}
	authorMap := communityAuthorMap(userIDs)

	likedSet := map[uint]bool{}
	if viewerID := c.GetUint("userID"); viewerID != 0 && len(postIDs) > 0 {
		var likes []models.CommunityLike
		database.DB.Where("user_id = ? AND post_id IN ?", viewerID, postIDs).Find(&likes)
		for _, l := range likes {
			likedSet[l.PostID] = true
		}
	}

	result := make([]gin.H, 0, len(posts))
	for _, p := range posts {
		result = append(result, buildCommunityPostResponse(p, authorMap[p.UserID], likedSet[p.ID]))
	}

	utils.OK(c, "Posts fetched", gin.H{
		"posts":      result,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"pages":      int(math.Ceil(float64(total) / float64(limit))),
		"categories": communityCategoryList(),
	})
}

func communityCategoryList() []string {
	cats := make([]string, 0, len(models.CommunityCategories))
	for k := range models.CommunityCategories {
		cats = append(cats, k)
	}
	return cats
}

// GET /api/community/posts/:id
func GetCommunityPost(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var post models.CommunityPost
	if err := database.DB.Where("id = ? AND flagged = ?", id, false).First(&post).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	author := communityAuthorMap([]uint{post.UserID})[post.UserID]

	likedByMe := false
	if viewerID := c.GetUint("userID"); viewerID != 0 {
		var like models.CommunityLike
		if err := database.DB.Where("user_id = ? AND post_id = ?", viewerID, post.ID).First(&like).Error; err == nil {
			likedByMe = true
		}
	}

	utils.OK(c, "Post fetched", buildCommunityPostResponse(post, author, likedByMe))
}

// GET /api/community/posts/:id/comments
func ListCommunityComments(c *gin.Context) {
	postID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var comments []models.CommunityComment
	database.DB.Where("post_id = ? AND flagged = ?", postID, false).
		Order("created_at ASC").
		Find(&comments)

	userIDs := make([]uint, 0, len(comments))
	seen := map[uint]bool{}
	for _, cm := range comments {
		if !seen[cm.UserID] {
			userIDs = append(userIDs, cm.UserID)
			seen[cm.UserID] = true
		}
	}
	authorMap := communityAuthorMap(userIDs)

	result := make([]gin.H, 0, len(comments))
	for _, cm := range comments {
		result = append(result, buildCommunityCommentResponse(cm, authorMap[cm.UserID]))
	}

	utils.OK(c, "Comments fetched", gin.H{"comments": result, "total": len(result)})
}

// ─────────────────────────────────────────────────────────────────────────────
// USER — Posts (any logged-in account)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/user/community/posts
func CreateCommunityPost(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		Category string `json:"category"`
		Body     string `json:"body" binding:"required"`
		ImageURL string `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Post body is required", nil)
		return
	}

	body := strings.TrimSpace(req.Body)
	if len(body) < 2 {
		utils.BadRequest(c, "Post is too short", nil)
		return
	}
	if len(body) > 3000 {
		utils.BadRequest(c, "Post must be under 3000 characters", nil)
		return
	}

	post := models.CommunityPost{
		UserID:   userID,
		Category: normalizeCommunityCategory(req.Category),
		Body:     body,
		ImageURL: strings.TrimSpace(req.ImageURL),
	}

	if c.GetString("accountType") == "brand" {
		if brand, err := getBrandForUser(userID); err == nil {
			post.BrandID = &brand.ID
		}
	}

	if err := database.DB.Create(&post).Error; err != nil {
		utils.InternalError(c, "Failed to create post")
		return
	}

	author := communityAuthorMap([]uint{userID})[userID]
	utils.Created(c, "Post published", buildCommunityPostResponse(post, author, false))
}

// PUT /api/user/community/posts/:id — owner only
func UpdateCommunityPost(c *gin.Context) {
	userID := c.GetUint("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var post models.CommunityPost
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&post).Error; err != nil {
		utils.NotFound(c, "Post not found or not yours")
		return
	}

	var req struct {
		Category string `json:"category"`
		Body     string `json:"body"`
		ImageURL *string `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}
	if body := strings.TrimSpace(req.Body); body != "" {
		if len(body) < 2 {
			utils.BadRequest(c, "Post is too short", nil)
			return
		}
		if len(body) > 3000 {
			utils.BadRequest(c, "Post must be under 3000 characters", nil)
			return
		}
		updates["body"] = body
	}
	if req.Category != "" {
		updates["category"] = normalizeCommunityCategory(req.Category)
	}
	if req.ImageURL != nil {
		updates["image_url"] = strings.TrimSpace(*req.ImageURL)
	}

	database.DB.Model(&post).Updates(updates)
	database.DB.First(&post, post.ID)

	author := communityAuthorMap([]uint{userID})[userID]
	var likedByMe bool
	if err := database.DB.Where("user_id = ? AND post_id = ?", userID, post.ID).First(&models.CommunityLike{}).Error; err == nil {
		likedByMe = true
	}
	utils.OK(c, "Post updated", buildCommunityPostResponse(post, author, likedByMe))
}

// DELETE /api/user/community/posts/:id — owner only
func DeleteCommunityPost(c *gin.Context) {
	userID := c.GetUint("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.CommunityPost{})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Post not found or not yours")
		return
	}
	utils.OK(c, "Post deleted", nil)
}

// POST /api/user/community/posts/:id/like — toggles like state
func ToggleCommunityLike(c *gin.Context) {
	userID := c.GetUint("userID")
	postID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var post models.CommunityPost
	if err := database.DB.First(&post, postID).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	var liked bool
	var existing models.CommunityLike
	if err := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&existing).Error; err == nil {
		database.DB.Delete(&existing)
		liked = false
	} else {
		database.DB.Create(&models.CommunityLike{UserID: userID, PostID: uint(postID)})
		liked = true
	}

	// Recompute like_count from source of truth to avoid drift.
	var count int64
	database.DB.Model(&models.CommunityLike{}).Where("post_id = ?", postID).Count(&count)
	database.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).Update("like_count", count)

	utils.OK(c, "Like updated", gin.H{"liked_by_me": liked, "like_count": count})
}

// ─────────────────────────────────────────────────────────────────────────────
// USER — Comments (any logged-in account)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/user/community/posts/:id/comments
func CreateCommunityComment(c *gin.Context) {
	userID := c.GetUint("userID")
	postID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var post models.CommunityPost
	if err := database.DB.First(&post, postID).Error; err != nil {
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

	comment := models.CommunityComment{PostID: post.ID, UserID: userID, Body: body}
	if err := database.DB.Create(&comment).Error; err != nil {
		utils.InternalError(c, "Failed to post comment")
		return
	}

	var commentCount int64
	database.DB.Model(&models.CommunityComment{}).Where("post_id = ? AND deleted_at IS NULL", post.ID).Count(&commentCount)
	database.DB.Model(&models.CommunityPost{}).Where("id = ?", post.ID).Update("comment_count", commentCount)

	author := communityAuthorMap([]uint{userID})[userID]
	utils.Created(c, "Comment posted", buildCommunityCommentResponse(comment, author))
}

// DELETE /api/user/community/comments/:id — the comment's own author, OR the
// author of the post it's attached to (post-owner moderation), may delete it.
func DeleteCommunityComment(c *gin.Context) {
	userID := c.GetUint("userID")
	commentID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var comment models.CommunityComment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		utils.NotFound(c, "Comment not found")
		return
	}

	allowed := comment.UserID == userID
	if !allowed {
		var post models.CommunityPost
		if err := database.DB.First(&post, comment.PostID).Error; err == nil && post.UserID == userID {
			allowed = true
		}
	}
	if !allowed {
		utils.Forbidden(c, "You can't delete this comment")
		return
	}

	database.DB.Delete(&comment)

	var commentCount int64
	database.DB.Model(&models.CommunityComment{}).Where("post_id = ? AND deleted_at IS NULL", comment.PostID).Count(&commentCount)
	database.DB.Model(&models.CommunityPost{}).Where("id = ?", comment.PostID).Update("comment_count", commentCount)

	utils.OK(c, "Comment deleted", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// USER — Reports (any logged-in account)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/user/community/posts/:id/report
func ReportCommunityPost(c *gin.Context) {
	userID := c.GetUint("userID")
	postID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := database.DB.First(&models.CommunityPost{}, postID).Error; err != nil {
		utils.NotFound(c, "Post not found")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	report := models.CommunityReport{
		TargetType:     "post",
		TargetID:       uint(postID),
		ReporterUserID: userID,
		Reason:         strings.TrimSpace(req.Reason),
	}
	if err := database.DB.Create(&report).Error; err != nil {
		utils.Conflict(c, "You've already reported this post")
		return
	}

	var flagCount int64
	database.DB.Model(&models.CommunityReport{}).Where("target_type = ? AND target_id = ?", "post", postID).Count(&flagCount)
	database.DB.Model(&models.CommunityPost{}).Where("id = ?", postID).
		Updates(map[string]interface{}{"flagged": true, "flag_count": flagCount})

	utils.OK(c, "Post reported — our team will review it", nil)
}

// POST /api/user/community/comments/:id/report
func ReportCommunityComment(c *gin.Context) {
	userID := c.GetUint("userID")
	commentID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	if err := database.DB.First(&models.CommunityComment{}, commentID).Error; err != nil {
		utils.NotFound(c, "Comment not found")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	report := models.CommunityReport{
		TargetType:     "comment",
		TargetID:       uint(commentID),
		ReporterUserID: userID,
		Reason:         strings.TrimSpace(req.Reason),
	}
	if err := database.DB.Create(&report).Error; err != nil {
		utils.Conflict(c, "You've already reported this comment")
		return
	}

	var flagCount int64
	database.DB.Model(&models.CommunityReport{}).Where("target_type = ? AND target_id = ?", "comment", commentID).Count(&flagCount)
	database.DB.Model(&models.CommunityComment{}).Where("id = ?", commentID).
		Updates(map[string]interface{}{"flagged": true, "flag_count": flagCount})

	utils.OK(c, "Comment reported — our team will review it", nil)
}
