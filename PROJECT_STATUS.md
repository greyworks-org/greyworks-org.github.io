# Greyworks Twin — Güncel Durum (Dobby için yetkili kaynak)

Lifecycle: **MAINTENANCE (canlıda / live)**. Site **greyworks.org** adresinde YAYINDA
(HTTP 200). dobby.greyworks.org twin servisi de ayakta. Bu projede "deploy et",
"yayına al", "canlıya çıkar", "publish" türü iş ÜRETME — zaten canlıda.

## CANLIDA / TAMAMLANDI (yeniden önerme)
- **greyworks.org**: production'da, herkese açık, çalışıyor.
- **Twin sayfası**: chat-first layout redesign yapıldı, model adı düzeltildi.
- **.env config**: startup'ta yükleniyor; .env.example + sudoers ops kuralı eklendi.
- Twin servisi systemd altında çalışıyor.

## DOBBY İÇİN KURAL
Şunlar için task ÜRETME / öneri yapma: "siteyi yayına al", "public URL'de yayınla",
"deploy", "go live", "launch". Site zaten canlı. Sadece GERÇEK bildirilmiş bir bug,
düşmüş servis (live-check unreachable), veya Utku'nun açık isteği üzerine hareket et.
Var olmayan özellik UYDURMA.

_Not: Durum değişirse bu dosyayı güncelle — Dobby bunu yetkili kaynak olarak okuyor._
