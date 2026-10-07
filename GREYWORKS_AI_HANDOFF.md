# Greyworks AI Devir Dokümanı

Son güncelleme: 2026-08-21 (P0-P3 düzeltme turu sonrası)  
Kaynak repo: `/Users/utku/Documents/WASK-Konuları/greyworks-live-source`  
Yerel URL: `http://127.0.0.1:8789/`

Bu dosya, başka bir AI veya geliştiricinin projeyi devralması için hazırlanmıştır. Önce bu dosyayı, sonra gerçek kaynak dosyalarını ve browser ekran görüntülerini oku. Eski tasarım kararlarını otomatik olarak doğru kabul etme. Kullanıcının doğrudan verdiği geri bildirimler, tasarımda en yüksek önceliğe sahiptir.

## 1. Projenin amacı

Greyworks, analog atölye disipliniyle dijital ürünler yapan küçük, bağımsız bir ürün stüdyosu olarak konumlanıyor.

Web sitesi:

- Gerçek son kullanıcıya dönük olmalı.
- Ürünleri, servisleri ve çalışma biçimini açıkça anlatmalı.
- Profesyonel ürün stüdyosu gibi görünmeli.
- Tasarım referanslarının yüzeyini kopyalamamalı.
- Yapay zekâ ile üretilmiş genel landing page şablonlarına benzememeli.
- Sade olabilir, boş olmamalı.
- Kısa metin kullanabilir, gerçek içeriği silmemeli.

Ana kullanıcı aksiyonu: ürünleri ve Greyworks'in ne yaptığını anlamak, sonra iletişim kurmak.

## 2. Kaynak ve kapsam sınırları

### Doğru kaynak

Çalışılacak repo:

`/Users/utku/Documents/WASK-Konuları/greyworks-live-source`

Bu repo GitHub Pages tabanlı canlı ana site kaynağıdır:

`https://github.com/greyworks-org/greyworks-org.github.io`

### Yanlış kaynak

`/Users/utku/greyworks-redesign` ana site kaynağı değildir. `greyworks-org/digital-twin` reposuna bağlıdır. Ana siteyi buradan yeniden kurma.

`/Users/utku` kökü başka bir çalışma alanıdır. Git stage, commit, reset, restore veya push işlemi bu kökten yapılmayacak.

### Kullanıcı görselleri

Repo içinde:

- `greyworks-logo-192.png`: header ve footer için küçük logo.
- `greyworks-logo-512.png`: metadata veya yüksek çözünürlüklü marka kullanımı.
- `greyworks-banner.jpg`: 1200x655, merkezde büyük Greyworks logosu bulunan kâğıt görseli.
- `greyworks-banner.png`: 1916x821, aynı marka görselinin PNG kopyası.

Kullanıcının son kararı: büyük logo hero veya header içinde kullanılmayacak. Header'da yazının yanında küçük marka işareti kullanılacak. Banner, büyük logo problemi yaratacak şekilde ana hero'ya konulmamalı.

### Diğer görseller

LullyTale görselleri gerçek ürün anlatımı için kullanılabilir:

- `lullytale/assets/feature-graphic.png`
- `lullytale/assets/screenshot-01.png`
- `lullytale/assets/screenshot-03.png`
- `lullytale/assets/screenshot-05.png`
- `lullytale/assets/screenshot-07.png`
- `lullytale/assets/story-*.png`

`hero.png`, `stockwise.png`, `bridgelingo.png`, `og.png` kullanıcı tarafından ana marka görselleri olarak onaylanmış değil. Koyu, sentetik, dashboard benzeri görseller AI üretimi hissi verdiği için kullanıcı açıkça onaylamadan primary visual olarak kullanılmamalı.

## 3. Kullanıcı geri bildirimlerinin kronolojisi

### İlk yön

Kullanıcı Greyworks banner ve logosunu verdi. İstenen yön:

