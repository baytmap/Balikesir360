# 🏛️ Balıkesir360 - BAYES Panoramik Görüntüleme Sistemi

**BAYES** (Balıkesir Yapı Envanter Sistemi) için geliştirilmiş interaktif 360° panoramik görüntüleme ve harita entegrasyonu platformu.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [Python Scriptleri](#python-scriptleri)
- [Geliştirme](#geliştirme)
- [Lisans](#lisans)

## 🎯 Genel Bakış

Balıkesir360, Balıkesir Belediyesi'nin yapı envanter sistemine entegre edilmiş, ArcGIS haritaları üzerinde 360° panoramik fotoğrafları görüntüleme ve yönetme imkanı sunan web tabanlı bir uygulamadır. Sistem, harita üzerindeki noktaları tıklayarak ilgili panoramik görüntülere erişim sağlar ve GPS koordinatları ile fotoğrafları eşleştirir.

## ✨ Özellikler

### 🌐 Harita Entegrasyonu
- **ArcGIS 4.24** entegrasyonu ile interaktif harita görüntüleme
- WebMap ve FeatureLayer desteği
- Dinamik katman yönetimi
- Harita üzerinde nokta bazlı navigasyon

### 📸 360° Panoramik Görüntüleme
- **Pannellum.js** kütüphanesi ile 360° görüntüleme
- Yatay ve dikey navigasyon kontrolleri
- Çoklu panorama desteği
- Yön oku (look marker) ile navigasyon rehberi

### 🗺️ GPS ve Koordinat Yönetimi
- EXIF verilerinden GPS koordinat çıkarma
- Fotoğraflara GPS koordinatları ekleme
- GeoJSON formatında veri üretimi
- Harita ve fotoğraf senkronizasyonu

### 📊 Veri İşleme
- Excel'den JSON'a veri dönüştürme
- Toplu dosya işleme
- Otomatik dosya organizasyonu
- Metadata yönetimi

## 🛠️ Teknolojiler

### Frontend
- **HTML5/CSS3/JavaScript** - Temel web teknolojileri
- **ArcGIS API for JavaScript 4.24** - Harita görselleştirme
- **Pannellum.js** - 360° panoramik görüntüleme
- **jQuery 3.6.0** - DOM manipülasyonu
- **Split.js** - Panel bölme işlevselliği
- **Font Awesome 6.1.0** - İkon kütüphanesi

### Backend
- **ASP.NET Core** - Web sunucusu (Portal klasörü)
- **ArcGIS Web Adaptor** - ArcGIS entegrasyonu

### Python Scriptleri
- **Pillow (PIL)** - Görüntü işleme
- **piexif** - EXIF veri okuma/yazma
- **pandas** - Excel veri işleme
- **exifread** - EXIF metadata okuma

## 📦 Kurulum

### Gereksinimler

- **Web Sunucusu**: IIS veya ASP.NET Core hosting
- **Python 3.7+** (scriptler için)
- **Node.js** (opsiyonel, bazı bağımlılıklar için)

### Adımlar

1. **Projeyi klonlayın veya indirin**
   ```bash
   git clone <repository-url>
   cd Balıkesir360
   ```

2. **Python bağımlılıklarını yükleyin**
   ```bash
   pip install pillow piexif pandas exifread
   ```

3. **Web sunucusunu yapılandırın**
   - `portal` klasöründeki ASP.NET Core uygulamasını yapılandırın
   - `appsettings.json` dosyasını ortamınıza göre düzenleyin
   - IIS veya Kestrel ile deploy edin

4. **ArcGIS Portal yapılandırması**
   - `main.js` dosyasındaki `portalUrl` ve `portalItem.id` değerlerini güncelleyin
   - ArcGIS Portal hesabınızı yapılandırın

## 🚀 Kullanım

### Web Uygulaması

1. Tarayıcınızda `index.html` veya `pv360.html` dosyasını açın
2. Harita üzerinde bir nokta seçin
3. Sağ panelde ilgili panoramik görüntü yüklenecektir
4. 360° görüntüyü fare ile sürükleyerek gezinebilirsiniz
5. Yön oku ile harita üzerindeki bakış açısını görebilirsiniz

### Python Scriptleri

#### GPS Koordinatları Ekleme
```bash
python geotag_photos.py
```
Fotoğraflara EXIF verilerinden GPS koordinatları ekler.

#### GeoJSON Üretimi
```bash
python generate_geojson.py --input <images_directory> --output points.geojson
```
Görsellerden GeoJSON dosyası oluşturur.

#### Excel'den JSON Dönüştürme
```bash
python excelToJson.py
```
Excel dosyasındaki verileri JSON formatına dönüştürür.

#### Dosya Organizasyonu
```bash
python organizeFilesCOPY.py  # Kopyalama
python organizeFilesMOVE.py  # Taşıma
```
Dosyaları belirli kurallara göre organize eder.

## 📁 Proje Yapısı

```
Balıkesir360/
│
├── 📄 HTML Dosyaları
│   ├── index.html              # Ana sayfa
│   ├── pv360.html              # Panoramik görüntüleme sayfası
│   └── pv360lokal.html         # Lokal test sayfası
│
├── 📜 JavaScript Dosyaları
│   ├── main.js                 # Ana harita yapılandırması
│   ├── pv360.js                # Panoramik görüntüleme mantığı
│   ├── pv360BalikesirKalan.js  # Kalan noktalar için özel script
│   ├── pv360HiddenLayer.js     # Gizli katman yönetimi
│   ├── pv360NoktaKatmani.js    # Nokta katmanı yönetimi
│   ├── export_points.js        # Nokta dışa aktarma
│   └── widgetE.js              # Widget bileşenleri
│
├── 🐍 Python Scriptleri
│   ├── geotag_photos.py              # GPS koordinat ekleme
│   ├── geotag_photosWoGrouping.py    # Gruplama olmadan GPS ekleme
│   ├── generate_geojson.py           # GeoJSON üretimi
│   ├── excelToJson.py                # Excel'den JSON'a dönüştürme
│   ├── organizeFilesCOPY.py          # Dosya kopyalama organizasyonu
│   ├── organizeFilesMOVE.py           # Dosya taşıma organizasyonu
│   ├── rename_images.py               # Görsel yeniden adlandırma
│   ├── renameVehicles.py              # Araç adlandırma
│   ├── deleteAreas.py                 # Alan silme
│   ├── sampleAreaCopy.py              # Örnek alan kopyalama
│   └── add_zzz_prefix_only.py         # Önek ekleme
│
├── 🎨 Stil Dosyaları
│   ├── styleF.css              # Ana stil dosyası
│   └── pannellum2.css          # Pannellum özel stilleri
│
├── 🖼️ Görsel Dosyaları
│   ├── logo.jpg, G360.png      # Logo ve markalar
│   ├── bbb_logo*.png           # Balıkesir Belediyesi logoları
│   └── location.png, look1.png # UI ikonları
│
├── 🌐 Portal (Backend)
│   └── portal/                 # ASP.NET Core uygulaması
│       ├── wwwroot/            # Statik dosyalar
│       ├── appsettings.json    # Yapılandırma
│       └── WebAdaptor.config   # Web Adaptor ayarları
│
└── 📊 Veri Klasörleri
    ├── BalikesirKalan/         # Kalan nokta verileri
    ├── data/                   # Ana veri klasörü (gitignore)
    ├── data2/                  # İkincil veri klasörü (gitignore)
    └── Lidar/                  # Lidar verileri (gitignore)
```

## 🐍 Python Scriptleri Detayları

### `geotag_photos.py`
Fotoğraflara EXIF verilerinden GPS koordinatları ekler ve plaka bilgilerini çıkarır.

**Kullanım:**
```python
# image_dir değişkenini kendi klasörünüze göre ayarlayın
python geotag_photos.py
```

### `generate_geojson.py`
Görsellerden GPS koordinatlarını okuyarak GeoJSON formatında harita verisi üretir.

**Kullanım:**
```bash
python generate_geojson.py --input <images_dir> --output output.geojson
```

### `excelToJson.py`
Excel dosyasındaki `objectid_1` sütununu JSON formatına dönüştürür.

**Gereksinimler:**
- `TersGörüntü.xlsx` dosyası proje kök dizininde olmalı

### `organizeFilesCOPY.py` / `organizeFilesMOVE.py`
Dosyaları belirli kurallara göre organize eder (kopyalama veya taşıma).

## 🔧 Geliştirme

### Yerel Geliştirme Ortamı

1. **Python ortamını hazırlayın**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt  # Eğer varsa
   ```

2. **Web sunucusunu başlatın**
   ```bash
   cd portal
   dotnet run
   ```

3. **Test için lokal HTML dosyalarını açın**
   - `pv360.html` dosyasını tarayıcıda açın

### Yapılandırma

- **ArcGIS Portal URL**: `main.js` dosyasında `esriConfig.portalUrl`
- **WebMap ID**: `main.js` dosyasında `portalItem.id`
- **Backend URL**: Portal klasöründeki `appsettings.json`

## 📝 Notlar

- Veri klasörleri (`data/`, `data2/`, `Lidar/`) Git'e dahil edilmez (büyük dosyalar)
- `node_modules/` klasörü Git'e dahil edilmez
- Python cache dosyaları (`__pycache__/`) Git'e dahil edilmez
- Geliştirme ortamı için `appsettings.Development.json` kullanılır

## 👥 Katkıda Bulunanlar

- **Geolab GIS** - Geliştirme ve entegrasyon
- **Kent Gelişim** - Proje yönetimi
- **Balıkesir Belediyesi** - Proje sahibi

## 📄 Lisans

Bu proje Balıkesir Belediyesi için özel olarak geliştirilmiştir.

## 🔗 İlgili Linkler

- [Balıkesir Belediyesi](https://balikesir.bel.tr/)
- [Kent Gelişim](http://kentgelisim.com.tr/)
- [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/)
- [Pannellum Documentation](https://pannellum.org/documentation/)
