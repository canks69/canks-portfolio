# Gunakan image Node.js sebagai base image
FROM node:18-alpine AS build

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json untuk menghindari mengulang instalasi dependensi jika tidak ada perubahan
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh file aplikasi ke dalam container
COPY . .

# Build proyek Astro untuk produksi
RUN npm run build

# Gunakan image nginx untuk menampilkan aplikasi hasil build
FROM nginx:alpine

# Salin hasil build dari tahap sebelumnya ke direktori yang akan dilayani oleh nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 untuk akses web
EXPOSE 80

# Jalankan nginx untuk melayani aplikasi
CMD ["nginx", "-g", "daemon off;"]
