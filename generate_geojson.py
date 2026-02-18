import os
import json
import argparse
import exifread
import time
import re

def dms_to_dd(dms, ref):
    deg = float(dms[0].num) / float(dms[0].den)
    minute = float(dms[1].num) / float(dms[1].den)
    sec = float(dms[2].num) / float(dms[2].den)
    dd = deg + (minute / 60.0) + (sec / 3600.0)
    return -dd if ref in ('S', 'W') else dd

def get_gps_coords(tags):
    try:
        lat = dms_to_dd(tags['GPS GPSLatitude'].values, tags['GPS GPSLatitudeRef'].values)
        lon = dms_to_dd(tags['GPS GPSLongitude'].values, tags['GPS GPSLongitudeRef'].values)
        return lon, lat
    except KeyError:
        return None

def natural_sort_key(s):
    parts = re.split(r'(\d+)', s)
    return [int(p) if p.isdigit() else p.lower() for p in parts]

def generate_geojson(images_dir, output_path):
    start_time = time.time()
    entries = []

    for fname in os.listdir(images_dir):
        if not fname.lower().endswith(('.jpg', '.jpeg')):
            continue
        img_path = os.path.join(images_dir, fname)
        with open(img_path, 'rb') as f:
            tags = exifread.process_file(f, details=False)
        coords = get_gps_coords(tags)
        if coords:
            # path: tarayıcıdan erişilebilir web yolu olarak ayarlanır
            web_path = os.path.join(os.path.basename(images_dir), fname).replace("\\", "/")
            entries.append({
                'path': web_path,
                'coords': coords
            })
        else:
            print(f"⚠️  GPS verisi bulunamadı, atlanıyor: {fname}")

    entries.sort(key=lambda e: natural_sort_key(os.path.basename(e['path'])))

    features = []
    for idx, entry in enumerate(entries, start=1):
        lon, lat = entry['coords']
        features.append({
            "type": "Feature",
            "properties": {
                "objectId": idx,
                "path": entry['path']
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as out:
        json.dump(geojson, out, indent=2, ensure_ascii=False)

    elapsed = time.time() - start_time
    mins, secs = divmod(elapsed, 60)
    print(f"✅ {len(features)} öğe üretildi: {output_path}")
    print(f"⏱️  İşlem süresi: {int(mins)}m {secs:.2f}s")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="images/ içindeki geotag'li JPEG'lerden doğal sıralı data/points.geojson üreten araç"
    )
    parser.add_argument(
        "--images_dir", "-i", default=r"D:\Users\Geolab\360\pv360\images",
        help="JPEG'lerin olduğu klasör"
    )
    parser.add_argument(
        "--output", "-o", default="data/points.geojson",
        help="Üretilen GeoJSON dosya yolu (varsayılan: data/points.geojson)"
    )
    args = parser.parse_args()
    generate_geojson(args.images_dir, args.output)