- Greyworks markasına uygun gri, kâğıt, kömür, ahşap ve amber dengesi.
- Analog, vintage ve geleneksel atölye hissi ile dijital ürün üretimi arasında kontrast.
- Modern ama genel SaaS sitesine benzemeyen arayüz.
- Gerçek görseller, dinamik ögeler, iyi geçişler.
- Kartlı tasarımın mümkün olduğunca kullanılmaması.
- Tüm site, sadece ana sayfa değil, rota ve işlev bazında incelenmeli.

### Canlı audit ve ilk plan

Canlı site audit'i yapıldı. Sağlık skoru 69/100 olarak raporlandı:

`/Users/utku/Documents/WASK-Konuları/output/research/greyworks-site-audit-2026-07-15.md`

İlk plana göre:

- Anlamlı rotalar korunacaktı.
- Slingshot kaynak doğrulanmadan uydurulmayacaktı.
- Contact form backend sözleşmesi kurulacaktı.
- Breaker native Canvas ile yapılacaktı.
- Sahte metrikler, 404 mağaza linkleri ve `href="#"` temizlenecekti.
- Mobil menü erişilebilirliği düzeltilecekti.
- Ürün, servis ve use case içeriği gerçek bağlantılarla korunacaktı.

### Kullanıcı referans ekran görüntüleri

Kullanıcı canlı siteden aldığı ekran görüntülerini referans verdi. Beğendiği özellikler:

- Açık, sakin arka plan.
- Büyük serif başlık.
- Geniş boşluk kullanımı.
- Az ama etkili metin.
- İnce çizgiler ve kontrollü renk.
- Gerçek içerik taşıyan görsel alanlar.
- Doğal, stüdyo benzeri his.

İstemediği özellikler:

- Her yerde noktalar.
- Mor veya mavi SaaS gradyanları.
- Yapay rozetler.
- Gereksiz açıklama paragrafı.
- Başlığın hemen altında uzun açıklama.
- Simetrik üçlü kart yapıları.
- Dekoratif ikon kartları.
- AI tarafından yazılmış gibi duran başlıklar.
- Genel, boş ve şablon landing page görünümü.

### 2026-08-20 doğrudan geri bildirim

Kullanıcı şunları açıkça söyledi:

1. Kocaman logo kaldırılmalı. Yazının yanında küçük logo kullanılmalı.
2. Renkler Greyworks temasıyla görsel olarak uyumlu olmalı.
3. Games bölümü kaldırılmalı. Linebreaker başka uygun bir alana taşınmalı.
4. Contact sayfasında Slingshot gamification mekanizması geri bulunmalı.
5. Başlıklar, metinler, düğmeler, renkler ve yerleşim AI üretimi gibi durmamalı.
6. `no-ai-slop` benzeri yaklaşımlar dikkate alınmalı.
7. Başlığın altında açıklama olmamalı.
8. Kullanıcıya gerçek bir websitesi sunulmalı, sadece stil denemesi yapılmamalı.

### Olumsuz sonuç ve düzeltme talebi

İlk sadeleştirme sonrası kullanıcı siteyi boş buldu. Bunun nedeni gerçek içeriğin gereğinden fazla silinmesiydi.

Hatanın kökü:

- Orijinal 6 servis alanı 3 satıra indirildi.
- 6 kullanım senaryosu ana sayfadan kaldırıldı.
- Ürün kanıtı yalnızca kısa bir LullyTale bloğuna indirildi.
- Greyworks'in ürün stüdyosu kimliği yerine tek bir slogan bırakıldı.
- Görsel referans alınırken bilgi mimarisi korunmadı.
- Global CSS override'ları içerik katmanını gizledi.

Son düzeltme prensibi:

> Sadeleştir, fakat gerçek içeriği silme. Kartları kaldır, bilgiyi kaldırma.

## 4. Son tasarım prensipleri

### Görsel dil

