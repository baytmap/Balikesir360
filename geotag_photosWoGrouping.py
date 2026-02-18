import os
import json
import time
import piexif
import re
from PIL import Image
from datetime import datetime

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


# === Başlangıç ===
start_time = time.time()

# === Ayarlar ===
image_dir = r"D:\Users\Geolab\360\ImagesLidar"
geojson_output = r"D:\Users\Geolab\360\pv360\Lidar\points.geojson"
gps_missing_log = r"D:\Users\Geolab\360\pv360\Lidar\gps_missing.txt"
dt_missing_log = r"D:\Users\Geolab\360\pv360\Lidar\datetime_missing.txt"

os.makedirs(os.path.dirname(geojson_output), exist_ok=True)

# Tüm meta verileri tek listede tutacağız
items = []
gps_missing = []
dt_missing = []


# === Dosyaları Tara ===
for fname in os.listdir(image_dir):
    if fname.lower().endswith(".jpg"):
        full_path = os.path.join(image_dir, fname)
        gps_data, dt_str = extract_metadata(full_path)

        if gps_data:
            items.append((fname, gps_data, dt_str))
            if not dt_str:
                dt_missing.append(fname)
        else:
            gps_missing.append(fname)


# === Datumlara göre sırala ===
def sort_key(item):
    dt_str = item[2]
    try:
        return datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
    except:
        return item[0]  # fallback

items.sort(key=sort_key)


# === GeoJSON oluştur ===
features = []
global_id = 1

for fname, gps_data, dt_str in items:
    features.append({
        "type": "Feature",
        "properties": {
            "filename": fname,
            "path": f"images/{fname}",
            "objectId": global_id
        },
        "geometry": {
            "type": "Point",
            "coordinates": [gps_data["lon"], gps_data["lat"]]
        }
    })
    global_id += 1


geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open(geojson_output, "w", encoding="utf-8") as f:
    json.dump(geojson, f, indent=2, ensure_ascii=False)


# === Eksikleri Yaz ===
if gps_missing:
    with open(gps_missing_log, "w", encoding="utf-8") as f:
        f.write("\n".join(gps_missing))

if dt_missing:
    with open(dt_missing_log, "w", encoding="utf-8") as f:
        f.write("\n".join(dt_missing))


# === Süre ===
elapsed = time.time() - start_time
minutes = int(elapsed // 60)
seconds = int(elapsed % 60)

print(f"✅ GeoJSON yazıldı: {geojson_output}")
print(f"GPS olmayan: {len(gps_missing)}")
print(f"DateTime olmayan: {len(dt_missing)}")
print(f"Süre: {minutes} dk {seconds} sn")
