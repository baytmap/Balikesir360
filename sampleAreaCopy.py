import os
import shutil
import time

# --- KULLANICI AYARLARI ---

# Görsellerin bulunduğu klasör
source_folder = r"D:\Users\Geolab\360\Images"

# Görsel isimlerinin bulunduğu txt dosyası
txt_file = r"D:\Users\Geolab\360\örnekgörüntü.txt"

# Kopyalanacak hedef klasör
output_folder = r"D:\Users\Geolab\360\örnekGörüntüGörseller"

# ----------------------------------------------

# Zamanı başlat
start_time = time.time()

# Hedef klasör yoksa oluştur
os.makedirs(output_folder, exist_ok=True)

# TXT dosyasını oku
with open(txt_file, "r", encoding="utf-8") as f:
    filenames = [line.strip() for line in f.readlines() if line.strip()]

count = 0

for name in filenames:
    source_path = os.path.join(source_folder, name)
    dest_path = os.path.join(output_folder, name)

    if os.path.exists(source_path):
        shutil.copy2(source_path, dest_path)
        count += 1
    else:
        print(f"BULUNAMADI: {name}")

# Zamanı durdur
end_time = time.time()
elapsed = end_time - start_time

print(f"\n✓ İşlem tamamlandı. {count} adet görsel kopyalandı.")
print(f"✓ Hedef klasör: {output_folder}")
print(f"⏱️ Toplam süre: {elapsed:.2f} saniye")