- Arka plan: kâğıt ve sıcak gri.
- Metin: kömür/siyaha yakın.
- Vurgu: amber ve pas turuncusu.
- İnce çizgiler: bölüm ve liste ayrımı için.
- Serif: büyük editorial başlıklar.
- Grotesk: gövde, navigasyon, form ve teknik bilgi.
- Fotoğraf/ürün görseli: gerçek ürün veya marka kaynağı.
- Hareket: hover, scroll ve etkileşim için sınırlı ve anlamlı.

### Renk token'ları

```css
--bg: #eee8de;
--bg-raised: #ded2c1;
--surface: #f8f2e8;
--text: #1d1b18;
--text-secondary: #5e5951;
--text-muted: #82776a;
--accent: #b87832;
--accent-bright: #a44d2f;
--border-strong: rgba(29,27,24,0.32);
```

### Tipografi ve yerleşim

- Display: `Georgia`, `Times New Roman`, serif fallback.
- UI/body: `Manrope`.
- Büyük başlıklarda sıkı satır yüksekliği ve negatif harf aralığı kullanılabilir.
- Başlık boyutu içerik gücünü aşmamalı.
- Hero başlığı altında uzun açıklama bulunmamalı.
- Kart yerine yatay editorial listeler, numaralı satırlar ve iki sütunlu metin/görsel bölümleri kullanılmalı.
- Ürün detayları için kısa definition list ve gerçek görsel şeritleri kullanılabilir.
- Her bölüm tek bir görev yapmalı.

## 5. Mevcut ana sayfa yapısı

`index.html` son durumda şu sıradadır:

1. Hero
   - `A small studio with care.`
   - LullyTale ürün görseli.
   - `See the work` bağlantısı.
   - Başlık altında açıklama yok.
2. Studio intro
   - `We make the part people use.`
   - Greyworks'in ürün, site ve sistem üretme yaklaşımı.
3. Services
   - Product builds
   - GTM and growth
   - Automation
   - Digital surfaces
   - Creator products
   - Store and launch
4. Work
   - LullyTale görseli.
   - Ürün açıklaması.
   - English/Turkish, babies and toddlers, Flutter bilgileri.
   - Story artwork şeridi.
5. Use cases
   - Launch a product from scratch
   - Make daily work lighter
   - Help the right people find it
   - Modernize a digital presence
   - Make a small product real
   - Give the team a better surface
6. Process
   - Talk
   - Choose
   - Make
7. Studio experiment
   - Breaker native Canvas.
8. CTA
   - `Tell us what you're making.`
9. Footer

Bu içerik sırası korunmalı. Yeni AI önce içerik kaynağını okumalı, sonra görsel iyileştirme yapmalı.

## 6. Rotalar ve durumları

| Rota | Durum | Not |
|---|---|---|
| `/` | Yenilendi | İçerik yoğun ana sayfa, LullyTale, servisler, use cases, Breaker |
| `/about/` | Korundu ve tema hizalandı | Utku Bozkurt ve çalışma yaklaşımı |
| `/services/` | Korundu ve tema hizalandı | Servis içerikleri, süreç, iletişim CTA'sı |
| `/usecases/` | Korundu ve tema hizalandı | 6 kullanım senaryosu ve teslim kapsamı |
| `/lullytale/` | Korundu | Ürün detayları, story library, screenshots, support/privacy bağlantıları |
| `/contact/` | Fonksiyonel olarak güncellendi | POST form, Slingshot, hesap silme ve ilgili sayfalar |
| `/support/` | Korundu | LullyTale ve genel destek |
| `/privacy/` | Korundu | Gizlilik metni |
| `/terms/` | Korundu | Kullanım şartları |
| `/games/` | Public navigasyondan çıkarıldı | Eski bağlantı uyumluluğu için `/#experiment` redirect |
| `/utku-bozkurt/` | Yeniden yazılmadı | Kişisel profil, ana akıştan footer'a bırakıldı |

Ana navigasyon:

