# Panduan Publish Aplikasi CiPUNK.NET

Aplikasi Anda saat ini sudah menggunakan **Database Online Asli (Firebase)** dan sudah siap tayang! Karena aplikasi ini menggunakan React, Anda harus melakukan *build* terlebih dahulu sebelum meng-uploadnya ke hosting.

Berikut adalah beberapa opsi cara mempublikasikan aplikasi Anda dengan domain **cipunk.net**:

---

## Opsi 1: Upload ke Hosting Rumahweb (cPanel)
Jika Anda sudah menyewa layanan hosting dan domain di Rumahweb.

**Langkah 1: Download & Build**
1. Klik tombol **Export** di AI Studio (Pilih Download as ZIP).
2. Ekstrak di komputer Anda, lalu buka Terminal/Command Prompt di dalam folder tersebut.
3. Jalankan perintah instalasi:
   ```bash
   npm install
   ```
4. Jalankan perintah build:
   ```bash
   npm run build
   ```
5. Buka folder `dist` yang baru saja muncul. ZIP **semua isi** di dalam folder `dist` (Bukan folder `dist`-nya langsung, tapi `index.html` dan `assets`-nya). Namakan misal `upload-cipunk.zip`.

**Langkah 2: Upload ke cPanel**
1. Login ke cPanel Rumahweb Anda, masuk ke **File Manager**.
2. Buka folder `public_html`.
3. Klik Upload, lalu unggah file `upload-cipunk.zip`.
4. Setelah selesai, Extract file ZIP tersebut di dalam `public_html`.
5. **(Penting)** Buat file bernama `.htaccess` di dalam `public_html`, klik Edit, dan masukkan kode berikut:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
   *Kode ini berguna agar saat web di-refresh tidak menyebabkan pesan Error 404.*

---

## Opsi 2: Deploy Cepat dengan Firebase Hosting (Gratis & Rekomendasi)
Karena Anda sudah menggunakan Firebase untuk database, Anda juga bisa menaruh web ini di Firebase Hosting secara gratis dan sangat cepat! Anda nantinya tetap bisa menyambungkan domain `cipunk.net` ke sini.

**Langkah 1: Setup Firebase Hosting di Komputer**
1. Buka Terminal/Command Prompt di dalam folder project yang sudah di-ekstrak.
2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Login ke akun Google Anda:
   ```bash
   firebase login
   ```
4. Inisialisasi Firebase di folder project:
   ```bash
   firebase init hosting
   ```
   - Pilih *Use an existing project* dan pilih project Firebase yang Anda buat (misal: `gen-lang-client-...`).
   - Saat ditanya *What do you want to use as your public directory?*, ketik: **`dist`**
   - Saat ditanya *Configure as a single-page app (rewrite all urls to /index.html)?*, ketik: **`y`**
   - Saat ditanya *Set up automatic builds and deploys with GitHub?*, ketik: **`N`**
   - Saat ditanya *File dist/index.html already exists. Overwrite?*, ketik: **`N`**

**Langkah 2: Build & Deploy**
1. Jalankan perintah build (jika belum):
   ```bash
   npm run build
   ```
2. Upload ke interet secara otomatis:
   ```bash
   firebase deploy --only hosting
   ```
3. Selesai! Anda akan mendapatkan link website Firebase Anda.

**Langkah 3: Memasang Domain cipunk.net di Firebase**
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Buka project Anda, lihat menu di sebelah kiri, klik **Build** -> **Hosting**.
3. Klik tombol **Add custom domain**.
4. Masukkan **cipunk.net**.
5. Firebase akan memberikan record DNS (biasanya berupa A Record / TXT Record).
6. Buka panel Member Area tempat Anda membeli domain (misal di Rumahweb), masuk ke menu **DNS Management**.
7. Tambahkan **Record DNS** sesuai yang diminta oleh Firebase. Proses penyambungan biasanya butuh waktu 1-24 jam.

---

## Opsi 3: Membagikan Langsung via AI Studio (Trial/Preview)
Jika Anda hanya ingin membagikan link sementara kepada pelanggan selagi belum disetting di hosting:
1. Klik tombol **Share (Bagikan)** di sudut kanan atas layar AI Studio.
2. Publikasikan dan salin tautan (URL) yang diberikan (formatnya `https://ais-pre-...run.app`).
3. Anda bisa langsung memberikan link tersebut ke pelanggan Anda.
