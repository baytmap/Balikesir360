import os
import time

def rename_images_with_prefix(folder_path, prefix='106_'):
    start_time = time.time()

    all_files = [f for f in os.listdir(folder_path)
                 if os.path.isfile(os.path.join(folder_path, f))]

    image_files = sorted([f for f in all_files
                          if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tif'))])

    print(f"Uyarı: Klasörde {len(image_files)} resim bulundu.")

    for old_name in image_files:
        old_path = os.path.join(folder_path, old_name)
        new_name = f"{prefix}{old_name}"
        new_path = os.path.join(folder_path, new_name)

        if os.path.exists(new_path):
            print(f"Atlandı: {new_name} zaten var.")
            continue

        os.rename(old_path, new_path)
        print(f"{old_name} → {new_name}")

    end_time = time.time()
    duration = end_time - start_time
    print(f"\nİşlem süresi: {duration:.2f} saniye")

if __name__ == "__main__":
    # Kendi klasör yolunu buraya gir (ham string olarak):
    folder = r"D:\Users\Geolab\Downloads\manyas\106GOPRO"
    rename_images_with_prefix(folder, prefix='106_')