- Home
- About
- Services
- Use Cases
- Contact

Games navigasyonda görünmemeli. Gemini markası hiçbir public HTML içinde bulunmamalı.

## 7. Contact ve Slingshot

Contact form:

```text
POST /api/contact
```

İstek alanları:

```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string",
  "website": "string"
}
```

Frontend'de mevcut:

- `action="/api/contact"`
- `method="post"`
- Label ve input ID eşleşmesi.
- Honeypot `website` alanı.
- Alan doğrulama.
- `aria-live="polite"` durum alanı.
- Çift gönderim koruması.
- Ağ/API sonucu için hata durumu.
- `slingshot.js` native Canvas drag etkileşimi.

Slingshot davranışı:

- Kullanıcı ipi aşağı çeker.
- Yeterli mesafe sonrası bırakınca form gönderilir.
- Form geçersizse gönderim yapılmaz.
- Klavye Enter/Space fallback'i bulunur.
- Başarıda `greyworks:contact-result` olayı ile durum güncellenir.
- Başarısızlıkta tekrar deneme mümkün kalır.
- Mailto ile form gönderimi yapılmaz.

Production eksikliği:

- `/api/contact` gerçek backend olarak repo içinde yok.
- GitHub Pages statik hosting POST endpoint'i çalıştırmaz.
- Lokal statik server'da POST sonucu 501 alınması beklenir.
- Hosting/API ve mail sağlayıcı kararı verilmeden form production'da tamamlanmış sayılmayacak.
- Secret değerler kaynak dosyaya konulmayacak.

## 8. Breaker

`breaker.js` native Canvas kullanır. Dış kütüphane gerektirmez.

Durumlar:

```text
READY → PLAYING → PAUSED
PLAYING → GAME_OVER
PLAYING → WON
GAME_OVER → PLAYING
WON → PLAYING
```

Kontroller:

- Masaüstü: ok tuşları, mouse.
- Mobil: touch.
- Klavye: Space başlatır, P duraklatır.
- `prefers-reduced-motion` gölge ve hareket efektlerini azaltır.
- Canvas DOM ölçüsü: `960x540`.

Breaker ana sayfada `Studio experiment` olarak bulunur. Yeni bir AI bunu Games sayfası veya ana navigasyon öğesi haline getirmemeli.

## 9. Teknik dosyalar

| Dosya | Görevi |
|---|---|
| `index.html` | Ana sayfa ve ana içerik akışı |
| `styles.css` | Tasarım sistemi, eski stiller ve son override katmanı |
| `site.js` | Header, nav, reveal, anchor, contact form, scroll davranışları |
| `breaker.js` | Native Breaker oyunu |
| `slingshot.js` | Contact Canvas etkileşimi |
| `fluid-orb.js` | WebGL ile çizilen hareketli küre. Henüz hiçbir sayfada kullanılmıyor |
| `.mcp.json` | Claude Code için shadcn MCP sunucusu tanımı |
| `services/index.html` | Servis sayfası |
| `usecases/index.html` | Kullanım senaryoları |
| `lullytale/index.html` | Ürün sayfası |
| `smoke-check.sh` | Statik rota ve içerik kontrolü |
| `test/site-contract.test.mjs` | HTML/JS sözleşme testleri |
| `PROJECT_STATUS.md` | Dobby için kısa durum dosyası |

### Fluid orb ve shadcn MCP

`fluid-orb.js`, swamimalode07/rare-ui deposundaki `fluid-orb` shadcn bileşeninin React'siz kopyasıdır. Bu site derleme adımı olmayan düz HTML olduğu için `.tsx` bileşenleri doğrudan kullanılamaz. Kullanımı:

```html
<div class="fluid-orb" data-size="240" data-color="#ff7a59"></div>
<script src="/fluid-orb.js?v=20260930-v6"></script>
```

