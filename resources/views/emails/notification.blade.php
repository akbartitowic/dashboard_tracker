<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification - Tracker BPKP</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;color:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);">
        <tr><td style="background:linear-gradient(135deg, {{ $header_color ?? '#6366f1' }} 0%, {{ $header_color_end ?? '#8b5cf6' }} 100%);padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">{{ $icon ?? '📋' }}</div>
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">{{ $title }}</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">Tracker BPKP — Sistem Manajemen Proyek</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">Halo,</p>
          <p style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 24px;"><strong style="color:#a78bfa;">{{ $username }}</strong> — {{ $message_body }}</p>
          <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:24px;">
            <div style="color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">DETAIL {{ $target_type }}</div>
            <div style="color:#f1f5f9;font-size:16px;font-weight:700;margin-bottom:16px;">{{ $target_name }}</div>
            <hr style="border:none;border-top:1px solid #1e293b;margin:12px 0;">
            <table width="100%" cellpadding="0" cellspacing="8">
              {{ $slot ?? '' }}
            </table>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">Buka aplikasi Tracker untuk melihat detail selengkapnya dan mulai mengerjakannya.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
          <p style="color:#475569;font-size:11px;margin:0;">Pesan ini dikirim otomatis oleh <strong style="color:#64748b;">Tracker BPKP</strong>. Jangan balas email ini.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
