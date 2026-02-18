import pandas as pd
import json

# 📁 Excel dosyasının yolu
excel_path = "TersGörüntü.xlsx"

# 📤 Çıktı JSON dosyası
output_json = "reversed_ids.json"

# Excel'den oku
df = pd.read_excel(excel_path)

# 'objectid_1' sütununu al
if 'objectid_1' in df.columns:
    reversed_ids = df['objectid_1'].dropna().astype(int).tolist()

    # JSON olarak kaydet
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(reversed_ids, f, ensure_ascii=False, indent=2)

    print(f"✅ Toplam {len(reversed_ids)} ID kaydedildi → {output_json}")
else:
    print("❌ 'objectid_1' sütunu bulunamadı. Lütfen Excel yapısını kontrol edin.")
