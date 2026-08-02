/* ============================================================
   YKS MÜFREDAT BİLGİ GRAFİĞİ (Knowledge Graph)
   ------------------------------------------------------------
   Uygulamadaki TEK müfredat kaynağı. Program üretici, AI Rota
   Rehberi, Müfredat Haritası, AI Analiz, AI Koç ve Hata Zindanı
   kendi listelerini tutmaz; hepsi buradan okur.

   Yapı:
     subject -> units[] -> topics[]
     topic = {
       id        : benzersiz anahtar (tekrar/ilerleme takibi için)
       name      : MEB kazanım başlığı
       section   : deneme analizi bölümü (W3 — bölüm bazlı analiz)
       prereq    : önkoşul topic id'leri (bağımlılık grafiği)
       weight    : ÖSYM'de yaklaşık soru ağırlığı (0-5)
       load      : tahmini ilk öğrenme yükü (dakika)
     }
   ============================================================ */

window.YKS_CURRICULUM = {
  meta: {
    version: "1.0",
    basis: "MEB Ortaöğretim Programı + ÖSYM YKS soru dağılımı",
    note: "Soru ağırlıkları son yılların ortalamasına göre yaklaşık değerlerdir."
  },

  subjects: {

    /* ================= TYT MATEMATİK (40 soru) ================= */
    "TYT Matematik": {
      exam: "TYT", subject: "Matematik", questionCount: 40,
      sections: ["Temel Matematik", "Problemler", "Cebir", "Olasılık & Veri", "Geometri"],
      units: [
        { unit: "Temel Kavramlar ve Sayılar", topics: [
          { id: "tyt_mat_temel",       name: "Temel Kavramlar (sayı kümeleri, tek-çift, ardışık)", section: "Temel Matematik", prereq: [], weight: 3, load: 90, sub: ["Sayı kümeleri", "Tek-çift sayılar", "Ardışık sayılar", "Faktöriyel"] },
          { id: "tyt_mat_bolme",       name: "Bölme ve Bölünebilme Kuralları",                     section: "Temel Matematik", prereq: ["tyt_mat_temel"], weight: 3, load: 90, sub: ["Bölme algoritması", "Bölünebilme kuralları", "Kalan bulma", "Asal çarpanlar"] },
          { id: "tyt_mat_ebobekok",    name: "EBOB - EKOK",                                        section: "Temel Matematik", prereq: ["tyt_mat_bolme"], weight: 2, load: 75 },
          { id: "tyt_mat_rasyonel",    name: "Rasyonel Sayılar ve Ondalık Gösterim",               section: "Temel Matematik", prereq: ["tyt_mat_temel"], weight: 2, load: 75 },
          { id: "tyt_mat_basit_esit",  name: "Basit Eşitsizlikler",                                section: "Temel Matematik", prereq: ["tyt_mat_rasyonel"], weight: 2, load: 60 },
          { id: "tyt_mat_mutlak",      name: "Mutlak Değer",                                       section: "Temel Matematik", prereq: ["tyt_mat_basit_esit"], weight: 2, load: 75 },
          { id: "tyt_mat_uslu",        name: "Üslü Sayılar",                                       section: "Temel Matematik", prereq: ["tyt_mat_temel"], weight: 2, load: 75, sub: ["Üs kuralları", "Negatif üs", "Bilimsel gösterim"] },
          { id: "tyt_mat_koklu",       name: "Köklü Sayılar",                                      section: "Temel Matematik", prereq: ["tyt_mat_uslu"], weight: 2, load: 75, sub: ["Kök kuralları", "Paydayı rasyonelleştirme", "İç içe kökler"] }
        ]},
        { unit: "Cebir", topics: [
          { id: "tyt_mat_carpanlara",  name: "Çarpanlara Ayırma ve Özdeşlikler",                   section: "Cebir", prereq: ["tyt_mat_uslu"], weight: 3, load: 105, sub: ["Özdeşlikler", "Ortak paranteze alma", "Gruplandırma", "İki kare farkı", "Tam kare"] },
          { id: "tyt_mat_oran",        name: "Oran - Orantı",                                      section: "Cebir", prereq: ["tyt_mat_rasyonel"], weight: 2, load: 60 },
          { id: "tyt_mat_denklem",     name: "Birinci Dereceden Denklemler",                       section: "Cebir", prereq: ["tyt_mat_carpanlara"], weight: 2, load: 75 },
          { id: "tyt_mat_kume",        name: "Kümeler ve Kartezyen Çarpım",                        section: "Cebir", prereq: ["tyt_mat_temel"], weight: 2, load: 75 },
          { id: "tyt_mat_fonksiyon",   name: "Fonksiyonlar (tanım, grafik, bileşke, ters)",        section: "Cebir", prereq: ["tyt_mat_kume", "tyt_mat_denklem"], weight: 3, load: 120, sub: ["Fonksiyon tanımı", "Fonksiyon türleri (birebir, örten)", "Bileşke fonksiyon", "Ters fonksiyon", "Grafik okuma"] },
          { id: "tyt_mat_polinom",     name: "Polinomlar",                                         section: "Cebir", prereq: ["tyt_mat_carpanlara"], weight: 2, load: 90 },
          { id: "tyt_mat_ikinci",      name: "İkinci Dereceden Denklemler ve Parabol",             section: "Cebir", prereq: ["tyt_mat_polinom", "tyt_mat_fonksiyon"], weight: 3, load: 120, sub: ["Diskriminant", "Kökler toplamı-çarpımı", "Parabol grafiği", "Tepe noktası", "Eşitsizlik çözümü"] }
        ]},
        { unit: "Problemler", topics: [
          { id: "tyt_mat_p_sayi",      name: "Sayı Problemleri",                                   section: "Problemler", prereq: ["tyt_mat_denklem"], weight: 2, load: 75 },
          { id: "tyt_mat_p_kesir",     name: "Kesir Problemleri",                                  section: "Problemler", prereq: ["tyt_mat_p_sayi"], weight: 2, load: 60 },
          { id: "tyt_mat_p_yas",       name: "Yaş Problemleri",                                    section: "Problemler", prereq: ["tyt_mat_p_sayi"], weight: 1, load: 45 },
          { id: "tyt_mat_p_isci",      name: "İşçi - Havuz Problemleri",                           section: "Problemler", prereq: ["tyt_mat_oran"], weight: 2, load: 75 },
          { id: "tyt_mat_p_hiz",       name: "Hız - Hareket Problemleri",                          section: "Problemler", prereq: ["tyt_mat_oran"], weight: 2, load: 75 },
          { id: "tyt_mat_p_yuzde",     name: "Yüzde, Kâr - Zarar Problemleri",                     section: "Problemler", prereq: ["tyt_mat_oran"], weight: 3, load: 75, sub: ["Yüzde hesabı", "Kâr-zarar", "İndirim-zam", "Faiz"] },
          { id: "tyt_mat_p_karisim",   name: "Karışım Problemleri",                                section: "Problemler", prereq: ["tyt_mat_p_yuzde"], weight: 2, load: 60 },
          { id: "tyt_mat_p_grafik",    name: "Tablo - Grafik Problemleri",                         section: "Problemler", prereq: ["tyt_mat_p_yuzde"], weight: 2, load: 60 },
          { id: "tyt_mat_p_rutinsiz",  name: "Rutin Olmayan Problemler (mantık-muhakeme)",         section: "Problemler", prereq: ["tyt_mat_p_grafik"], weight: 3, load: 90, sub: ["Sayı-şekil örüntüleri", "Mantık-muhakeme", "Tablo yorumlama", "Sıralama problemleri"] }
        ]},
        { unit: "Olasılık ve Veri", topics: [
          { id: "tyt_mat_permutasyon", name: "Permütasyon - Kombinasyon",                          section: "Olasılık & Veri", prereq: ["tyt_mat_temel"], weight: 2, load: 90 },
          { id: "tyt_mat_olasilik",    name: "Olasılık",                                           section: "Olasılık & Veri", prereq: ["tyt_mat_permutasyon"], weight: 2, load: 75 },
          { id: "tyt_mat_veri",        name: "Veri, İstatistik ve Merkezî Eğilim Ölçüleri",        section: "Olasılık & Veri", prereq: ["tyt_mat_p_grafik"], weight: 2, load: 60 }
        ]},
        { unit: "Geometri", topics: [
          { id: "tyt_geo_aci",         name: "Doğruda ve Üçgende Açılar",                          section: "Geometri", prereq: [], weight: 2, load: 75 },
          { id: "tyt_geo_ucgen_kenar", name: "Üçgende Açı-Kenar Bağıntıları",                      section: "Geometri", prereq: ["tyt_geo_aci"], weight: 2, load: 75 },
          { id: "tyt_geo_dik_ucgen",   name: "Dik Üçgen ve Pisagor Bağıntıları",                   section: "Geometri", prereq: ["tyt_geo_ucgen_kenar"], weight: 2, load: 75 },
          { id: "tyt_geo_ozel_ucgen",  name: "İkizkenar ve Eşkenar Üçgen",                         section: "Geometri", prereq: ["tyt_geo_dik_ucgen"], weight: 1, load: 60 },
          { id: "tyt_geo_yardimci",    name: "Açıortay, Kenarortay ve Yardımcı Elemanlar",         section: "Geometri", prereq: ["tyt_geo_ucgen_kenar"], weight: 2, load: 75 },
          { id: "tyt_geo_benzerlik",   name: "Üçgende Benzerlik ve Eşlik",                         section: "Geometri", prereq: ["tyt_geo_ozel_ucgen"], weight: 2, load: 90 },
          { id: "tyt_geo_alan",        name: "Üçgende Alan",                                       section: "Geometri", prereq: ["tyt_geo_benzerlik"], weight: 2, load: 60 },
          { id: "tyt_geo_dortgen",     name: "Çokgenler ve Dörtgenler",                            section: "Geometri", prereq: ["tyt_geo_alan"], weight: 2, load: 90 },
          { id: "tyt_geo_ozel_dortgen",name: "Özel Dörtgenler (paralelkenar, yamuk, deltoid)",     section: "Geometri", prereq: ["tyt_geo_dortgen"], weight: 3, load: 105, sub: ["Paralelkenar", "Eşkenar dörtgen", "Dikdörtgen", "Kare", "Yamuk", "Deltoid"] },
          { id: "tyt_geo_cember",      name: "Çember ve Daire",                                    section: "Geometri", prereq: ["tyt_geo_dortgen"], weight: 3, load: 105, sub: ["Çemberde açı", "Teğet-kiriş", "Çevre ve alan", "Daire dilimi"] },
          { id: "tyt_geo_analitik",    name: "Analitik Geometri (nokta, doğru)",                   section: "Geometri", prereq: ["tyt_mat_fonksiyon", "tyt_geo_dortgen"], weight: 2, load: 90 },
          { id: "tyt_geo_kati",        name: "Katı Cisimler (prizma, piramit, küre)",              section: "Geometri", prereq: ["tyt_geo_ozel_dortgen"], weight: 2, load: 90 }
        ]}
      ]
    },

    /* ================= TYT TÜRKÇE (40 soru) ================= */
    "TYT Türkçe": {
      exam: "TYT", subject: "Türkçe", questionCount: 40,
      sections: ["Paragraf", "Dil Bilgisi", "Sözcük & Cümle", "Yazım & Noktalama"],
      units: [
        { unit: "Anlam Bilgisi", topics: [
          { id: "tyt_tr_sozcuk",   name: "Sözcükte Anlam",                                   section: "Sözcük & Cümle", prereq: [], weight: 3, load: 75, sub: ["Gerçek anlam", "Yan anlam", "Mecaz anlam", "Terim anlam", "Eş-zıt anlam"] },
          { id: "tyt_tr_deyim",    name: "Deyim, Atasözü ve Söz Öbekleri",                   section: "Sözcük & Cümle", prereq: ["tyt_tr_sozcuk"], weight: 2, load: 45 },
          { id: "tyt_tr_cumle",    name: "Cümlede Anlam",                                    section: "Sözcük & Cümle", prereq: ["tyt_tr_sozcuk"], weight: 3, load: 90 },
          { id: "tyt_tr_p_anadus", name: "Paragrafta Ana Düşünce ve Yardımcı Düşünce",       section: "Paragraf", prereq: ["tyt_tr_cumle"], weight: 5, load: 120, sub: ["Ana düşünce bulma", "Yardımcı düşünce", "Konu-başlık", "Parçada anlatılmak istenen"] },
          { id: "tyt_tr_p_yapi",   name: "Paragrafta Yapı (giriş-gelişme-sonuç, akış)",      section: "Paragraf", prereq: ["tyt_tr_p_anadus"], weight: 4, load: 90, sub: ["Giriş-gelişme-sonuç", "Paragraf tamamlama", "Akışı bozan cümle", "Paragraf bölme"] },
          { id: "tyt_tr_p_anlatim",name: "Paragrafta Anlatım Biçimleri ve Düşünceyi Geliştirme", section: "Paragraf", prereq: ["tyt_tr_p_yapi"], weight: 3, load: 75, sub: ["Betimleme-öyküleme", "Açıklama-tartışma", "Örnekleme", "Tanık gösterme", "Karşılaştırma"] },
          { id: "tyt_tr_p_hiz",    name: "Paragraf Hız ve Odak Kondisyonu",                  section: "Paragraf", prereq: ["tyt_tr_p_anlatim"], weight: 4, load: 60 }
        ]},
        { unit: "Dil Bilgisi", topics: [
          { id: "tyt_tr_ses",      name: "Ses Bilgisi",                                      section: "Dil Bilgisi", prereq: [], weight: 2, load: 60 },
          { id: "tyt_tr_yapi",     name: "Sözcükte Yapı (kök, ek, yapım-çekim)",             section: "Dil Bilgisi", prereq: ["tyt_tr_ses"], weight: 2, load: 75 },
          { id: "tyt_tr_turler",   name: "Sözcük Türleri (isim, sıfat, zamir, zarf, edat)",  section: "Dil Bilgisi", prereq: ["tyt_tr_yapi"], weight: 3, load: 105, sub: ["İsim", "Sıfat", "Zamir", "Zarf", "Edat-bağlaç-ünlem"] },
          { id: "tyt_tr_fiil",     name: "Fiiller, Fiilimsi ve Çatı",                        section: "Dil Bilgisi", prereq: ["tyt_tr_turler"], weight: 3, load: 105, sub: ["Fiilde kip ve kişi", "Ek fiil", "Fiilimsiler", "Çatı (etken-edilgen, geçişli-geçişsiz)"] },
          { id: "tyt_tr_ogeler",   name: "Cümlenin Ögeleri",                                 section: "Dil Bilgisi", prereq: ["tyt_tr_turler"], weight: 2, load: 75 },
          { id: "tyt_tr_cumle_ces",name: "Cümle Çeşitleri",                                  section: "Dil Bilgisi", prereq: ["tyt_tr_ogeler"], weight: 2, load: 60 },
          { id: "tyt_tr_anlatim_b",name: "Anlatım Bozuklukları",                             section: "Dil Bilgisi", prereq: ["tyt_tr_ogeler"], weight: 2, load: 75 }
        ]},
        { unit: "Yazım Kuralları", topics: [
          { id: "tyt_tr_yazim",    name: "Yazım Kuralları",                                  section: "Yazım & Noktalama", prereq: [], weight: 2, load: 60 },
          { id: "tyt_tr_noktalama",name: "Noktalama İşaretleri",                             section: "Yazım & Noktalama", prereq: ["tyt_tr_yazim"], weight: 2, load: 60 }
        ]}
      ]
    },

    /* ================= TYT FİZİK (7 soru) ================= */
    "TYT Fizik": {
      exam: "TYT", subject: "Fizik", questionCount: 7,
      sections: ["Mekanik", "Elektrik & Manyetizma", "Optik", "Isı & Madde", "Dalgalar"],
      units: [
        { unit: "Fizik Bilimine Giriş ve Madde", topics: [
          { id: "tyt_fiz_giris",   name: "Fizik Bilimine Giriş ve Büyüklükler",   section: "Isı & Madde", prereq: [], weight: 1, load: 45 },
          { id: "tyt_fiz_madde",   name: "Madde ve Özellikleri (yoğunluk, dayanıklılık)", section: "Isı & Madde", prereq: ["tyt_fiz_giris"], weight: 1, load: 60 },
          { id: "tyt_fiz_isi",     name: "Isı, Sıcaklık ve Genleşme",             section: "Isı & Madde", prereq: ["tyt_fiz_madde"], weight: 1, load: 75 },
          { id: "tyt_fiz_basinc",  name: "Basınç ve Kaldırma Kuvveti",            section: "Mekanik", prereq: ["tyt_fiz_madde"], weight: 1, load: 75 }
        ]},
        { unit: "Hareket ve Kuvvet", topics: [
          { id: "tyt_fiz_hareket", name: "Hareket (konum, hız, ivme, grafikler)", section: "Mekanik", prereq: ["tyt_fiz_giris"], weight: 1, load: 90 },
          { id: "tyt_fiz_kuvvet",  name: "Kuvvet ve Newton Yasaları",             section: "Mekanik", prereq: ["tyt_fiz_hareket"], weight: 1, load: 90 },
          { id: "tyt_fiz_is_enerji",name: "İş, Güç ve Enerji",                    section: "Mekanik", prereq: ["tyt_fiz_kuvvet"], weight: 1, load: 75 }
        ]},
        { unit: "Elektrik, Optik ve Dalgalar", topics: [
          { id: "tyt_fiz_elektrik",name: "Elektrostatik ve Elektrik Akımı",       section: "Elektrik & Manyetizma", prereq: ["tyt_fiz_giris"], weight: 1, load: 90 },
          { id: "tyt_fiz_manyetik",name: "Mıknatıs ve Manyetik Alan",             section: "Elektrik & Manyetizma", prereq: ["tyt_fiz_elektrik"], weight: 1, load: 60 },
          { id: "tyt_fiz_dalga",   name: "Dalgalar (yay, su, ses, deprem)",       section: "Dalgalar", prereq: ["tyt_fiz_hareket"], weight: 1, load: 75 },
          { id: "tyt_fiz_optik",   name: "Optik (ışık, gölge, ayna, mercek)",     section: "Optik", prereq: ["tyt_fiz_dalga"], weight: 1, load: 90 }
        ]}
      ]
    },

    /* ================= TYT KİMYA (7 soru) ================= */
    "TYT Kimya": {
      exam: "TYT", subject: "Kimya", questionCount: 7,
      sections: ["Genel Kimya", "Fiziksel Kimya", "Organik Kimya"],
      units: [
        { unit: "Kimyanın Temelleri", topics: [
          { id: "tyt_kim_bilim",   name: "Kimya Bilimi ve Simyadan Kimyaya",       section: "Genel Kimya", prereq: [], weight: 1, load: 45 },
          { id: "tyt_kim_atom",    name: "Atom ve Periyodik Sistem",               section: "Genel Kimya", prereq: ["tyt_kim_bilim"], weight: 1, load: 90 },
          { id: "tyt_kim_periyodik",name: "Periyodik Özelliklerin Değişimi",       section: "Genel Kimya", prereq: ["tyt_kim_atom"], weight: 1, load: 60 },
          { id: "tyt_kim_bag",     name: "Kimyasal Türler Arası Etkileşimler (bağlar)", section: "Genel Kimya", prereq: ["tyt_kim_periyodik"], weight: 1, load: 90 }
        ]},
        { unit: "Maddenin Halleri ve Karışımlar", topics: [
          { id: "tyt_kim_halleri", name: "Maddenin Halleri",                       section: "Fiziksel Kimya", prereq: ["tyt_kim_bag"], weight: 1, load: 60 },
          { id: "tyt_kim_karisim", name: "Karışımlar ve Ayırma Yöntemleri",        section: "Fiziksel Kimya", prereq: ["tyt_kim_halleri"], weight: 1, load: 75 },
          { id: "tyt_kim_asit",    name: "Asitler, Bazlar ve Tuzlar",              section: "Fiziksel Kimya", prereq: ["tyt_kim_karisim"], weight: 1, load: 90 }
        ]},
        { unit: "Kimyasal Hesaplamalar ve Çevre", topics: [
          { id: "tyt_kim_mol",     name: "Mol Kavramı ve Kimyasal Hesaplamalar",   section: "Genel Kimya", prereq: ["tyt_kim_bag"], weight: 1, load: 105 },
          { id: "tyt_kim_tepkime", name: "Kimyasal Tepkimeler ve Denkleştirme",    section: "Genel Kimya", prereq: ["tyt_kim_mol"], weight: 1, load: 75 },
          { id: "tyt_kim_organik", name: "Kimya Her Yerde ve Organik Bileşiklere Giriş", section: "Organik Kimya", prereq: ["tyt_kim_tepkime"], weight: 1, load: 60 }
        ]}
      ]
    },

    /* ================= TYT BİYOLOJİ (6 soru) ================= */
    "TYT Biyoloji": {
      exam: "TYT", subject: "Biyoloji", questionCount: 6,
      sections: ["Hücre Biyolojisi", "Genetik", "Sistemler", "Ekoloji"],
      units: [
        { unit: "Canlılar Dünyası", topics: [
          { id: "tyt_biy_bilim",   name: "Canlıların Ortak Özellikleri ve Organik Bileşikler", section: "Hücre Biyolojisi", prereq: [], weight: 1, load: 90 },
          { id: "tyt_biy_hucre",   name: "Hücre ve Organeller",                    section: "Hücre Biyolojisi", prereq: ["tyt_biy_bilim"], weight: 1, load: 90 },
          { id: "tyt_biy_zar",     name: "Hücre Zarından Madde Geçişleri",         section: "Hücre Biyolojisi", prereq: ["tyt_biy_hucre"], weight: 1, load: 75 },
          { id: "tyt_biy_bolunme", name: "Hücre Bölünmeleri (mitoz, mayoz)",       section: "Hücre Biyolojisi", prereq: ["tyt_biy_hucre"], weight: 1, load: 90 }
        ]},
        { unit: "Kalıtım ve Ekosistem", topics: [
          { id: "tyt_biy_kalitim", name: "Kalıtım ve Mendel Genetiği",             section: "Genetik", prereq: ["tyt_biy_bolunme"], weight: 1, load: 105 },
          { id: "tyt_biy_soyagaci",name: "Kan Grupları ve Soyağacı Analizi",       section: "Genetik", prereq: ["tyt_biy_kalitim"], weight: 1, load: 60 },
          { id: "tyt_biy_siniflandirma", name: "Canlıların Sınıflandırılması",     section: "Ekoloji", prereq: ["tyt_biy_bilim"], weight: 1, load: 75 },
          { id: "tyt_biy_ekosistem",name: "Ekosistem Ekolojisi ve Madde Döngüleri",section: "Ekoloji", prereq: ["tyt_biy_siniflandirma"], weight: 1, load: 75 },
          { id: "tyt_biy_sistem",  name: "Destek-Hareket, Sindirim ve Dolaşım Sistemleri", section: "Sistemler", prereq: ["tyt_biy_zar"], weight: 1, load: 105 }
        ]}
      ]
    },

    /* ================= TYT TARİH (5 soru) ================= */
    "TYT Tarih": {
      exam: "TYT", subject: "Tarih", questionCount: 5,
      sections: ["İlk Çağ & İslamiyet Öncesi", "Türk-İslam & Osmanlı", "Yakın Çağ & İnkılap"],
      units: [
        { unit: "Tarih Bilimi ve İlk Çağ", topics: [
          { id: "tyt_tar_bilim",   name: "Tarih Bilimine Giriş",                   section: "İlk Çağ & İslamiyet Öncesi", prereq: [], weight: 1, load: 45 },
          { id: "tyt_tar_ilkcag",  name: "İlk Çağ Uygarlıkları",                   section: "İlk Çağ & İslamiyet Öncesi", prereq: ["tyt_tar_bilim"], weight: 1, load: 75 },
          { id: "tyt_tar_ilkturk", name: "İslamiyet Öncesi Türk Tarihi",           section: "İlk Çağ & İslamiyet Öncesi", prereq: ["tyt_tar_ilkcag"], weight: 1, load: 75 }
        ]},
        { unit: "Türk-İslam ve Osmanlı", topics: [
          { id: "tyt_tar_islam",   name: "İslam Tarihi ve İlk Türk-İslam Devletleri", section: "Türk-İslam & Osmanlı", prereq: ["tyt_tar_ilkturk"], weight: 1, load: 90 },
          { id: "tyt_tar_kurulus", name: "Osmanlı Kuruluş ve Yükselme Dönemi",     section: "Türk-İslam & Osmanlı", prereq: ["tyt_tar_islam"], weight: 1, load: 90 },
          { id: "tyt_tar_duraklama",name: "Osmanlı Duraklama, Gerileme ve Dağılma",section: "Türk-İslam & Osmanlı", prereq: ["tyt_tar_kurulus"], weight: 1, load: 90 }
        ]},
        { unit: "İnkılap Tarihi", topics: [
          { id: "tyt_tar_kurtulus",name: "Kurtuluş Savaşı ve Cepheler",            section: "Yakın Çağ & İnkılap", prereq: ["tyt_tar_duraklama"], weight: 1, load: 90 },
          { id: "tyt_tar_inkilap", name: "Atatürk İlke ve İnkılapları",            section: "Yakın Çağ & İnkılap", prereq: ["tyt_tar_kurtulus"], weight: 1, load: 75 }
        ]}
      ]
    },

    /* ================= TYT COĞRAFYA (5 soru) ================= */
    "TYT Coğrafya": {
      exam: "TYT", subject: "Coğrafya", questionCount: 5,
      sections: ["Doğal Sistemler", "Beşerî Sistemler", "Türkiye Coğrafyası"],
      units: [
        { unit: "Doğal Sistemler", topics: [
          { id: "tyt_cog_dogainsan",name: "Doğa ve İnsan, Harita Bilgisi",         section: "Doğal Sistemler", prereq: [], weight: 1, load: 75 },
          { id: "tyt_cog_konum",   name: "Dünyanın Şekli, Hareketleri ve Koordinatlar", section: "Doğal Sistemler", prereq: ["tyt_cog_dogainsan"], weight: 1, load: 90 },
          { id: "tyt_cog_iklim",   name: "İklim Bilgisi, Basınç ve Rüzgarlar",     section: "Doğal Sistemler", prereq: ["tyt_cog_konum"], weight: 1, load: 105 },
          { id: "tyt_cog_yerkabugu",name: "İç ve Dış Kuvvetler, Yer Şekilleri",    section: "Doğal Sistemler", prereq: ["tyt_cog_iklim"], weight: 1, load: 90 }
        ]},
        { unit: "Beşerî ve Türkiye Coğrafyası", topics: [
          { id: "tyt_cog_nufus",   name: "Nüfus, Yerleşme ve Göç",                 section: "Beşerî Sistemler", prereq: ["tyt_cog_dogainsan"], weight: 1, load: 75 },
          { id: "tyt_cog_ekonomi", name: "Ekonomik Faaliyetler ve Doğal Kaynaklar",section: "Beşerî Sistemler", prereq: ["tyt_cog_nufus"], weight: 1, load: 75 },
          { id: "tyt_cog_turkiye", name: "Türkiye'nin Coğrafi Konumu ve Özellikleri", section: "Türkiye Coğrafyası", prereq: ["tyt_cog_yerkabugu"], weight: 1, load: 90 }
        ]}
      ]
    },

    /* ================= TYT FELSEFE / DİN (10 soru) ================= */
    "TYT Felsefe": {
      exam: "TYT", subject: "Felsefe", questionCount: 5,
      sections: ["Felsefeye Giriş", "Bilgi & Bilim Felsefesi", "Ahlak & Siyaset"],
      units: [
        { unit: "Felsefe", topics: [
          { id: "tyt_fel_giris",   name: "Felsefeye Giriş ve Felsefi Düşünce",     section: "Felsefeye Giriş", prereq: [], weight: 1, load: 60 },
          { id: "tyt_fel_bilgi",   name: "Bilgi Felsefesi",                        section: "Bilgi & Bilim Felsefesi", prereq: ["tyt_fel_giris"], weight: 1, load: 75 },
          { id: "tyt_fel_varlik",  name: "Varlık Felsefesi",                       section: "Bilgi & Bilim Felsefesi", prereq: ["tyt_fel_bilgi"], weight: 1, load: 60 },
          { id: "tyt_fel_ahlak",   name: "Ahlak ve Siyaset Felsefesi",             section: "Ahlak & Siyaset", prereq: ["tyt_fel_varlik"], weight: 1, load: 75 },
          { id: "tyt_fel_sanat",   name: "Sanat, Din ve Bilim Felsefesi",          section: "Ahlak & Siyaset", prereq: ["tyt_fel_ahlak"], weight: 1, load: 60 }
        ]}
      ]
    },
    "TYT Din Kültürü": {
      exam: "TYT", subject: "Din Kültürü", questionCount: 5,
      sections: ["İnanç & İbadet", "Ahlak & Kültür"],
      units: [
        { unit: "Din Kültürü ve Ahlak Bilgisi", topics: [
          { id: "tyt_din_inanc",   name: "İnanç ve İbadet",                        section: "İnanç & İbadet", prereq: [], weight: 1, load: 60 },
          { id: "tyt_din_ahlak",   name: "Ahlak ve Değerler",                      section: "Ahlak & Kültür", prereq: ["tyt_din_inanc"], weight: 1, load: 60 },
          { id: "tyt_din_kultur",  name: "Din, Kültür ve Medeniyet",               section: "Ahlak & Kültür", prereq: ["tyt_din_ahlak"], weight: 1, load: 60 },
          { id: "tyt_din_hz",      name: "Hz. Muhammed ve Vahiy",                  section: "İnanç & İbadet", prereq: ["tyt_din_inanc"], weight: 1, load: 60 }
        ]}
      ]
    },

    /* ================= AYT MATEMATİK (40 soru) ================= */
    "AYT Matematik": {
      exam: "AYT", subject: "Matematik", questionCount: 40,
      sections: ["Fonksiyon & Cebir", "Trigonometri", "Analiz (Limit-Türev-İntegral)", "Olasılık & Diziler", "Geometri"],
      units: [
        { unit: "Fonksiyonlar ve Cebir", topics: [
          { id: "ayt_mat_fonk_ileri", name: "İleri Fonksiyonlar (bileşke, ters, parçalı)", section: "Fonksiyon & Cebir", prereq: ["tyt_mat_fonksiyon"], weight: 3, load: 120, sub: ["Parçalı fonksiyon", "Mutlak değer fonksiyonu", "Bileşke", "Ters fonksiyon", "Fonksiyon grafikleri"] },
          { id: "ayt_mat_polinom",    name: "Polinomlarda İşlemler ve Bölme",       section: "Fonksiyon & Cebir", prereq: ["tyt_mat_polinom"], weight: 2, load: 90 },
          { id: "ayt_mat_ikinci",     name: "İkinci Dereceden Denklem ve Eşitsizlik Sistemleri", section: "Fonksiyon & Cebir", prereq: ["tyt_mat_ikinci"], weight: 3, load: 105 },
          { id: "ayt_mat_logaritma",  name: "Logaritma ve Üstel Fonksiyonlar",      section: "Fonksiyon & Cebir", prereq: ["ayt_mat_fonk_ileri"], weight: 3, load: 120, sub: ["Logaritma tanımı", "Log kuralları", "Logaritmik denklem", "Üstel fonksiyon", "Doğal logaritma"] }
        ]},
        { unit: "Trigonometri", topics: [
          { id: "ayt_mat_trig_temel", name: "Trigonometrik Fonksiyonlar ve Birim Çember", section: "Trigonometri", prereq: ["tyt_geo_dik_ucgen", "ayt_mat_fonk_ileri"], weight: 3, load: 120, sub: ["Birim çember", "Trigonometrik oranlar", "Bölgelere göre işaret", "Periyot"] },
          { id: "ayt_mat_trig_formul",name: "Toplam-Fark ve Yarım Açı Formülleri",  section: "Trigonometri", prereq: ["ayt_mat_trig_temel"], weight: 3, load: 105, sub: ["Toplam-fark formülleri", "Yarım açı", "İki kat açı", "Dönüşüm formülleri"] },
          { id: "ayt_mat_trig_denklem",name: "Trigonometrik Denklemler",            section: "Trigonometri", prereq: ["ayt_mat_trig_formul"], weight: 2, load: 90 }
        ]},
        { unit: "Diziler ve Olasılık", topics: [
          { id: "ayt_mat_diziler",    name: "Diziler (aritmetik, geometrik)",       section: "Olasılık & Diziler", prereq: ["ayt_mat_fonk_ileri"], weight: 2, load: 90, sub: ["Aritmetik dizi", "Geometrik dizi", "Toplam formülleri", "Seriler"] },
          { id: "ayt_mat_olasilik",   name: "İleri Olasılık ve Koşullu Olasılık",   section: "Olasılık & Diziler", prereq: ["tyt_mat_olasilik"], weight: 2, load: 90 },
          { id: "ayt_mat_binom",      name: "Binom Açılımı",                        section: "Olasılık & Diziler", prereq: ["tyt_mat_permutasyon"], weight: 1, load: 60 }
        ]},
        { unit: "Analiz", topics: [
          { id: "ayt_mat_limit",      name: "Limit ve Süreklilik",                  section: "Analiz (Limit-Türev-İntegral)", prereq: ["ayt_mat_diziler", "ayt_mat_logaritma"], weight: 3, load: 120, sub: ["Limit tanımı", "Soldan-sağdan limit", "Belirsizlik durumları", "Süreklilik", "Asimptot"] },
          { id: "ayt_mat_turev",      name: "Türev Alma Kuralları",                 section: "Analiz (Limit-Türev-İntegral)", prereq: ["ayt_mat_limit"], weight: 4, load: 135, sub: ["Türev tanımı", "Türev alma kuralları", "Zincir kuralı", "Kapalı türev", "Yüksek mertebe türev"] },
          { id: "ayt_mat_turev_uyg",  name: "Türev Uygulamaları (maks-min, grafik, hız)", section: "Analiz (Limit-Türev-İntegral)", prereq: ["ayt_mat_turev"], weight: 4, load: 135, sub: ["Teğet-normal denklemi", "Artan-azalan", "Maksimum-minimum", "Grafik çizimi", "Hız-ivme"] },
          { id: "ayt_mat_integral",   name: "Belirsiz İntegral ve Alma Yöntemleri", section: "Analiz (Limit-Türev-İntegral)", prereq: ["ayt_mat_turev_uyg"], weight: 3, load: 135, sub: ["Belirsiz integral", "Değişken değiştirme", "Kısmi integrasyon", "Basit kesirlere ayırma"] },
          { id: "ayt_mat_integral_uyg",name: "Belirli İntegral ve Alan-Hacim Hesabı",section: "Analiz (Limit-Türev-İntegral)", prereq: ["ayt_mat_integral"], weight: 3, load: 120, sub: ["Belirli integral", "Eğri altında alan", "İki eğri arası alan", "Dönel cisim hacmi"] }
        ]},
        { unit: "Geometri", topics: [
          { id: "ayt_geo_analitik_dogru",name: "Analitik Geometri: Doğru",          section: "Geometri", prereq: ["tyt_geo_analitik"], weight: 2, load: 90 },
          { id: "ayt_geo_cember",     name: "Analitik Geometri: Çember",            section: "Geometri", prereq: ["ayt_geo_analitik_dogru", "tyt_geo_cember"], weight: 2, load: 90 },
          { id: "ayt_geo_donusum",    name: "Dönüşüm Geometrisi",                   section: "Geometri", prereq: ["ayt_geo_analitik_dogru"], weight: 1, load: 75 },
          { id: "ayt_geo_kati",       name: "Katı Cisimler ve Hacim Hesapları",     section: "Geometri", prereq: ["tyt_geo_kati"], weight: 2, load: 90 },
          { id: "ayt_geo_vektor",     name: "Vektörler",                            section: "Geometri", prereq: ["ayt_geo_analitik_dogru"], weight: 1, load: 75 }
        ]}
      ]
    },

    /* ================= AYT FİZİK (14 soru) ================= */
    "AYT Fizik": {
      exam: "AYT", subject: "Fizik", questionCount: 14,
      sections: ["Mekanik", "Elektrik & Manyetizma", "Modern Fizik", "Dalga & Optik"],
      units: [
        { unit: "Kuvvet ve Hareket", topics: [
          { id: "ayt_fiz_vektor",   name: "Vektörler ve Bağıl Hareket",             section: "Mekanik", prereq: ["tyt_fiz_hareket"], weight: 2, load: 105 },
          { id: "ayt_fiz_newton",   name: "Newton Yasaları ve Sürtünmeli Sistemler",section: "Mekanik", prereq: ["ayt_fiz_vektor"], weight: 3, load: 120, sub: ["Serbest cisim diyagramı", "Sürtünme kuvveti", "Eğik düzlem", "Bağlı cisimler"] },
          { id: "ayt_fiz_atis",     name: "Atışlar (yatay, eğik)",                  section: "Mekanik", prereq: ["ayt_fiz_newton"], weight: 2, load: 105 },
          { id: "ayt_fiz_enerji",   name: "İş, Enerji ve Momentum Korunumu",        section: "Mekanik", prereq: ["ayt_fiz_newton"], weight: 3, load: 120, sub: ["İş ve güç", "Kinetik-potansiyel enerji", "Enerji korunumu", "Momentum", "Çarpışmalar"] },
          { id: "ayt_fiz_tork",     name: "Tork, Denge ve Kütle Merkezi",           section: "Mekanik", prereq: ["ayt_fiz_newton"], weight: 2, load: 90 },
          { id: "ayt_fiz_cembersel",name: "Düzgün Çembersel Hareket ve Kepler",     section: "Mekanik", prereq: ["ayt_fiz_enerji"], weight: 2, load: 105 },
          { id: "ayt_fiz_basit_harmonik", name: "Basit Harmonik Hareket",           section: "Mekanik", prereq: ["ayt_fiz_cembersel"], weight: 1, load: 90 }
        ]},
        { unit: "Elektrik ve Manyetizma", topics: [
          { id: "ayt_fiz_elektrik", name: "Elektriksel Kuvvet ve Alan",             section: "Elektrik & Manyetizma", prereq: ["tyt_fiz_elektrik"], weight: 2, load: 105 },
          { id: "ayt_fiz_potansiyel",name: "Elektriksel Potansiyel ve Sığa",        section: "Elektrik & Manyetizma", prereq: ["ayt_fiz_elektrik"], weight: 2, load: 105 },
          { id: "ayt_fiz_manyetizma",name: "Manyetik Alan ve İndüksiyon",           section: "Elektrik & Manyetizma", prereq: ["ayt_fiz_potansiyel"], weight: 2, load: 105, sub: ["Manyetik alan", "Akım-manyetik alan", "Lorentz kuvveti", "İndüksiyon", "Lenz yasası"] },
          { id: "ayt_fiz_alternatif",name: "Alternatif Akım ve Transformatör",      section: "Elektrik & Manyetizma", prereq: ["ayt_fiz_manyetizma"], weight: 1, load: 75 }
        ]},
        { unit: "Dalga, Optik ve Modern Fizik", topics: [
          { id: "ayt_fiz_dalga",    name: "Dalga Mekaniği ve Girişim",              section: "Dalga & Optik", prereq: ["tyt_fiz_dalga"], weight: 1, load: 90 },
          { id: "ayt_fiz_optik",    name: "Geometrik Optik (ayna, mercek)",         section: "Dalga & Optik", prereq: ["tyt_fiz_optik"], weight: 1, load: 90 },
          { id: "ayt_fiz_atom",     name: "Atom Fiziğine Giriş ve Radyoaktivite",   section: "Modern Fizik", prereq: ["ayt_fiz_potansiyel"], weight: 2, load: 105 },
          { id: "ayt_fiz_modern",   name: "Modern Fizik (özel görelilik, fotoelektrik)", section: "Modern Fizik", prereq: ["ayt_fiz_atom"], weight: 2, load: 105, sub: ["Özel görelilik", "Fotoelektrik olay", "Compton saçılması", "De Broglie dalga boyu"] }
        ]}
      ]
    },

    /* ================= AYT KİMYA (13 soru) ================= */
    "AYT Kimya": {
      exam: "AYT", subject: "Kimya", questionCount: 13,
      sections: ["Fiziksel Kimya", "Kimyasal Denge", "Organik Kimya", "Genel Kimya"],
      units: [
        { unit: "Modern Atom ve Gazlar", topics: [
          { id: "ayt_kim_atom",     name: "Modern Atom Teorisi ve Kuantum Sayıları",section: "Genel Kimya", prereq: ["tyt_kim_atom"], weight: 2, load: 120 },
          { id: "ayt_kim_gaz",      name: "Gazlar ve Gaz Kanunları",                section: "Fiziksel Kimya", prereq: ["tyt_kim_halleri"], weight: 2, load: 105 },
          { id: "ayt_kim_sivi",     name: "Sıvı Çözeltiler ve Koligatif Özellikler",section: "Fiziksel Kimya", prereq: ["ayt_kim_gaz"], weight: 2, load: 105 },
          { id: "ayt_kim_termo",    name: "Kimya ve Enerji (termokimya)",           section: "Fiziksel Kimya", prereq: ["ayt_kim_sivi"], weight: 1, load: 90 }
        ]},
        { unit: "Tepkime Hızı ve Denge", topics: [
          { id: "ayt_kim_hiz",      name: "Tepkime Hızları ve Mekanizma",           section: "Kimyasal Denge", prereq: ["ayt_kim_termo"], weight: 2, load: 105 },
          { id: "ayt_kim_denge",    name: "Kimyasal Denge ve Le Chatelier",         section: "Kimyasal Denge", prereq: ["ayt_kim_hiz"], weight: 2, load: 120, sub: ["Denge sabiti", "Le Chatelier", "Derişim etkisi", "Sıcaklık-basınç etkisi"] },
          { id: "ayt_kim_asit_baz", name: "Asit-Baz Dengesi ve pH",                 section: "Kimyasal Denge", prereq: ["ayt_kim_denge"], weight: 2, load: 120, sub: ["Kuvvetli-zayıf asit-baz", "pH-pOH hesabı", "Tampon çözeltiler", "Titrasyon"] },
          { id: "ayt_kim_cozunurluk",name: "Çözünürlük Dengesi",                    section: "Kimyasal Denge", prereq: ["ayt_kim_asit_baz"], weight: 1, load: 90 },
          { id: "ayt_kim_elektro",  name: "Kimya ve Elektrik (redoks, elektroliz)", section: "Fiziksel Kimya", prereq: ["ayt_kim_denge"], weight: 2, load: 105 }
        ]},
        { unit: "Organik Kimya", topics: [
          { id: "ayt_kim_org_giris",name: "Organik Kimyaya Giriş ve Hibritleşme",   section: "Organik Kimya", prereq: ["ayt_kim_atom"], weight: 2, load: 105 },
          { id: "ayt_kim_hidrokarbon",name: "Hidrokarbonlar (alkan, alken, alkin)", section: "Organik Kimya", prereq: ["ayt_kim_org_giris"], weight: 2, load: 120, sub: ["Alkanlar", "Alkenler", "Alkinler", "Aromatik bileşikler", "İzomeri"] },
          { id: "ayt_kim_fonksiyonel",name: "Fonksiyonel Gruplar (alkol, eter, asit, ester)", section: "Organik Kimya", prereq: ["ayt_kim_hidrokarbon"], weight: 3, load: 135, sub: ["Alkoller", "Eterler", "Aldehit-keton", "Karboksilik asit", "Esterler", "Aminler"] },
          { id: "ayt_kim_enerji_kaynak",name: "Enerji Kaynakları ve Bilimsel Gelişmeler", section: "Genel Kimya", prereq: ["ayt_kim_fonksiyonel"], weight: 1, load: 60 }
        ]}
      ]
    },

    /* ================= AYT BİYOLOJİ (13 soru) ================= */
    "AYT Biyoloji": {
      exam: "AYT", subject: "Biyoloji", questionCount: 13,
      sections: ["Genetik", "Hücre & Metabolizma", "Sistemler", "Ekoloji & Bitki"],
      units: [
        { unit: "Kalıtım ve Moleküler Biyoloji", topics: [
          { id: "ayt_biy_kalitim",  name: "Kalıtımın Genel İlkeleri",               section: "Genetik", prereq: ["tyt_biy_kalitim"], weight: 3, load: 120, sub: ["Mendel yasaları", "Çaprazlamalar", "Eşeye bağlı kalıtım", "Kan grupları", "Soyağacı"] },
          { id: "ayt_biy_dna",      name: "Nükleik Asitler ve Protein Sentezi",     section: "Genetik", prereq: ["ayt_biy_kalitim"], weight: 3, load: 135, sub: ["DNA yapısı", "Replikasyon", "Transkripsiyon", "Translasyon", "Genetik kod"] },
          { id: "ayt_biy_biyotek",  name: "Genetik Mühendisliği ve Biyoteknoloji",  section: "Genetik", prereq: ["ayt_biy_dna"], weight: 2, load: 90 }
        ]},
        { unit: "Metabolizma", topics: [
          { id: "ayt_biy_enzim",    name: "Enzimler ve Metabolizma",                section: "Hücre & Metabolizma", prereq: ["tyt_biy_zar"], weight: 2, load: 105 },
          { id: "ayt_biy_fotosentez",name: "Fotosentez ve Kemosentez",              section: "Hücre & Metabolizma", prereq: ["ayt_biy_enzim"], weight: 3, load: 135, sub: ["Işığa bağlı reaksiyonlar", "Calvin döngüsü", "Fotosentez hızı", "Kemosentez"] },
          { id: "ayt_biy_solunum",  name: "Hücresel Solunum (oksijenli, fermantasyon)", section: "Hücre & Metabolizma", prereq: ["ayt_biy_fotosentez"], weight: 3, load: 135, sub: ["Glikoliz", "Krebs döngüsü", "ETS", "Fermantasyon"] }
        ]},
        { unit: "Sistemler ve Bitki Biyolojisi", topics: [
          { id: "ayt_biy_sinir",    name: "Sinir Sistemi ve Duyu Organları",        section: "Sistemler", prereq: ["ayt_biy_enzim"], weight: 2, load: 120 },
          { id: "ayt_biy_endokrin", name: "Endokrin Sistem ve Hormonlar",           section: "Sistemler", prereq: ["ayt_biy_sinir"], weight: 2, load: 105 },
          { id: "ayt_biy_bosaltim", name: "Boşaltım ve Solunum Sistemi",            section: "Sistemler", prereq: ["ayt_biy_endokrin"], weight: 2, load: 105 },
          { id: "ayt_biy_ureme",    name: "Üreme Sistemi ve Embriyonik Gelişim",    section: "Sistemler", prereq: ["ayt_biy_bosaltim"], weight: 2, load: 105 },
          { id: "ayt_biy_bitki",    name: "Bitki Biyolojisi (yapı, taşıma, hormon)",section: "Ekoloji & Bitki", prereq: ["ayt_biy_fotosentez"], weight: 3, load: 135, sub: ["Bitkisel dokular", "Su ve mineral taşınması", "Bitki hormonları", "Çimlenme"] },
          { id: "ayt_biy_komunite", name: "Komünite ve Popülasyon Ekolojisi",       section: "Ekoloji & Bitki", prereq: ["tyt_biy_ekosistem"], weight: 2, load: 90 }
        ]}
      ]
    },

    /* ================= AYT EDEBİYAT (24 soru) ================= */
    "AYT Edebiyat": {
      exam: "AYT", subject: "Edebiyat", questionCount: 24,
      sections: ["Şiir Bilgisi", "İslamiyet Öncesi & Halk", "Divan Edebiyatı", "Tanzimat & Sonrası", "Cumhuriyet Dönemi"],
      units: [
        { unit: "Edebi Bilgiler", topics: [
          { id: "ayt_ede_siir",     name: "Şiir Bilgisi (ölçü, uyak, nazım biçimleri)", section: "Şiir Bilgisi", prereq: [], weight: 3, load: 105, sub: ["Ölçü (hece, aruz)", "Uyak ve redif", "Nazım birimi", "Nazım biçimleri", "Şiir türleri"] },
          { id: "ayt_ede_sanat",    name: "Söz Sanatları",                          section: "Şiir Bilgisi", prereq: ["ayt_ede_siir"], weight: 3, load: 90, sub: ["Benzetme-istiare", "Mecaz-kinaye", "Tezat-tevriye", "Cinas-seci"] },
          { id: "ayt_ede_turler",   name: "Edebî Türler ve Metin Bilgisi",          section: "Şiir Bilgisi", prereq: ["ayt_ede_sanat"], weight: 2, load: 90 }
        ]},
        { unit: "İslamiyet Öncesi ve Halk Edebiyatı", topics: [
          { id: "ayt_ede_islamoncesi",name: "İslamiyet Öncesi Türk Edebiyatı",      section: "İslamiyet Öncesi & Halk", prereq: ["ayt_ede_siir"], weight: 2, load: 75 },
          { id: "ayt_ede_gecis",    name: "Geçiş Dönemi Eserleri",                  section: "İslamiyet Öncesi & Halk", prereq: ["ayt_ede_islamoncesi"], weight: 2, load: 60 },
          { id: "ayt_ede_asik",     name: "Âşık Edebiyatı (koşma, semai, varsağı)", section: "İslamiyet Öncesi & Halk", prereq: ["ayt_ede_gecis"], weight: 2, load: 90 },
          { id: "ayt_ede_tekke",    name: "Tekke-Tasavvuf Edebiyatı",               section: "İslamiyet Öncesi & Halk", prereq: ["ayt_ede_asik"], weight: 2, load: 75 },
          { id: "ayt_ede_anonim",   name: "Anonim Halk Edebiyatı",                  section: "İslamiyet Öncesi & Halk", prereq: ["ayt_ede_asik"], weight: 1, load: 60 }
        ]},
        { unit: "Divan Edebiyatı", topics: [
          { id: "ayt_ede_divan_nazim",name: "Divan Şiiri Nazım Biçimleri (gazel, kaside, mesnevi)", section: "Divan Edebiyatı", prereq: ["ayt_ede_siir"], weight: 3, load: 105, sub: ["Gazel", "Kaside", "Mesnevi", "Rubai", "Murabba"] },
          { id: "ayt_ede_divan_sair",name: "Divan Edebiyatı Şair ve Yazarları",     section: "Divan Edebiyatı", prereq: ["ayt_ede_divan_nazim"], weight: 3, load: 105 },
          { id: "ayt_ede_divan_nesir",name: "Divan Nesri",                          section: "Divan Edebiyatı", prereq: ["ayt_ede_divan_sair"], weight: 1, load: 60 }
        ]},
        { unit: "Yeni Türk Edebiyatı", topics: [
          { id: "ayt_ede_tanzimat", name: "Tanzimat Edebiyatı (1. ve 2. Dönem)",    section: "Tanzimat & Sonrası", prereq: ["ayt_ede_divan_sair"], weight: 3, load: 105 },
          { id: "ayt_ede_servet",   name: "Servet-i Fünûn ve Fecr-i Âti",           section: "Tanzimat & Sonrası", prereq: ["ayt_ede_tanzimat"], weight: 2, load: 90 },
          { id: "ayt_ede_milli",    name: "Millî Edebiyat Dönemi",                  section: "Tanzimat & Sonrası", prereq: ["ayt_ede_servet"], weight: 2, load: 90 },
          { id: "ayt_ede_cumhuriyet_siir",name: "Cumhuriyet Dönemi Şiiri",          section: "Cumhuriyet Dönemi", prereq: ["ayt_ede_milli"], weight: 3, load: 105, sub: ["Beş Hececiler", "Garip akımı", "İkinci Yeni", "Toplumcu gerçekçi şiir"] },
          { id: "ayt_ede_cumhuriyet_roman",name: "Cumhuriyet Dönemi Roman ve Hikâye",section: "Cumhuriyet Dönemi", prereq: ["ayt_ede_cumhuriyet_siir"], weight: 3, load: 105 },
          { id: "ayt_ede_dunya",    name: "Dünya Edebiyatı ve Akımlar",             section: "Cumhuriyet Dönemi", prereq: ["ayt_ede_cumhuriyet_roman"], weight: 2, load: 75 }
        ]}
      ]
    },

    /* ================= AYT TARİH (10+11 soru) ================= */
    "AYT Tarih": {
      exam: "AYT", subject: "Tarih", questionCount: 21,
      sections: ["Türk-İslam Tarihi", "Osmanlı Tarihi", "İnkılap Tarihi", "Çağdaş Türk & Dünya"],
      units: [
        { unit: "Orta ve Yeni Çağ", topics: [
          { id: "ayt_tar_ilkturk",  name: "İlk Türk Devletleri ve Kültür",          section: "Türk-İslam Tarihi", prereq: ["tyt_tar_ilkturk"], weight: 2, load: 90 },
          { id: "ayt_tar_turkislam",name: "Türk-İslam Devletleri (Karahanlı, Gazneli, Selçuklu)", section: "Türk-İslam Tarihi", prereq: ["ayt_tar_ilkturk"], weight: 2, load: 105 },
          { id: "ayt_tar_beylik",   name: "Anadolu Selçuklu ve Beylikler",          section: "Türk-İslam Tarihi", prereq: ["ayt_tar_turkislam"], weight: 2, load: 90 }
        ]},
        { unit: "Osmanlı Tarihi", topics: [
          { id: "ayt_tar_kurulus",  name: "Osmanlı Kuruluş Dönemi (AYT ileri düzey)",                 section: "Osmanlı Tarihi", prereq: ["ayt_tar_beylik"], weight: 2, load: 90 },
          { id: "ayt_tar_yukselme", name: "Osmanlı Yükselme Dönemi (AYT ileri düzey)",                section: "Osmanlı Tarihi", prereq: ["ayt_tar_kurulus"], weight: 2, load: 105 },
          { id: "ayt_tar_kultur",   name: "Osmanlı Kültür ve Medeniyeti",           section: "Osmanlı Tarihi", prereq: ["ayt_tar_yukselme"], weight: 2, load: 90 },
          { id: "ayt_tar_dagilma",  name: "Osmanlı Duraklama ve Dağılma (AYT ileri düzey)", section: "Osmanlı Tarihi", prereq: ["ayt_tar_kultur"], weight: 2, load: 105 }
        ]},
        { unit: "İnkılap ve Çağdaş Dönem", topics: [
          { id: "ayt_tar_1dunya",   name: "I. Dünya Savaşı ve Mondros",             section: "İnkılap Tarihi", prereq: ["ayt_tar_dagilma"], weight: 2, load: 90 },
          { id: "ayt_tar_kongre",   name: "Millî Mücadele Hazırlık ve Kongreler",   section: "İnkılap Tarihi", prereq: ["ayt_tar_1dunya"], weight: 2, load: 90 },
          { id: "ayt_tar_cepheler", name: "Kurtuluş Savaşı Cepheleri ve Lozan",     section: "İnkılap Tarihi", prereq: ["ayt_tar_kongre"], weight: 2, load: 105 },
          { id: "ayt_tar_inkilaplar",name: "Atatürk İlkeleri ve İnkılapları",       section: "İnkılap Tarihi", prereq: ["ayt_tar_cepheler"], weight: 2, load: 90 },
          { id: "ayt_tar_2dunya",   name: "II. Dünya Savaşı ve Soğuk Savaş",        section: "Çağdaş Türk & Dünya", prereq: ["ayt_tar_inkilaplar"], weight: 2, load: 90 },
          { id: "ayt_tar_cagdas",   name: "Çağdaş Türk ve Dünya Tarihi",            section: "Çağdaş Türk & Dünya", prereq: ["ayt_tar_2dunya"], weight: 1, load: 75 }
        ]}
      ]
    },

    /* ================= AYT COĞRAFYA (6+11 soru) ================= */
    "AYT Coğrafya": {
      exam: "AYT", subject: "Coğrafya", questionCount: 17,
      sections: ["Doğal Sistemler", "Beşerî Sistemler", "Türkiye Coğrafyası", "Küresel Ortam"],
      units: [
        { unit: "Doğal Sistemler", topics: [
          { id: "ayt_cog_ekosistem",name: "Ekosistem ve Biyoçeşitlilik",            section: "Doğal Sistemler", prereq: ["tyt_cog_iklim"], weight: 2, load: 90 },
          { id: "ayt_cog_iklim",    name: "İklim Tipleri ve Bitki Örtüsü",          section: "Doğal Sistemler", prereq: ["ayt_cog_ekosistem"], weight: 2, load: 105 },
          { id: "ayt_cog_yerkabugu",name: "Yer Şekilleri ve Oluşum Süreçleri",      section: "Doğal Sistemler", prereq: ["tyt_cog_yerkabugu"], weight: 2, load: 105 }
        ]},
        { unit: "Beşerî Sistemler", topics: [
          { id: "ayt_cog_nufus",    name: "Nüfus Politikaları ve Piramitleri",      section: "Beşerî Sistemler", prereq: ["tyt_cog_nufus"], weight: 2, load: 90 },
          { id: "ayt_cog_sehir",    name: "Şehirler ve Etki Alanları",              section: "Beşerî Sistemler", prereq: ["ayt_cog_nufus"], weight: 2, load: 75 },
          { id: "ayt_cog_ekonomi",  name: "Ekonomik Faaliyetler ve Sektörler",      section: "Beşerî Sistemler", prereq: ["ayt_cog_sehir"], weight: 2, load: 90 }
        ]},
        { unit: "Türkiye ve Küresel Ortam", topics: [
          { id: "ayt_cog_tr_iklim", name: "Türkiye'nin İklimi ve Yer Şekilleri",    section: "Türkiye Coğrafyası", prereq: ["ayt_cog_iklim", "tyt_cog_turkiye"], weight: 3, load: 120 },
          { id: "ayt_cog_tr_nufus", name: "Türkiye'de Nüfus ve Yerleşme",           section: "Türkiye Coğrafyası", prereq: ["ayt_cog_tr_iklim"], weight: 2, load: 90 },
          { id: "ayt_cog_tr_ekonomi",name: "Türkiye Ekonomisi (tarım, sanayi, ulaşım, turizm)", section: "Türkiye Coğrafyası", prereq: ["ayt_cog_tr_nufus"], weight: 3, load: 120 },
          { id: "ayt_cog_bolgeler", name: "Bölgeler ve Ülkeler (küresel ortam)",    section: "Küresel Ortam", prereq: ["ayt_cog_tr_ekonomi"], weight: 2, load: 90 },
          { id: "ayt_cog_cevre",    name: "Çevre ve Doğal Afetler",                 section: "Küresel Ortam", prereq: ["ayt_cog_bolgeler"], weight: 2, load: 75 }
        ]}
      ]
    },

    /* ================= AYT FELSEFE GRUBU (12 soru) ================= */
    "AYT Felsefe Grubu": {
      exam: "AYT", subject: "Felsefe", questionCount: 12,
      sections: ["Felsefe Tarihi", "Psikoloji", "Sosyoloji", "Mantık"],
      units: [
        { unit: "Felsefe ve Mantık", topics: [
          { id: "ayt_fel_tarih_ilk", name: "İlk Çağ ve Orta Çağ Felsefesi",         section: "Felsefe Tarihi", prereq: ["tyt_fel_giris"], weight: 2, load: 105 },
          { id: "ayt_fel_tarih_yeni",name: "15-20. Yüzyıl Felsefesi",               section: "Felsefe Tarihi", prereq: ["ayt_fel_tarih_ilk"], weight: 2, load: 105 },
          { id: "ayt_fel_mantik",   name: "Mantığa Giriş ve Klasik Mantık",         section: "Mantık", prereq: ["tyt_fel_bilgi"], weight: 2, load: 105 },
          { id: "ayt_fel_sembolik", name: "Sembolik Mantık",                        section: "Mantık", prereq: ["ayt_fel_mantik"], weight: 2, load: 105 }
        ]},
        { unit: "Psikoloji ve Sosyoloji", topics: [
          { id: "ayt_psi_giris",    name: "Psikoloji Bilimini Tanıma ve Yaklaşımlar",section: "Psikoloji", prereq: [], weight: 2, load: 90 },
          { id: "ayt_psi_ogrenme",  name: "Öğrenme, Bellek ve Güdü",                section: "Psikoloji", prereq: ["ayt_psi_giris"], weight: 2, load: 105 },
          { id: "ayt_psi_kisilik",  name: "Kişilik, Ruh Sağlığı ve Sosyal Etki",    section: "Psikoloji", prereq: ["ayt_psi_ogrenme"], weight: 2, load: 90 },
          { id: "ayt_sos_giris",    name: "Sosyolojiye Giriş ve Toplumsal Yapı",    section: "Sosyoloji", prereq: [], weight: 2, load: 90 },
          { id: "ayt_sos_kurum",    name: "Toplumsal Kurumlar ve Değişme",          section: "Sosyoloji", prereq: ["ayt_sos_giris"], weight: 2, load: 105 }
        ]}
      ]
    },

    /* ================= YDT İNGİLİZCE (80 soru) ================= */
    "YDT İngilizce": {
      exam: "YDT", subject: "Dil", questionCount: 80,
      sections: ["Kelime & Dilbilgisi", "Cümle Tamamlama", "Çeviri", "Paragraf", "Diyalog & Anlam"],
      units: [
        { unit: "Dil Bilgisi ve Kelime", topics: [
          { id: "ydt_ing_tenses",   name: "Tenses (zamanlar)",                      section: "Kelime & Dilbilgisi", prereq: [], weight: 4, load: 135, sub: ["Present tenses", "Past tenses", "Future tenses", "Perfect tenses"] },
          { id: "ydt_ing_modals",   name: "Modals ve Passive Voice",                section: "Kelime & Dilbilgisi", prereq: ["ydt_ing_tenses"], weight: 3, load: 105 },
          { id: "ydt_ing_clause",   name: "Noun / Adjective / Adverbial Clauses",   section: "Kelime & Dilbilgisi", prereq: ["ydt_ing_modals"], weight: 4, load: 135, sub: ["Noun clauses", "Adjective (relative) clauses", "Adverbial clauses"] },
          { id: "ydt_ing_conj",     name: "Conjunctions ve Connectors",             section: "Kelime & Dilbilgisi", prereq: ["ydt_ing_clause"], weight: 3, load: 105 },
          { id: "ydt_ing_prep",     name: "Prepositions ve Phrasal Verbs",          section: "Kelime & Dilbilgisi", prereq: ["ydt_ing_conj"], weight: 3, load: 120 },
          { id: "ydt_ing_vocab",    name: "Vocabulary Building",                    section: "Kelime & Dilbilgisi", prereq: [], weight: 5, load: 150 }
        ]},
        { unit: "Soru Tipleri", topics: [
          { id: "ydt_ing_cloze",    name: "Cloze Test",                             section: "Cümle Tamamlama", prereq: ["ydt_ing_prep"], weight: 3, load: 90 },
          { id: "ydt_ing_sentence", name: "Sentence Completion",                    section: "Cümle Tamamlama", prereq: ["ydt_ing_clause"], weight: 4, load: 105 },
          { id: "ydt_ing_translation",name: "Translation (TR-EN / EN-TR)",          section: "Çeviri", prereq: ["ydt_ing_sentence"], weight: 3, load: 90 },
          { id: "ydt_ing_reading",  name: "Reading Comprehension",                  section: "Paragraf", prereq: ["ydt_ing_vocab"], weight: 5, load: 150, sub: ["Main idea", "Detail questions", "Inference", "Vocabulary in context"] },
          { id: "ydt_ing_dialogue", name: "Dialogue Completion",                    section: "Diyalog & Anlam", prereq: ["ydt_ing_sentence"], weight: 2, load: 75 },
          { id: "ydt_ing_restatement",name: "Restatement ve Paragraph Completion",  section: "Diyalog & Anlam", prereq: ["ydt_ing_reading"], weight: 3, load: 105 },
          { id: "ydt_ing_irrelevant",name: "Irrelevant Sentence",                   section: "Paragraf", prereq: ["ydt_ing_reading"], weight: 2, load: 75 }
        ]}
      ]
    }
  },

  /* Alan → gereken dersler */
  trackSubjects: {
    "Sayısal":       ["TYT Matematik", "TYT Türkçe", "TYT Fizik", "TYT Kimya", "TYT Biyoloji", "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü", "AYT Matematik", "AYT Fizik", "AYT Kimya", "AYT Biyoloji"],
    "Eşit Ağırlık":  ["TYT Matematik", "TYT Türkçe", "TYT Fizik", "TYT Kimya", "TYT Biyoloji", "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü", "AYT Matematik", "AYT Edebiyat", "AYT Tarih", "AYT Coğrafya"],
    "Sözel":         ["TYT Matematik", "TYT Türkçe", "TYT Fizik", "TYT Kimya", "TYT Biyoloji", "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü", "AYT Edebiyat", "AYT Tarih", "AYT Coğrafya", "AYT Felsefe Grubu"],
    "Dil":           ["TYT Matematik", "TYT Türkçe", "TYT Fizik", "TYT Kimya", "TYT Biyoloji", "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü", "YDT İngilizce"]
  }
};
