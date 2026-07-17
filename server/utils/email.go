package utils

// Email sending via the official Resend Go SDK.
// Install with: go get github.com/resend/resend-go/v3
//
// .env variables needed:
//   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
//   EMAIL_FROM=onboarding@resend.dev        ← during dev/testing
//   EMAIL_FROM_NAME=BLVCKMRKT
//
// When going live with your own domain:
//   EMAIL_FROM=noreply@blvckmrkt.com

import (
	"fmt"
	"os"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/resend/resend-go/v3"
)

// SendOTPEmail sends the 6-digit reset code to the user's inbox.
// If RESEND_API_KEY is not set, returns an error and the caller
// falls back to logging the OTP in the console for dev testing.
func SendOTPEmail(toEmail, firstName, otp string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)

	from := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{toEmail},
		Subject: "Your BLVCKMRKT Password Reset Code",
		Html:    buildOTPEmail(firstName, otp),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}

	return nil
}

// buildOTPEmail returns a branded HTML email for the reset code.
func buildOTPEmail(firstName, otp string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:520px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
            BLVCK<span style="color:#ef4444;">MRKT</span>
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">
            Password Reset
          </p>
          <h1 style="color:#fff;font-size:26px;margin:0 0 16px;line-height:1.2;">
            Hey %s, here's your reset code
          </h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.7;margin:0 0 28px;">
            Someone requested a password reset for your BLVCKMRKT account.
            Enter the code below on the reset page. It expires in
            <strong style="color:#fff;">15 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background:#0a0a0a;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 14px;">
              Your Reset Code
            </p>
            <span style="font-family:Georgia,monospace;font-size:48px;font-weight:900;color:#ef4444;letter-spacing:0.6em;padding-left:0.6em;">
              %s
            </span>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:14px 0 0;">
              This code expires in 15 minutes
            </p>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 18px;">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.6;">
              🔒 If you didn't request this, you can safely ignore this email.
              Your password will not change.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
            © 2026 BLVCKMRKT &nbsp;·&nbsp; Automated message — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`, firstName, otp)
}

// SendVerificationEmail sends the 6-digit signup verification code.
func SendVerificationEmail(toEmail, firstName, otp string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)
	from   := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{toEmail},
		Subject: "Verify your BLVCKMRKT email address",
		Html:    buildVerificationEmail(firstName, otp),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	return nil
}

// buildVerificationEmail returns a branded HTML email for signup verification.
func buildVerificationEmail(firstName, otp string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:520px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
            BLVCK<span style="color:#ef4444;">MRKT</span>
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">
            Email Verification
          </p>
          <h1 style="color:#fff;font-size:26px;margin:0 0 16px;line-height:1.2;">
            Hey %s, confirm your email
          </h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.7;margin:0 0 28px;">
            You're almost in. Enter the code below to verify your email and finish creating your BLVCKMRKT account.
            It expires in <strong style="color:#fff;">15 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background:#0a0a0a;border:2px solid rgba(239,68,68,0.4);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 14px;">
              Verification Code
            </p>
            <span style="font-family:Georgia,monospace;font-size:48px;font-weight:900;color:#ef4444;letter-spacing:0.6em;padding-left:0.6em;">
              %s
            </span>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:14px 0 0;">
              Expires in 15 minutes
            </p>
          </div>

          <!-- What's next -->
          <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;line-height:1.6;">
              ✦ After verifying, you'll be taken straight to your new account.
            </p>
          </div>

          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0;line-height:1.6;">
            Didn't create an account? You can safely ignore this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
            © 2026 BLVCKMRKT &nbsp;·&nbsp; Automated message — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`, firstName, otp)
}
// ─────────────────────────────────────────────────────────────────────────────
// Order Confirmation Email
// ─────────────────────────────────────────────────────────────────────────────

// OrderConfirmationData holds everything needed to render the order email.
type OrderConfirmationData struct {
	FirstName     string
	Email         string
	OrderID       string // e.g. "ORD-0042"
	PaymentMethod string // e.g. "paystack", "flutterwave", "transfer"
	PaymentStatus string // "paid" or "pending"
	DeliveryType  string // "local", "zone", "pickup"
	Subtotal      float64
	ShippingFee   float64
	Total         float64
	Currency      string
	Items         []OrderConfirmationItem
}

type OrderConfirmationItem struct {
	Name      string
	Size      string
	Quantity  int
	UnitPrice float64
	Total     float64
	ImageURL  string
}

