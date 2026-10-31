VOICE ENGLISH PARTNER — NETLIFY PACKAGE

ISI PAKET
- index.html: aplikasi utama; fitur lama dipertahankan.
- netlify/functions/generate-module.js: generator soal terverifikasi.
- netlify/functions/grade-response.js: penilaian semantik dengan rubrik.
- netlify/functions/_ai.js: koneksi AI server-side.
- netlify.toml: konfigurasi Netlify.

DEPLOY
1. Ekstrak ZIP ini. Upload folder hasil ekstrak ke repository GitHub.
2. Hubungkan repository ke Netlify. Build command kosong; publish directory: .
3. Netlify Site configuration > Environment variables: tambahkan OPENAI_API_KEY dengan API key milik Anda. Opsional: OPENAI_MODEL (default gpt-4o-mini).
4. Deploy ulang. Uji generator dengan teks singkat dan jumlah 2; lalu uji penilaian melalui sesi siswa.

PENTING
- Tanpa OPENAI_API_KEY, generator dan penilaian akan gagal secara eksplisit; tidak ada soal dummy atau skor tebakan. API key disimpan di Netlify, jangan dimasukkan ke HTML. Penggunaan API dapat menimbulkan biaya sesuai akun penyedia AI.
- Firebase tetap menggunakan konfigurasi proyek lama dari HTML. Pastikan Realtime Database Rules membatasi akses per guru dan siswa; konfigurasi frontend bukan pengganti aturan keamanan.
- File asal memiliki login guru berbasis localStorage, PIN plaintext, dan kredensial bawaan di JavaScript. Itu belum aman untuk penggunaan publik/multi-guru. Sebelum dipakai dengan data siswa sungguhan, migrasikan autentikasi ke Firebase Authentication dan hapus kredensial bawaan.
- SpeechRecognition browser hanya mengubah suara menjadi teks. Penilaian ini menilai isi transkrip, bukan pelafalan, intonasi, kefasihan, atau kualitas audio.
- Skor AI adalah dukungan penilaian formatif, bukan pengganti verifikasi guru. Periksa sampel hasil untuk menyelaraskan rubrik dengan tujuan pembelajaran sekolah.
- CSV lama tetap tersedia. Data baru menyimpan timestamp ISO, rubrik, umpan balik, dan dugaan miskonsepsi.
