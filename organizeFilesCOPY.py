import os
import shutil
import time

# === Zaman başlat ===
start_time = time.time()

# === Ayarlar ===
root_dir = r"D:\görüntü\balikesir"
target_dir = r"D:\Users\Geolab\360\BalıkesirKalan"

os.makedirs(target_dir, exist_ok=True)
file_count = 0

# === Ana döngü ===
for day_folder in os.listdir(root_dir):
    day_path = os.path.join(root_dir, day_folder)
    if not os.path.isdir(day_path):
        continue

    for cam_folder in os.listdir(day_path):  # 100GOPRO, 101GOPRO...
        cam_path = os.path.join(day_path, cam_folder)
        if not os.path.isdir(cam_path):
            continue

        for file in os.listdir(cam_path):
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                src_path = os.path.join(cam_path, file)
                new_name = f"{day_folder}-{cam_folder}-{file}"
                dst_path = os.path.join(target_dir, new_name)

                # Aynı isim varsa atla
                if os.path.exists(dst_path):
                    print(f"⚠️ Atlandı: {new_name} zaten var.")
                    continue

                # Dosyayı kopyala (taşımak yerine)
                shutil.copy2(src_path, dst_path)
                file_count += 1
                print(f"📸 Kopyalandı: {new_name}")

# === Zaman hesapla ===
end_time = time.time()
elapsed = end_time - start_time
minutes = int(elapsed // 60)
seconds = int(elapsed % 60)

print(f"\n✅ {file_count} görsel başarıyla kopyalandı.")
print(f"🕒 Süre: {minutes} dakika {seconds} saniye")