- `data-size` piksel cinsindendir (varsayılan 240), `data-color` hex renktir (varsayılan `#1A73F2`).
- Kürenin üst kısmı her zaman beyaza yakındır. Koyu zeminde sayfanın en parlak öğesi olur, yeri buna göre seçilmeli.
- Görünmediği zaman da her karede çizim yapar. Kalıcı bir alana konacaksa ekran dışındayken durdurulmalı.
- Yukarıdaki JS uyarısı geçerlidir: yalnızca anlamlı bir yerde kullan, süs olsun diye ekleme.

`.mcp.json`, Claude Code oturumlarına shadcn MCP sunucusunu (`npx shadcn@latest mcp`) tanıtır. Bu araçlarla shadcn kayıtlarındaki bileşenler aranabilir ve kodu görüntülenebilir. `shadcn add` bu depoda çalıştırılmamalı: React, Tailwind ve `components.json` kurulumu başlatır ve sitede kullanılamayan dosyalar üretir. Bileşen gerekiyorsa kodu `view` ile okunup `fluid-orb.js` gibi düz JS'e çevrilmeli.

### CSS uyarısı

`styles.css` geçmişte birkaç tasarım yaklaşımının üst üste eklenmesiyle büyüdü. Dosyanın sonunda `Quiet studio pass` ve `Real studio homepage` override blokları var. Yeni AI:

- Yeni bir üçüncü override katmanı eklememeli.
- Önce mevcut cascade'i anlamalı.
- Gerektiğinde eski ölü gradient, particle, card ve AI-template stillerini temizlemeli.
- Görsel değişikliği browser screenshot ile doğrulamalı.

### JS uyarısı

`site.js` içinde eski particle, GSAP, stats ve parallax fonksiyonları bulunuyor. Ana sayfada bunların bir bölümü kullanılmıyor veya CSS ile kapatılıyor. Yeni AI:

- Dots/particle sistemini tekrar açmamalı.
- Sahte sayaç eklememeli.
- GSAP'i sırf hareket varmış gibi göstermek için eklememeli.
- Motion sadece kullanıcıya anlamlı geri bildirim sağlıyorsa kullanılmalı.

## 10. Yapılmış düzeltmeler

- Header marka işareti gerçek `greyworks-logo-192.png` ile değiştirildi.
- Büyük merkez logo kompozisyonu header/hero'dan çıkarıldı.
- Gemini ve Games bağlantıları public navigasyondan çıkarıldı.
- `/games/` eski route redirect olarak korundu.
- Hero ve sayfa başlıkları serif/Manrope sistemiyle hizalandı.
- Mor/mavi SaaS görünümü bastırıldı.
- Background dots, particle canvas ve cursor glow görünür UI'dan çıkarıldı.
- Ana sayfadaki sahte metrikler kaldırıldı.
- Doğrulanmamış Google Play linkleri kaldırıldı.
- `href="#"` kontrolü yapıldı.
- Contact form backend sözleşmesi kuruldu.
- Contact form label/input erişilebilirlik ilişkileri düzeltildi.
- Slingshot native Canvas olarak geri eklendi.
- Breaker native Canvas olarak ana sayfaya taşındı.
- Mobil menü `aria-expanded` ve `aria-controls` ile düzeltildi.
- Mobil yatay taşma kontrol edildi.
- Sosyal paylaşım metadata'sındaki yanlış `.jpg` yolları `.png` olarak düzeltildi.
- Ana sayfaya 6 servis alanı ve 6 use case geri eklendi.
- Servis ve use case linkleri gerçek sayfa anchor'larına bağlandı.
- Services sayfasına `creator-products` bölümü eklendi.
- Contact büyük kart panellerinden editoryal iki sütun yapısına dönüştürüldü.

## 11. Yapılmayan veya tamamlanmamış işler

### Production deploy

Yapılmadı. Kullanıcı açıkça production yayını istemeden deploy yapılmayacak.

### Contact backend

Frontend hazır. Serverless endpoint, rate limit, same-origin, mail delivery ve secret yapılandırması tamamlanmadı.

