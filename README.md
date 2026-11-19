# Seamless Project Migration

/skill:migrate-external-project Source: code archive. Migrate the attached project into Lovable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/62f76615-b2b5-44c2-8669-2b0608c8d2ac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Login Google saat dijalankan di komputer sendiri

Jalankan `npm run dev` dan buka **http://127.0.0.1:8080** (tombol Google di `localhost` otomatis
memindahkanmu ke sana, karena Google tidak menerima alamat `localhost`).

- Setelah login Google kamu kembali ke halaman awal, lalu otomatis diteruskan ke halaman tujuan.
- Alamat `http://127.0.0.1:8080` harus ada di **Cloud → Users → Settings → Advanced → Redirect URLs**.
- Port harus 8080. Jika port 8080 dipakai program lain, tutup program itu dulu.
