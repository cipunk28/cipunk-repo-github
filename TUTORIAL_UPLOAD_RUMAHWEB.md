# Panduan Lengkap Upload Aplikasi CiPUNK.NET ke Hosting Rumahweb

Aplikasi CiPUNK.NET ini dibangun menggunakan **React (Vite)**. Aplikasi model seperti ini adalah *Single Page Application (SPA)* yang harus di-build ("dicompile") terlebih dahulu sebelum diupload ke hosting standar seperti Rumahweb (cPanel).

Berikut adalah langkah-langkah lengkapnya dari awal sampai online:

## Langkah 1: Download Project dari AI Studio
1. Klik tombol **Export** (atau Download/Share) pada pojok kanan atas browser AI Studio Anda.
2. Pilih format **Download as ZIP**.
3. Ekstrak file ZIP tersebut di laptop/komputer Anda.

## Langkah 2: Build Aplikasi (Menyiapkan File Siap Upload)
Untuk melakukan langkah ini, Anda memerlukan **Node.js** yang sudah terinstall di komputer.
1. Buka folder hasil ekstrak tadi di terminal (Command Prompt / PowerShell / Terminal Mac).
2. Ketik perintah berikut untuk mengunduh semua module pendukung:
   ```bash
   npm install
   ```
3. Setelah selesai, ketik perintah ini untuk membuat versi siap tayangnya (Production Build):
   ```bash
   npm run build
   ```
4. Jika sudah selesai, akan muncul **folder baru bernama `dist`** di dalam folder project Anda.
5. Masuk ke dalam folder `dist` tersebut. Di dalamnya akan ada file `index.html` dan folder `assets`. 
6. **Blok semua file dan folder di dalam folder `dist`**, klik kanan, dan jadikan file zip (misal: `upload-cipunk.zip`). 
*(PENTING: Jangan men-zip folder `dist`-nya langsung, tapi zip isinya saja. File `index.html` harus langsung terlihat saat zip dibuka).*

## Langkah 3: Login ke cPanel Rumahweb
1. Buka browser dan login ke **Client Area Rumahweb** (https://clientzone.rumahweb.com).
2. Menuju ke menu **Services** > Pilih hosting Anda > Klik tombol **Login to cPanel**.

## Langkah 4: Upload File ke File Manager
1. Di halaman cPanel, cari dan klik menu **File Manager**.
2. Di sebelah kiri, klik folder **`public_html`** (Ini adalah folder utama website Anda).
   *- Jika Anda menaruhnya di subdomain atau add-on domain, buka folder milik subdomain/domain tersebut.*
3. Klik tombol **Upload** di bagian menu atas.
4. Pilih file `upload-cipunk.zip` yang sudah Anda buat pada Langkah 2 tadi. Tunggu hingga proses upload 100% (warnanya berubah jadi hijau).
5. Kembali ke File Manager, klik kanan pada file `upload-cipunk.zip` tersebut lalu pilih **Extract**.
6. Extract ke direktori `/public_html`.
7. Pastikan file `index.html` dan folder `assets` sekarang sudah berada langsung di dalam folder `/public_html`. Anda boleh menghapus file zip-nya setelah ini.

## Langkah 5: Membuat File .htaccess (Sangat Penting!)
Karena aplikasi React menggunakan navigasi internal, jika orang me-refresh halaman website, cPanel umumnya akan mengeluarkan peringatan Error 404 (Not Found). Untuk mencegah ini:
1. Di dalam File Manager `public_html`, klik tombol **Settings** (Pengaturan) di pojok kanan atas, lalu centang **Show Hidden Files (dotfiles)** dan klik Save.
2. Klik tombol **+ File** di kiri atas, beri nama filenya **`.htaccess`** (jangan lupa titik di awalnya) dan klik Create New File.
3. Klik kanan pada file `.htaccess` tersebut lalu pilih **Edit**.
4. Masukkan kode persis di bawah ini:
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
5. Klik **Save Changes** di pojok kanan atas, lalu Anda bisa menutup editornya.

## Langkah 6: Selesai! 🎉
Sekarang silakan akses nama domain website Anda di browser (misalnya: `www.cipunk.net` atau domain milik Anda). Website akan langsung tampil dan berjalan seperti.

---

### ⚠️ CATATAN PENTING TENTANG DATABASE
Aplikasi ini saat ini menyimpan data (Database Pelanggan, Sandi, Logo, dan QRIS) di **`localStorage` browser**.
Artinya:
- Data hanya tersimpan di komputer/HP yang dipakai oleh Mimin/Admin saat mendaftarkan data tersebut.
- Jika pengunjung/pelanggan membuka web dari HP mereka sendiri, mereka TIDAK AKAN melihat database pelanggan yang dimasukkan Admin dari laptop Admin, karena databasenya tidak tersambung ke server pusat (tersimpan lokal di hp masing-masing).
- **Saran:** Jika Anda ingin web ini bisa diakses pelanggan dari mana saja dan datanya tersinkronisasi ke Mimin secara langsung (database online asli), maka aplikasi wajib dihubungkan ke **Firebase Backend**. (Beri tahu AI jika Anda ingin fitur Firebase ini dipasang!).