### Live verification

Lokal browser QA yapıldı. Production sonrası tüm rotalar ve dış bağlantılar tekrar canlı browser ile kontrol edilmeli.

### PromptForge kontrolü

Kullanıcı PromptForge üzerinde tutarlılık kontrolü istedi. Bu repo içinde doğrulanmış PromptForge raporu veya sonucu bulunmuyor. Başka AI bunu yapılmış gibi yazmamalı. Gerekirse ayrı bir audit olarak çalıştırılmalı.

### Video feedback

Kullanıcının 2026-08-20 ekran kaydı bu çalışma alanında okunabilir dosya olarak bulunamadı. Kayıt izlenmiş gibi varsayım yapılmamalı.

### Git

Değişiklikler commit edilmedi. Çalışma ağacı bilinçli olarak dirty durumda. Başka AI önce `git status` ve `git diff` okumalı.

## 0. ÖNCE BUNU OKU: geçerli tasarım yönü (2026-09-30)

Sitenin görsel dili **koyu lacivert + ember turuncu**. Kaynağı kullanıcının kendi
Claude Design taslağı: `Greyworks websitesi temizleme.zip` içindeki
`Greyworks.dc.html`. O dosya bir canvas taslağıydı, siteye taşınırken şablon
içerik (Project One/Two/Three) kullanılmadı ve rota yapısı korundu.

| Token | Değer |
|---|---|
| `--bg` | `#0a1020` |
| `--surface` | `#111a30` |
| `--border-strong` | `#243052` |
| `--text` | `#eef2ff` |
| `--accent` | `#ff7a59` |
| `--on-accent` | `#1c0b05` |

Tipografi: **Sora** (display), **DM Sans** (gövde), **JetBrains Mono** (etiket,
buton, sayaç). Kartlar 24px radius, butonlar pill. Grid'ler 1px hairline ile
ayrılır (`gap:1px` + `background: var(--border-strong)`).

Denenmiş ve **reddedilmiş** yönler, geri getirilmemeli:
- Mor/mavi v4 SaaS teması (`#6c47ff`, `#f0f0f3`, Manrope)
- Sıcak kâğıt + serif editorial (`#eee8de`, amber, Georgia)

Kullanıcı ikisini de gördü ve beğenmedi. Aşağıdaki bölüm 3 ve 4 bu eski
turlardan kalma kayıtlardır, tarihsel bilgi olarak okunmalı.

### Taslaktan alınmayanlar ve nedeni

- **Şablon iş listesi.** Taslakta "Project One / Two / Three" ve "A short
  description of the project and its outcome." vardı. Yerine gerçek iki iş
  kullanıldı: Automation Pipelines ve LullyTale.
- **`hello@example.com`.** Gerçek adres `contact@greyworks.com`.
- **Tek sayfa yapısı.** Taslak sadece anchor navigasyonu kullanıyordu. Site 11
  rotalı kaldı; `/privacy/` ve `/support/` LullyTale'in store kaydına bağlı,
  kaldırılamaz.
- **Canvas runtime.** `support.js` ve `<sc-for>` kullanılmadı, içerik statik
  HTML olarak yazıldı; aksi hâlde crawler ve JS'siz ziyaretçi boş sayfa görür.

## 0b. Önceki tur: tasarım yönü 2026-08-21'de değişti

Aşağıdaki bölüm 3 ve 4, kullanıcının **daha eski** geri bildirimlerini kaydediyor
ve o kayda göre mor/mavi palet, kartlar, rozetler ve başlık altı açıklama
istenmiyordu. **Bu artık geçerli değil.**

2026-08-21'de kullanıcı, sıcak kâğıt + serif editorial yönü gördü ve reddetti:

> "hiç beğenmedim. Claude sunumu gibi duruyor. Fontlardan renklere her şey aynı.
> Canlıdaki websitesini incele: https://greyworks.org/ ben bu tarzda olmasını
> istiyorum ayrıca Lullytale vs. şeyleri bu kadar öne çıkarma generic tut"

