import json
import time

def load_ids_from_txt(txt_path):
    """TXT dosyasındaki satırlardan 'id' değerlerini çeker"""
    ids = set()
    with open(txt_path, 'r', encoding='utf-8') as file:
        for line in file:
            line = line.strip()
            if "id:" in line:
                try:
                    part = line.split("id:")[1].split(",")[0].strip()
                    ids.add(int(part))
                except (IndexError, ValueError):
                    continue  # hatalı satır varsa atla
    return ids


def filter_objectids_without_reassignment(geojson_path, ids_to_remove, output_path):
    """
    GeoJSON'dan objectId'si, TXT'deki id listesinde bulunanları siler.
    Kalanlara dokunmaz ve objectId'leri yeniden atamaz.
    """

    start_time = time.time()

    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    original_count = len(geojson_data['features'])

    # objectId'si TXT'deki id'lerden biri olanları sil
    filtered_features = [
        feature for feature in geojson_data['features']
        if feature['properties'].get('objectId') not in ids_to_remove
    ]

    removed_count = original_count - len(filtered_features)

    # Yeni GeoJSON yapısı
    updated_geojson = {
        "type": "FeatureCollection",
        "features": filtered_features
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(updated_geojson, f, ensure_ascii=False, indent=2)

    end_time = time.time()
    elapsed_time = end_time - start_time
    minutes, seconds = divmod(elapsed_time, 60)

    print(f"✅ {removed_count} adet obje silindi. Kalan: {len(filtered_features)} obje.")
    print(f"✅ Güncellenmiş GeoJSON '{output_path}' dosyasına kaydedildi.")
    print(f"⏱️ İşlem süresi: {int(minutes)} dakika {seconds:.2f} saniye")

# Örnek kullanım
if __name__ == "__main__":
    txt_path = "reversed_panoramas.txt"              # TXT dosyası (id: ...)
    geojson_path = "points-manyas-kiziksa.geojson"   # Girdi GeoJSON (objectId içeriyor)
    output_path = "deletedAreasKiziksa.geojson"      # Çıktı dosyası

    ids_to_remove = load_ids_from_txt(txt_path)
    filter_objectids_without_reassignment(geojson_path, ids_to_remove, output_path)