// SendOrderConfirmationEmail sends the branded order confirmation to the buyer.
func SendOrderConfirmationEmail(data OrderConfirmationData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)
	from := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	subject := fmt.Sprintf("Order Confirmed – %s", data.OrderID)
	if data.PaymentStatus == "pending" {
		subject = fmt.Sprintf("Order Received – %s (Awaiting Payment)", data.OrderID)
	}

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{data.Email},
		Subject: subject,
		Html:    buildOrderConfirmationEmail(data),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	return nil
}

func buildOrderConfirmationEmail(d OrderConfirmationData) string {
	// ── Payment status badge ───────────────────────────────────────────────
	badgeColor := "#16a34a"
	badgeText := "Payment Confirmed"
	if d.PaymentStatus == "pending" {
		badgeColor = "#d97706"
		badgeText = "Awaiting Payment Confirmation"
	}

	// ── Payment method label ───────────────────────────────────────────────
	methodLabel := d.PaymentMethod
	switch d.PaymentMethod {
	case "paystack", "card":
		methodLabel = "Card (Paystack)"
	case "flutterwave":
		methodLabel = "Card (Flutterwave)"
	case "transfer", "manual_transfer", "bank_transfer":
		methodLabel = "Bank Transfer"
	}

	// ── Delivery type label ────────────────────────────────────────────────
	deliveryLabel := "Delivery"
	switch d.DeliveryType {
	case "pickup":
		deliveryLabel = "Pickup"
	case "local":
		deliveryLabel = "Local Delivery"
	case "zone":
		deliveryLabel = "Zone Delivery"
	}

	// ── Currency symbol ────────────────────────────────────────────────────
	currencySymbol := d.Currency
	if d.Currency == "NGN" {
		currencySymbol = "₦"
	}

	// ── Build item rows ────────────────────────────────────────────────────
	itemRows := ""
	for _, item := range d.Items {
		sizeLabel := ""
		if item.Size != "" && item.Size != "—" {
			sizeLabel = fmt.Sprintf(` <span style="color:rgba(255,255,255,0.3);font-size:11px;">/ %s</span>`, item.Size)
		}
		itemRows += fmt.Sprintf(`
		<tr>
		  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
		    <table width="100%%" cellpadding="0" cellspacing="0">
		      <tr>
		        <td style="width:44px;vertical-align:top;">
		          <div style="width:44px;height:44px;background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
		            %s
		          </div>
		        </td>
		        <td style="padding-left:12px;vertical-align:top;">
		          <p style="color:#fff;font-size:13px;margin:0 0 3px;font-weight:600;">%s%s</p>
		          <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">Qty: %d</p>
		        </td>
		        <td style="text-align:right;vertical-align:top;white-space:nowrap;">
		          <p style="color:#fff;font-size:13px;margin:0;font-weight:600;">%s%.2f</p>
		        </td>
		      </tr>
		    </table>
		  </td>
		</tr>`,
			imageTag(item.ImageURL),
			item.Name, sizeLabel,
			item.Quantity,
			currencySymbol, item.Total,
		)
	}

	// ── Pending payment note ───────────────────────────────────────────────
	pendingNote := ""
	if d.PaymentStatus == "pending" {
		pendingNote = `
		<tr><td style="padding:0 0 24px;">
		  <div style="background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.25);border-radius:10px;padding:14px 18px;">
		    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;line-height:1.7;">
		      ⏳ <strong style="color:#fbbf24;">Your order is reserved.</strong> Once we confirm your bank transfer,
		      we'll process it right away and send you an update.
		    </p>
		  </div>
		</td></tr>`
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
                BLVCK<span style="color:#ef4444;">MRKT</span>
              </span>
            </td>
            <td align="right">
              <span style="background:%s;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:5px 12px;border-radius:20px;">
                %s
              </span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 0;">
          <table width="100%%" cellpadding="0" cellspacing="0">

            <!-- Greeting -->
            <tr><td style="padding-bottom:24px;">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 10px;">
                Order Confirmation
              </p>
              <h1 style="color:#fff;font-size:24px;margin:0 0 10px;line-height:1.3;">
                Thanks, %s! Your order is in. 🎉
              </h1>
              <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">
                Order <strong style="color:rgba(255,255,255,0.7);">%s</strong> &nbsp;·&nbsp; %s
              </p>
            </td></tr>

            %s

            <!-- Divider -->
            <tr><td style="padding-bottom:20px;">
              <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
            </td></tr>

            <!-- Items -->
            <tr><td>
              <p style="color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 4px;">
                Items Ordered
              </p>
              <table width="100%%" cellpadding="0" cellspacing="0">
                %s
              </table>
            </td></tr>

            <!-- Totals -->
            <tr><td style="padding:20px 0 28px;">
              <div style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px 20px;">
                <table width="100%%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:rgba(255,255,255,0.4);font-size:12px;padding-bottom:8px;">Subtotal</td>
                    <td align="right" style="color:rgba(255,255,255,0.6);font-size:12px;padding-bottom:8px;">%s%.2f</td>
                  </tr>
                  <tr>
                    <td style="color:rgba(255,255,255,0.4);font-size:12px;padding-bottom:12px;">Shipping (%s)</td>
                    <td align="right" style="color:rgba(255,255,255,0.6);font-size:12px;padding-bottom:12px;">%s%.2f</td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;color:#fff;font-size:14px;font-weight:700;">Total</td>
                    <td align="right" style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;color:#ef4444;font-size:16px;font-weight:900;">%s%.2f</td>
                  </tr>
                </table>
              </div>
            </td></tr>

            <!-- Payment info -->
            <tr><td style="padding-bottom:28px;">
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 18px;">
                <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px;">
                  Payment Details
                </p>
                <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;line-height:1.7;">
                  Method: <strong style="color:rgba(255,255,255,0.8);">%s</strong><br>
                  Reference: <strong style="color:rgba(255,255,255,0.8);">%s</strong>
                </p>
              </div>
            </td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
            © 2026 BLVCKMRKT &nbsp;·&nbsp; Automated message — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
		badgeColor, badgeText,
		d.FirstName, d.OrderID, deliveryLabel,
		pendingNote,
		itemRows,
		currencySymbol, d.Subtotal,
		deliveryLabel, currencySymbol, d.ShippingFee,
		currencySymbol, d.Total,
		methodLabel, d.OrderID,
	)
}