Alınan kararlar:

| Konu | Karar |
|---|---|
| Görsel dil | Canlı sitenin v4 sistemi. `styles.css` `98a25ce` commit'inden birebir geri alındı |
| Palet | `--bg #f0f0f3`, `--accent #6c47ff` mor, `--accent2 #0ea5e9`. Sıcak kâğıt/amber **kullanılmıyor** |
| Tipografi | Yalnızca Manrope. Serif display **yok** |
| Bileşen | Yuvarlak kartlar, pill butonlar, mor ikon tile'ları, gradient mesh hero, marquee. Editorial satır yapısı **kullanılmıyor** |
| Hero | Pill rozet + büyük sans başlık + **başlık altı açıklama var** |
| Metrikler | Yok. Kullanıcı stat bloğunun geri gelmemesini seçti |
| LullyTale | Showcase'de iki eşit karttan biri. Hero görseli veya featured kart **değil** |

Serif, kâğıt paleti, amber accent veya `.detail-row` editorial satırları geri
getirilmemeli. Bunlar denendi ve reddedildi.

## 11b. 2026-08-21 düzeltme turu

### Test harness

`npm test` üç suite çalıştırır, toplam 39 test:

| Dosya | Neyi bağlar |
|---|---|
| `test/site-contract.test.mjs` | Eski statik sözleşme (form POST, breaker, games/gemini yokluğu) |
| `test/content-contract.test.mjs` | Footer tekliği, theme-color, tek H1, home↔services/usecases başlık ve sıra eşleşmesi, og:image boyutları, ölü markup yokluğu, CSS brace dengesi |
| `test/browser-qa.test.mjs` | Gerçek Chromium. Mobil contact grid, breaker kontrast, `[hidden]`, mobil menü focus, liste işaretleri, img aspect ratio, console error, mobil taşma, font tabanı, tap target, reveal (JS'li ve JS'siz), section ritmi, WCAG kontrast |

Browser suite `test/helpers/static-server.mjs` ile repo'yu kendi serve eder,
Playwright'ı makinedeki kurulumdan çözer. Playwright bulunamazsa **sessizce
atlamaz, hata verir**.

### Kurallara dönüşen kararlar

- `[hidden] { display: none !important }` reset'te. Component `display` kuralları
  script'in `hidden` ile kapattığı kontrolleri geri açıyordu.
- Reveal stilleri `.js` altında. Script çalışmazsa içerik `opacity: 0` kalmaz.
- Metin token'ları (`--text-muted`, `--accent`, `--accent-bright`) kâğıt zeminde
  ≥4.5:1. Dekoratif amber `--accent-soft` içinde ve tipografide kullanılmıyor.
- `--header-h` token'ı; mobil menü offset'i ve `scroll-margin-top` bunu kullanır.
- Section padding tavanı 176px. Test bunu ölçüyor.
- Editorial satır yapısı (`.detail-list` / `.detail-row`) home, services, usecases
  ve lullytale'de aynı. Kart grid'i geri getirilmemeli.
- Liste madde işareti ince amber çizgi, nokta değil. Kullanıcı nokta istemiyor.

### Bilinen açık konular

- `.env` git'te tracked ve canlıda public. `UPSTREAM_API_KEY` rotate edilmeli.
- `/api/contact` yok. Form hata mesajında mail adresi veriyor.
- `feature-graphic.png` (700x342) kaynak asset'te wordmark kesik. Hero'da
  screenshot üçlüsüyle değiştirildi, lullytale hero'sunda CSS ile üstten
  çerçeveleniyor. Temiz bir 1200x630 export tercih edilir.
- LullyTale "38+ story" ve "Spanish in development" doğrulanmadı.

## 12. QA kanıtları

Çalıştırılan kontroller:

