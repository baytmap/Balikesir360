import os
import json
import time
import piexif
import re
from PIL import Image
from datetime import datetime
from collections import defaultdict

def dms_to_deg(dms, ref):
    deg = dms[0][0] / dms[0][1]
    min_ = dms[1][0] / dms[1][1]
    sec = dms[2][0] / dms[2][1]
    decimal = deg + (min_ / 60.0) + (sec / 3600.0)
    return decimal if ref in ['N', 'E'] else -decimal

def extract_metadata(image_path):
    try:
        img = Image.open(image_path)
        exif_data = img.info.get("exif")
        if not exif_data:
            return None, None

        exif = piexif.load(exif_data)

        gps = exif.get("GPS", {})
        if not gps or 2 not in gps or 4 not in gps:
            return None, None

        lat = dms_to_deg(gps[2], gps[1].decode())
        lon = dms_to_deg(gps[4], gps[3].decode())

        dt_raw = exif.get("Exif", {}).get(piexif.ExifIFD.DateTimeOriginal)
        dt_str = dt_raw.decode() if dt_raw else ""

        return {"lat": lat, "lon": lon}, dt_str
    except:
        return None, None

def extract_plate(fname):
    match = re.search(r"_([0-9A-Z]{6,8})-", fname)
    if match:
        return match.group(1)
    return "UNKNOWN"

# === Zaman başlat ===
start_time = time.time()

# === Ayarlar ===
image_dir = r"D:\Users\Geolab\360\Images"  # Orijinal görsellerin bulunduğu klasör
geojson_output = r"D:\Users\Geolab\360\pv360\BalikesirKalan\points.geojson"  # GeoJSON çıktısı
gps_missing_log = r"D:\Users\Geolab\360\pv360\BalikesirKalan\gps_missing.txt" # Gps çıktısı
dt_missing_log = r"D:\Users\Geolab\360\pv360\BalikesirKalan\datetime_missing.txt"  # Çekilen zaman çıktısı

os.makedirs(os.path.dirname(geojson_output), exist_ok=True)

# === Veri yapıları ===
meta_by_plate = defaultdict(list)
gps_missing = []
dt_missing = []

# === Dosyaları tara ve grupla ===
for fname in os.listdir(image_dir):
    if fname.lower().endswith(".jpg"):
        full_path = os.path.join(image_dir, fname)
        gps_data, dt_str = extract_metadata(full_path)

        if gps_data:
            plate = extract_plate(fname)
            meta_by_plate[plate].append((fname, gps_data, dt_str))
            if not dt_str:
                dt_missing.append(fname)
        else:
            gps_missing.append(fname)

# === Sıralama ve GeoJSON üretim ===
features = []
global_id = 1

for plate in sorted(meta_by_plate.keys()):  # plakalar alfabetik sırada işlenir
    file_list = meta_by_plate[plate]

    def sort_key(item):
        dt_str = item[2]
        try:
            return datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
        except:
            return item[0]

    file_list.sort(key=sort_key)

    for fname, gps_data, _ in file_list:
        features.append({
            "type": "Feature",
            "properties": {
                "filename": fname,
                "path": f"images/{fname}",  # symbolic link üzerinden path verildi
                "objectId": global_id,
                "plate": plate
            },
            "geometry": {
                "type": "Point",
                "coordinates": [gps_data["lon"], gps_data["lat"]]
            }
        })
        global_id += 1

# === GeoJSON kaydet ===
geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open(geojson_output, "w", encoding="utf-8") as f:
    json.dump(geojson, f, indent=2, ensure_ascii=False)

# === Eksikleri logla ===
if gps_missing:
    with open(gps_missing_log, "w", encoding="utf-8") as f:
        f.write("\n".join(gps_missing))
    print(f"⚠️ GPS verisi olmayan {len(gps_missing)} görsel: {gps_missing_log}")

if dt_missing:
    with open(dt_missing_log, "w", encoding="utf-8") as f:
        f.write("\n".join(dt_missing))
    print(f"⚠️ DateTimeOriginal olmayan {len(dt_missing)} görsel: {dt_missing_log}")

# === Süre hesapla ===
end_time = time.time()
elapsed = end_time - start_time
minutes = int(elapsed // 60)
seconds = int(elapsed % 60)

print(f"✅ GeoJSON başarıyla yazıldı: {geojson_output}")
print(f"🕒 Tamamlanma süresi: {minutes} dakika {seconds} saniye")