// imageTag returns an <img> if URL is set, or a placeholder div.
func imageTag(url string) string {
	if url == "" {
		return `<div style="width:44px;height:44px;background:#222;border-radius:6px;"></div>`
	}
	return fmt.Sprintf(`<img src="%s" width="44" height="44" style="display:block;width:44px;height:44px;object-fit:cover;border-radius:6px;" alt="">`, url)
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand New-Order Notification Email
// ─────────────────────────────────────────────────────────────────────────────

// BrandOrderNotificationData holds everything needed to tell a brand that a
// buyer just purchased their product(s). Sent per-brand, scoped to only the
// items in the order that belong to that brand — an order can span multiple
// brands, and each brand should only see (and be notified about) their own
// items, not the whole order.
type BrandOrderNotificationData struct {
	BrandName  string
	BrandEmail string
	OrderID    string
	BuyerName  string
	Currency   string
	BrandTotal float64
	Items      []OrderConfirmationItem
}

// SendBrandOrderNotificationEmail notifies a brand that a new order containing
// their product(s) has been placed.
func SendBrandOrderNotificationEmail(d BrandOrderNotificationData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)
	from := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{d.BrandEmail},
		Subject: fmt.Sprintf("🛍️ New order – %s", d.OrderID),
		Html:    buildBrandOrderNotificationEmail(d),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	return nil
}

