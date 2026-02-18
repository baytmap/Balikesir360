import os
import time
from pathlib import Path

# ---------------------------------------------------------
# KULLANICI AYARLARI
# ---------------------------------------------------------
# Görsellerin bulunduğu klasör (örnek)
IMAGE_DIR = r"D:\Users\Geolab\360\BalıkesirKalan"

# Eklenmesini istediğin prefix
PREFIX = "zzz_"
# ---------------------------------------------------------


def add_prefix_to_files(image_dir, prefix="zzz_"):
    """
    Klasördeki JPG dosyalarının başına prefix ekler.
    Zaten prefix'li olanları atlar.
    """
    renamed = 0
    skipped = 0

    for file in os.listdir(image_dir):
        if not file.lower().endswith(".jpg"):
            continue
        if file.startswith(prefix):
            skipped += 1
            continue

        old_path = Path(image_dir) / file
        new_name = f"{prefix}{file}"
        new_path = Path(image_dir) / new_name

        os.rename(old_path, new_path)
        renamed += 1

    print(f"✅ {renamed} dosya yeniden adlandırıldı.")
    if skipped:
        print(f"⚠️ {skipped} dosya zaten '{prefix}' ile başlıyordu, atlandı.")


if __name__ == "__main__":
    print("🚀 ZZZ prefix ekleme işlemi başlatıldı...\n")
    start_time = time.time()  # ⏱ Başlangıç zamanı

    add_prefix_to_files(IMAGE_DIR, PREFIX)

    elapsed = time.time() - start_time
    minutes, seconds = divmod(elapsed, 60)

    print("\n🎉 İşlem tamamlandı!")
    if minutes >= 1:
        print(f"⏰ Toplam süre: {int(minutes)} dakika {seconds:.1f} saniye")
    else:
        print(f"⏰ Toplam süre: {seconds:.2f} saniye")
