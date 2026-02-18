import os
import time

def add_prefix_to_filenames(folder_path, prefix="35"):
    start_time = time.time()
    # Klasördeki tüm dosyaları listele
    for filename in os.listdir(folder_path):
        old_path = os.path.join(folder_path, filename)
        # Salt dosyaysa (klasör değilse) ve daha önce prefix eklenmemişse
        if os.path.isfile(old_path) and not filename.startswith(prefix):
            new_filename = prefix + filename
            new_path = os.path.join(folder_path, new_filename)
            try:
                os.rename(old_path, new_path)
                print(f"Yeniden adlandırıldı: {filename} -> {new_filename}")
            except Exception as e:
                print(f"Hata ({filename}): {e}")
    
    end_time = time.time()
    execution_time = end_time - start_time
    minutes = int(execution_time // 60)
    seconds = int(execution_time % 60)
    print(f"\nİşlem süresi: {minutes} dakika {seconds} saniye")

if __name__ == "__main__":
    # Buraya kendi resim klasörünüzün yolunu yazın:
    folder = r"C:\Users\Geolab\Masaüstü\360\images" 
    add_prefix_to_filenames(folder)