func buildBrandOrderNotificationEmail(d BrandOrderNotificationData) string {
	currencySymbol := d.Currency
	if d.Currency == "NGN" {
		currencySymbol = "₦"
	}

	itemRows := ""
	for _, item := range d.Items {
		sizeLabel := ""
		if item.Size != "" && item.Size != "—" {
			sizeLabel = fmt.Sprintf(" · Size %s", item.Size)
		}
		itemRows += fmt.Sprintf(`
		<tr>
		  <td style="padding:0 0 14px;">
		    <table width="100%%" cellpadding="0" cellspacing="0"><tr>
		      <td style="width:44px;vertical-align:top;">%s</td>
		      <td style="padding-left:12px;vertical-align:top;">
		        <p style="color:#fff;font-size:13px;margin:0 0 3px;font-weight:600;">%s%s</p>
		        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">Qty: %d</p>
		      </td>
		      <td style="text-align:right;vertical-align:top;white-space:nowrap;">
		        <p style="color:#fff;font-size:13px;margin:0;font-weight:600;">%s%.2f</p>
		      </td>
		    </tr></table>
		  </td>
		</tr>`,
			imageTag(item.ImageURL),
			item.Name, sizeLabel,
			item.Quantity,
			currencySymbol, item.Total,
		)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Order</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:520px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
                BLVCK<span style="color:#ef4444;">MRKT</span>
              </span>
            </td>
            <td align="right">
              <span style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid rgba(239,68,68,0.3);">
                New Order
              </span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">

          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">
            Order Notification
          </p>
          <h1 style="color:#fff;font-size:24px;margin:0 0 10px;line-height:1.3;">
            You've got a sale, %s! 🎉
          </h1>
          <p style="color:rgba(255,255,255,0.45);font-size:13px;line-height:1.7;margin:0 0 24px;">
            %s just purchased from your storefront on BLVCKMRKT. Order
            <strong style="color:#fff;">%s</strong>.
          </p>

          <!-- Items -->
          <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            %s
          </table>

          <!-- Total -->
          <div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            <table width="100%%" cellpadding="0" cellspacing="0"><tr>
              <td style="color:rgba(255,255,255,0.4);font-size:12px;">Your Total</td>
              <td align="right" style="color:#ef4444;font-size:16px;font-weight:900;">%s%.2f</td>
            </tr></table>
          </div>

          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.6;">
              📦 Log in to your Brand Studio dashboard to view fulfilment details and update the order status.
            </p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
            © 2026 BLVCKMRKT &nbsp;·&nbsp; Automated message — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
		d.BrandName, d.BuyerName, d.OrderID,
		itemRows,
		currencySymbol, d.BrandTotal,
	)
}

// ── Payout Email ───────────────────────────────────────────────────────────────

// PayoutEmailData holds everything needed to render the payout email.
type PayoutEmailData struct {
	BrandName    string
	BrandEmail   string
	Amount       float64
	Currency     string
	OrderID      string
	Reference    string
	Gateway      string
	AccountName  string
	AccountNumber string
	BankName     string
}

// SendPayoutEmail notifies a brand that BLVCKMRKT has sent them a payout.
func SendPayoutEmail(d PayoutEmailData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)
	from := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{d.BrandEmail},
		Subject: fmt.Sprintf("💸 You've been paid — Order %s", d.OrderID),
		Html:    buildPayoutEmail(d),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	return nil
}

func buildPayoutEmail(d PayoutEmailData) string {
	currencySymbol := d.Currency
	if d.Currency == "NGN" {
		currencySymbol = "₦"
	}

	gatewayLabel := d.Gateway
	switch d.Gateway {
	case "paystack":
		gatewayLabel = "Paystack"
	case "flutterwave":
		gatewayLabel = "Flutterwave"
	case "manual":
		gatewayLabel = "Bank Transfer"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You've Been Paid</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:520px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
                BLVCK<span style="color:#ef4444;">MRKT</span>
              </span>
            </td>
            <td align="right">
              <span style="background:rgba(34,197,94,0.15);color:#22c55e;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid rgba(34,197,94,0.3);">
                Payout Sent
              </span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">

          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">
            Payment Notification
          </p>
          <h1 style="color:#fff;font-size:26px;margin:0 0 10px;line-height:1.2;">
            You've been paid, %s! 🎉
          </h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.7;margin:0 0 28px;">
            BLVCKMRKT has processed your payout for order
            <strong style="color:#fff;">%s</strong>.
            The funds have been sent to your registered bank account.
          </p>

          <!-- Amount Box -->
          <div style="background:#0a0a0a;border:2px solid rgba(34,197,94,0.3);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 10px;">
              Amount Credited
            </p>
            <span style="font-family:Georgia,serif;font-size:48px;font-weight:900;color:#22c55e;letter-spacing:0.02em;">
              %s%.2f
            </span>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:10px 0 0;">
              %s
            </p>
          </div>

          <!-- Payout Details -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 14px;">
              Payout Details
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding-bottom:8px;">Order</td>
                <td align="right" style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;padding-bottom:8px;">%s</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding-bottom:8px;">Reference</td>
                <td align="right" style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;padding-bottom:8px;font-family:monospace;">%s</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding-bottom:8px;">Via</td>
                <td align="right" style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;padding-bottom:8px;">%s</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;padding-bottom:8px;">Bank</td>
                <td align="right" style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;padding-bottom:8px;">%s</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;">Account</td>
                <td align="right" style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;font-family:monospace;">%s (%s)</td>
              </tr>
            </table>
          </div>

          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.6;">
              💡 Allow 1–3 business days for the funds to reflect in your account depending on your bank.
              If you have any questions, contact us at <strong style="color:rgba(255,255,255,0.5);">support@blvckmrkt.com</strong>
            </p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
            © 2026 BLVCKMRKT &nbsp;·&nbsp; Automated message — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
		d.BrandName, d.OrderID,
		currencySymbol, d.Amount, d.Currency,
		d.OrderID, d.Reference, gatewayLabel,
		d.BankName, d.AccountNumber, d.AccountName,
	)
}

