# Greyworks Twin — Güncel Durum (Dobby için yetkili kaynak)

Lifecycle: **MAINTENANCE (canlıda / live)**. Site **greyworks.org** adresinde YAYINDA
(HTTP 200). Production source bu repo içindeki `main` branch'tir. 20 Ağustos 2026
güncellemesi local source üzerinde hazırlanmış ve production deploy onayı bekliyor.
dobby.greyworks.org twin servisi de ayakta. Bu projede "deploy et",
"yayına al", "canlıya çıkar", "publish" türü iş ÜRETME — zaten canlıda.

## CANLIDA / TAMAMLANDI (yeniden önerme)
- **greyworks.org**: production'da, herkese açık, çalışıyor.
- **Site redesign fixes**: local source'ta hazırlandı. Production'a gönderilmedi.
  Küçük gerçek marka logosu, sıcak Greyworks paleti, merkezdeki büyük logo asset'inin
  kaldırılması, gerçek servis ve kullanım senaryolarının geri getirilmesi, LullyTale
  ürün görselleri, Games akışının kaldırılması, ana sayfaya taşınan native Breaker,
  mobil menü a11y düzeltmeleri ve Contact Slingshot etkileşimi eklendi. Ana sayfa
  artık yalnızca sloganlardan oluşmuyor; altı servis alanı, altı kullanım senaryosu,
  ürün bilgileri ve çalışma süreci içeriyor.
- **Contact backend**: `/api/contact` frontend sözleşmesi hazır. Repo GitHub Pages
  kullandığı için endpoint production'da henüz çalışmıyor. Hosting/API kararı ve
  mail delivery secret'ları olmadan canlıya hazır kabul edilmiyor.
- **Twin sayfası**: chat-first layout redesign yapıldı, model adı düzeltildi.
- **.env config**: startup'ta yükleniyor; .env.example + sudoers ops kuralı eklendi.
- Twin servisi systemd altında çalışıyor.

## DOBBY İÇİN KURAL
Şunlar için task ÜRETME / öneri yapma: "siteyi yayına al", "public URL'de yayınla",
"deploy", "go live", "launch". Site zaten canlı. Sadece GERÇEK bildirilmiş bir bug,
düşmüş servis (live-check unreachable), veya Utku'nun açık isteği üzerine hareket et.
Var olmayan özellik UYDURMA.

_Not: Durum değişirse bu dosyayı güncelle — Dobby bunu yetkili kaynak olarak okuyor._

## 30 EYLÜL 2026 (canlıda)

**Tasarım yönü:** Koyu lacivert + ember turuncu (`#0a1020` / `#ff7a59`), Sora +
DM Sans + JetBrains Mono. Kaynak: kullanıcının kendi Claude Design taslağı.
Mor v4 ve sıcak kâğıt editorial denemeleri reddedildi. Detay:
GREYWORKS_AI_HANDOFF.md bölüm 0.

21 Ağustos turunun düzeltmeleri 30 Eylül'de production'a push edildi. `.env`
artık takipte değil ve `https://greyworks.org/.env` 404 dönüyor.

## 21 AĞUSTOS 2026 TURU

P0 (bozuk işlev), P1 (içerik bütünlüğü), P2 (tasarım tutarlılığı) ve P3 (temizlik)
turları tamamlandı. Gate: `npm test` → 41/41.

Düzeltilen bloker'lar: contact formu mobilde iki sütunda 147px'e sıkışıyordu;
Breaker'ın Start/Pause/Restart butonları koyu zeminde görünmezdi; kapalı mobil menü
klavyeyle gezilebiliyordu; usecases listelerinde madde işareti yoktu; hero görselinde
yarım kesik wordmark vardı; `.text-label` global `display:none` 17 gerçek içerik
parçasını gizliyordu.

Services ve usecases sayfaları kart gridinden ana sayfayla aynı editorial satır
yapısına geçirildi. Section ritmi 320px ölü boşluktan ~156px'e indirildi. Kontrast
token'ları AA'ya çekildi. `styles.css` 2286 → ~2010 satır, ölü v4 katmanı
(particle, cursor glow, sahte metrik, shimmer, marquee, showcase, games) kaldırıldı.
`site.js` 588 → ~230 satır, 7 ölü fonksiyon ve GSAP dalı çıkarıldı.

## AÇIK KALAN

- **`.env` git'te tracked ve `https://greyworks.org/.env` üzerinden public.**
  `UPSTREAM_API_KEY` rotate edilmeli. `.gitignore`'a eklendi ama takipten
  çıkarılmadı (`git rm --cached .env` gerekiyor).
- `/api/contact` backend yok. Form artık hata durumunda mail adresini gösteriyor.
- LullyTale "38+ story" ve "Spanish in development" iddiaları doğrulanmadı.
- Production deploy yapılmadı, kullanıcı onayı bekliyor.

## AI DEVİR DOKÜMANI

Detaylı proje geçmişi, kullanıcı geri bildirimleri, tasarım kararları, teknik sınırlar,
QA kanıtları ve sonraki AI için çalışma kuralları:

`GREYWORKS_AI_HANDOFF.md`