```bash
node --test test/site-contract.test.mjs
node --check site.js
node --check breaker.js
node --check slingshot.js
git diff --check
xmllint --noout sitemap.xml
```

Son sonuç: 8/8 test geçti. JavaScript syntax, diff whitespace ve sitemap XML kontrolleri geçti.

Browser kontrolleri:

- `1440x900`: ana sayfa 200, console error yok.
- `375x812`: yatay taşma yok, `scrollWidth === 375`.
- Ana sayfada 6 service row bulundu.
- Ana sayfada 6 use case row bulundu.
- Hero ürün görseli görünür.
- Breaker canvas `960x540`.
- Breaker `Playing` ve `Paused` durumları gözlendi.
- Contact form label eşleşmeleri gözlendi.
- Contact Slingshot canvas mobilde `280x120` çizim alanına sahip.
- `/services/#creator-products` gerçek anchor'a gidiyor.
- `/usecases/#ops` gerçek anchor'a gidiyor.
- `href="#"`, public `/games/`, Gemini ve doğrulanmamış Play linki taramada bulunmadı.

`smoke-check.sh` dosyası mevcut. App içindeki lokal server shell tarafından erişilemediği için bu ortamda script sonucu production kanıtı sayılmamalı. Browser QA kanıtı tercih edilmeli.

## 13. Yeni AI için çalışma sırası

1. Bu dosyayı oku.
2. `PROJECT_STATUS.md` oku.
3. `git status --short` ve `git diff --stat` çalıştır.
4. `index.html`, `styles.css`, `site.js`, `services/index.html`, `usecases/index.html`, `contact/index.html` oku.
5. Lokal browser'da 1440px ve 375px ekran görüntüsü al.
6. Kullanıcının son geri bildirimini öncele.
7. İçerik silmeden görsel düzenleme yap.
8. Yeni metrik, ürün, ekip üyesi, telefon, mağaza linki veya başarı iddiası uydurma.
9. Kart, nokta, mor gradyan, sahte rozet ve AI-template hareketleri ekleme.
10. Hero altında kullanıcı istemediği açıklama paragrafını ekleme.
11. Büyük logo kullanma. Header'da küçük gerçek marka işareti kullan.
12. Her linki gerçek hedefiyle test et.
13. Contact API production sınırını gizleme.
14. Test, syntax, diff ve browser QA çalıştır.
15. Production deploy öncesi ayrıca kullanıcı onayı al.

## 14. Kalite kabul ölçütleri

Yeni çıktı şu koşulları sağlamalı:

- Kullanıcı ilk ekranda Greyworks'in ürün stüdyosu olduğunu anlar.
- İlk ekranda gerçek, ilgili görsel bulunur.
- Ana sayfa boş slogan sayfası gibi görünmez.
- Altı servis alanı korunur veya yeni bilgi mimarisi bunların tüm anlamını taşır.
- Altı kullanım senaryosu korunur veya eşdeğer içerik açıkça bulunur.
- LullyTale gerçek ürün olarak görünür.
- Contact form ve Slingshot görünür ve anlaşılırdır.
- Breaker deneysel bölüm olarak kalır, Games navigasyonu geri gelmez.
- Kullanıcı istemediği noktaları, mor gradyanları, dev logoyu ve yapay rozetleri görmez.
- Mobilde içerik okunur, görseller taşmaz.
- Console error, ölü link ve 404 asset kalmaz.
- Her iddia kaynaklı veya doğrulanmış olur.
- Tasarım sade ama içerik bakımından boş olmaz.

## 15. Kısa karar özeti

Doğru yön: içerik taşıyan sıcak editorial ürün stüdyosu.  
Yanlış yön: boş minimal slogan sayfası, mor SaaS şablonu, üçlü kart grid'i, sahte metrik, dev logo, noktalar, AI sloganları.  
Ana ders: Kullanıcı sade tasarım istedi, içeriksiz tasarım istemedi.