// ─────────────────────────────────────────────────────────────────────────────
// Partnership Welcome Email
// ─────────────────────────────────────────────────────────────────────────────

// PartnershipWelcomeData holds everything needed for the welcome email.
type PartnershipWelcomeData struct {
	BrandName  string
	FirstName  string
	Email      string
	SignedAt   string // formatted date string
}

// SendPartnershipWelcomeEmail sends a branded welcome + approval email to the brand.
func SendPartnershipWelcomeEmail(d PartnershipWelcomeData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)
	from   := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{d.Email},
		Subject: fmt.Sprintf("🎉 Welcome to BLVCKMRKT — %s is now a Partner", d.BrandName),
		Html:    buildPartnershipWelcomeEmail(d),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	return nil
}

// Update ONLY the buildPartnershipWelcomeEmail function in utils/email.go
// Replace the existing function with this one:

func buildPartnershipWelcomeEmail(d PartnershipWelcomeData) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Welcome to BLVCKMRKT</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
                BLVCK<span style="color:#ef4444;">MRKT</span>
              </span>
            </td>
            <td align="right">
              <!-- ✅ Changed badge from "Partner Approved" to "Under Review" -->
              <span style="background:rgba(234,179,8,0.12);color:#eab308;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:5px 14px;border-radius:20px;border:1px solid rgba(234,179,8,0.3);">
                ⏳ Under Review
              </span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Hero Banner -->
        <tr><td style="background:linear-gradient(135deg,#0d0d0a 0%%,#0d0d0d 60%%,#0a0a0a 100%%);padding:48px 36px 36px;border-bottom:1px solid rgba(234,179,8,0.08);text-align:center;">
          <!-- Icon — clock/review instead of checkmark -->
          <div style="width:72px;height:72px;border-radius:50%%;background:rgba(234,179,8,0.08);border:2px solid rgba(234,179,8,0.3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
            <span style="font-size:32px;">🔍</span>
          </div>
          <h1 style="color:#fff;font-size:28px;margin:0 0 10px;line-height:1.2;font-weight:900;letter-spacing:0.02em;">
            Agreement Received —<br />
            <span style="color:#eab308;">Screening in Progress</span>
          </h1>
          <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:0;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
            Partnership Agreement Signed · Awaiting Verification
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 36px 28px;">

          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">
            Hello %s,
          </p>
          <h2 style="color:#fff;font-size:22px;margin:0 0 16px;line-height:1.3;">
            Thank you for signing the BLVCKMRKT Brand Partnership Agreement.
          </h2>

          <!-- ✅ Honest, clear message about the screening process -->
          <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.85;margin:0 0 12px;">
            We've received and recorded your agreement for
            <strong style="color:#fff;">%s</strong>.
            However, before we grant you full access to the platform, the
            <strong style="color:#fff;">BLVCKMRKT team</strong> will now conduct
            a screening process to verify that your brand is legitimate and meets
            our marketplace standards.
          </p>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.85;margin:0 0 28px;">
            This is a standard step we take for every brand — we owe it to our
            buyers and the integrity of the marketplace to ensure that every
            brand on BLVCKMRKT is <strong style="color:#fff;">real, credible, and ready to sell</strong>.
          </p>

          <!-- ✅ What we're checking — transparent breakdown -->
          <div style="background:#0a0a0a;border:1px solid rgba(234,179,8,0.2);border-radius:12px;padding:24px;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 18px;">
              What Our Team Is Reviewing
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:14px;vertical-align:top;width:24px;">
                  <span style="color:#eab308;font-size:13px;">—</span>
                </td>
                <td style="padding-bottom:14px;padding-left:10px;">
                  <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 2px;">Brand Authenticity</p>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;line-height:1.6;">Verifying that %s is a real, operating brand and not a fraudulent or placeholder entity.</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px;vertical-align:top;width:24px;">
                  <span style="color:#eab308;font-size:13px;">—</span>
                </td>
                <td style="padding-bottom:14px;padding-left:10px;">
                  <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 2px;">Product Legitimacy</p>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;line-height:1.6;">Confirming that you have real products available for sale that meet our listing standards.</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px;vertical-align:top;width:24px;">
                  <span style="color:#eab308;font-size:13px;">—</span>
                </td>
                <td style="padding-bottom:14px;padding-left:10px;">
                  <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 2px;">Fulfilment Capability</p>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;line-height:1.6;">Ensuring you have the operational capacity to fulfil orders placed through the platform.</p>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;width:24px;">
                  <span style="color:#eab308;font-size:13px;">—</span>
                </td>
                <td style="padding-left:10px;">
                  <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 2px;">Agreement Compliance</p>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;line-height:1.6;">Cross-checking that the details submitted align with the partnership terms you agreed to.</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- ✅ Agreement details box -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 14px;">
              Your Agreement Record
            </p>
            <table width="100%%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:rgba(255,255,255,0.35);font-size:12px;padding-bottom:10px;">Brand</td>
                <td align="right" style="color:#fff;font-size:12px;font-weight:700;padding-bottom:10px;">%s</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.35);font-size:12px;padding-bottom:10px;">Agreement</td>
                <td align="right" style="color:rgba(255,255,255,0.7);font-size:12px;padding-bottom:10px;">Brand Partnership Agreement v1.0</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.35);font-size:12px;padding-bottom:10px;">Status</td>
                <td align="right">
                  <span style="background:rgba(234,179,8,0.1);color:#eab308;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:3px 10px;border-radius:20px;border:1px solid rgba(234,179,8,0.25);">
                    ⏳ Pending Screening
                  </span>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;color:rgba(255,255,255,0.35);font-size:12px;">Signed</td>
                <td align="right" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;color:rgba(255,255,255,0.5);font-size:12px;">%s</td>
              </tr>
            </table>
          </div>

          <!-- ✅ Timeline expectation -->
          <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.12);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;">
              What Happens Next
            </p>
            <p style="color:rgba(255,255,255,0.55);font-size:13px;line-height:1.8;margin:0 0 12px;">
              Our team typically completes the screening process within
              <strong style="color:#fff;">2–5 business days</strong>.
              Once your brand has been verified, you'll receive a separate
              email confirming your approval and granting you full access to
              set up your storefront, list products, and start selling.
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.8;margin:0;">
              If we need any additional information from you during the review,
              we'll reach out directly to
              <strong style="color:rgba(255,255,255,0.7);">%s</strong>.
              Please keep an eye on your inbox.
            </p>
          </div>

          <!-- ✅ What NOT to do while waiting -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 10px;">
              While You Wait
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;line-height:1.8;">
              You can go ahead and complete your subscription checkout to reserve your plan —
              your storefront will be activated automatically once your brand clears screening.
              You may also begin preparing your product catalogue and brand assets
              (logo, banner, descriptions) so you're ready to go live immediately upon approval.
            </p>
          </div>

          <!-- ✅ Support note -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:14px 18px;">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.7;">
              Have questions about the screening process? Reach out to us at
              <strong style="color:rgba(255,255,255,0.5);">support@blvckmrkt.com</strong> —
              we'll be happy to walk you through what to expect.
            </p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <table width="100%%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
                © 2026 BLVCKMRKT &nbsp;·&nbsp; Automated message — please do not reply.<br>
                This email was sent because you signed the BLVCKMRKT Brand Partnership Agreement.
              </p>
            </td>
            <td align="right" style="vertical-align:bottom;">
              <span style="font-family:Georgia,serif;font-size:16px;font-weight:900;color:rgba(255,255,255,0.08);letter-spacing:0.06em;">
                BLVCK<span style="color:rgba(239,68,68,0.15);">MRKT</span>
              </span>
            </td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
		// Args in order of %s placeholders:
		d.FirstName,    // "Hello %s,"
		d.BrandName,    // "received and recorded your agreement for %s"
		d.BrandName,    // "Verifying that %s is a real..."
		d.BrandName,    // "Your Agreement Record" → Brand row
		d.SignedAt,     // Signed date
		d.Email,        // "we'll reach out directly to %s"
	)
}