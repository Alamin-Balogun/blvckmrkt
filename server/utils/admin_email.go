package utils

import (
	"fmt"
	"os"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/resend/resend-go/v3"
)

// SendAdminOTPEmail sends the 2FA login code to an admin's inbox.
func SendAdminOTPEmail(toEmail, firstName, otp string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	client := resend.NewClient(apiKey)
	from   := fmt.Sprintf("%s <%s>", config.App.EmailFromName, config.App.EmailFrom)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{toEmail},
		Subject: "BLVCKMRKT Admin — Your 2FA Login Code",
		Html:    buildAdminOTPEmail(firstName, otp),
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	return nil
}

func buildAdminOTPEmail(firstName, otp string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin 2FA Code</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:520px;width:100%%;">

        <tr><td style="background:#0d0d0d;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;">
            BLVCK<span style="color:#ef4444;">MRKT</span>
            <span style="font-size:11px;font-family:system-ui;font-weight:400;color:rgba(255,255,255,0.3);letter-spacing:0.2em;margin-left:8px;">ADMIN</span>
          </span>
        </td></tr>

        <tr><td style="padding:36px 36px 28px;">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">
            Two-Factor Authentication
          </p>
          <h1 style="color:#fff;font-size:24px;margin:0 0 16px;line-height:1.2;">
            Hey %s, here's your login code
          </h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.7;margin:0 0 28px;">
            A login attempt was made on your admin account.
            Enter the code below to complete sign-in.
            It expires in <strong style="color:#fff;">15 minutes</strong>.
          </p>

          <div style="background:#0a0a0a;border:2px solid rgba(239,68,68,0.4);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 14px;">
              2FA Code
            </p>
            <span style="font-family:Georgia,monospace;font-size:48px;font-weight:900;color:#ef4444;letter-spacing:0.6em;padding-left:0.6em;">
              %s
            </span>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:14px 0 0;">
              Expires in 15 minutes
            </p>
          </div>

          <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 18px;">
            <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;line-height:1.6;">
              🔒 If you did not attempt to log in, your password may be compromised.
              Change it immediately and contact your system administrator.
            </p>
          </div>
        </td></tr>

        <tr><td style="background:#0d0d0d;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;line-height:1.6;">
            © 2026 BLVCKMRKT Admin &nbsp;·&nbsp; Do not reply to this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`, firstName, otp)
}