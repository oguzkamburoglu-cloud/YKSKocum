// YKS (TYT/AYT) Soru Bankasi — 2016-2025 mufredat ve soru tarzina gore
// hazirlanmis OZGUN sorular. Bunlar OSYM'nin cikmis sorulari DEGILDIR;
// OSYM soru kitapciklarinin cogaltilmasi ve kullanilmasi izne baglidir.
// kaynak: "ozgun" alani tasiyan kayitlar bu oturumda yazilip dogrulanmistir.

const YKS_QUESTION_BANK = {
  Matematik: [
    {
      id: "mat_1",
      topic: "Temel Kavramlar",
      year: 2023,
      text: "a, b ve c sıfırdan farklı gerçel sayılar olmak üzere, a + b < 0, b + c > 0 ve a * c < 0 olduğuna göre; a, b ve c sayılarının işaretleri sırasıyla aşağıdakilerden hangisidir?",
      options: ["-, -, +", "+, -, +", "-, +, +", "-, -, -", "+, +, -"],
      correct: 0,
      explanation: "a * c < 0 ise a ve c zıt işaretlidir. b + c > 0 ve a + b < 0 ise c pozitif, a negatif olmalıdır. c pozitif (+), a negatif (-) iken, a + b < 0 eşitsizliğini sağlamak için b de negatif (-) olmalıdır. Dolayısıyla işaretler sırasıyla -, -, + şeklindedir."
    },
    {
      id: "mat_2",
      topic: "Bölünebilme Kuralları",
      year: 2022,
      text: "Rakamları birbirinden farklı üç basamaklı bir ABC doğal sayısı 3, 4 ve 5 ile kalansız bölünebilmektedir. Buna göre A + B + C toplamı kaçtır?",
      options: ["12", "15", "18", "21", "24"],
      correct: 1,
      explanation: "ABC sayısı 5 ile bölündüğü için C = 0 veya C = 5 olmalıdır. ABC sayısı 4 ile bölündüğü için son iki basamağı olan BC çift sayı olmalı, bu yüzden C = 0'dır. Sayı AB0 olur. 4 ile bölünebilmesi için B sayısı 2, 4, 6, 8 olabilir. 3 ile bölünebilmesi için A + B + 0, 3'ün katı olmalıdır. Rakamları farklı şartını sağlayan A=6, B=9, C=0 değerleri için A+B+C = 15 olur."
    },
    {
      id: "mat_3",
      topic: "Üslü Sayılar",
      year: 2021,
      text: "2^x = a ve 3^x = b olduğuna göre, 144^x ifadesinin a ve b türünden eşiti aşağıdakilerden hangisidir?",
      options: ["a^2 * b^2", "a^4 * b^2", "a^2 * b^4", "a^3 * b^2", "a^4 * b^4"],
      correct: 1,
      explanation: "144 sayısı asal çarpanlarına ayrıldığında 144 = 16 * 9 = 2^4 * 3^2 olur. Dolayısıyla 144^x = (2^4 * 3^2)^x = (2^x)^4 * (3^x)^2 = a^4 * b^2 bulunur."
    },
    {
      id: "mat_4",
      topic: "Köklü Sayılar",
      year: 2020,
      text: "√(18) + √(8) - √(50) işleminin sonucu aşağıdakilerden hangisidir?",
      options: ["0", "√2", "2√2", "3√2", "5√2"],
      correct: 0,
      explanation: "√(18) = 3√2, √(8) = 2√2 ve √(50) = 5√2'dir. İşlemi yaparsak: 3√2 + 2√2 - 5√2 = 5√2 - 5√2 = 0 bulunur."
    },
    {
      id: "mat_5",
      topic: "Fonksiyonlar",
      year: 2023,
      text: "f(x) = ax + b doğrusal fonksiyonu için f(2) = 7 ve f(5) = 16 olduğuna göre, f(8) değeri kaçtır?",
      options: ["21", "23", "25", "27", "29"],
      correct: 2,
      explanation: "f(2) = 2a + b = 7 ve f(5) = 5a + b = 16. İki denklemi çıkarırsak 3a = 9 => a = 3 bulunur. a = 3 ise 2(3) + b = 7 => b = 1 olur. Fonksiyon f(x) = 3x + 1'dir. Buradan f(8) = 3 * 8 + 1 = 25 bulunur."
    },
    {
      id: "mat_6",
      topic: "Basit Eşitsizlikler",
      year: 2019,
      text: "x ve y gerçel sayıları için -2 < x < 4 ve 1 < y < 3 olduğuna göre, 2x - 3y ifadesinin alabileceği en büyük tam sayı değeri kaçtır?",
      options: ["2", "3", "4", "5", "6"],
      correct: 2,
      explanation: "-2 < x < 4  =>  -4 < 2x < 8.  1 < y < 3  =>  -9 < -3y < -3. Bu iki eşitsizliği taraf tarafa toplarsak: -13 < 2x - 3y < 5 elde edilir. Bu ifadenin alabileceği en büyük tam sayı değeri 4 değil, sınır değer açık olduğu için 4'tür (5'ten küçük en büyük tam sayı)."
    },
    {
      id: "mat_7",
      topic: "Mutlak Değer",
      year: 2018,
      text: "|x - 3| <= 5 eşitsizliğini sağlayan x tam sayılarının toplamı kaçtır?",
      options: ["30", "33", "36", "39", "42"],
      correct: 1,
      explanation: "|x - 3| <= 5 ise -5 <= x - 3 <= 5 yazılır. Her tarafa 3 eklersek -2 <= x <= 8 olur. Bu aralıktaki tam sayılar: -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8'dir. Toplamları: (-2 - 1 + 0 + 1 + 2) + (3 + 4 + 5 + 6 + 7 + 8) = 0 + 33 = 33 bulunur."
    },
    {
      id: "mat_8",
      topic: "Polinomlar",
      year: 2022,
      text: "P(x) = x^2 - ax + 6 polinomunun x - 2 ile bölümünden kalan 4 olduğuna göre, a kaçtır?",
      options: ["1", "2", "3", "4", "5"],
      correct: 2,
      explanation: "P(x)'in x - 2 ile bölümünden kalan P(2)'dir. P(2) = 2^2 - 2a + 6 = 4 => 10 - 2a = 4 => 2a = 6 => a = 3 bulunur."
    },
    {
      id: "mat_9",
      topic: "Trigonometri",
      year: 2023,
      text: "0 < x < π/2 olmak üzere, sin(x) * cos(x) = 1/4 olduğuna göre, sin(x) + cos(x) toplamının pozitif değeri kaçtır?",
      options: ["√6/2", "√3/2", "√2/2", "√5/2", "√6/3"],
      correct: 0,
      explanation: "T = sin(x) + cos(x) olsun. Her iki tarafın karesini alırsak: T^2 = sin^2(x) + cos^2(x) + 2*sin(x)*cos(x) = 1 + 2*(1/4) = 1 + 1/2 = 3/2. T pozitif olduğu için T = √(3/2) = √3/√2 = √6/2 elde edilir."
    },
    {
      id: "mat_10",
      topic: "Logaritma",
      year: 2021,
      text: "log_2(x) + log_2(x - 2) = 3 denklemini sağlayan x değeri kaçtır?",
      options: ["2", "3", "4", "5", "6"],
      correct: 2,
      explanation: "Logaritma özelliklerinden, log_2(x * (x - 2)) = 3 olur. Buradan x(x - 2) = 2^3 = 8 => x^2 - 2x - 8 = 0. Çarpanlarına ayırırsak (x - 4)(x + 2) = 0. Logaritma tanım kümesinden x > 2 olmalıdır, bu yüzden x = 4 bulunur."
    },
    {
      id: "mat_11",
      topic: "Diziler",
      year: 2020,
      text: "Bir (a_n) aritmetik dizisinde a_2 = 5 ve a_5 = 14 olduğuna göre, a_10 kaçtır?",
      options: ["25", "27", "29", "31", "33"],
      correct: 2,
      explanation: "Ortak fark d olsun. a_5 = a_2 + 3d => 14 = 5 + 3d => 3d = 9 => d = 3. İlk terim a_1 = a_2 - d = 5 - 3 = 2'dir. a_10 = a_1 + 9d = 2 + 9*3 = 29 bulunur."
    },
    {
      id: "mat_12",
      topic: "Limit ve Süreklilik",
      year: 2024,
      text: "lim (x->3) (x^2 - 9) / (x - 3) limitinin değeri kaçtır?",
      options: ["0", "3", "6", "9", "Belirsiz"],
      correct: 2,
      explanation: "x = 3 için 0/0 belirsizliği vardır. İfadeyi çarpanlarına ayıralım: (x - 3)(x + 3) / (x - 3) = x + 3. Şimdi limiti hesaplarsak: lim (x->3) (x + 3) = 3 + 3 = 6 olur."
    },
    {
      id: "mat_13",
      topic: "Türev",
      year: 2023,
      text: "f(x) = x^3 - 3x^2 + 4x - 5 olduğuna göre, f'(2) değeri kaçtır?",
      options: ["2", "4", "6", "8", "10"],
      correct: 1,
      explanation: "f'(x) = 3x^2 - 6x + 4. x = 2 yazarsak: f'(2) = 3(2)^2 - 6(2) + 4 = 12 - 12 + 4 = 4 bulunur."
    },
    {
      id: "mat_14",
      topic: "İntegral",
      year: 2022,
      text: "∫ (from 1 to 3) (2x + 1) dx integralinin değeri kaçtır?",
      options: ["8", "10", "12", "14", "16"],
      correct: 1,
      explanation: "İntegral alırsak: [x^2 + x] (1'den 3'e). Üst sınırı yazarsak: 3^2 + 3 = 12. Alt sınırı yazarsak: 1^2 + 1 = 2. Farkı: 12 - 2 = 10 bulunur."
    },
    {
      id: "mat_15",
      topic: "Permütasyon-Kombinasyon",
      year: 2021,
      text: "5 kız ve 4 erkek öğrenci arasından, 2 kız ve 2 erkek öğrenciden oluşan 4 kişilik bir grup kaç farklı şekilde seçilebilir?",
      options: ["30", "45", "60", "75", "90"],
      correct: 2,
      explanation: "Seçim kombinasyon ile yapılır. C(5, 2) * C(4, 2) = (5*4 / 2*1) * (4*3 / 2*1) = 10 * 6 = 60 farklı şekilde seçilebilir."
    },
    {
      id: "mat_16",
      topic: "Olasılık",
      year: 2020,
      text: "Bir madeni para 3 kez atılıyor. En az iki kez tura gelme olasılığı kaçtır?",
      options: ["1/8", "3/8", "1/2", "5/8", "3/4"],
      correct: 2,
      explanation: "Örnek uzay eleman sayısı 2^3 = 8'dir. İstenen durumlar: (T, T, Y), (T, Y, T), (Y, T, T) ve (T, T, T) olmak üzere 4 tanedir. Olasılık: 4/8 = 1/2'dir."
    },
    {
      id: "mat_17",
      topic: "Kümeler",
      year: 2019,
      text: "A ve B kümeleri için s(A) = 12, s(B) = 8 ve s(A ∩ B) = 3 olduğuna göre, s(A ∪ B) kaçtır?",
      options: ["15", "17", "19", "21", "23"],
      correct: 1,
      explanation: "Küme birleşim formülünden: s(A ∪ B) = s(A) + s(B) - s(A ∩ B) = 12 + 8 - 3 = 17 bulunur."
    },
    {
      id: "mat_18",
      topic: "Veri Analizi",
      year: 2018,
      text: "8, 12, 15, 17, 23 sayı dizisinin standart sapmasını bulmadan önce aritmetik ortalaması kaçtır?",
      options: ["13", "14", "15", "16", "17"],
      correct: 2,
      explanation: "Aritmetik Ortalama = (8 + 12 + 15 + 17 + 23) / 5 = 75 / 5 = 15 bulunur."
    },
    {
      id: "mat_19",
      topic: "Geometri - Üçgenler",
      year: 2023,
      text: "Bir ABC dik üçgeninde AB ⊥ BC, |AB| = 6 cm ve |AC| = 10 cm olduğuna göre, bu üçgenin alanı kaç cm² dir?",
      options: ["24", "30", "36", "48", "60"],
      correct: 0,
      explanation: "Pisagor teoreminden |BC|^2 = |AC|^2 - |AB|^2 = 10^2 - 6^2 = 64 => |BC| = 8 cm. Dik üçgenin alanı dik kenarların çarpımının yarısıdır: (6 * 8) / 2 = 24 cm²."
    },
    {
      id: "mat_20",
      topic: "Geometri - Çember ve Daire",
      year: 2022,
      text: "Yarıçapı 6 cm olan bir dairenin çevresinin alanına oranı kaçtır?",
      options: ["1/3", "1/2", "2/3", "1", "3/2"],
      correct: 0,
      explanation: "Çevre = 2 * π * r = 12π. Alan = π * r^2 = 36π. Çevre / Alan = 12π / 36π = 1/3."
    },
    {
      id: "mat_21",
      topic: "Analitik Geometri",
      year: 2021,
      text: "A(2, -3) ve B(6, 5) noktalarının orta noktasının koordinatları toplamı kaçtır?",
      options: ["3", "4", "5", "6", "7"],
      correct: 2,
      explanation: "Orta nokta koordinatları C(x, y) ise x = (2 + 6)/2 = 4 ve y = (-3 + 5)/2 = 1'dir. Koordinatlar toplamı: 4 + 1 = 5 olur."
    },
    {
      id: "mat_22",
      topic: "Katı Cisimler",
      year: 2020,
      text: "Bir kenarı 4 cm olan bir küpün tüm yüzey alanı kaç cm² dir?",
      options: ["64", "96", "120", "144", "160"],
      correct: 1,
      explanation: "Küpün 6 yüzü vardır ve her bir yüzünün alanı a^2'dir. Yüzey Alanı = 6 * a^2 = 6 * 4^2 = 6 * 16 = 96 cm²."
    },
    {
      id: "mat_23",
      topic: "Problemler - Hız",
      year: 2023,
      text: "Saatteki hızı 80 km olan bir araç, A kentinden B kentine 4 saatte gidiyor. Bu araç dönüşte hızını saatte 20 km artırırsa dönüş yolculuğu kaç saat sürer?",
      options: ["2.8", "3", "3.2", "3.5", "3.8"],
      correct: 2,
      explanation: "Yol = Hız * Zaman = 80 * 4 = 320 km. Dönüş hızı = 80 + 20 = 100 km/s. Dönüş süresi = Yol / Yeni Hız = 320 / 100 = 3.2 saat bulunur."
    },
    {
      id: "mat_24",
      topic: "Problemler - Karışım",
      year: 2022,
      text: "%20'lik 300 gram tuzlu su karışımına 100 gram saf su eklenirse yeni karışımın tuz oranı yüzde kaç olur?",
      options: ["12", "15", "16", "18", "20"],
      correct: 1,
      explanation: "İlk karışımdaki tuz miktarı = 300 * (20/100) = 60 gram. Toplam yeni kütle = 300 + 100 = 400 gram. Yeni oran = (Tuz Miktarı / Toplam Kütle) * 100 = (60 / 400) * 100 = 15 olur. Yani %15."
    },
    {
      id: "mat_25",
      topic: "Problemler - Yaş",
      year: 2021,
      text: "Bir babanın yaşı, oğlunun yaşının 3 katıdır. 5 yıl sonra babanın yaşı oğlunun yaşının 2.5 katı olacağına göre, babanın bugünkü yaşı kaçtır?",
      options: ["30", "36", "40", "45", "50"],
      correct: 3,
      explanation: "Oğul = x, Baba = 3x. 5 yıl sonra: Baba = 3x + 5, Oğul = x + 5. Denklem: 3x + 5 = 2.5 * (x + 5) => 3x + 5 = 2.5x + 12.5 => 0.5x = 7.5 => x = 15. Babanın bugünkü yaşı 3x = 3 * 15 = 45 olur."
    },
    {
      id: "mat_26",
      topic: "Oran-Orantı",
      year: 2017,
      text: "a ve b sayıları sırasıyla 3 ve 5 ile doğru orantılıdır. a + b = 24 olduğuna göre, b kaçtır?",
      options: ["9", "12", "15", "18", "20"],
      correct: 2,
      explanation: "a = 3k, b = 5k yazılır. a + b = 8k = 24 => k = 3. Buradan b = 5k = 5 * 3 = 15 bulunur."
    },
    {
      id: "mat_27",
      topic: "Sayı Basamakları",
      year: 2016,
      text: "AB ve BA iki basamaklı doğal sayılardır. AB + BA = 132 olduğuna göre, A + B kaçtır?",
      options: ["10", "11", "12", "13", "14"],
      correct: 2,
      explanation: "Çözümleme yaparsak: (10A + B) + (10B + A) = 11A + 11B = 11(A + B) = 132. Buradan A + B = 132 / 11 = 12 bulunur."
    },
    {
      id: "mat_28",
      topic: "Rasyonel Sayılar",
      year: 2024,
      text: "(1/2 - 1/3) / (1/4 + 1/6) işleminin sonucu kaçtır?",
      options: ["1/5", "2/5", "3/5", "4/5", "1/2"],
      correct: 1,
      explanation: "Pay: 1/2 - 1/3 = (3-2)/6 = 1/6. Payda: 1/4 + 1/6 = (3+2)/12 = 5/12. Bölme işlemi: (1/6) / (5/12) = (1/6) * (12/5) = 2/5."
    },
    {
      id: "mat_29",
      topic: "Kümeler",
      year: 2022,
      text: "Boş kümeden farklı A ve B kümeleri için, A ⊆ B olduğuna göre, aşağıdakilerden hangisi kesinlikle doğrudur?",
      options: ["A ∩ B = B", "A ∪ B = A", "A \\ B = Ø", "B \\ A = Ø", "s(A) = s(B)"],
      correct: 2,
      explanation: "A kümesi B'nin alt kümesi (A ⊆ B) ise, A'nın tüm elemanları aynı zamanda B'nin de elemanıdır. Dolayısıyla A fark B (A \\ B) kümesinde eleman bulunmaz, boş kümedir (Ø)."
    },
    {
      id: "mat_30",
      topic: "İkinci Dereceden Denklemler",
      year: 2021,
      text: "x^2 - 5x + 6 = 0 denkleminin köklerinin çarpımı kaçtır?",
      options: ["-6", "-5", "2", "3", "6"],
      correct: 4,
      explanation: "Kökler çarpımı formülü c/a'dır. Burada a = 1, b = -5, c = 6'dır. Kökler çarpımı 6 / 1 = 6 olur."
    }
  ,
    {
      "id": "mat_y1",
      "topic": "Temel Kavramlar",
      "year": 2021,
      "text": "Ardışık beş tek doğal sayının toplamı 145 olduğuna göre, bu sayıların en büyüğü kaçtır?",
      "options": [
            "29",
            "31",
            "33",
            "35",
            "37"
      ],
      "correct": 2,
      "explanation": "Ardışık beş sayının toplamı, ortadaki sayının 5 katına eşittir. 145 / 5 = 29 olduğundan ortadaki sayı 29'dur. Sayılar 25, 27, 29, 31, 33 olur; en büyüğü 33'tür.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y2",
      "topic": "Bölünebilme Kuralları",
      "year": 2022,
      "text": "5A3B dört basamaklı sayısı 45 ile kalansız bölünebilmektedir. Buna göre A + B toplamının alabileceği en büyük değer kaçtır?",
      "options": [
            "1",
            "5",
            "8",
            "10",
            "13"
      ],
      "correct": 3,
      "explanation": "45 = 9 · 5 olduğundan sayı hem 9'a hem 5'e bölünmelidir. 5'e bölünme için B = 0 veya B = 5'tir. B = 0 için rakamlar toplamı 8 + A, 9'un katı olmalı: A = 1 (5130). B = 5 için 13 + A, 9'un katı olmalı: A = 5 (5535). A + B toplamları 1 ve 10'dur; en büyüğü 10'dur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y3",
      "topic": "Üslü Sayılar",
      "year": 2023,
      "text": "(2^12 · 3^8) / 6^8 işleminin sonucu kaçtır?",
      "options": [
            "2",
            "4",
            "8",
            "16",
            "32"
      ],
      "correct": 3,
      "explanation": "6^8 = (2 · 3)^8 = 2^8 · 3^8'dir. İfade (2^12 · 3^8) / (2^8 · 3^8) = 2^(12-8) = 2^4 = 16 olur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y4",
      "topic": "Köklü Sayılar",
      "year": 2021,
      "text": "(√12 + √27) / √3 işleminin sonucu kaçtır?",
      "options": [
            "3",
            "4",
            "5",
            "6",
            "7"
      ],
      "correct": 2,
      "explanation": "√12 = 2√3 ve √27 = 3√3'tür. Pay 2√3 + 3√3 = 5√3 olur. 5√3 / √3 = 5 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y5",
      "topic": "Mutlak Değer",
      "year": 2024,
      "text": "x bir gerçel sayı olmak üzere, |x - 3| + |x + 2| ifadesinin alabileceği en küçük değer kaçtır?",
      "options": [
            "1",
            "3",
            "5",
            "7",
            "9"
      ],
      "correct": 2,
      "explanation": "İfade, sayı doğrusunda x noktasının 3 ve -2 noktalarına olan uzaklıklarının toplamıdır. Bu toplam, x sayısı -2 ile 3 arasında (uçlar dahil) seçildiğinde en küçük değerini alır ve iki nokta arasındaki uzaklığa, yani 3 - (-2) = 5'e eşit olur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y6",
      "topic": "Oran-Orantı",
      "year": 2022,
      "text": "a/b = 2/3 ve b/c = 4/5 olduğuna göre, a + b + c = 105 ise c kaçtır?",
      "options": [
            "30",
            "36",
            "40",
            "45",
            "50"
      ],
      "correct": 3,
      "explanation": "a/b = 2/3 için a = 2k, b = 3k alalım. b/c = 4/5 ise c = 5b/4 = 15k/4 olur. Paydayı yok etmek için tümünü 4 ile genişletirsek a : b : c = 8 : 12 : 15 elde edilir. Terimler toplamı 8 + 12 + 15 = 35'tir. 105 / 35 = 3 olduğundan c = 15 · 3 = 45 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y7",
      "topic": "Problemler - Hız",
      "year": 2023,
      "text": "Bir araç A kentinden B kentine 60 km/sa, aynı yoldan B'den A'ya ise 40 km/sa sabit hızla gitmiştir. Buna göre aracın tüm yolculuk boyunca ortalama hızı kaç km/sa'tir?",
      "options": [
            "45",
            "48",
            "50",
            "52",
            "55"
      ],
      "correct": 1,
      "explanation": "Gidiş ve dönüşte yol aynı olduğundan ortalama hız, hızların harmonik ortalamasıdır: (2 · 60 · 40) / (60 + 40) = 4800 / 100 = 48 km/sa. Aritmetik ortalama olan 50 yanlış olur, çünkü yavaş hızda daha uzun süre geçirilir.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y8",
      "topic": "Problemler - Karışım",
      "year": 2021,
      "text": "Kütlece %20'lik 40 litre tuzlu suya kaç litre saf su eklenirse karışım %16'lık olur?",
      "options": [
            "5",
            "8",
            "10",
            "12",
            "15"
      ],
      "correct": 2,
      "explanation": "Karışımdaki tuz miktarı 40 · 0,20 = 8 litredir. Su eklendiğinde tuz miktarı değişmez, toplam hacim artar. 8 / (40 + x) = 0,16 eşitliğinden 40 + x = 50 ve x = 10 litre bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y9",
      "topic": "Problemler - Yaş",
      "year": 2024,
      "text": "Bir baba ile oğlunun yaşları toplamı 56'dır. 4 yıl önce babanın yaşı, oğlunun yaşının 5 katıydı. Buna göre oğlun bugünkü yaşı kaçtır?",
      "options": [
            "10",
            "12",
            "14",
            "16",
            "18"
      ],
      "correct": 1,
      "explanation": "Oğlun yaşı o, babanın yaşı b olsun. b + o = 56'dır. 4 yıl önce b - 4 = 5(o - 4) yani b = 5o - 16 olur. Yerine koyarsak 5o - 16 + o = 56, 6o = 72 ve o = 12 bulunur. (Baba 44; 4 yıl önce 40 = 5 · 8 sağlanır.)",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y10",
      "topic": "Kümeler",
      "year": 2022,
      "text": "s(A) = 12, s(B) = 9 ve s(A ∩ B) = 5 olduğuna göre, s(A ∪ B) kaçtır?",
      "options": [
            "14",
            "15",
            "16",
            "17",
            "21"
      ],
      "correct": 2,
      "explanation": "s(A ∪ B) = s(A) + s(B) - s(A ∩ B) formülünden 12 + 9 - 5 = 16 bulunur. Kesişim iki kez sayıldığı için bir kez çıkarılır.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y11",
      "topic": "Permütasyon-Kombinasyon",
      "year": 2023,
      "text": "KİTAP kelimesinin harfleri kullanılarak, harflerin tümü birer kez kullanılmak koşuluyla K harfi ile başlayan kaç farklı 5 harfli dizilim yazılabilir?",
      "options": [
            "12",
            "24",
            "48",
            "60",
            "120"
      ],
      "correct": 1,
      "explanation": "Kelimenin 5 harfi de birbirinden farklıdır. K harfi başa sabitlendiğinde geriye kalan 4 harf her sırada dizilebilir: 4! = 4 · 3 · 2 · 1 = 24 farklı dizilim elde edilir.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y12",
      "topic": "Olasılık",
      "year": 2025,
      "text": "1'den 20'ye kadar olan doğal sayıların yazılı olduğu 20 kart arasından rastgele bir kart çekiliyor. Çekilen kartın üzerindeki sayının 3 veya 5 ile tam bölünebilme olasılığı kaçtır?",
      "options": [
            "7/20",
            "8/20",
            "9/20",
            "10/20",
            "11/20"
      ],
      "correct": 2,
      "explanation": "3'ün katları 3, 6, 9, 12, 15, 18 olmak üzere 6 tanedir. 5'in katları 5, 10, 15, 20 olmak üzere 4 tanedir. 15 sayısı her ikisinde de sayıldığından bir kez çıkarılır: 6 + 4 - 1 = 9 elverişli durum vardır. Olasılık 9/20'dir.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y13",
      "topic": "Fonksiyonlar",
      "year": 2021,
      "text": "f(x) = 2x - 3 ve g(x) = x^2 + 1 olduğuna göre, (f o g)(2) değeri kaçtır?",
      "options": [
            "5",
            "6",
            "7",
            "8",
            "9"
      ],
      "correct": 2,
      "explanation": "(f o g)(2) = f(g(2)) demektir. Önce g(2) = 2^2 + 1 = 5 hesaplanır. Sonra f(5) = 2 · 5 - 3 = 7 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y14",
      "topic": "İkinci Dereceden Denklemler",
      "year": 2024,
      "text": "x^2 - 5x + 6 = 0 denkleminin kökleri x1 ve x2 olduğuna göre, 1/x1 + 1/x2 toplamı kaçtır?",
      "options": [
            "1/6",
            "5/6",
            "6/5",
            "5",
            "6"
      ],
      "correct": 1,
      "explanation": "Kökler toplamı x1 + x2 = 5, kökler çarpımı x1 · x2 = 6'dır. 1/x1 + 1/x2 ifadesi paydada eşitlenirse (x1 + x2) / (x1 · x2) = 5/6 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y15",
      "topic": "Polinomlar",
      "year": 2022,
      "text": "P(x) = x^3 - 2x^2 + ax - 6 polinomu (x - 2) ile kalansız bölünebildiğine göre, a kaçtır?",
      "options": [
            "1",
            "2",
            "3",
            "4",
            "5"
      ],
      "correct": 2,
      "explanation": "Kalanlar teoremine göre (x - 2) ile kalansız bölünme, P(2) = 0 olması demektir. P(2) = 8 - 8 + 2a - 6 = 2a - 6 = 0 eşitliğinden a = 3 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y16",
      "topic": "Logaritma",
      "year": 2023,
      "text": "log₂8 + log₃27 - log₅25 işleminin sonucu kaçtır?",
      "options": [
            "2",
            "3",
            "4",
            "5",
            "6"
      ],
      "correct": 2,
      "explanation": "8 = 2^3 olduğundan log₂8 = 3'tür. 27 = 3^3 olduğundan log₃27 = 3'tür. 25 = 5^2 olduğundan log₅25 = 2'dir. İşlem 3 + 3 - 2 = 4 sonucunu verir.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y17",
      "topic": "Trigonometri",
      "year": 2025,
      "text": "x dar açı olmak üzere sin x = 3/5 olduğuna göre, tan x değeri kaçtır?",
      "options": [
            "3/4",
            "4/3",
            "4/5",
            "5/3",
            "5/4"
      ],
      "correct": 0,
      "explanation": "sin^2 x + cos^2 x = 1 eşitliğinden cos^2 x = 1 - 9/25 = 16/25 olur. x dar açı olduğundan cos x = 4/5'tir. tan x = sin x / cos x = (3/5) / (4/5) = 3/4 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y18",
      "topic": "Diziler",
      "year": 2021,
      "text": "İlk terimi 5, ortak farkı 4 olan bir aritmetik dizinin 20. terimi kaçtır?",
      "options": [
            "77",
            "79",
            "81",
            "83",
            "85"
      ],
      "correct": 2,
      "explanation": "Aritmetik dizide genel terim a_n = a_1 + (n - 1) · d'dir. a_20 = 5 + 19 · 4 = 5 + 76 = 81 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y19",
      "topic": "Geometri - Üçgenler",
      "year": 2024,
      "text": "Dik kenar uzunlukları 6 cm ve 8 cm olan bir dik üçgende, hipotenüse ait yüksekliğin uzunluğu kaç cm'dir?",
      "options": [
            "3,6",
            "4",
            "4,8",
            "5",
            "5,4"
      ],
      "correct": 2,
      "explanation": "Hipotenüs Pisagor bağıntısıyla √(36 + 64) = 10 cm'dir. Üçgenin alanı iki dik kenardan (6 · 8) / 2 = 24 cm² olarak bulunur. Aynı alan hipotenüs ve ona ait yükseklikle de yazılır: (10 · h) / 2 = 24 eşitliğinden h = 4,8 cm elde edilir.",
      "kaynak": "ozgun"
},
    {
      "id": "mat_y20",
      "topic": "Analitik Geometri",
      "year": 2025,
      "text": "Analitik düzlemde A(1, 2) ve B(5, 8) noktaları veriliyor. Buna göre |AB| uzunluğu kaç birimdir?",
      "options": [
            "2√13",
            "2√10",
            "6",
            "8",
            "10"
      ],
      "correct": 0,
      "explanation": "İki nokta arası uzaklık √((5-1)^2 + (8-2)^2) = √(16 + 36) = √52 olarak hesaplanır. √52 = √(4 · 13) = 2√13 birimdir.",
      "kaynak": "ozgun"
}
  ],
  Turkce: [
    {
      id: "tur_1",
      topic: "Paragrafta Anlam",
      year: 2023,
      text: "Aşağıdaki cümlelerin hangisinde bir 'ön yargı' (peşin hüküm) söz konusudur?",
      options: [
        "Bu yazarın son romanı da öncekiler gibi çok satacaktır.",
        "Sanatçı, eserlerinde genellikle köy yaşamını ele alıyor.",
        "Yarın akşam düzenlenecek olan konserin biletleri tükendi.",
        "Kitabı okuduktan sonra fikirlerimi sizinle paylaşacağım.",
        "Yaz tatilinde Ege kıyılarını gezmeyi planlıyoruz."
      ],
      correct: 0,
      explanation: "Geleceğe dair kesin bir hüküm verilerek 'son romanı da öncekiler gibi çok satacaktır' denmesi, olumlu da olsa bir ön yargı (peşin hüküm) belirtir."
    },
    {
      id: "tur_2",
      topic: "Cümlede Anlam",
      year: 2022,
      text: "Aşağıdaki cümlelerin hangisinde 'neden-sonuç' ilişkisi vardır?",
      options: [
        "Sınavı kazanmak için gece gündüz demeden çalıştı.",
        "Hava aniden soğuyunca dışarıdaki herkes içeri kaçtı.",
        "Güzel bir gelecek ancak çalışmakla elde edilir.",
        "Yazar, son kitabında İstanbul sokaklarını betimlemiş.",
        "Okullar kapansa da memlekete gitsek diye düşünüyor."
      ],
      correct: 1,
      explanation: "Havanın aniden soğuması 'neden', dışarıdaki herkesin içeri kaçması ise 'sonuç'tur. Eylem gerçekleşmiştir ve bir nedene dayanmaktadır."
    },
    {
      id: "tur_3",
      topic: "Sözcükte Anlam",
      year: 2023,
      text: "Aşağıdaki cümlelerin hangisinde 'dokunmak' sözcüğü 'etkilemek, duygulandırmak' anlamında kullanılmıştır?",
      options: [
        "Bu ilaç mideme biraz dokundu galiba.",
        "Masadaki dosyalara kimse dokunmasın.",
        "Onun bu çaresiz hali hepimize çok dokundu.",
        "Evdeki eski eşyalara yıllardır el dokunmamıştı.",
        "Ucu bana dokunmayan işlere karışmam."
      ],
      correct: 2,
      explanation: "'Onun bu çaresiz hali hepimize çok dokundu' cümlesinde 'dokunmak' sözcüğü duygulanmak, derinden etkilemek anlamında kullanılmıştır."
    },
    {
      id: "tur_4",
      topic: "Yazım Kuralları",
      year: 2022,
      text: "Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?",
      options: [
        "Herkes kendi işine baksın lütfen.",
        "Bu sene de Karadeniz Bölgesi'ni gezeceğiz.",
        "O kadar çok konuştu ki başım ağrıdı.",
        "Laboratuvardaki deney başarıyla sonuçlandı.",
        "Pekçok insan bu konuda yanlış düşünüyor."
      ],
      correct: 4,
      explanation: "'Pek çok' sözcüğü her zaman ayrı yazılmalıdır. Birleşik yazılması yazım yanlışıdır."
    },
    {
      id: "tur_5",
      topic: "Noktalama İşaretleri",
      year: 2021,
      text: "Aşağıdaki cümlelerin hangisinde virgül (,) yanlış kullanılmıştır?",
      options: [
        "Pazardan elma, armut ve muz aldık.",
        "Eve geldi, ellerini yıkadı ve masaya oturdu.",
        "Genç, adamın arkasından sessizce koştu.",
        "Zor durumları aşmak için, sabırlı olmak gerekir.",
        "Yarın, erken kalkıp işe gideceğim."
      ],
      correct: 4,
      explanation: "'Yarın, erken kalkıp...' cümlesinde zaman bildiren zarftan sonra veya zarf fiil grubundan önce tek başına virgül kullanılması gereksiz ve yanlıştır."
    },
    {
      id: "tur_6",
      topic: "Dil Bilgisi - Sözcük Türleri",
      year: 2023,
      text: "'Güzel' sözcüğü aşağıdaki cümlelerin hangisinde zarf (belirteç) görevinde kullanılmıştır?",
      options: [
        "Bize çok güzel bir haber verdi.",
        "O akşam hayatımın en güzel rüyasını gördüm.",
        "Toplantıda gerçekten çok güzel konuştu.",
        "Bu güzel havalar bizi mahvetti.",
        "Güzel gören güzel düşünür, derler."
      ],
      correct: 2,
      explanation: "'Güzel konuştu' ifadesinde 'güzel' sözcüğü bir fiili (konuştu) durum yönünden nitelediği için zarftır. Diğerlerinde sıfat veya adlaşmış sıfattır."
    },
    {
      id: "tur_7",
      topic: "Dil Bilgisi - Cümlenin Ögeleri",
      year: 2022,
      text: "'Kitap okumayı çok seven Ali, dün kütüphaneden üç yeni kitap aldı.' cümlesinin ögelerinin dizilişi aşağıdakilerden hangisidir?",
      options: [
        "Özne - Zarf Tümleci - Dolaylı Tümleç - Belirtisiz Nesne - Yüklem",
        "Belirtili Nesne - Zarf Tümleci - Dolaylı Tümleç - Özne - Yüklem",
        "Özne - Zarf Tümleci - Dolaylı Tümleç - Belirtili Nesne - Yüklem",
        "Özne - Dolaylı Tümleç - Zarf Tümleci - Belirtisiz Nesne - Yüklem",
        "Belirtisiz Nesne - Zarf Tümleci - Özne - Dolaylı Tümleç - Yüklem"
      ],
      correct: 0,
      explanation: "Yüklem: aldı. Alan kim?: Kitap okumayı çok seven Ali (Özne). Ne zaman aldı?: dün (Zarf Tümleci). Nereden aldı?: kütüphaneden (Dolaylı Tümleç/Yer Tamlayıcısı). Ne aldı?: üç yeni kitap (Belirtisiz Nesne). Sıralama: Özne - ZT - DT - Belirtisiz Nesne - Yüklem."
    },
    {
      id: "tur_8",
      topic: "Ses Bilgisi",
      year: 2020,
      text: "Aşağıdaki cümlelerin hangisinde 'ünsüz yumuşaması'na uğramış bir sözcük yoktur?",
      options: [
        "Kitabın sayfalarını tek tek çevirdi.",
        "Giderek artan bir heyecan içindeydi.",
        "Bardağı masanın üzerine bıraktı.",
        "Sıcak çorbayı yavaşça içti.",
        "Duyduğu sesle irkilip arkasına baktı."
      ],
      correct: 3,
      explanation: "A'da 'kitabın' (kitap), B'de 'giderek' (git-), C'de 'bardağı' (bardak), E'de 'duyduğu' (duyduk) sözcüklerinde ünsüz yumuşaması vardır. D şıkkında yumuşama yoktur ('yavaşça' sözcüğünde ünsüz benzeşmesi vardır)."
    },
    {
      id: "tur_9",
      topic: "Paragrafta Anlam",
      year: 2021,
      text: "Bir paragrafta düşüncenin akışını bozan cümleyi bulurken neye dikkat edilmelidir?",
      options: [
        "Cümlenin uzunluğuna",
        "Cümlenin yükleminin türüne",
        "Paragrafın ana düşüncesinden farklı bir konuya veya konunun farklı bir yönüne değinen cümleye",
        "İçinde bağlaç olan cümlelere",
        "Soru cümlesi olup olmamasına"
      ],
      correct: 2,
      explanation: "Düşüncenin akışını bozan cümle, paragrafın genelinde işlenen konunun dışına çıkan ya da konunun yönünü aniden değiştiren cümledir."
    },
    {
      id: "tur_10",
      topic: "Anlatım Bozukluğu",
      year: 2018,
      text: "Aşağıdaki cümlelerin hangisinde bir anlatım bozukluğu vardır?",
      options: [
        "Dün akşamki maçta karşılıklı iki takım çok iyi mücadele etti.",
        "Yarın yapılacak olan sınavda tüm öğrencilere başarılar dilerim.",
        "Uçak, hava muhalefeti yüzünden rötar yaptı.",
        "Sınıftaki gürültüden dolayı öğretmen dersi erken bitirdi.",
        "Bu konuda onunla fikir ayrılığına düştük."
      ],
      correct: 0,
      explanation: "'Karşılıklı iki takım...' cümlesinde mücadele etmek zaten karşılıklı yapılan bir eylemdir. Ayrıca iki takımın karşı karşıya geleceği bellidir. 'Karşılıklı' sözcüğünün kullanımı gereksizdir."
    },
    {
      id: "tur_11",
      topic: "Sözcükte Yapı",
      year: 2023,
      text: "Aşağıdaki sözcüklerden hangisi hem yapım hem de çekim eki almıştır?",
      options: ["Masa", "Kitapçı", "Evlerimiz", "Gözlükçüden", "Koştu"],
      correct: 3,
      explanation: "'Gözlükçüden' sözcüğünün kökü 'göz'dür. '-lük' ve '-çü' yapım ekleridir (göz-gözlük-gözlükçü). '-den' ayrılma hal eki ise çekim ekidir. Dolayısıyla hem yapım hem çekim eki almıştır."
    },
    {
      id: "tur_12",
      topic: "Cümle Türleri",
      year: 2022,
      text: "Aşağıdakilerden hangisi yükleminin yerine göre kurallı, yükleminin türüne göre isim cümlesidir?",
      options: [
        "Her şey çok güzel olacak.",
        "En büyük erdem dürüstlüktür.",
        "Gidiyorum gurbeti içimde duya duya.",
        "Çocuklar bahçede neşeyle koşuyordu.",
        "Kitap en sadık dosttur insana."
      ],
      correct: 1,
      explanation: "'En büyük erdem dürüstlüktür.' cümlesinde yüklem sondadır (kurallı). Yüklem 'dürüstlüktür' bir isimdir (isim cümlesi). E şıkkında yüklem ortadadır (devrik)."
    },
    {
      id: "tur_13",
      topic: "Paragrafta Anlam",
      year: 2024,
      text: "Paragrafın ana düşüncesi (ana fikri) en genel tanımıyla nedir?",
      options: [
        "Paragrafta en çok geçen kelimedir.",
        "Yazarın okuyucuya vermek istediği temel mesaj veya öğüttür.",
        "Paragraftaki olay örgüsüdür.",
        "Paragrafın ilk cümlesidir.",
        "Paragrafın son kelimesidir."
      ],
      correct: 1,
      explanation: "Ana fikir, yazarın o yazıyı yazma amacı olan ve okuyucuya aktarmak istediği temel düşünce, mesaj ya da iletidir."
    },
    {
      id: "tur_14",
      topic: "Yazım Kuralları",
      year: 2023,
      text: "Aşağıdaki cümlelerin hangisinde 'de' bağlacının yazımı ile ilgili bir yanlışlık yapılmıştır?",
      options: [
        "Sen de bizimle gelmek ister misin?",
        "Sokakta da kimseler kalmamıştı.",
        "Gelse de gelmese de artık fark etmez.",
        "Kitabımı okulda unutmuşum.",
        "Benide toplantıya çağırdılar."
      ],
      correct: 4,
      explanation: "'Benide toplantıya çağırdılar' cümlesindeki 'de' dahi anlamındaki bağlaçtır ve ayrı yazılması gerekir ('Beni de' şeklinde)."
    },
    {
      id: "tur_15",
      topic: "Noktalama İşaretleri",
      year: 2022,
      text: "Ögeleri arasında virgül bulunan sıralı cümleleri birbirinden ayırmak için hangi noktalama işareti kullanılır?",
      options: [
        "Nokta (.)",
        "Virgül (,)",
        "Noktalı Virgül (;)",
        "İki Nokta (:)",
        "Üç Nokta (...)"
      ],
      correct: 2,
      explanation: "Kural gereği, ögeleri arasında virgül bulunan sıralı cümleleri birbirinden ayırmak için noktalı virgül (;) kullanılır."
    },
    {
      id: "tur_16",
      topic: "Sözcükte Anlam",
      year: 2021,
      text: "Aşağıdakilerin hangisinde 'ince' kelimesi mecaz anlamda kullanılmıştır?",
      options: [
        "İnce bir ipi iğneden geçirdi.",
        "Üzerinde ince bir ceket vardı.",
        "Ona karşı çok ince davranışlar sergiledi.",
        "İnce dallar rüzgarda kırıldı.",
        "İnce bir kağıda yazı yazdı."
      ],
      correct: 2,
      explanation: "'İnce davranış' ifadesinde 'ince', narin, kibar, hassas anlamlarında kullanılarak gerçek anlamından tamamen uzaklaşmış ve mecaz anlam kazanmıştır."
    },
    {
      id: "tur_17",
      topic: "Ses Bilgisi",
      year: 2023,
      text: "'Sokaktan gelen ses' ifadesindeki 'sokaktan' kelimesinde hangi ses olayı gerçekleşmiştir?",
      options: [
        "Ünsüz Yumuşaması",
        "Ünsüz Benzeşmesi (Sertleşmesi)",
        "Ünlü Düşmesi",
        "Ünsüz Türemesi",
        "Ünlü Daralması"
      ],
      correct: 1,
      explanation: "Kök 'sokak' fıstıkçı şahap sert ünsüzlerinden 'k' ile biter. Gelen ek fiili yönelme/ayrılma eki '-dan' sertleşerek '-tan' olmuştur. Bu olaya ünsüz benzeşmesi veya sertleşmesi denir."
    },
    {
      id: "tur_18",
      topic: "Paragrafta Yardımcı Düşünce",
      year: 2022,
      text: "Aşağıdakilerden hangisi bir paragrafta 'ulaşılamaz, değinilmemiştir' tarzındaki yardımcı düşünce sorularını çözerken izlenecek en iyi yöntemdir?",
      options: [
        "Önce paragrafı hızlıca okumak, sonra seçenekleri ezberlemek.",
        "Önce seçenekleri okuyup anahtar kelimeleri belirlemek, ardından paragrafta bu kelimeleri arayarak eşleştirme yapmak.",
        "Yalnızca ilk ve son cümlelere bakıp karar vermek.",
        "Seçeneklerden en uzun olanı doğru cevap olarak işaretlemek.",
        "Kendi kişisel görüşlerimize göre seçenekleri yorumlamak."
      ],
      correct: 1,
      explanation: "Yardımcı düşünce sorularında önce seçenekleri okumak, paragrafta ne arayacağımızı bilmemizi sağlar. Paragrafı okurken seçeneklerdeki anahtar ifadeleri eşleştirerek eleme yapabiliriz."
    },
    {
      id: "tur_19",
      topic: "Fiilimsiler",
      year: 2021,
      text: "Aşağıdaki cümlelerin hangisinde 'sıfat-fiil' (ortaç) kullanılmıştır?",
      options: [
        "Gülünce gözlerinin içi gülüyor.",
        "Çalışan insan mutlaka karşılığını alır.",
        "Buraya geleli tam üç yıl oldu.",
        "Koşarak yanımıza kadar geldi.",
        "Dersi dinlemek için sessizce bekledi."
      ],
      correct: 1,
      explanation: "'Çalışan insan' sıfat tamlamasında 'çalışan' kelimesi '-an' sıfat-fiil ekini almıştır ve sıfat görevindedir. A'da 'gülünce' zarf-fiil, C'de 'geleli' zarf-fiil, D'de 'koşarak' zarf-fiildir."
    },
    {
      id: "tur_20",
      topic: "Yazım Kuralları",
      year: 2020,
      text: "Aşağıdaki cümlelerin hangisinde sayıların yazımı ile ilgili bir yanlışlık yapılmıştır?",
      options: [
        "Sınavda 2. olduk.",
        "Olay 15 Eylül 2019'da gerçekleşti.",
        "Herkese ikişer elma dağıtıldı.",
        "Sınıfta 25 öğrenci vardı.",
        "Bu soruyu çözmek için 3'er kişilik gruplar kurduk."
      ],
      correct: 4,
      explanation: "Türkçede üleştirme sayıları rakamla değil, yazıyla yazılmalıdır. Dolayısıyla '3'er' değil, 'üçer' şeklinde yazılmalıdır."
    },
    {
      id: "tur_21",
      topic: "Noktalama İşaretleri",
      year: 2023,
      text: "Aşağıdaki cümlelerin hangisinin sonuna üç nokta (...) konulmalıdır?",
      options: [
        "Karşımızda masmavi bir deniz",
        "Bu işi bugün bitireceksin",
        "Neden dün beni aramadın",
        "Ah, ne güzel bir gün",
        "Kitap okumak ufku genişletir"
      ],
      correct: 0,
      explanation: "'Karşımızda masmavi bir deniz...' cümlesi yüklemi olmayan, tamamlanmamış (kesik) bir cümledir. Bu nedenle sonuna üç nokta konulmalıdır."
    },
    {
      id: "tur_22",
      topic: "Cümlede Anlam",
      year: 2024,
      text: "'Bir sanatçı toplumun aynası olmalıdır.' cümlesyle anlatılmak istenen aşağıdakilerden hangisidir?",
      options: [
        "Sanatçı yalnızca kendi iç dünyasını anlatmalıdır.",
        "Sanatçı toplumsal gerçekleri olduğu gibi yansıtmalıdır.",
        "Sanatçı toplumdan bağımsız eserler üretmelidir.",
        "Sanatçı eserlerinde süslü bir dil kullanmalıdır.",
        "Sanatçı geçmişteki sanatçıları taklit etmelidir."
      ],
      correct: 1,
      explanation: "Ayna, karşısındaki nesneyi değiştirmeden, olduğu gibi gösterir. Dolayısıyla sanatçının toplumun aynası olması, toplumsal gerçekleri olduğu gibi yansıtması anlamına gelir."
    },
    {
      id: "tur_23",
      topic: "Sözcük Türleri",
      year: 2021,
      text: "Aşağıdaki cümlelerin hangisinde 'kendi' zamiri (dönüşlülük zamiri) pekiştirme göreviyle kullanılmıştır?",
      options: [
        "Bu resmi ben kendim yaptım.",
        "Kendi işini kendin yapmalısın.",
        "O her zaman kendini düşünür.",
        "Kendine iyi bakmanı istiyorum.",
        "Kendi dünyasında mutlu yaşıyor."
      ],
      correct: 0,
      explanation: "'Ben kendim yaptım' cümlesinde özne olan 'ben' şahıs zamiri, 'kendim' dönüşlülük zamiri ile birlikte kullanılarak özneyi pekiştirmiştir."
    },
    {
      id: "tur_24",
      topic: "Dil Bilgisi - Fiil Çatısı",
      year: 2020,
      text: "Aşağıdaki cümlelerden hangisinin yüklemi nesnesine göre 'geçişli' bir fiildir?",
      options: [
        "Dün gece saatlerce ağladı.",
        "Çocuklar parkta neşeyle gülüşüyordu.",
        "Sonunda aradığı kitabı kütüphanede buldu.",
        "Hava kararınca eve doğru yürüdük.",
        "Sabah erkenden uyandı."
      ],
      correct: 2,
      explanation: "Nesne alabilen fiillere geçişli fiil denir. Fiilin başına 'onu' kelimesi getirilerek test edilebilir. 'Onu buldu' anlamlı olduğu için 'buldu' geçişlidir. 'Onu ağladı', 'onu gülüşüyordu' anlamsızdır."
    },
    {
      id: "tur_25",
      topic: "Paragrafta Anlam",
      year: 2019,
      text: "Paragrafta ikiye bölme sorularında ikinci paragraf hangi cümle ile başlar?",
      options: [
        "Konunun tamamen bittiği cümleyle.",
        "Konunun farklı bir yönüne, boyutuna veya yeni bir düşünceye geçilen cümleyle.",
        "Bağlaçla başlayan cümleyle.",
        "Yüklemi isim olan cümleyle.",
        "En kısa cümleyle."
      ],
      correct: 1,
      explanation: "Bir metin iki paragrafa bölünmek istendiğinde, ikinci paragraf konunun farklı bir yönye değinmeye başlayan ilk cümle ile başlatılır."
    },
    {
      id: "tur_26",
      topic: "Yazım Kuralları",
      year: 2018,
      text: "Aşağıdaki birleşik fiillerden hangisinin yazımı yanlıştır?",
      options: ["Hissetti", "Kayboldu", "Kabul etti", "Farketti", "Arz etti"],
      correct: 3,
      explanation: "Etmek, olmak yardımcı fiilleriyle kurulan birleşik fiillerde, ses düşmesi veya ses türemesi varsa birleşik, yoksa ayrı yazılır. 'Fark etti' kelimesinde herhangi bir ses olayı olmadığı için ayrı yazılmalıdır."
    },
    {
      id: "tur_27",
      topic: "Dil Bilgisi",
      year: 2017,
      text: "Aşağıdaki cümlelerin hangisinde 'zamir' (adıl) yoktur?",
      options: [
        "Bunu daha önce konuşmuştuk.",
        "Kimse bu soruyu çözemedi.",
        "Bazı öğrenciler derse geç kaldı.",
        "Onlar yarın tatile çıkıyor.",
        "Kalemlerin birkaçı masada kalmış."
      ],
      correct: 2,
      explanation: "'Bazı öğrenciler...' cümlesindeki 'bazı' sözcüğü bir ismi nitelediği için belgisiz sıfattır, zamir değildir. Diğer cümlelerde 'bunu' (işaret zamiri), 'kimse' (belgisiz zamir), 'onlar' (kişi zamiri) ve 'birkaçı' (belgisiz zamir) bulunmaktadır."
    },
    {
      id: "tur_28",
      topic: "Ses Bilgisi",
      year: 2016,
      text: "'Sabret' kelimesinde hangi ses olayları meydana gelmiştir?",
      options: [
        "Ünlü düşmesi - Ünsüz yumuşaması",
        "Ünlü düşmesi - Ünsüz türemesi",
        "Ünsüz düşmesi - Ünsüz sertleşmesi",
        "Ünlü türemesi - Ünsüz yumuşaması",
        "Ünlü daralması - Ünsüz sertleşmesi"
      ],
      correct: 0,
      explanation: "Sabır + et -> Sabret. 'ı' ünlüsü düşmüştür (ünlü düşmesi). Sabır kelimesinin sonundaki 'r' harfi dururken 'et' yardımcı fiilinin t'si sabit kalmıştır. Aslında 'sabır' + 'et' birleşirken 'p-b' değişimi yani yumuşama kökte zaten vardır (sabr). En belirgin ses olayları ünlü düşmesi ve yardımcı fiil birleşimindeki değişimdir."
    },
    {
      id: "tur_29",
      topic: "Cümlede Anlam",
      year: 2024,
      text: "Aşağıdaki cümlelerin hangisinde 'öznel' bir yargı vardır?",
      options: [
        "Türkiye'nin başkenti Ankara'dır.",
        "Su 100 derecede kaynar.",
        "Bu şairin şiirleri insanı bambaşka dünyalara götürüyor.",
        "Roman 350 sayfadan oluşmaktadır.",
        "Film iki saat sürmektedir."
      ],
      correct: 2,
      explanation: "Öznel yargı, kişiden kişiye değişen, kanıtlanamayan yargılardır. Şiirlerin insanı bambaşka dünyalara götürmesi kişisel bir beğenidir ve özneldir."
    },
    {
      id: "tur_30",
      topic: "Noktalama İşaretleri",
      year: 2023,
      text: "Kendisinden sonra açıklama yapılacak veya örnek verilecek cümlelerin sonuna hangi noktalama işareti konur?",
      options: [
        "Nokta (.)",
        "Noktalı Virgül (;)",
        "İki Nokta (:)",
        "Soru İşareti (?)",
        "Ünlem İşareti (!)"
      ],
      correct: 2,
      explanation: "Açıklama yapılacak veya örnek verilecek ifadelerden önce iki nokta (:) işareti kullanılır."
    }
  ,
    {
      "id": "tur_y1",
      "topic": "Sözcükte Anlam",
      "year": 2021,
      "text": "\"Yıllar geçtikçe sesi de duruldu, öfkesi de.\" cümlesindeki \"durulmak\" sözcüğü aşağıdaki anlamlardan hangisiyle kullanılmıştır?",
      "options": [
            "Berraklaşmak",
            "Sakinleşmek, yatışmak",
            "Yavaşlamak",
            "Azalmak",
            "Olgunlaşmak"
      ],
      "correct": 1,
      "explanation": "Cümlede ses ve öfke birlikte anılmıştır; ikisinin de \"durulması\" şiddetini yitirip yatışması anlamına gelir. Sözcük burada temel anlamı olan \"berraklaşmak\" ile değil, mecaz anlamı olan \"sakinleşmek\" ile kullanılmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y2",
      "topic": "Cümlede Anlam",
      "year": 2022,
      "text": "\"Bu kitabı okumadım ama konusunu az çok biliyorum.\" cümlesinde aşağıdaki anlam ilişkilerinden hangisi vardır?",
      "options": [
            "Neden-sonuç",
            "Amaç-sonuç",
            "Karşılaştırma",
            "Koşul",
            "Beklenmezlik (karşıtlık)"
      ],
      "correct": 4,
      "explanation": "\"Ama\" bağlacı, ilk yargıdan beklenenin tersini bildiren ikinci yargıyı bağlar. Kitabı okumamışken konusunu bilmek beklenmedik bir durumdur; bu nedenle cümlede karşıtlık (beklenmezlik) ilişkisi vardır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y3",
      "topic": "Paragrafta Anlam",
      "year": 2023,
      "text": "Bir paragrafın giriş cümlesi için aşağıdakilerden hangisi söylenemez?",
      "options": [
            "Kendinden önceki bir cümleye bağlanmaz",
            "Bağımsız bir yargı bildirir",
            "\"Bu nedenle, oysa, ayrıca\" gibi ifadelerle başlayabilir",
            "Paragrafın konusunu sezdirir",
            "Genellikle genel bir yargı içerir"
      ],
      "correct": 2,
      "explanation": "Giriş cümlesi kendinden önce bir cümle bulunmadığı için bağlayıcı ifadelerle başlayamaz. \"Bu nedenle, oysa, ayrıca\" gibi sözler önceki bir yargıya gönderme yapar; bu yüzden bunlarla başlayan cümle giriş cümlesi olamaz.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y4",
      "topic": "Paragrafta Yardımcı Düşünce",
      "year": 2021,
      "text": "Bir paragrafın ana düşüncesi ile yardımcı düşüncesi arasındaki fark için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "Ana düşünce paragrafın tamamına, yardımcı düşünce bir bölümüne aittir",
            "Yardımcı düşünce paragrafın tamamını kapsar",
            "Ana düşünce her zaman ilk cümlededir",
            "Yardımcı düşünce paragrafta yer almaz",
            "İkisi arasında anlamca fark yoktur"
      ],
      "correct": 0,
      "explanation": "Ana düşünce, yazarın paragrafın bütününde vermek istediği temel mesajdır. Yardımcı düşünceler ise ana düşünceyi destekleyen, paragrafın yalnızca bir bölümünden çıkarılabilen ara yargılardır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y5",
      "topic": "Yazım Kuralları",
      "year": 2022,
      "text": "Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?",
      "options": [
            "Sınava iki hafta kaldı.",
            "Herkes yerine oturdu.",
            "Yalnış yapmaktan korkma.",
            "Bir de onu dinleyelim.",
            "Hiçbir şey söylemedi."
      ],
      "correct": 2,
      "explanation": "Sözcüğün doğru yazımı \"yanlış\" biçimindedir; \"yalnış\" yaygın bir yazım yanlışıdır. Diğer seçeneklerde \"herkes\", \"bir de\" ve \"hiçbir\" sözcükleri doğru yazılmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y6",
      "topic": "Noktalama İşaretleri",
      "year": 2023,
      "text": "\"Yarın sabah erken kalkacağım ( ) çünkü otobüsüm sekizde kalkıyor ( )\" cümlesinde parantezle belirtilen yerlere sırasıyla hangi noktalama işaretleri getirilmelidir?",
      "options": [
            "Virgül - nokta",
            "Noktalı virgül - nokta",
            "İki nokta - üç nokta",
            "Virgül - soru işareti",
            "Nokta - nokta"
      ],
      "correct": 1,
      "explanation": "\"Çünkü\" bağlacıyla bağlanan ve kendi içinde yargı bildiren iki cümle arasında noktalı virgül kullanılır. Cümle tamamlanmış bir yargıyla bittiği için sonuna nokta konur.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y7",
      "topic": "Sözcükte Yapı",
      "year": 2024,
      "text": "Aşağıdaki sözcüklerden hangisi yapıca birleşiktir?",
      "options": [
            "Gözlükçü",
            "Bilgisayar",
            "Kitaplık",
            "Yazarlık",
            "Susuzluk"
      ],
      "correct": 1,
      "explanation": "\"Bilgisayar\" sözcüğü \"bilgi\" ve \"saymak\" sözcüklerinin birleşmesiyle oluşmuş birleşik sözcüktür. Diğerleri kök ve yapım ekinden oluşan türemiş sözcüklerdir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y8",
      "topic": "Dil Bilgisi - Sözcük Türleri",
      "year": 2021,
      "text": "\"Bu soruyu çözebilen tek kişi oydu.\" cümlesindeki \"tek\" sözcüğünün türü aşağıdakilerden hangisidir?",
      "options": [
            "İşaret sıfatı",
            "Sayı sıfatı",
            "Niteleme sıfatı",
            "Belgisiz sıfat",
            "Zarf"
      ],
      "correct": 1,
      "explanation": "\"Tek\" sözcüğü \"kişi\" adını sayı yönünden belirtmektedir. Varlığın sayısını bildiren sıfatlar sayı sıfatıdır; buradaki kullanım \"bir tane\" anlamı taşıdığı için asıl sayı sıfatıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y9",
      "topic": "Dil Bilgisi - Cümlenin Ögeleri",
      "year": 2022,
      "text": "\"Öğretmen, sınav sonuçlarını öğrencilere dün açıkladı.\" cümlesinde \"öğrencilere\" sözcüğü hangi ögedir?",
      "options": [
            "Nesne",
            "Dolaylı tümleç",
            "Zarf tümleci",
            "Özne",
            "Yüklem"
      ],
      "correct": 1,
      "explanation": "Yükleme \"kime\" sorusu sorulduğunda \"öğrencilere\" yanıtı alınır. Yönelme (-e), bulunma (-de) ve ayrılma (-den) durum ekleriyle yükleme bağlanan öge dolaylı tümleçtir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y10",
      "topic": "Dil Bilgisi - Fiil Çatısı",
      "year": 2023,
      "text": "\"Camlar sabaha kadar silindi.\" cümlesinin öznesine göre çatısı aşağıdakilerden hangisidir?",
      "options": [
            "Etken",
            "Edilgen",
            "Dönüşlü",
            "İşteş",
            "Geçişli"
      ],
      "correct": 1,
      "explanation": "Cümlede işi yapan belli değildir; \"camlar\" işten etkilenen sözde öznedir. Fiile \"-in\" edilgenlik eki gelmiştir. Bu nedenle cümlenin çatısı edilgendir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y11",
      "topic": "Fiilimsiler",
      "year": 2021,
      "text": "\"Koşarak gelen çocuk, kapıyı açmayı unuttu.\" cümlesinde kaç tane fiilimsi vardır?",
      "options": [
            "1",
            "2",
            "3",
            "4",
            "5"
      ],
      "correct": 2,
      "explanation": "Cümlede \"koşarak\" (zarf-fiil), \"gelen\" (sıfat-fiil) ve \"açmayı\" (isim-fiil) olmak üzere üç fiilimsi bulunur. \"Unuttu\" ise çekimli fiildir, yüklemdir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y12",
      "topic": "Ses Bilgisi",
      "year": 2022,
      "text": "Aşağıdaki sözcüklerin hangisinde ünsüz yumuşaması (ünsüz değişimi) vardır?",
      "options": [
            "Kitabı",
            "Sokak",
            "Yaprak",
            "Renkli",
            "Anlam"
      ],
      "correct": 0,
      "explanation": "\"Kitap\" sözcüğü ünlüyle başlayan \"-ı\" ekini aldığında sondaki sert ünsüz \"p\", yumuşayarak \"b\"ye dönüşür: kitap → kitabı. Diğer sözcüklerde böyle bir değişim yoktur.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y13",
      "topic": "Anlatım Bozukluğu",
      "year": 2023,
      "text": "Aşağıdaki cümlelerin hangisinde gereksiz sözcük kullanımından kaynaklanan anlatım bozukluğu vardır?",
      "options": [
            "Sınavdan sonra hep birlikte eve döndük.",
            "Yaklaşık iki saat kadar bekledik.",
            "Bu konuyu yarın konuşalım.",
            "Kitabı dikkatle okudu.",
            "Herkes görüşünü açıkça belirtti."
      ],
      "correct": 1,
      "explanation": "\"Yaklaşık\" ve \"kadar\" sözcüklerinin ikisi de tahmin bildirir; aynı cümlede birlikte kullanılmaları gereksiz sözcük tekrarına yol açar. \"Yaklaşık iki saat\" ya da \"iki saat kadar\" denmelidir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y14",
      "topic": "Cümle Türleri",
      "year": 2024,
      "text": "\"Yağmur yağınca maç ertelendi.\" cümlesinin yapısına göre türü aşağıdakilerden hangisidir?",
      "options": [
            "Basit cümle",
            "Birleşik cümle",
            "Sıralı cümle",
            "Bağlı cümle",
            "Devrik cümle"
      ],
      "correct": 1,
      "explanation": "Cümlede \"yağınca\" zarf-fiili bir yan cümlecik oluşturur ve temel cümleye bağlanır. İçinde fiilimsiyle kurulmuş yan cümlecik bulunan cümleler yapıca birleşik cümledir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y15",
      "topic": "Paragrafta Anlatım Biçimleri",
      "year": 2021,
      "text": "Bir varlığın veya olayın okuyucunun gözünde canlanmasını sağlayacak biçimde aktarılmasına dayanan anlatım biçimi aşağıdakilerden hangisidir?",
      "options": [
            "Açıklama",
            "Tartışma",
            "Betimleme",
            "Öyküleme",
            "Örnekleme"
      ],
      "correct": 2,
      "explanation": "Betimlemede duyu organlarıyla algılananlar sözcüklere dökülür ve okuyucunun zihninde bir tablo oluşturulur. Öyküleme olayı zaman akışıyla, açıklama ise bilgi vererek aktarır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y16",
      "topic": "Sözcükler Arası Anlam İlişkileri",
      "year": 2022,
      "text": "Aşağıdaki sözcük çiftlerinden hangisi eş anlamlı (anlamdaş) değildir?",
      "options": [
            "Kara - siyah",
            "Konuk - misafir",
            "Hediye - armağan",
            "Sıcak - soğuk",
            "Okul - mektep"
      ],
      "correct": 3,
      "explanation": "\"Sıcak\" ve \"soğuk\" birbirinin karşıtıdır; zıt anlamlı sözcüklerdir. Diğer çiftlerde sözcükler aynı kavramı karşılayan, biri Türkçe biri yabancı kökenli eş anlamlılardır.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y17",
      "topic": "Dil Bilgisi - Ek Fiil",
      "year": 2023,
      "text": "\"Çocukken çok utangaçtım.\" cümlesindeki \"utangaçtım\" sözcüğünde ek fiilin hangi görevi vardır?",
      "options": [
            "İsmi yüklem yapmıştır",
            "Basit zamanlı fiili birleşik zamanlı yapmıştır",
            "Fiili isimleştirmiştir",
            "Olumsuzluk katmıştır",
            "Soru anlamı katmıştır"
      ],
      "correct": 0,
      "explanation": "\"Utangaç\" bir sıfattır, yani ad soylu sözcüktür. Ek fiilin görülen geçmiş zamanı (-tım) eklenerek bu ad soylu sözcük cümlenin yüklemi hâline getirilmiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y18",
      "topic": "Paragrafta Yapı",
      "year": 2024,
      "text": "Bir paragrafta anlatılanların sonuca bağlandığı, düşüncenin özetlendiği bölüm aşağıdakilerden hangisidir?",
      "options": [
            "Giriş",
            "Gelişme",
            "Sonuç",
            "Başlık",
            "Konu"
      ],
      "correct": 2,
      "explanation": "Paragraf giriş, gelişme ve sonuç bölümlerinden oluşur. Giriş konuyu tanıtır, gelişme ayrıntılarla açar, sonuç bölümü ise anlatılanları bir yargıya bağlayıp özetler.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y19",
      "topic": "Cümlede Anlam - Öznellik",
      "year": 2025,
      "text": "Aşağıdaki cümlelerin hangisi öznel bir yargı bildirir?",
      "options": [
            "Roman 320 sayfadan oluşuyor.",
            "Kitap 1998 yılında yayımlandı.",
            "Yazarın en etkileyici eseri budur.",
            "Eser on dile çevrildi.",
            "Romanda üç ana karakter vardır."
      ],
      "correct": 2,
      "explanation": "\"En etkileyici\" ifadesi kişiden kişiye değişen bir değerlendirmedir ve doğruluğu kanıtlanamaz; bu nedenle öznel bir yargıdır. Diğer cümleler ölçülebilir, kanıtlanabilir nesnel bilgiler içerir.",
      "kaynak": "ozgun"
},
    {
      "id": "tur_y20",
      "topic": "Sözcükte Anlam - Deyimler",
      "year": 2025,
      "text": "\"Etekleri zil çalmak\" deyimi aşağıdaki anlamlardan hangisini karşılar?",
      "options": [
            "Çok üzülmek",
            "Çok sevinmek",
            "Aceleci davranmak",
            "Telaşlanmak",
            "Yorulmak"
      ],
      "correct": 1,
      "explanation": "\"Etekleri zil çalmak\", bir kişinin sevincini gizleyemeyecek kadar çok mutlu olması anlamında kullanılan bir deyimdir.",
      "kaynak": "ozgun"
}
  ],
  Fizik: [
    {
      id: "fiz_1",
      topic: "Mekanik - Kuvvet ve Hareket",
      year: 2023,
      text: "Düzgün doğrusal bir yolda hareket eden bir aracın hız-zaman grafiği doğrusaldır. Aracın hızı 10 m/s'den 30 m/s'ye 5 saniyede çıktığına göre, bu sürede aracın ivmesi kaç m/s² dir?",
      options: ["2", "3", "4", "5", "6"],
      correct: 2,
      explanation: "İvme (a) = Hızdaki Değişim (Δv) / Zaman (Δt) formülüyle bulunur. Δv = 30 - 10 = 20 m/s. Δt = 5 s. a = 20 / 5 = 4 m/s² bulunur."
    },
    {
      id: "fiz_2",
      topic: "Elektrik ve Manyetizma",
      year: 2022,
      text: "Dirençleri sırasıyla 3 Ω ve 6 Ω olan iki direnç birbirine paralel bağlanıp 12 V'luk bir üretece bağlanıyor. Ana koldan geçen toplam akım kaç Amperdir?",
      options: ["2", "3", "4", "6", "8"],
      correct: 3,
      explanation: "Eşdeğer Direnç (R_eş) paralel kollar için: (R1 * R2) / (R1 + R2) = (3 * 6) / (3 + 6) = 18 / 9 = 2 Ω. Ohm Kanunundan V = I * R => 12 = I * 2 => I = 6 A bulunur."
    },
    {
      id: "fiz_3",
      topic: "Optik",
      year: 2023,
      text: "Odak uzaklığı f olan çukur aynanın merkezine konulan bir cismin görüntüsünün özellikleri aşağıdakilerden hangisidir?",
      options: [
        "Odakta, ters ve küçük",
        "Merkezde, ters and eşit boyda",
        "Odak ile ayna arasında, düz ve büyük",
        "Sonsuzda",
        "Merkezin dışında, ters ve büyük"
      ],
      correct: 1,
      explanation: "Çukur aynada merkezdeki (2f) bir cismin görüntüsü yine merkezde, ters, gerçek ve cismin boyuna eşit büyüklükte oluşur."
    },
    {
      id: "fiz_4",
      topic: "Dalgalar",
      year: 2021,
      text: "Derinliği her yerde aynı olan bir dalga leğeninde oluşturulan periyodik dalgaların frekansı artırılırsa dalgaboyu (λ) ve dalga hızı (v) nasıl değişir?",
      options: [
        "λ artar, v değişmez",
        "λ azalır, v artar",
        "λ azalır, v değişmez",
        "λ artar, v artar",
        "İkisi de değişmez"
      ],
      correct: 2,
      explanation: "Dalga hızı (v) sadece ortama bağlıdır. Derinlik değişmediği için hız (v) değişmez. v = λ * f formülünden, v sabitken frekans (f) artarsa dalgaboyu (λ) azalır."
    },
    {
      id: "fiz_5",
      topic: "Madde ve Özellikleri",
      year: 2020,
      text: "Kütlesi 150 g olan içi dolu bir cisim, dereceli bir silindirdeki 200 cm³ seviyesindeki suya bırakıldığında su seviyesi 250 cm³ seviyesine çıkıyor. Bu cismin özkütlesi (yoğunluğu) kaç g/cm³ tür?",
      options: ["1.5", "2", "3", "4", "5"],
      correct: 2,
      explanation: "Cismin hacmi (V) = 250 - 200 = 50 cm³. Kütlesi (m) = 150 g. Özkütle (d) = m / V = 150 / 50 = 3 g/cm³ bulunur."
    },
    {
      id: "fiz_6",
      topic: "Isı, Sıcaklık ve Genleşme",
      year: 2022,
      text: "Isıca yalıtılmış bir kapta karıştırılan farklı sıcaklıktaki iki sıvının ısı alışverişi tamamlandığında aşağıdakilerden hangisi kesinlikle eşit olur?",
      options: [
        "Sıcaklık değişimleri",
        "Son sıcaklıkları",
        "İç enerjilerindeki değişimlerin yönü",
        "Isı sığaları",
        "Öz ısıları"
      ],
      correct: 1,
      explanation: "Isıl dengeye ulaşan sistemlerde, maddelerin son sıcaklıkları birbirine kesinlikle eşit olur."
    },
    {
      id: "fiz_7",
      topic: "Mekanik - İş, Güç ve Enerji",
      year: 2023,
      text: "Yerden h yüksekliğindeki m kütleli bir cisim serbest bırakılıyor. Sürtünmeler önemsiz olduğuna göre, cisim yere çarptığı andaki kinetik enerjisi aşağıdakilerden hangisine eşittir?",
      options: ["m*g*h", "1/2 * m * g * h", "2 * m * g * h", "m * g^2 * h", "Sıfır"],
      correct: 0,
      explanation: "Enerjinin korunumu yasasına göre, başlangıçtaki potansiyel enerji (E_p = mgh) sürtünmesiz ortamda tamamen kinetik enerjiye dönüşür. Dolayısıyla yere çarptığı andaki kinetik enerji mgh'dir."
    },
    {
      id: "fiz_8",
      topic: "Basınç ve Kaldırma Kuvveti",
      year: 2021,
      text: "Hacmi V olan özkütlesi suyun özkütlesinden küçük bir cisim suda yüzmektedir. Bu cisme etki eden kaldırma kuvveti aşağıdakilerden hangisine eşittir?",
      options: [
        "Cismin batan hacminin ağırlığına",
        "Cismin toplam ağırlığından daha büyüktür",
        "Cismin toplam ağırlığından daha küçüktür",
        "Cismin batan hacminin suyun özkütlesiyle çarpımına",
        "Cismin toplam ağırlığına"
      ],
      correct: 4,
      explanation: "Yüzen ve askıda kalan cisimlerde, cisme etki eden kaldırma kuvveti cismin kendi ağırlığına eşit büyüklüktedir (F_k = G)."
    },
    {
      id: "fiz_9",
      topic: "Modern Fizik",
      year: 2019,
      text: "Fotoelektrik olayda, metal yüzeyden kopan elektronların maksimum kinetik enerjisini artırmak için aşağıdakilerden hangisi yapılabilir?",
      options: [
        "Gelen ışığın şiddetini artırmak",
        "Gelen fotonların frekansını artırmak",
        "Metalin eşik enerjisini (bağlanma enerjisi) artırmak",
        "Işık kaynağını metal yüzeye yaklaştırmak",
        "Yüzey alanını genişletmek"
      ],
      correct: 1,
      explanation: "Einstein fotoelektrik denklemi: E_foton = E_bağlanma + E_kinetik. E_kinetik = h*f - E_bağlanma. Kinetik enerjiyi artırmak için gelen fotonun frekansı (f) artırılmalıdır."
    },
    {
      id: "fiz_10",
      topic: "Elektrik - Elektrostatik",
      year: 2018,
      text: "Elektrik yükleri +q ve +4q olan iki noktasal cisim arasındaki uzaklık d iken birbirlerine uyguladıkları elektriksel kuvvet F'dir. Aralarındaki uzaklık 2d yapılırsa yeni kuvvet kaç F olur?",
      options: ["1/4", "1/2", "1", "2", "4"],
      correct: 0,
      explanation: "Coulomb yasasına göre kuvvet uzaklığın karesiyle ters orantılıdır (F = k*q1*q2 / d^2). Uzaklık 2 katına çıkarsa, kuvvet (2)^2 = 4 kat azalır ve F/4 olur."
    },
    {
      id: "fiz_11",
      topic: "Fizik Bilimine Giriş",
      year: 2024,
      text: "Aşağıdakilerden hangisi fizikteki temel büyüklüklerden biri değildir?",
      options: ["Kütle", "Zaman", "Akım Şiddeti", "Hız", "Sıcaklık"],
      correct: 3,
      explanation: "Fizikte temel büyüklükler Kısa Muz (Kütle, Işık şiddeti, Sıcaklık, Akım şiddeti, Madde miktarı, Uzunluk, Zaman) formülüyle hatırlanır. Hız ise türetilmiş bir büyüklüktür."
    },
    {
      id: "fiz_12",
      topic: "Mekanik - Dinamik",
      year: 2023,
      text: "Sürtünmesiz yatay düzlemde durmakta olan 5 kg kütleli bir cisme 20 N'luk yatay bir kuvvet uygulanıyor. Cismin kazanacağı ivme kaç m/s² dir?",
      options: ["2", "3", "4", "5", "10"],
      correct: 2,
      explanation: "Newton'un 2. Hareket Yasası: F = m * a. Buradan 20 = 5 * a => a = 4 m/s² bulunur."
    },
    {
      id: "fiz_13",
      topic: "Isı, Sıcaklık ve Genleşme",
      year: 2021,
      text: "Celsius termometresinin 30 °C gösterdiği bir ortam sıcaklığını Kelvin termometresi kaç K gösterir?",
      options: ["243", "273", "303", "313", "333"],
      correct: 2,
      explanation: "Kelvin ile Celsius arasındaki ilişki: T(K) = t(°C) + 273'tür. T = 30 + 273 = 303 K olur."
    },
    {
      id: "fiz_14",
      topic: "Optik - Kırılma",
      year: 2022,
      text: "Işığın az yoğun ortamdan çok yoğun ortama geçişinde aşağıdakilerden hangisi gerçekleşir?",
      options: [
        "Normalden uzaklaşarak kırılır",
        "Normale yaklaşarak kırılır",
        "Kırılmadan geçer",
        "Hızı artar",
        "Tam yansıma yapar"
      ],
      correct: 1,
      explanation: "Işık az yoğun (küçük indisli) ortamdan çok yoğun (büyük indisli) ortama geçerken hızı azalır ve normale yaklaşarak kırılır."
    },
    {
      id: "fiz_15",
      topic: "Mekanik - Basit Makineler",
      year: 2020,
      text: "Sürtünmesiz ideal bir makara sisteminde kuvvet kazancı 3 ise, yükü 60 cm yukarı kaldırmak için ipin ucu kaç cm çekilmelidir?",
      options: ["20", "60", "120", "180", "240"],
      correct: 3,
      explanation: "Basit makinelerde işten kazanç yoktur. Kuvvet kazancı 3 ise yoldan kayıp da 3 kat olmalıdır. Yükü 60 cm kaldırmak için ip 3 * 60 = 180 cm çekilmelidir."
    },
    {
      id: "fiz_16",
      topic: "Vektörler",
      year: 2017,
      text: "Aynı doğrultuda ve aynı yönlü 5 N ve 12 N büyüklüğündeki iki vektörün bileşkesinin en büyük değeri kaç N olur?",
      options: ["7", "10", "13", "17", "20"],
      correct: 3,
      explanation: "Aynı yönlü vektörler toplanır: R = 5 + 12 = 17 N olur. Zıt yönlü olsalardı en küçük değer 12 - 5 = 7 N olurdu."
    },
    {
      id: "fiz_17",
      topic: "Modern Fizik",
      year: 2020,
      text: "Aşağıdaki elektromanyetik dalgalardan hangisinin enerjisi en yüksektir?",
      options: ["Radyo dalgaları", "Kızılötesi ışınlar", "Görünür ışık", "Morötesi ışınlar", "Gama ışınları"],
      correct: 4,
      explanation: "Elektromanyetik spektrumda frekansı en yüksek olan gama ışınlarının dalgaboyu en kısa, enerjisi ise en yüksektir."
    },
    {
      id: "fiz_18",
      topic: "Madde ve Özellikleri",
      year: 2022,
      text: "Aynı tür sıvı moleküllerinin birbirini tutmasını sağlayan kuvvete ne ad verilir?",
      options: ["Adezyon", "Kohezyon", "Kılcallık", "Yüzey gerilimi", "Viskozite"],
      correct: 1,
      explanation: "Aynı cins moleküller arasındaki çekim kuvvetine kohezyon (tutunma), farklı cins moleküller arasındaki çekim kuvvetine ise adezyon (yapışma) denir."
    },
    {
      id: "fiz_19",
      topic: "Mekanik - Dairesel Hareket",
      year: 2021,
      text: "Düzgün çembersel hareket yapan bir cismin çizgisel hız vektörü ile merkezcil ivme vektörü arasındaki açı kaç derecedir?",
      options: ["0", "45", "90", "180", "360"],
      correct: 2,
      explanation: "Düzgün çembersel harekette çizgisel hız yörüngeye teğet, merkezcil ivme ise merkeze doğrudur. Dolayısıyla bu iki vektör her zaman birbirine diktir (90°)."
    },
    {
      id: "fiz_20",
      topic: "Optik - Renkler",
      year: 2023,
      text: "Kırmızı ve Yeşil ışık renklerinin karışımıyla hangi renk elde edilir?",
      options: ["Mavi", "Sarı", "Magenta", "Cyan", "Beyaz"],
      correct: 1,
      explanation: "Işık renklerinde kırmızı ve yeşil ana renklerinin birleşimi sarı (ikincil renk) rengini verir."
    },
    {
      id: "fiz_21",
      topic: "Elektrik - Akım",
      year: 2022,
      text: "Bir iletkenin kesitinden 2 saniyede 10 Coulomb'luk yük geçiyor. Bu iletkenden geçen akım şiddeti kaç Amperdir?",
      options: ["2", "5", "10", "20", "40"],
      correct: 1,
      explanation: "Akım (I) = Yük (Q) / Zaman (t) formülünden: I = 10 / 2 = 5 Amper bulunur."
    },
    {
      id: "fiz_22",
      topic: "Dalgalar - Ses",
      year: 2021,
      text: "Ses dalgaları ile ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Mekanik dalgalardır.",
        "Boşlukta yayılabilirler.",
        "Boyuna dalgalardır.",
        "Katılarda sıvılardan daha hızlı yayılırlar.",
        "Sıcaklık arttıkça yayılma hızı artar."
      ],
      correct: 1,
      explanation: "Ses dalgaları yayılmak için maddesel bir ortama ihtiyaç duyan mekanik dalgalardır. Bu yüzden boşlukta yayılamazlar."
    },
    {
      id: "fiz_23",
      topic: "Basınç",
      year: 2020,
      text: "Katı bir cismin oturduğu yüzeye uyguladığı basınç aşağıdakilerden hangisine bağlı değildir?",
      options: [
        "Cismin kütlesine",
        "Bulunduğu yerin yerçekimi ivmesine",
        "Temas eden yüzey alanına",
        "Cismin hacmine",
        "Cismin duruş biçimine"
      ],
      correct: 3,
      explanation: "Katı basıncı P = G / S (Ağırlık / Yüzey Alanı) formülüyle bulunur. G = m*g'dir. Kütle, çekim ivmesi ve yüzey alanı doğrudan etkilidir ancak cismin hacmi tek başına basıncı belirlemez."
    },
    {
      id: "fiz_24",
      topic: "Isı, Sıcaklık ve Genleşme",
      year: 2019,
      text: "Isı iletim hızı ile ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Maddenin cinsine bağlıdır.",
        "Sıcaklık farkı arttıkça artar.",
        "Yüzey alanı arttıkça azalır.",
        "Kalınlık arttıkça azalır.",
        "Katılar ısıyı gazlara göre daha hızlı iletir."
      ],
      correct: 2,
      explanation: "Isı iletim hızı kesit alanı (yüzey alanı) ile doğru orantılıdır. Yüzey alanı arttıkça ısı iletim hızı da artar. Dolayısıyla 'yüzey alanı arttıkça azalır' ifadesi yanlıştır."
    },
    {
      id: "fiz_25",
      topic: "Mekanik - Tork ve Denge",
      year: 2018,
      text: "Dönme noktasına olan dik uzaklığı 2 metre olan bir kapıya, menteşeye dik olacak şekilde 50 N'luk kuvvet uygulanıyor. Oluşan torkun büyüklüğü kaç N.m'dir?",
      options: ["25", "50", "75", "100", "200"],
      correct: 3,
      explanation: "Tork (τ) = Kuvvet (F) * Dik Uzaklık (d) = 50 * 2 = 100 N.m bulunur."
    },
    {
      id: "fiz_26",
      topic: "Fizik Bilimine Giriş",
      year: 2017,
      text: "Işığın doğasını, yayılmasını, kırılmasını ve aynalardaki davranışını inceleyen fiziğin alt dalı aşağıdakilerden hangisidir?",
      options: ["Mekanik", "Termodinamik", "Optik", "Elektromanyetizma", "Nükleer Fizik"],
      correct: 2,
      explanation: "Işık olaylarını inceleyen fiziğin alt dalı Optik'tir."
    },
    {
      id: "fiz_27",
      topic: "Elektrik - Akım",
      year: 2016,
      text: "Boyu L, kesit alanı S olan bir metal telin direnci R'dir. Bu tel ikiye katlanıp boyu yarıya indirilirse direnci kaç R olur?",
      options: ["1/4", "1/2", "1", "2", "4"],
      correct: 0,
      explanation: "Direnç R = ρ * L / S. Tel ikiye katlandığında boy L/2 olurken kesit alanı 2S olur. Yeni direnç = ρ * (L/2) / (2S) = 1/4 * (ρ * L / S) = R/4 bulunur."
    },
    {
      id: "fiz_28",
      topic: "Optik - Mercekler",
      year: 2024,
      text: "Hipermetrop (yakını net görememe) göz kusurunu düzeltmek için hangi mercek türü kullanılır?",
      options: ["İnce kenarlı (yakınsak) mercek", "Kalın kenarlı (ıraksak) mercek", "Silindirik mercek", "Çukur ayna", "Düzlem ayna"],
      correct: 0,
      explanation: "Hipermetrop göz kusurunda görüntünün retinanın arkasına düşmesi problemi ince kenarlı (yakınsak) mercek kullanılarak düzeltilir."
    },
    {
      id: "fiz_29",
      topic: "Mekanik - Sürtünme",
      year: 2023,
      text: "Yatay düzlemde hareket eden bir cisme etki eden sürtünme kuvveti aşağıdakilerden hangisine bağlı değildir?",
      options: [
        "Yüzeyin cinsine",
        "Cismin kütlesine",
        "Cismin temas yüzeyinin alanına",
        "Cismin hareket yönüne",
        "Yerçekimi ivmesine"
      ],
      correct: 2,
      explanation: "Sürtünme kuvveti F_s = k * N = k * m * g formülüyle hesaplanır. Sürtünme kuvveti, temas eden yüzey alanının büyüklüğüne bağlı değildir."
    },
    {
      id: "fiz_30",
      topic: "Isı, Sıcaklık ve Genleşme",
      year: 2022,
      text: "Sıcaklığı artan bir metal çubuğun boyunun uzama miktarı aşağıdakilerden hangisine bağlı değildir?",
      options: [
        "Çubuğun ilk boyuna",
        "Sıcaklık artış miktarına",
        "Çubuğun yapıldığı metalin cinsine",
        "Çubuğun kalınlığına",
        "Genleşme katsayısına"
      ],
      correct: 3,
      explanation: "Boyca genleşme formülü ΔL = L0 * α * ΔT'dir. Kalınlık (kesit alanı) boyca uzama miktarını etkilemez."
    }
  ,
    {
      "id": "fiz_y1",
      "topic": "Fizik Bilimine Giriş",
      "year": 2021,
      "text": "Uluslararası Birim Sistemi'nde (SI) kütlenin temel birimi aşağıdakilerden hangisidir?",
      "options": [
            "gram",
            "kilogram",
            "newton",
            "joule",
            "mol"
      ],
      "correct": 1,
      "explanation": "SI'de yedi temel büyüklükten biri olan kütlenin temel birimi kilogramdır (kg). Gram kilogramın ast katıdır; newton kuvvetin, joule enerjinin, mol madde miktarının birimidir.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y2",
      "topic": "Vektörler",
      "year": 2022,
      "text": "Birbirine dik olarak etki eden 3 N ve 4 N büyüklüğündeki iki kuvvetin bileşkesinin büyüklüğü kaç N'dur?",
      "options": [
            "1",
            "3",
            "5",
            "7",
            "12"
      ],
      "correct": 2,
      "explanation": "Dik iki vektörün bileşkesi Pisagor bağıntısıyla bulunur: √(3² + 4²) = √25 = 5 N. Kuvvetler dik olduğu için doğrudan toplanamaz.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y3",
      "topic": "Mekanik - Kuvvet ve Hareket",
      "year": 2023,
      "text": "Sürtünmesiz yatay düzlemde duran 4 kg kütleli bir cisme 12 N büyüklüğünde net kuvvet uygulanıyor. Cismin kazandığı ivme kaç m/s²'dir?",
      "options": [
            "2",
            "3",
            "4",
            "6",
            "8"
      ],
      "correct": 1,
      "explanation": "Newton'un ikinci yasasına göre F = m · a'dır. a = F / m = 12 / 4 = 3 m/s² bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y4",
      "topic": "Mekanik - Dinamik",
      "year": 2024,
      "text": "20 m/s hızla giden 1000 kg kütleli bir araç, sabit bir frenleme kuvvetiyle 5 saniyede durmaktadır. Buna göre frenleme kuvvetinin büyüklüğü kaç N'dur?",
      "options": [
            "2000",
            "3000",
            "4000",
            "5000",
            "8000"
      ],
      "correct": 2,
      "explanation": "İvme a = Δv / Δt = (0 - 20) / 5 = -4 m/s²'dir. Kuvvetin büyüklüğü F = m · |a| = 1000 · 4 = 4000 N olarak bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y5",
      "topic": "Mekanik - İş, Güç ve Enerji",
      "year": 2021,
      "text": "Yatay bir düzlemde bir cisme, hareket doğrultusunda 50 N'luk sabit bir kuvvet uygulanarak cisim 8 m yol alıyor. Kuvvetin yaptığı iş kaç J'dür?",
      "options": [
            "100",
            "200",
            "400",
            "500",
            "800"
      ],
      "correct": 2,
      "explanation": "Kuvvet ile yer değiştirme aynı doğrultuda olduğundan W = F · x = 50 · 8 = 400 J'dür.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y6",
      "topic": "Mekanik - Sürtünme",
      "year": 2022,
      "text": "Yatay düzlemde bulunan 10 kg kütleli bir cisim ile zemin arasındaki sürtünme katsayısı 0,2'dir. (g = 10 m/s²) Buna göre cisme etki eden sürtünme kuvveti kaç N'dur?",
      "options": [
            "2",
            "10",
            "20",
            "50",
            "100"
      ],
      "correct": 2,
      "explanation": "Yatay düzlemde normal kuvvet N = m · g = 10 · 10 = 100 N'dur. Sürtünme kuvveti f = k · N = 0,2 · 100 = 20 N olur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y7",
      "topic": "Mekanik - Dairesel Hareket",
      "year": 2023,
      "text": "Yarıçapı 2 m olan çember biçimli bir yolda 4 m/s sabit süratle dönen bir cismin merkezcil ivmesinin büyüklüğü kaç m/s²'dir?",
      "options": [
            "2",
            "4",
            "8",
            "16",
            "32"
      ],
      "correct": 2,
      "explanation": "Merkezcil ivme a = v² / r bağıntısıyla hesaplanır: a = 4² / 2 = 16 / 2 = 8 m/s² bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y8",
      "topic": "Mekanik - Tork ve Denge",
      "year": 2025,
      "text": "Bir cisme, dönme eksenine olan dik uzaklığı 0,5 m olan noktadan, kola dik doğrultuda 40 N'luk kuvvet uygulanıyor. Oluşan torkun büyüklüğü kaç N·m'dir?",
      "options": [
            "8",
            "20",
            "40",
            "80",
            "200"
      ],
      "correct": 1,
      "explanation": "Kuvvet kola dik olduğundan tork τ = F · d = 40 · 0,5 = 20 N·m'dir.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y9",
      "topic": "Mekanik - Basit Makineler",
      "year": 2021,
      "text": "Bir kaldıraçta yük kolu 0,5 m, kuvvet kolu 2 m'dir. 200 N'luk yükü dengelemek için uygulanması gereken kuvvet kaç N'dur?",
      "options": [
            "25",
            "50",
            "100",
            "400",
            "800"
      ],
      "correct": 1,
      "explanation": "Kaldıraç denge koşulu F · kuvvet kolu = Yük · yük kolu'dur. F · 2 = 200 · 0,5 eşitliğinden F = 100 / 2 = 50 N bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y10",
      "topic": "Madde ve Özellikleri",
      "year": 2022,
      "text": "Kütlesi 270 g, hacmi 100 cm³ olan bir cismin özkütlesi kaç g/cm³'tür?",
      "options": [
            "0,37",
            "1,7",
            "2,7",
            "3,7",
            "27"
      ],
      "correct": 2,
      "explanation": "Özkütle d = m / V bağıntısıyla bulunur: d = 270 / 100 = 2,7 g/cm³'tür.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y11",
      "topic": "Basınç ve Kaldırma Kuvveti",
      "year": 2024,
      "text": "Özkütlesi 1000 kg/m³ olan durgun bir sıvının yüzeyinden 2 m derinlikteki bir noktada sıvının yaptığı basınç kaç Pa'dır? (g = 10 m/s²)",
      "options": [
            "200",
            "2000",
            "20000",
            "200000",
            "2000000"
      ],
      "correct": 2,
      "explanation": "Sıvı basıncı P = h · d · g bağıntısıyla hesaplanır: P = 2 · 1000 · 10 = 20000 Pa'dır. Sıvı basıncı kabın şekline değil, yalnızca derinliğe ve sıvının özkütlesine bağlıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y12",
      "topic": "Isı, Sıcaklık ve Genleşme",
      "year": 2023,
      "text": "Öz ısısı 4200 J/(kg·°C) olan 2 kg suyun sıcaklığını 10 °C artırmak için gereken ısı kaç J'dür?",
      "options": [
            "8400",
            "42000",
            "84000",
            "420000",
            "840000"
      ],
      "correct": 2,
      "explanation": "Q = m · c · ΔT bağıntısından Q = 2 · 4200 · 10 = 84000 J bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y13",
      "topic": "Elektrik - Elektrostatik",
      "year": 2021,
      "text": "Noktasal iki yük arasındaki uzaklık iki katına çıkarılırsa, aralarındaki elektriksel kuvvetin büyüklüğü nasıl değişir?",
      "options": [
            "İki katına çıkar",
            "Dört katına çıkar",
            "Yarıya iner",
            "Dörtte birine iner",
            "Değişmez"
      ],
      "correct": 3,
      "explanation": "Coulomb yasasına göre kuvvet, uzaklığın karesiyle ters orantılıdır (F = k·q₁·q₂ / d²). Uzaklık iki katına çıkınca payda 2² = 4 kat büyür ve kuvvet dörtte birine iner.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y14",
      "topic": "Elektrik - Akım",
      "year": 2022,
      "text": "Uçları arasındaki potansiyel fark 12 V olan 4 Ω'luk bir dirençten geçen akım şiddeti kaç A'dir?",
      "options": [
            "0,33",
            "3",
            "4",
            "8",
            "48"
      ],
      "correct": 1,
      "explanation": "Ohm yasasına göre V = I · R'dir. I = V / R = 12 / 4 = 3 A bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y15",
      "topic": "Elektrik ve Manyetizma",
      "year": 2025,
      "text": "Üzerinden sabit akım geçen sonsuz uzunluktaki düz bir telin oluşturduğu manyetik alanın şiddeti, telden uzaklaştıkça nasıl değişir?",
      "options": [
            "Artar",
            "Azalır",
            "Değişmez",
            "Önce artar, sonra azalır",
            "Sıfır olur"
      ],
      "correct": 1,
      "explanation": "Düz bir telin oluşturduğu manyetik alan, tele olan uzaklıkla ters orantılıdır (B = 2k·i / d). Uzaklık arttıkça alan şiddeti azalır, ancak hiçbir sonlu uzaklıkta tam olarak sıfır olmaz.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y16",
      "topic": "Optik",
      "year": 2023,
      "text": "Bir cisim düzlem aynaya 3 m uzaklıkta durmaktadır. Cisim ile görüntüsü arasındaki uzaklık kaç m'dir?",
      "options": [
            "1,5",
            "3",
            "4,5",
            "6",
            "9"
      ],
      "correct": 3,
      "explanation": "Düzlem aynada görüntü, aynanın arkasında cismin aynaya olan uzaklığı kadar oluşur. Görüntü aynaya 3 m uzaklıktadır; cisim ile görüntü arası 3 + 3 = 6 m olur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y17",
      "topic": "Optik - Kırılma",
      "year": 2021,
      "text": "Işık, az yoğun bir ortamdan çok yoğun bir ortama eğik olarak geçerken izlediği yol için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "Normalden uzaklaşır",
            "Normale yaklaşır",
            "Doğrultusunu değiştirmez",
            "Geldiği ortama geri döner",
            "İki ışına ayrılır"
      ],
      "correct": 1,
      "explanation": "Işık çok yoğun ortamda daha yavaş ilerlediği için, az yoğundan çok yoğun ortama geçerken kırılma açısı gelme açısından küçük olur; yani ışın normale yaklaşır.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y18",
      "topic": "Optik - Mercekler",
      "year": 2024,
      "text": "Odak uzaklığı 20 cm olan ince kenarlı bir merceğin optik gücü kaç diyoptridir?",
      "options": [
            "0,2",
            "2",
            "5",
            "20",
            "50"
      ],
      "correct": 2,
      "explanation": "Optik güç P = 1 / f bağıntısıyla bulunur ve f metre cinsinden yazılır. f = 20 cm = 0,2 m olduğundan P = 1 / 0,2 = 5 diyoptridir.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y19",
      "topic": "Dalgalar",
      "year": 2022,
      "text": "Dalga boyu 0,5 m ve frekansı 40 Hz olan bir dalganın yayılma hızı kaç m/s'dir?",
      "options": [
            "8",
            "20",
            "40",
            "80",
            "200"
      ],
      "correct": 1,
      "explanation": "Dalga hızı v = λ · f bağıntısıyla hesaplanır: v = 0,5 · 40 = 20 m/s bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "fiz_y20",
      "topic": "Modern Fizik",
      "year": 2025,
      "text": "Fotoelektrik olayda, metal yüzeyden birim zamanda sökülen elektron sayısı öncelikle ışığın hangi özelliğine bağlıdır? (Işığın frekansı eşik frekansından büyüktür.)",
      "options": [
            "Frekansına",
            "Şiddetine",
            "Yayılma hızına",
            "Geliş açısına",
            "Polarizasyonuna"
      ],
      "correct": 1,
      "explanation": "Işığın frekansı eşik frekansını aştıktan sonra, sökülen elektronların sayısı gelen foton sayısıyla yani ışığın şiddetiyle doğru orantılıdır. Frekans ise sökülen elektronların maksimum kinetik enerjisini belirler, sayısını değil.",
      "kaynak": "ozgun"
}
  ],
  Kimya: [
    {
      id: "kim_1",
      topic: "Atom ve Periyodik Sistem",
      year: 2023,
      text: "Periyodik cetvelde aynı grupta yukarıdan aşağıya doğru inildikçe genellikle aşağıdakilerden hangisi azalır?",
      options: [
        "Atom yarıçapı",
        "Elektron ilgisi",
        "Metalik aktiflik",
        "Proton sayısı",
        "Temel enerji seviyesi sayısı"
      ],
      correct: 1,
      explanation: "Aynı grupta yukarıdan aşağıya inildikçe atom yarıçapı artar, metalik aktiflik artar, proton sayısı artar, katman sayısı artar; ancak iyonlaşma enerjisi ve elektron ilgisi genellikle azalır."
    },
    {
      id: "kim_2",
      topic: "Kimyasal Türler Arası Etkileşimler",
      year: 2022,
      text: "Aşağıdaki moleküllerden hangisi apolar yapılıdır? (1H, 6C, 8O)",
      options: ["H2O", "NH3", "CO2", "HCl", "HF"],
      correct: 2,
      explanation: "CO2 molekülünde karbon atomu merkezdedir ve iki oksijen atomuyla doğrusal (180 derece) bağ yapar. Vektörel çekimler birbirini sıfırladığı için molekül apolardır. H2O ve NH3 ise merkez atomlarında ortaklanmamış elektron çifti bulundurduğu için polardır."
    },
    {
      id: "kim_3",
      topic: "Kimyasal Hesaplamalar",
      year: 2023,
      text: "Normal koşullarda (NK) 4.48 litre hacim kaplayan CO2 gazı kaç moldür?",
      options: ["0.1", "0.2", "0.3", "0.4", "0.5"],
      correct: 1,
      explanation: "Normal koşullarda 1 mol gaz 22.4 litre hacim kaplar. 4.48 / 22.4 = 0.2 mol bulunur."
    },
    {
      id: "kim_4",
      topic: "Maddenin Halleri",
      year: 2021,
      text: "Sıvıların viskozitesi ile ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Sıcaklık arttıkça viskozite azalır.",
        "Moleküller arası çekim kuvveti büyük olan sıvıların viskozitesi büyüktür.",
        "Viskozite, akışkanlığa karşı gösterilen dirençtir.",
        "Sıcaklık azaldıkça akışkanlık artar.",
        "Balın viskozitesi suyun viskozitesinden büyüktür."
      ],
      correct: 3,
      explanation: "Sıcaklık azaldıkça viskozite artar, bu yüzden akışkanlık azalır. Dolayısıyla 'sıcaklık azaldıkça akışkanlık artar' ifadesi yanlıştır."
    },
    {
      id: "kim_5",
      topic: "Karışımlar",
      year: 2020,
      text: "Aşağıdaki karışımlardan hangisi homojendir?",
      options: ["Tuzlu su", "Zeytinyağı-su", "Süt", "Çamurlu su", "Duman"],
      correct: 0,
      explanation: "Tuzlu su, tuzun suda tamamen iyonlarına ayrışarak dağılmasıyla oluşan homojen bir karışımdır (çözeltidir). Diğerleri heterojendir."
    },
    {
      id: "kim_6",
      topic: "Asitler, Bazlar ve Tuzlar",
      year: 2022,
      text: "Aşağıdaki maddelerden hangisinin sulu çözeltisinin pH değeri 7'den küçüktür?",
      options: ["NaOH", "NH3", "HCl", "NaCl", "KOH"],
      correct: 2,
      explanation: "Sulu çözeltisinin pH değerinin 7'den küçük olması asit olduğunu gösterir. HCl (hidroklorik asit) güçlü bir asittir. NaOH, KOH ve NH3 bazik; NaCl ise nötrdür."
    },
    {
      id: "kim_7",
      topic: "Kimya Bilimi",
      year: 2024,
      text: "Yaygın adı 'Kezzap' olan bileşiğin kimyasal formülü aşağıdakilerden hangisidir?",
      options: ["H2SO4", "HNO3", "HCl", "CH3COOH", "H3PO4"],
      correct: 1,
      explanation: "Kezzabın kimyasal adı nitrik asit, formülü ise HNO3'tür. H2SO4 zaç yağı, HCl tuz ruhu, CH3COOH ise sirke asididir."
    },
    {
      id: "kim_8",
      topic: "Kimyasal Türler Arası Etkileşimler",
      year: 2021,
      text: "Aşağıdaki bağ türlerinden hangisi zayıf etkileşim sınıfına girer?",
      options: ["Kovalent bağ", "İyonik bağ", "Metalik bağ", "Hidrojen bağı", "Polar kovalent bağ"],
      correct: 3,
      explanation: "Kovalent, iyonik ve metalik bağlar güçlü etkileşimlerdir (kimyasal bağlar). Hidrojen bağları ve Van der Waals etkileşimleri ise zayıf etkileşimlerdir (fiziksel bağlar)."
    },
    {
      id: "kim_9",
      topic: "Kimya Her Yerde",
      year: 2020,
      text: "Sabun ve deterjanların temizleme prensibiyle ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Kiri temizleyen moleküller polar ve apolar kısımlar içerir.",
        "Kuyruk kısmı apolar olup kire tutunur.",
        "Baş kısmı polar olup su ile etkileşir.",
        "Deterjanlar sert sularda köpürmez.",
        "Sabunlar bitkisel veya hayvansal yağlardan elde edilir."
      ],
      correct: 3,
      explanation: "Deterjanlar, yapılarındaki özelliklerden dolayı sert sulardaki kalsiyum ve magnezyum iyonlarıyla çökelek oluşturmazlar ve sert sularda da köpürerek temizlik yapabilirler. Sabunlar ise sert sularda çökelir."
    },
    {
      id: "kim_10",
      topic: "Kimyasal Tepkimeler",
      year: 2019,
      text: "N2 + 3H2 -> 2NH3 tepkimesiyle ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Sentez (oluşum) tepkimesidir.",
        "Tepkimeye girenlerin mol sayısı ürünlerin mol sayısına eşittir.",
        "Atom sayısı ve cinsi korunmuştur.",
        "Toplam kütle korunmuştur.",
        "Homojen gaz evre tepkimesidir."
      ],
      correct: 1,
      explanation: "Girenlerin toplam mol sayısı 1 + 3 = 4 mol iken, ürünlerin mol sayısı 2 moldür. Mol sayısı korunmamıştır."
    },
    {
      id: "kim_11",
      topic: "Atom ve Periyodik Sistem",
      year: 2023,
      text: "Elektron dağılımı 2, 8, 8, 2 şeklinde olan kalsiyum (Ca) atomu periyodik cetvelde hangi periyot ve gruptadır?",
      options: [
        "3. periyot, 2A grubu",
        "4. periyot, 2A grubu",
        "4. periyot, 8A grubu",
        "2. periyot, 4A grubu",
        "4. periyot, 1A grubu"
      ],
      correct: 1,
      explanation: "Katman sayısı periyodu verir. 4 katmanı olduğu için 4. periyottadır. Son katmandaki elektron sayısı grubu verir, son katmanda 2 elektron olduğu için 2A grubundadır."
    },
    {
      id: "kim_12",
      topic: "Asitler, Bazlar ve Tuzlar",
      year: 2022,
      text: "Aşağıdaki metal sınıflandırmalarından hangisi asitlerin tamamıyla tepkimeye girerek H2 gazı açığa çıkarmaz?",
      options: ["Aktif metaller", "Yarı soy metaller (Cu, Hg, Ag)", "Amfoter metaller", "Alkali metaller", "Toprak alkali metaller"],
      correct: 1,
      explanation: "Yarı soy metaller (Cu, Hg, Ag) hidrojenden daha az aktiftir. Oksijensiz asitlerle tepkime vermezler. Yalnızca HNO3 ve H2SO4 gibi kuvvetli ve oksijenli asitlerle tepkimeye girerler ve H2 gazı yerine NO, NO2 veya SO2 gazları çıkarırlar."
    },
    {
      id: "kim_13",
      topic: "Karışımlar - Ayırma Teknikleri",
      year: 2021,
      text: "Kaynama noktası farkından yararlanılarak sıvı-sıvı homojen karışımları ayırmak için kullanılan yöntem aşağıdakilerden hangisidir?",
      options: ["Süzme", "Ayrımsal damıtma", "Ayırma hunisi", "Dekantasyon", "Flotasyon"],
      correct: 1,
      explanation: "Sıvı-sıvı homojen karışımlar (alkol-su gibi) kaynama noktası farkından yararlanılarak ayrımsal damıtma yöntemiyle bileşenlerine ayrılır."
    },
    {
      id: "kim_14",
      topic: "Maddenin Halleri",
      year: 2020,
      text: "Sabit sıcaklıkta dış basıncın artırılması bir sıvının kaynama noktasını nasıl etkiler?",
      options: ["Artırır", "Azaltır", "Değiştirmez", "Önce azaltır sonra artırır", "Sıvının miktarına bağlıdır"],
      correct: 0,
      explanation: "Sıvının kaynaması, iç buhar basıncının dış basınca eşit olmasıyla gerçekleşir. Dış basınç artarsa, iç buhar basıncının bu basınca ulaşması için sıvının daha fazla ısıtılması gerekir, yani kaynama noktası artar."
    },
    {
      id: "kim_15",
      topic: "Kimya Bilimi",
      year: 2018,
      text: "Üzerinde tahriş edici ve ünlem işareti olan bir kimyasal maddeyle çalışırken aşağıdakilerden hangisine dikkat edilmelidir?",
      options: [
        "Vücuda temas ettirilmemei ve buharı solunmamalıdır.",
        "Kıvılcım ve ateşten uzak tutulmalıdır.",
        "Radyoaktif olduğu için koruyucu kurşun giysi giyilmelidir.",
        "Doğaya doğrudan dökülmesinde sakınca yoktur.",
        "Metal kaplarda saklanmalıdır."
      ],
      correct: 0,
      explanation: "Tahriş edici maddeler cilde ve solunum yollarına zarar verir. Bu maddelerle çalışırken eldiven takılmalı, temas ettirilmemeli ve buharı doğrudan solunmamalıdır."
    },
    {
      id: "kim_16",
      topic: "Atom ve Yapısı",
      year: 2017,
      text: "Nötron sayıları aynı, proton sayıları farklı olan atomlara ne ad verilir?",
      options: ["İzotop", "İzoton", "İzobar", "İzolektronik", "Alotrop"],
      correct: 1,
      explanation: "Nötron sayıları aynı, proton sayıları farklı olan atomlar izotondur (son harfi 'n' nötrondan akılda kalabilir)."
    },
    {
      id: "kim_17",
      topic: "Kimyasal Türler Arası Etkileşimler",
      year: 2016,
      text: "NaCl bileşiğinin oda koşullarındaki fiziksel hali ve bağ türü aşağıdakilerden hangisidir?",
      options: [
        "Sıvı - Kovalent bağ",
        "Gaz - İyonik bağ",
        "Katı - İyonik bağ",
        "Katı - Kovalent bağ",
        "Sıvı - İyonik bağ"
      ],
      correct: 2,
      explanation: "Sodyum klorür (sofratuzu) metal-ametal arasında oluşan iyonik bağlı katı kristal yapılı bir bileşiktir. Oda koşullarında katı haldedir."
    },
    {
      id: "kim_18",
      topic: "Asitler, Bazlar ve Tuzlar",
      year: 2024,
      text: "Yemek sodası olarak bilinen tuzun formülü aşağıdakilerden hangisidir?",
      options: ["Na2CO3", "NaHCO3", "CaCO3", "NH4Cl", "NaCl"],
      correct: 1,
      explanation: "Yemek sodası NaHCO3 (sodyum bikarbonat), çamaşır sodası Na2CO3 (sodyum karbonat), kireç taşı ise CaCO3'tür."
    },
    {
      id: "kim_19",
      topic: "Kimya Bilimi",
      year: 2023,
      text: "Karbon bileşiklerinin yapılarını, özelliklerini ve tepkimelerini inceleyen kimya disiplini aşağıdakilerden hangisidir?",
      options: ["Analitik Kimya", "Biyokimya", "Anorganik Kimya", "Organik Kimya", "Fizikokimya"],
      correct: 3,
      explanation: "Karbon temelli bileşikleri inceleyen kimya dalına Organik Kimya (Karbon Kimyası) denir."
    },
    {
      id: "kim_20",
      topic: "Atom ve Periyodik Sistem",
      year: 2022,
      text: "Halojenler olarak bilinen element grubu periyodik sistemin hangi grubunda yer alır?",
      options: ["1A", "2A", "7A", "8A", "3B"],
      correct: 2,
      explanation: "Periyodik cetvelde 7A grubu elementlerine halojenler (tuz oluşturanlar) denir. 1A alkali metaller, 2A toprak alkali metaller, 8A ise soygazlardır."
    },
    {
      id: "kim_21",
      topic: "Maddenin Halleri",
      year: 2021,
      text: "Aşağıdakilerden hangisi kristal katı sınıfına girmez?",
      options: ["Elmas", "Yemek tuzu", "Demir", "Cam", "Buz"],
      correct: 3,
      explanation: "Cam, plastik, tereyağı ve lastik gibi maddeler tanecikleri düzensiz istiflenmiş amorf katı sınıfına girer. Belirli bir erime noktaları yoktur. Elmas, demir, tuz ve buz ise kristal katıdır."
    },
    {
      id: "kim_22",
      topic: "Kimyasal Hesaplamalar",
      year: 2020,
      text: "1 mol H2O bileşiğinde toplam kaç tane atom bulunur? (N_A = Avogadro Sayısı)",
      options: ["1 * N_A", "2 * N_A", "3 * N_A", "4 * N_A", "3"],
      correct: 2,
      explanation: "H2O bileşiğinde 2 tane hidrojen, 1 tane oksijen olmak üzere 3 atom vardır. 1 molünde 3 mol atom, yani 3 * N_A tane atom bulunur."
    },
    {
      id: "kim_23",
      topic: "Karışımlar",
      year: 2019,
      text: "Kütlece %20'lik 200 g şekerli su çözeltisinde kaç gram şeker çözünmüştür?",
      options: ["20", "30", "40", "50", "60"],
      correct: 2,
      explanation: "Çözünen şeker miktarı = Çözelti kütlesi * (Yüzde / 100) = 200 * (20/100) = 40 gramdır."
    },
    {
      id: "kim_24",
      topic: "Asitler, Bazlar ve Tuzlar",
      year: 2018,
      text: "Asit yağmurlarına yol açan temel gazlar arasında aşağıdakilerden hangisi bulunmaz?",
      options: ["SO2", "NO2", "CO2", "CH4", "SO3"],
      correct: 3,
      explanation: "Kükürt oksitler (SO2, SO3), azot oksitler (NO2) ve karbondioksit (CO2) havadaki su buharıyla birleşerek asit yağmurlarını oluşturur. CH4 (metan) ise bir sera gazıdır fakat asit yağmuru oluşturmaz."
    },
    {
      id: "kim_25",
      topic: "Kimya Bilimi",
      year: 2017,
      text: "Simya ile ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Değersiz madenleri altına çevirmeyi amaçlamışlardır.",
        "Ölümsüzlük iksirini (felsefe taşı) bulmaya çalışmışlardır.",
        "Sistematik bilgi birikimi içerir.",
        "Deneme-yanılma yöntemine dayanır.",
        "Teorik temelleri yoktur."
      ],
      correct: 2,
      explanation: "Simya bir bilim dalı değildir; deneme-yanılmaya dayalıdır, teorik temelleri ve sistematik bilgi birikimi yoktur. Sistematik bilgi birikimi kimyaya aittir."
    },
    {
      id: "kim_26",
      topic: "Atom ve Yapısı",
      year: 2016,
      text: "Proton sayıları aynı, kütle numaraları farklı olan atomlara ne ad verilir?",
      options: ["İzotop", "İzoton", "İzobar", "İzolektronik", "Alotrop"],
      correct: 0,
      explanation: "Proton sayıları aynı (aynı elementin atomları), nötron sayıları veya kütle numaraları farklı olan atomlara izotop denir (örneğin Döteryum ve Trityum)."
    },
    {
      id: "kim_27",
      topic: "Kimyasal Türler Arası Etkileşimler",
      year: 2024,
      text: "Aşağıdaki bağlardan hangisi polar kovalent bağa örnektir?",
      options: ["O2 molekülündeki bağ", "N2 molekülündeki bağ", "HCl molekülündeki bağ", "NaCl kristalindeki bağ", "F2 molekülündeki bağ"],
      correct: 2,
      explanation: "Aynı ametal atomları arasında apolar kovalent bağ (O2, N2, F2), farklı ametal atomları arasında polar kovalent bağ (HCl) oluşur. NaCl ise iyonik bağlıdır."
    },
    {
      id: "kim_28",
      topic: "Karışımlar",
      year: 2023,
      text: "Gözle görülemeyecek kadar küçük taneciklerin sıvı içerisinde asılı kalmasıyla oluşan heterojen karışımlara ne ad verilir?",
      options: ["Süspansiyon", "Emülsiyon", "Aerosol", "Kolloid", "Çözelti"],
      correct: 3,
      explanation: "Sütün, kanın veya sisin yapısında olduğu gibi, bir maddenin sıvı içerisinde çıplak gözle görülemeyecek kadar küçük tanecikler halinde asılı kalmasıyla oluşan karışımlara kolloid denir."
    },
    {
      id: "kim_29",
      topic: "Asitler, Bazlar ve Tuzlar",
      year: 2022,
      text: "Amonyak (NH3) bileşiği ile ilgili aşağıdakilerden hangisi doğrudur?",
      options: [
        "Yapısında H barındırdığı için asittir.",
        "Sulu çözeltisi mavi turnusolu kırmızıya çevirir.",
        "Susuz bir bazdır.",
        "pH değeri 7'den küçüktür.",
        "Tahriş edici özelliği yoktur."
      ],
      correct: 2,
      explanation: "Amonyak yapısında hidroksil (OH) grubu bulundurmamasına rağmen suda çözündüğünde OH- iyonu oluşturduğu için baz özellik gösterir ve 'susuz baz' olarak bilinir."
    },
    {
      id: "kim_30",
      topic: "Maddenin Halleri",
      year: 2021,
      text: "Sıvıların buhar basıncı aşağıdakilerden hangisine bağlı değildir?",
      options: ["Sıvının cinsine", "Sıcaklığa", "Sıvının saflığına", "Dış basınca", "Sıvı içindeki çözünmüş katı miktarına"],
      correct: 3,
      explanation: "Sıvıların dengedeki buhar basıncı sıvının cinsine, sıcaklığına ve saflığına (çözünmüş madde olup olmamasına) bağlıdır; dış basınca veya sıvının miktarına bağlı değildir. Dış basınç kaynama noktasını etkiler."
    }
  ,
    {
      "id": "kim_y1",
      "topic": "Atom ve Yapısı",
      "year": 2021,
      "text": "Kütle numarası 17, atom numarası 8 olan bir atomun çekirdeğindeki nötron sayısı kaçtır?",
      "options": [
            "8",
            "9",
            "17",
            "25",
            "26"
      ],
      "correct": 1,
      "explanation": "Kütle numarası = proton + nötron sayısıdır. Atom numarası proton sayısına eşit olduğundan proton 8'dir. Nötron sayısı 17 - 8 = 9 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y2",
      "topic": "Atom ve Periyodik Sistem",
      "year": 2022,
      "text": "Elektron dizilimi 1s² 2s² 2p⁶ 3s¹ olan bir elementin periyodik cetveldeki yeri aşağıdakilerden hangisidir?",
      "options": [
            "2. periyot, 1A grubu",
            "3. periyot, 1A grubu",
            "3. periyot, 7A grubu",
            "1. periyot, 1A grubu",
            "3. periyot, 2A grubu"
      ],
      "correct": 1,
      "explanation": "En yüksek baş kuantum sayısı (n = 3) periyot numarasını verir. Son katmanda 1 elektron bulunduğu ve bu elektron s orbitalinde olduğu için element 1A grubundadır. Element sodyumdur (Na).",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y3",
      "topic": "Kimyasal Türler Arası Etkileşimler",
      "year": 2023,
      "text": "NaCl bileşiğindeki sodyum ve klor arasındaki bağ türü aşağıdakilerden hangisidir?",
      "options": [
            "Apolar kovalent bağ",
            "İyonik bağ",
            "Metalik bağ",
            "Hidrojen bağı",
            "Van der Waals etkileşimi"
      ],
      "correct": 1,
      "explanation": "Sodyum bir metal, klor bir ametaldir. Metal elektron vererek katyon, ametal elektron alarak anyon olur; zıt yüklü iyonlar arasındaki elektrostatik çekim iyonik bağdır.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y4",
      "topic": "Kimyasal Hesaplamalar",
      "year": 2021,
      "text": "3 mol H₂O'nun kütlesi kaç gramdır? (H: 1 g/mol, O: 16 g/mol)",
      "options": [
            "18",
            "36",
            "54",
            "72",
            "108"
      ],
      "correct": 2,
      "explanation": "H₂O'nun mol kütlesi 2 · 1 + 16 = 18 g/mol'dür. 3 mol için kütle 3 · 18 = 54 gramdır.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y5",
      "topic": "Mol Kavramı",
      "year": 2024,
      "text": "0,5 mol maddede kaç tane tanecik bulunur? (Avogadro sayısı: 6,02 · 10²³)",
      "options": [
            "6,02 · 10²³",
            "3,01 · 10²³",
            "1,204 · 10²⁴",
            "6,02 · 10²²",
            "1,204 · 10²³"
      ],
      "correct": 1,
      "explanation": "1 mol maddede 6,02 · 10²³ tanecik bulunur. 0,5 mol için 0,5 · 6,02 · 10²³ = 3,01 · 10²³ tanecik olur.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y6",
      "topic": "Gazlar",
      "year": 2022,
      "text": "Normal şartlarda (NŞA) 2 mol gazın kapladığı hacim kaç litredir?",
      "options": [
            "11,2",
            "22,4",
            "33,6",
            "44,8",
            "67,2"
      ],
      "correct": 3,
      "explanation": "Normal şartlarda 1 mol ideal gaz 22,4 litre hacim kaplar. 2 mol için 2 · 22,4 = 44,8 litre bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y7",
      "topic": "Maddenin Halleri",
      "year": 2023,
      "text": "Süblimleşme olayı aşağıdaki hâl değişimlerinden hangisidir?",
      "options": [
            "Katıdan sıvıya",
            "Sıvıdan gaza",
            "Katıdan gaza",
            "Gazdan sıvıya",
            "Gazdan katıya"
      ],
      "correct": 2,
      "explanation": "Süblimleşme, bir maddenin sıvı hâle geçmeden doğrudan katı hâlden gaz hâline geçmesidir. Naftalin ve kuru buz (katı CO₂) bu davranışı gösterir.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y8",
      "topic": "Karışımlar",
      "year": 2021,
      "text": "Aşağıdaki karışımlardan hangisi homojendir?",
      "options": [
            "Çamurlu su",
            "Tuzlu su",
            "Sis",
            "Süt",
            "Kum-su karışımı"
      ],
      "correct": 1,
      "explanation": "Homojen karışımlarda bileşenler gözle veya optik araçlarla ayırt edilemez ve karışım her yerinde aynı özelliği gösterir. Tuzlu su (çözelti) homojendir; diğer seçenekler heterojen karışımlardır.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y9",
      "topic": "Karışımlar - Ayırma Teknikleri",
      "year": 2024,
      "text": "Suda çözünmüş hâldeki tuzu sudan ayırmak için aşağıdaki yöntemlerden hangisi kullanılır?",
      "options": [
            "Süzme",
            "Buharlaştırma",
            "Ayırma hunisi",
            "Mıknatısla ayırma",
            "Eleme"
      ],
      "correct": 1,
      "explanation": "Tuz suda çözündüğü için süzgeç kâğıdından geçer; süzme işe yaramaz. Su buharlaştırıldığında tuz kapta katı hâlde kalır. Ayırma hunisi birbirine karışmayan sıvılar, mıknatıs ise manyetik maddeler içindir.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y10",
      "topic": "Asitler, Bazlar ve Tuzlar",
      "year": 2022,
      "text": "Derişimi 0,001 M olan HCl çözeltisinin pH değeri kaçtır? (HCl kuvvetli asittir)",
      "options": [
            "1",
            "2",
            "3",
            "4",
            "11"
      ],
      "correct": 2,
      "explanation": "HCl kuvvetli asit olduğundan tamamen iyonlaşır ve [H⁺] = 0,001 = 10⁻³ M olur. pH = -log[H⁺] = -log(10⁻³) = 3 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y11",
      "topic": "Nötrleşme",
      "year": 2023,
      "text": "Bir asit ile bir bazın tepkimesi sonucunda oluşan ürünler aşağıdakilerden hangisidir?",
      "options": [
            "Tuz ve su",
            "Yalnızca tuz",
            "Asit ve gaz",
            "Baz ve su",
            "Tuz ve hidrojen gazı"
      ],
      "correct": 0,
      "explanation": "Nötrleşme tepkimesinde asidin verdiği H⁺ iyonu ile bazın verdiği OH⁻ iyonu birleşerek su oluşturur; geriye kalan iyonlar da tuzu meydana getirir. Örnek: HCl + NaOH → NaCl + H₂O.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y12",
      "topic": "Kimyasal Tepkimeler",
      "year": 2021,
      "text": "C₃H₈ + O₂ → CO₂ + H₂O tepkimesi denkleştirildiğinde O₂'nin katsayısı kaç olur?",
      "options": [
            "3",
            "4",
            "5",
            "6",
            "7"
      ],
      "correct": 2,
      "explanation": "Karbonlar için 3 CO₂, hidrojenler için 4 H₂O yazılır. Sağ tarafta toplam oksijen atomu 3·2 + 4·1 = 10'dur. Sol tarafta 10 oksijen atomu için 5 O₂ gerekir: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y13",
      "topic": "Çözeltiler",
      "year": 2024,
      "text": "250 mL çözeltide 0,5 mol NaOH çözünmüştür. Bu çözeltinin molar derişimi kaç mol/L'dir?",
      "options": [
            "0,5",
            "1",
            "1,5",
            "2",
            "2,5"
      ],
      "correct": 3,
      "explanation": "Molar derişim M = mol sayısı / hacim (L) bağıntısıyla bulunur. 250 mL = 0,25 L olduğundan M = 0,5 / 0,25 = 2 mol/L'dir.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y14",
      "topic": "Yükseltgenme-İndirgenme",
      "year": 2025,
      "text": "H₂SO₄ bileşiğinde kükürtün (S) yükseltgenme basamağı kaçtır?",
      "options": [
            "+2",
            "+4",
            "+6",
            "-2",
            "0"
      ],
      "correct": 2,
      "explanation": "Bileşikte hidrojenin yükseltgenme basamağı +1, oksijeninki -2'dir. Nötr bileşikte toplam sıfır olmalıdır: 2(+1) + S + 4(-2) = 0 → 2 + S - 8 = 0 → S = +6 bulunur.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y15",
      "topic": "Periyodik Özellikler",
      "year": 2022,
      "text": "Periyodik cetvelde aynı periyotta soldan sağa doğru gidildiğinde atom yarıçapı nasıl değişir?",
      "options": [
            "Artar",
            "Azalır",
            "Değişmez",
            "Önce azalır sonra artar",
            "Düzensiz değişir"
      ],
      "correct": 1,
      "explanation": "Aynı periyotta soldan sağa giderken katman sayısı sabit kalır ama çekirdek yükü (proton sayısı) artar. Artan çekirdek çekimi elektronları daha güçlü çektiği için atom yarıçapı küçülür.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y16",
      "topic": "Fiziksel ve Kimyasal Değişim",
      "year": 2023,
      "text": "Aşağıdaki olaylardan hangisi kimyasal bir değişimdir?",
      "options": [
            "Buzun erimesi",
            "Şekerin suda çözünmesi",
            "Demirin paslanması",
            "Camın kırılması",
            "Suyun buharlaşması"
      ],
      "correct": 2,
      "explanation": "Kimyasal değişimde maddenin iç yapısı değişir ve yeni madde oluşur. Demir paslanırken oksijenle tepkimeye girip demir oksit oluşturur. Diğer seçeneklerde maddenin kimliği korunur, yalnızca hâli veya görünümü değişir.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y17",
      "topic": "İzotop ve İzoton",
      "year": 2021,
      "text": "İzotop atomlar için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "Proton sayıları farklı, nötron sayıları aynıdır",
            "Proton sayıları aynı, nötron sayıları farklıdır",
            "Hem proton hem nötron sayıları aynıdır",
            "Kütle numaraları aynı, proton sayıları farklıdır",
            "Elektron sayıları mutlaka farklıdır"
      ],
      "correct": 1,
      "explanation": "İzotop atomlar aynı elementin farklı türleridir; proton (atom) numaraları aynı, nötron sayıları dolayısıyla kütle numaraları farklıdır. Kimyasal özellikleri aynı, fiziksel özellikleri farklıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y18",
      "topic": "Kimya Bilimi",
      "year": 2024,
      "text": "Laboratuvarda uçucu ve zararlı gaz çıkaran deneyler aşağıdakilerden hangisinde yapılmalıdır?",
      "options": [
            "Açık tezgâhta",
            "Çeker ocakta",
            "Etüvde",
            "Desikatörde",
            "Su banyosunda"
      ],
      "correct": 1,
      "explanation": "Çeker ocak, deney sırasında oluşan zararlı gaz ve buharları ortamdan uzaklaştıran havalandırma sistemidir. Etüv kurutma, desikatör nem almadan saklama, su banyosu ise kontrollü ısıtma amacıyla kullanılır.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y19",
      "topic": "Kimya Her Yerde",
      "year": 2025,
      "text": "Çamaşır suyu (NaOCl) ile tuz ruhunun (HCl) birlikte kullanılması neden tehlikelidir?",
      "options": [
            "Patlayıcı bir katı oluşur",
            "Zehirli klor gazı açığa çıkar",
            "Çözelti donar",
            "Yanıcı hidrojen gazı oluşur",
            "Hiçbir tepkime gerçekleşmez"
      ],
      "correct": 1,
      "explanation": "Çamaşır suyu ile asit karıştırıldığında tepkime sonucu zehirli klor (Cl₂) gazı açığa çıkar. Bu gaz solunum yollarını ciddi biçimde tahriş eder; bu yüzden temizlik ürünleri birbirine karıştırılmamalıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "kim_y20",
      "topic": "Kimyasal Hesaplamalar - Kütle Korunumu",
      "year": 2023,
      "text": "Kapalı bir kapta 12 g karbon, 32 g oksijenle tam verimle tepkimeye girerek karbondioksit oluşturmuştur. Oluşan karbondioksitin kütlesi kaç gramdır?",
      "options": [
            "20",
            "32",
            "40",
            "44",
            "56"
      ],
      "correct": 3,
      "explanation": "Kütlenin korunumu yasasına göre kapalı sistemde girenlerin toplam kütlesi ürünlerin toplam kütlesine eşittir: 12 + 32 = 44 gram karbondioksit oluşur.",
      "kaynak": "ozgun"
}
  ],
  Biyoloji: [
    {
      id: "biy_1",
      topic: "Hücre",
      year: 2023,
      text: "Ökaryotik bir hücrede protein sentezinin başladığı ve tamamlandığı organel aşağıdakilerden hangisidir?",
      options: ["Mitokondri", "Ribozom", "Kloroplast", "Lizozom", "Golgi aygıtı"],
      correct: 1,
      explanation: "Protein sentezi tüm canlılarda ortak olarak ribozom organelinde gerçekleştirilir."
    },
    {
      id: "biy_2",
      topic: "Canlıların Sınıflandırılması",
      year: 2022,
      text: "Aşağıdaki özelliklerden hangisi yalnızca bakteriler alemine özgüdür?",
      options: [
        "Hücre çeperine sahip olma",
        "Peptidoglikan yapılı hücre duvarına sahip olma",
        "Tek hücreli olma",
        "Fotosentez yapma",
        "Aktif hareket etme"
      ],
      correct: 1,
      explanation: "Bakterilerin hücre duvarı peptit ve polisakkaritlerden oluşan peptidoglikan yapıdadır. Bu özellik yalnızca bakterilere özgüdür (Arkelerde pseudopeptidoglikan, bitkilerde selüloz, mantarlarda kitin bulunur)."
    },
    {
      id: "biy_3",
      topic: "Kalıtım",
      year: 2023,
      text: "AaBb genotipli bağımsız genlere sahip bir bireyde kaç farklı gamet çeşidi oluşabilir?",
      options: ["2", "4", "8", "16", "32"],
      correct: 1,
      explanation: "Gamet çeşidi formülü 2^n'dir. Burada n heterozigot karakter sayısıdır. Aa ve Bb olmak üzere 2 heterozigot karakter vardır. 2^2 = 4 çeşit gamet oluşur."
    },
    {
      id: "biy_4",
      topic: "Ekoloji",
      year: 2021,
      text: "Bir ekosistemde üreticilerden tüketicilere doğru gidildikçe genellikle aşağıdakilerden hangisi azalır?",
      options: [
        "Biyolojik birikim (zehir miktarı)",
        "Aktarılan enerji miktarı",
        "Vücut büyüklüğü",
        "Tür çeşitliliği",
        "Birey sayısı"
      ],
      correct: 1,
      explanation: "Besin zincirinde üreticilerden tüketicilere doğru çıkıldıkça aktarılan enerji miktarı %10 kuralına göre azalarak gider. Biyolojik birikim ise artar."
    },
    {
      id: "biy_5",
      topic: "Hücre Bölünmeleri",
      year: 2020,
      text: "Mitoz bölünmenin anafaz evresinde gerçekleşen en önemli olay aşağıdakilerden hangisidir?",
      options: [
        "Kardeş kromatitlerin zıt kutuplara çekilmesi",
        "Kromozomların ekvatoral düzlemde dizilmesi",
        "Çekirdek zarının yeniden oluşması",
        "Kromatin ipliklerin kromozomlara dönüşmesi",
        "Sitoplazmanın bölünmesi"
      ],
      correct: 0,
      explanation: "Mitoz bölünmenin anafaz evresinde iğ ipliklerinin kısalmasıyla kardeş kromatitler ayrılarak zıt kutuplara çekilirler."
    },
    {
      id: "biy_6",
      topic: "Canlıların Temel Bileşenleri",
      year: 2022,
      text: "Aşağıdaki organik bileşiklerden hangisi hücre zarının yapısına katılmaz?",
      options: ["Fosfolipit", "Glikoprotein", "Kolesterol", "Glikojen", "Protein"],
      correct: 3,
      explanation: "Hücre zarı yapısında protein, fosfolipit, kolesterol ve glikoprotein/glikolipit bulunur. Glikojen ise hayvan hücrelerinde glikozun depo şeklidir, hücre zarının yapısında yer almaz."
    },
    {
      id: "biy_7",
      topic: "Sistemler - Sindirim",
      year: 2023,
      text: "İnsanda yağların kimyasal sindiriminin başladığı ve tamamlandığı organ aşağıdakilerden hangisidir?",
      options: ["Ağız", "Mide", "İnce bağırsak", "Kalın bağırsak", "Karaciğer"],
      correct: 2,
      explanation: "Yağların kimyasal sindirimi ince bağırsakta safra salgısının fiziksel yardımı ve pankreastan salgılanan lipaz enzimi ile ince bağırsakta başlar ve yine orada tamamlanır."
    },
    {
      id: "biy_8",
      topic: "Nükleik Asitler",
      year: 2021,
      text: "DNA ve RNA molekülleri için aşağıdakilerden hangisi ortaktır?",
      options: [
        "Kendini eşleyebilme",
        "Çift sarmal yapıya sahip olma",
        "Nükleotit adı verilen birimlerden oluşma",
        "Urasil bazını bulundurma",
        "Deoksiriboz şekeri içerme"
      ],
      correct: 2,
      explanation: "Hem DNA hem de RNA nükleotit adı verilen yapı birimlerinin dehidrasyonu ile oluşan polimerlerdir. DNA deoksiriboz ve timin; RNA riboz ve urasil içerir. DNA kendini eşler, RNA eşleyemez."
    },
    {
      id: "biy_9",
      topic: "Sistemler - Dolaşım",
      year: 2019,
      text: "Sağlıklı bir insanda kalbin sol karıncığından çıkan temiz kan, vücudu dolaştıktan sonra kalbin hangi odacığına geri döner?",
      options: ["Sağ kulakçık", "Sağ karıncık", "Sol kulakçık", "Sol karıncık", "Aort"],
      correct: 0,
      explanation: "Büyük kan dolaşımında temiz kan sol karıncıktan aort ile çıkar, tüm vücutta kirlendikten sonra üst ve alt ana toplardamarlar ile kalbin sağ kulakçığına dökülür."
    },
    {
      id: "biy_10",
      topic: "Bitki Biyolojisi",
      year: 2018,
      text: "Bitkilerde su ve minerallerin köklerden yapraklara doğru taşınmasını sağlayan yapı aşağıdakilerden hangisidir?",
      options: ["Floem (Soymuk boruları)", "Ksilem (Odun boruları)", "Kambiyum", "Stoma", "Lentisel"],
      correct: 1,
      explanation: "Ksilem (odun boruları), köklerden alınan su ve minerallerin yapraklara doğru tek yönlü ve hızlı taşınmasını sağlar. Floem ise fotosentez ürünlerini çift yönlü taşır."
    },
    {
      id: "biy_11",
      topic: "Enzimler",
      year: 2024,
      text: "Enzimlerin çalışma hızını etkileyen faktörler ile ilgili aşağıdakilerden hangisi yanlıştır?",
      options: [
        "Sıcaklık belirli bir derecenin üzerine çıkarsa enzimlerin yapısı bozulur.",
        "Her enzimin en iyi çalıştığı optimum bir pH değeri vardır.",
        "Substrat yüzeyi arttıkça reaksiyon hızı artar.",
        "Su oranı %15'in altına düştüğünde enzimler çalışamaz.",
        "Sıcaklık 0 °C'nin altına düştüğünde enzimlerin yapısı kalıcı olarak bozulur."
      ],
      correct: 4,
      explanation: "Düşük sıcaklıkta (0 °C ve altı) enzimlerin yapısı bozulmaz, yalnızca aktiviteleri durur. Sıcaklık artırıldığında tekrar çalışabilirler. Ancak yüksek sıcaklıkta yapısı denatüre olur ve geri dönüşümsüz olarak bozulur."
    },
    {
      id: "biy_12",
      topic: "Fotosentez ve Kemosentez",
      year: 2023,
      text: "Fotosentezin ışığa bağımlı reaksiyonlarında aşağıdakilerden hangisi üretilmez?",
      options: ["ATP", "NADPH", "Oksijen", "Glikoz", "Proton"],
      correct: 3,
      explanation: "Glikoz, fotosentezin ışıktan bağımsız reaksiyonlarında (Calvin döngüsü) CO2 kullanılarak üretilir. Işığa bağımlı reaksiyonlarda ise ATP, NADPH ve O2 üretilir."
    },
    {
      id: "biy_13",
      topic: "Hücresel Solunum",
      year: 2022,
      text: "Oksijenli solunumun krebs döngüsü olayları hücrenin neresinde gerçekleşir?",
      options: [
        "Sitoplazma",
        "Mitokondri matriksi",
        "Mitokondri kristası",
        "Kloroplast stroması",
        "Ribozom"
      ],
      correct: 1,
      explanation: "Oksijenli solunumda glikoliz sitoplazmada, krebs döngüsü mitokondri matriksinde, ETS (Elektron Taşıma Sistemi) ise mitokondri kristasında gerçekleşir."
    },
    {
      id: "biy_14",
      topic: "Kalıtım",
      year: 2021,
      text: "Renk körlüğü X kromozomunda çekinik olarak taşınan bir hastalıktır. Taşıyıcı bir anne ile sağlıklı bir babanın doğacak erkek çocuklarının renk körü olma olasılığı kaçtır?",
      options: ["0", "1/4", "1/2", "3/4", "1"],
      correct: 2,
      explanation: "Anne X^R X^r (Taşıyıcı), Baba X^R Y (Sağlıklı). Erkek çocuklar anneden X kromozomu alırlar. Annenin X kromozomlarından biri sağlıklı (X^R), diğeri hastalıklıdır (X^r). Dolayısıyla doğacak erkek çocukların hastalıklı geni alma, yani renk körü olma olasılığı 1/2'dir."
    },
    {
      id: "biy_15",
      topic: "Ekoloji",
      year: 2020,
      text: "Aynı türe ait bireylerin oluşturduğu topluluğa ne ad verilir?",
      options: ["Popülasyon", "Komünite", "Ekosistem", "Biyom", "Biyosfer"],
      correct: 0,
      explanation: "Belirli bir alanda yaşayan aynı türe ait bireylerin oluşturduğu topluluğa popülasyon denir. Farklı türlerin oluşturduğu topluluk komünitedir."
    },
    {
      id: "biy_16",
      topic: "Canlıların Temel Bileşenleri",
      year: 2017,
      text: "Hücrede enerji eldesinde kullanım önceliği sırası aşağıdakilerden hangisidir?",
      options: [
        "Karbonhidrat - Yağ - Protein",
        "Protein - Yağ - Karbonhidrat",
        "Yağ - Karbonhidrat - Protein",
        "Karbonhidrat - Protein - Yağ",
        "Protein - Karbonhidrat - Yağ"
      ],
      correct: 0,
      explanation: "Hücreler enerji eldesinde kullanım kolaylığına göre sırasıyla karbonhidratları, yağları ve en son proteinleri kullanırlar."
    },
    {
      id: "biy_17",
      topic: "Hücre",
      year: 2016,
      text: "Aktif taşıma ve kolaylaştırılmış difüzyon olaylarında aşağıdakilerden hangisi ortaktır?",
      options: [
        "ATP harcanması",
        "Taşıyıcı proteinlerin kullanılması",
        "Maddelerin az yoğundan çok yoğuna taşınması",
        "Yalnızca canlı hücrelerde gerçekleşmesi",
        "Hücre çeperi olan hücrelerde gerçekleşmemesi"
      ],
      correct: 1,
      explanation: "Hem aktif taşımada hem de kolaylaştırılmış difüzyonda maddelerin zardan geçişini kolaylaştıran özgül taşıyıcı proteinler (veya kanallar) görev alır. Ancak difüzyonda ATP harcanmaz."
    },
    {
      id: "biy_18",
      topic: "Sistemler - Sinir Sistemi",
      year: 2024,
      text: "İnsanda öğrenilmiş davranışların, hafızanın ve istemli kas hareketlerinin kontrol merkezi olan beyin bölümü aşağıdakilerden hangisidir?",
      options: ["Beyincik", "Uç Beyin (Beyin kabuğu)", "Omurilik soğanı", "Hipotalamus", "Orta beyin"],
      correct: 1,
      explanation: "Uç beyin (beyin kabuğu), zeka, hafıza, yazma, konuşma, istemli kas hareketleri ve duyu organlarından gelen uyarıların algılandığı merkezdir."
    },
    {
      id: "biy_19",
      topic: "Sistemler - Solunum",
      year: 2023,
      text: "Kanda karbondioksit (CO2) miktarının artması durumunda vücutta ilk olarak ne gerçekleşir?",
      options: [
        "Kan pH'ı yükselir, soluk alışverişi yavaşlar.",
        "Kan pH'ı düşer, omurilik soğanı uyarılarak soluk alışverişi hızlanır.",
        "Kan basıncı düşer, kalp atışı yavaşlar.",
        "Alyuvar sayısı azalır.",
        "Soluk alışverişi tamamen durur."
      ],
      correct: 1,
      explanation: "Kanda CO2 artması asitliği artırarak pH'ı düşürür. Bu durum omurilik soğanındaki kemoreseptörleri uyarır ve solunum hızlandırılarak CO2'nin vücuttan atılması sağlanır."
    },
    {
      id: "biy_20",
      topic: "Sistemler - Destek ve Hareket",
      year: 2022,
      text: "Çizgili kasların kasılması sırasında aşağıdakilerden hangisinin miktarında azalma görülür?",
      options: ["Kreatin fosfat", "Kreatin", "ADP", "Laktik asit", "Karbondioksit"],
      correct: 0,
      explanation: "Kas kasılması sırasında hızlı enerji eldesi için kreatin fosfat harcanır ve kreatin miktarı artar. Dolayısıyla kreatin fosfat miktarı azalır."
    },
    {
      id: "biy_21",
      topic: "Canlıların Sınıflandırılması",
      year: 2021,
      text: "Aşağıdakilerden hangisi sürüngenler sınıfına ait bir özellik değildir?",
      options: [
        "Vücutlarının keratin pullarla kaplı olması",
        "Akciğer solunumu yapmaları",
        "İç döllenme, dış gelişme göstermeleri",
        "Vücut sıcaklıklarının değişken (soğukkanlı) olması",
        "Kalplerinin 4 odacıklı olup temiz ve kirli kanın hiç karışmaması"
      ],
      correct: 4,
      explanation: "Sürüngenlerde kalp genellikle 3 odacıklıdır (karıncıkta yarım perde bulunur). Sadece timsahlarda 4 odacıklıdır ancak onlarda da panizza kanalında kan karışır. Temiz ve kirli kanın hiç karışmadığı tam 4 odacıklı kalpler kuşlar ve memelilerde bulunur."
    },
    {
      id: "biy_22",
      topic: "Hücre Bölünmeleri",
      year: 2020,
      text: "Mayoz bölünmede çeşitliliği sağlayan 'Krossing-over' olayı mayozun hangi evresinde gerçekleşir?",
      options: ["Profaz I", "Metafaz I", "Anafaz I", "Profaz II", "Anafaz II"],
      correct: 0,
      explanation: "Homolog kromozomların kardeş olmayan kromatitleri arasındaki gen alışverişi (krossing-over) Profaz I evresindeki tetrat yapısında gerçekleşir."
    },
    {
      id: "biy_23",
      topic: "Ekoloji",
      year: 2019,
      text: "Atmosferdeki azot gazının (N2) toprağa bağlanmasında (fiksasyonunda) aşağıdakilerden hangisi görev almaz?",
      options: [
        "Yıldırım ve şimşek olayları",
        "Rhizobium bakterileri",
        "Siyanobakteriler",
        "Nitrifikasyon bakterileri",
        "Baklagillerin kök yumruları"
      ],
      correct: 3,
      explanation: "Nitrifikasyon bakterileri amonyağı nitrite ve nitrata dönüştürür (topraktaki azotu dönüştürür). Atmosferdeki serbest azotu doğrudan bağlayamazlar. Azot fiksasyonunu şimşekler ve azot bağlayıcı bakteriler (Rhizobium, siyanobakteriler) yapar."
    },
    {
      id: "biy_24",
      topic: "Canlıların Temel Bileşenleri",
      year: 2018,
      text: "İnsanda eksikliğinde skorbüt (diş eti kanaması) hastalığına yol açan vitamin aşağıdakilerden hangisidir?",
      options: ["A vitamini", "B vitamini", "C vitamini", "D vitamini", "K vitamini"],
      correct: 2,
      explanation: "C vitamin eksikliği kolajen sentezinin bozulmasına ve dolayısıyla skorbüt (diş eti kanaması, halsizlik) hastalığına neden olur."
    },
    {
      id: "biy_25",
      topic: "Hücre",
      year: 2017,
      text: "Hücre içi sindirimden sorumlu olan ve içinde hidrolitik (sindirici) enzimler barındıran organel aşağıdakilerden hangisidir?",
      options: ["Lizozom", "Ribozom", "Peroksizom", "Golgi aygıtı", "Sentrozom"],
      correct: 0,
      explanation: "Lizozom, hücre içi sindirimi gerçekleştiren hidrolitik enzim dolu organeldir. Enzimler ribozomda üretilir, endoplazmik retikulum ve golgide işlenerek lizozoma aktarılır."
    },
    {
      id: "biy_26",
      topic: "Bitki Biyolojisi",
      year: 2016,
      text: "Bitkilerde stomaların açılıp kapanmasında aşağıdakilerden hangisi etkili değildir?",
      options: [
        "Bekçi hücrelerdeki turgor basıncının değişmesi",
        "Işık varlığı",
        "Karbondioksit yoğunluğu",
        "Potasyum iyonlarının bekçi hücrelerine pompalanması",
        "Ksilemdeki suyun akış hızı"
      ],
      correct: 4,
      explanation: "Stomaların açılıp kapanması bekçi hücrelerindeki turgor basıncı değişimine, potasyum geçişlerine, ışık ve CO2 miktarına bağlıdır. Ksilemdeki suyun akış hızı stomaların anlık açılıp kapanmasını doğrudan yöneten aktif bir mekanizma değildir."
    },
    {
      id: "biy_27",
      topic: "Sistemler - Boşaltım",
      year: 2024,
      text: "Sağlıklı bir insanın nefron kanallarından idrar oluşturulurken aşağıdakilerden hangisi aktif taşıma veya difüzyon ile geri emilmez?",
      options: ["Glikoz", "Amino asit", "Üre", "Su", "Kreatinin"],
      correct: 4,
      explanation: "Kreatinin nefron kanallarından neredeyse hiç geri emilmez, tamamına yakını idrarla dışarı atılır. Glikoz ve amino asitler %100 oranında geri emilir, su ise osmozla geri emilir."
    },
    {
      id: "biy_28",
      topic: "Sistemler - Endokrin",
      year: 2023,
      text: "Kandaki kalsiyum seviyesi düştüğünde, kalsiyumun kemiklerden kana geçmesini sağlayarak dengeyi kuran hormon hangisidir?",
      options: ["Kalsitonin", "Parathormon", "Tiroksin", "Aldosteron", "Kortizol"],
      correct: 1,
      explanation: "Parathormon (paratiroit bezinden salgılanır), kalsiyumu kemikten kana geçirerek kan kalsiyumunu artırır. Kalsitonin ise tam tersine kandan kemiğe geçişi sağlar."
    },
    {
      id: "biy_29",
      topic: "Nükleik Asitler",
      year: 2022,
      text: "DNA replikasyonu (eşlenmesi) sırasında hidrojen bağlarını kopararak sarmal yapıyı açan enzim aşağıdakilerden hangisidir?",
      options: ["DNA Polimeraz", "DNA Ligaz", "Helikaz", "RNA Polimeraz", "Restriksiyon Enzimi"],
      correct: 2,
      explanation: "Helikaz enzimi, replikasyon orijinlerinde iki DNA zinciri arasındaki hidrojen bağlarını kopararak sarmal yapıyı fermuar gibi açar."
    },
    {
      id: "biy_30",
      topic: "Canlıların Temel Bileşenleri",
      year: 2021,
      text: "Aşağıdakilerden hangisi dehidrasyon sentezine (yapım reaksiyonuna) bir örnek değildir?",
      options: [
        "Glikoz + Fruktoz -> Sakkaroz + H2O",
        "n(Glikoz) -> Nişasta + (n-1)H2O",
        "Glikoz + O2 -> CO2 + H2O + ATP",
        "n(Amino asit) -> Protein + (n-1)H2O",
        "Gliserol + 3 Yağ Asidi -> Trigliserit + 3H2O"
      ],
      correct: 2,
      explanation: "Glikozun oksijenle yıkımı (solunum) bir katabolizma (yıkım) olayıdır ve su üretilmesine rağmen bir dehidrasyon sentezi değildir, hidroliz de değildir, bir oksitlenme ve yıkımdır. Diğerleri küçük monomerlerin su açığa çıkararak birleştiği dehidrasyon tepkimeleridir."
    }
  ,
    {
      "id": "biy_y1",
      "topic": "Hücre",
      "year": 2021,
      "text": "Hücrede protein sentezinin gerçekleştiği organel aşağıdakilerden hangisidir?",
      "options": [
            "Mitokondri",
            "Ribozom",
            "Lizozom",
            "Golgi aygıtı",
            "Koful"
      ],
      "correct": 1,
      "explanation": "Ribozom, mRNA'daki bilgiyi kullanarak amino asitleri birleştirip protein sentezleyen organeldir. Mitokondri enerji üretir, lizozom sindirim yapar, golgi salgı paketler, koful depolama görevi görür.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y2",
      "topic": "Canlıların Temel Bileşenleri",
      "year": 2022,
      "text": "Aşağıdaki organik bileşiklerden hangisi hücrede enerji verici olarak kullanılmaz?",
      "options": [
            "Karbonhidrat",
            "Yağ",
            "Protein",
            "Vitamin",
            "Nişasta"
      ],
      "correct": 3,
      "explanation": "Vitaminler düzenleyici görev yapar; yapıya katılmaz ve enerji vermez. Karbonhidratlar birinci, yağlar ikinci, proteinler ise son sırada enerji kaynağı olarak kullanılabilir.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y3",
      "topic": "Enzimler",
      "year": 2023,
      "text": "Enzimlerin çalışma hızını etkileyen faktörler için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "Sıcaklık arttıkça hız sürekli artar",
            "Optimum sıcaklığın üzerinde enzim yapısı bozulur ve hız düşer",
            "pH değişimi enzimi etkilemez",
            "Substrat miktarı hızı hiç etkilemez",
            "Enzimler tepkimede tükenir"
      ],
      "correct": 1,
      "explanation": "Enzimler protein yapılıdır. Optimum sıcaklığa kadar hız artar; bu değerin üzerinde protein yapısı bozulur (denatürasyon) ve enzim işlevini yitirir. Enzimler tepkimeden değişmeden çıkar, tükenmez.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y4",
      "topic": "Hücre Bölünmeleri",
      "year": 2021,
      "text": "2n = 46 kromozomlu bir insan hücresi mitoz bölünme geçirdiğinde oluşan hücrelerin kromozom sayısı kaçtır?",
      "options": [
            "23",
            "46",
            "92",
            "69",
            "12"
      ],
      "correct": 1,
      "explanation": "Mitoz bölünmede kromozom sayısı korunur; oluşan iki yavru hücre de ana hücreyle aynı sayıda, yani 46 kromozom taşır. Kromozom sayısının yarıya inmesi mayoz bölünmede görülür.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y5",
      "topic": "Hücre Bölünmeleri - Mayoz",
      "year": 2024,
      "text": "Mayoz bölünmede kalıtsal çeşitliliği artıran temel olay aşağıdakilerden hangisidir?",
      "options": [
            "DNA'nın kendini eşlemesi",
            "Krossing-over (parça değişimi)",
            "Sitoplazma bölünmesi",
            "Kromozomların kutuplara çekilmesi",
            "Çekirdek zarının erimesi"
      ],
      "correct": 1,
      "explanation": "Mayoz I'in profaz evresinde homolog kromozomların kardeş olmayan kromatitleri arasında parça değişimi (krossing-over) olur. Bu, gen kombinasyonlarını değiştirerek kalıtsal çeşitliliği artırır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y6",
      "topic": "Kalıtım",
      "year": 2022,
      "text": "Aa genotipli iki bireyin çaprazlanması sonucu oluşan döllerin yüzde kaçı çekinik fenotipte olur?",
      "options": [
            "%0",
            "%25",
            "%50",
            "%75",
            "%100"
      ],
      "correct": 1,
      "explanation": "Aa × Aa çaprazlamasında oluşan genotipler 1 AA : 2 Aa : 1 aa oranındadır. Çekinik fenotip yalnızca aa genotipinde görülür; bu da 4 bireyden 1'i, yani %25'tir.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y7",
      "topic": "Kalıtım - Kan Grupları",
      "year": 2023,
      "text": "Kan grubu 0 (sıfır) olan bir bireyin genotipi aşağıdakilerden hangisidir?",
      "options": [
            "AO",
            "BO",
            "AB",
            "OO",
            "AA"
      ],
      "correct": 3,
      "explanation": "0 kan grubunu belirleyen O aleli çekiniktir. Bu nedenle 0 kan grubu yalnızca iki çekinik alelin bir araya gelmesiyle, yani OO genotipiyle ortaya çıkar.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y8",
      "topic": "Nükleik Asitler",
      "year": 2021,
      "text": "Bir DNA molekülünde adenin (A) nükleotidi oranı %30 ise guanin (G) nükleotidi oranı yüzde kaçtır?",
      "options": [
            "%10",
            "%20",
            "%30",
            "%40",
            "%70"
      ],
      "correct": 1,
      "explanation": "Chargaff kuralına göre DNA'da A = T ve G = C'dir. A = %30 ise T = %30 olur; ikisi toplam %60 eder. Kalan %40 G ve C arasında eşit paylaşılır: G = C = %20'dir.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y9",
      "topic": "Fotosentez ve Kemosentez",
      "year": 2022,
      "text": "Fotosentez tepkimesinde açığa çıkan oksijen gazının kaynağı aşağıdakilerden hangisidir?",
      "options": [
            "Karbondioksit",
            "Su",
            "Glikoz",
            "Klorofil",
            "ATP"
      ],
      "correct": 1,
      "explanation": "Fotosentezin ışığa bağlı evresinde su molekülleri fotoliz ile parçalanır (H₂O → 2H⁺ + ½O₂ + 2e⁻). Açığa çıkan oksijen suyun parçalanmasından gelir, karbondioksitten değil.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y10",
      "topic": "Hücresel Solunum",
      "year": 2023,
      "text": "Oksijenli solunumda en fazla ATP'nin üretildiği evre ve bölge aşağıdakilerden hangisidir?",
      "options": [
            "Glikoliz - sitoplazma",
            "Krebs döngüsü - mitokondri matriksi",
            "Elektron taşıma sistemi - mitokondri iç zarı",
            "Fotoliz - kloroplast",
            "Fermantasyon - sitoplazma"
      ],
      "correct": 2,
      "explanation": "Glikoliz ve Krebs döngüsünde az sayıda ATP üretilir; asıl ATP kazancı mitokondrinin iç zarındaki elektron taşıma sisteminde oksidatif fosforilasyonla sağlanır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y11",
      "topic": "Sistemler - Sindirim",
      "year": 2024,
      "text": "Proteinlerin kimyasal sindiriminin başladığı organ aşağıdakilerden hangisidir?",
      "options": [
            "Ağız",
            "Mide",
            "İnce bağırsak",
            "Kalın bağırsak",
            "Yemek borusu"
      ],
      "correct": 1,
      "explanation": "Midede salgılanan pepsin enzimi, asidik ortamda proteinleri daha küçük parçalara ayırır. Ağızda yalnızca karbonhidrat sindirimi (amilaz ile) başlar; kalın bağırsakta kimyasal sindirim olmaz.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y12",
      "topic": "Sistemler - Dolaşım",
      "year": 2021,
      "text": "İnsan kalbinde temiz (oksijence zengin) kanın bulunduğu bölümler aşağıdakilerden hangisidir?",
      "options": [
            "Sağ kulakçık ve sağ karıncık",
            "Sol kulakçık ve sol karıncık",
            "Sağ kulakçık ve sol karıncık",
            "Sol kulakçık ve sağ karıncık",
            "Yalnızca sağ karıncık"
      ],
      "correct": 1,
      "explanation": "Akciğerlerden gelen oksijence zengin kan sol kulakçığa dolar, oradan sol karıncığa geçer ve aort ile vücuda pompalanır. Kalbin sağ tarafı ise vücuttan gelen kirli kanı taşır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y13",
      "topic": "Sistemler - Solunum",
      "year": 2022,
      "text": "Akciğerlerde gaz alışverişinin gerçekleştiği yapı aşağıdakilerden hangisidir?",
      "options": [
            "Bronş",
            "Bronşçuk",
            "Alveol",
            "Soluk borusu",
            "Gırtlak"
      ],
      "correct": 2,
      "explanation": "Alveoller, tek sıra epitelden oluşan ve kılcal damarlarla sarılı keseciklerdir. Oksijen ile karbondioksit difüzyonla burada yer değiştirir. Diğer yapılar havayı ileten yollardır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y14",
      "topic": "Sistemler - Boşaltım",
      "year": 2023,
      "text": "Böbreğin yapı ve görev birimi aşağıdakilerden hangisidir?",
      "options": [
            "Alveol",
            "Nefron",
            "Villus",
            "Nöron",
            "Glomerulus"
      ],
      "correct": 1,
      "explanation": "Nefron; glomerulus, Bowman kapsülü ve boşaltım tüplerinden oluşan, süzülme-geri emilim-salgılama basamaklarını gerçekleştiren böbreğin temel birimidir. Glomerulus nefronun bir parçasıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y15",
      "topic": "Sistemler - Sinir Sistemi",
      "year": 2024,
      "text": "Vücut sıcaklığı, kan basıncı ve solunum gibi yaşamsal olayların düzenlendiği merkez aşağıdakilerden hangisidir?",
      "options": [
            "Beyincik",
            "Omurilik soğanı",
            "Ön beyin",
            "Talamus",
            "Hipofiz"
      ],
      "correct": 1,
      "explanation": "Omurilik soğanı (medulla oblongata) solunum, dolaşım, kalp atışı ve refleks merkezlerini barındırır; bu yüzden yaşamsal merkez olarak adlandırılır. Beyincik denge ve koordinasyondan sorumludur.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y16",
      "topic": "Sistemler - Endokrin",
      "year": 2021,
      "text": "Kandaki glikoz düzeyini düşüren hormon ve onu salgılayan bez aşağıdakilerden hangisidir?",
      "options": [
            "Glukagon - pankreas",
            "İnsülin - pankreas",
            "Adrenalin - böbrek üstü bezi",
            "Tiroksin - tiroit",
            "Büyüme hormonu - hipofiz"
      ],
      "correct": 1,
      "explanation": "Pankreasın beta hücrelerinden salgılanan insülin, glikozun hücrelere alınmasını ve glikojen olarak depolanmasını sağlayarak kan şekerini düşürür. Glukagon ise tam tersi etki gösterir.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y17",
      "topic": "Sistemler - Destek ve Hareket",
      "year": 2022,
      "text": "İskelet kasları için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "İstemsiz çalışır ve çabuk yorulmaz",
            "İstemli çalışır ve çabuk yorulur",
            "Kalpte bulunur",
            "Tek çekirdeklidir ve iğ biçimlidir",
            "Yalnızca uyku sırasında kasılır"
      ],
      "correct": 1,
      "explanation": "İskelet kasları çok çekirdekli, çizgili ve istemli çalışan kaslardır; hızlı kasılır ama çabuk yorulurlar. Düz kaslar istemsizdir ve geç yorulur; kalp kası ise çizgili olmasına rağmen istemsiz çalışır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y18",
      "topic": "Ekoloji",
      "year": 2023,
      "text": "Bir besin zincirinde enerjinin bir beslenme basamağından diğerine aktarılma oranı yaklaşık olarak nedir?",
      "options": [
            "%1",
            "%10",
            "%50",
            "%90",
            "%100"
      ],
      "correct": 1,
      "explanation": "Bir beslenme basamağındaki enerjinin yaklaşık %10'u bir üst basamağa aktarılır; geri kalanı solunum, hareket ve ısı olarak kaybedilir. Bu nedenle besin zincirleri genellikle 4-5 basamakla sınırlıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y19",
      "topic": "Canlıların Sınıflandırılması",
      "year": 2025,
      "text": "Sınıflandırmada en küçük ve en fazla ortak özelliğe sahip bireyleri içeren birim aşağıdakilerden hangisidir?",
      "options": [
            "Âlem",
            "Şube",
            "Sınıf",
            "Cins",
            "Tür"
      ],
      "correct": 4,
      "explanation": "Sınıflandırma birimleri âlemden türe doğru daralır. Tür, birbirine en çok benzeyen ve çiftleştiklerinde verimli döller verebilen bireyler topluluğudur; birey sayısı en az, ortak özellik en fazladır.",
      "kaynak": "ozgun"
},
    {
      "id": "biy_y20",
      "topic": "Bitki Biyolojisi",
      "year": 2024,
      "text": "Bitkilerde su ve mineraller kökten yapraklara hangi iletim dokusuyla taşınır?",
      "options": [
            "Ksilem (odun borusu)",
            "Floem (soymuk borusu)",
            "Kambiyum",
            "Epidermis",
            "Parankima"
      ],
      "correct": 0,
      "explanation": "Ksilem, su ve mineral tuzları kökten yapraklara doğru tek yönlü olarak taşır; taşıma terleme çekimiyle gerçekleşir ve enerji harcanmaz. Floem ise fotosentez ürünlerini çift yönlü taşır.",
      "kaynak": "ozgun"
}
  ],
  Edebiyat: [
    {
      id: "edeb_1",
      topic: "Şiir Bilgisi",
      year: 2023,
      text: "Aşağıdaki dizelerin hangisinde 'tam kafiye' kullanılmıştır?",
      options: [
        "Yollar ki gider uzaklara / Bakma arkadaki tuzaklara",
        "Geçti istemem gelmeni / Yokluğunda buldum seni",
        "Dost dost diye nicesine sarıldım / Benim sadık yarim kara topraktır",
        "Karac'oğlan der ki kondum göçemedim / Helal süt emmişi seçemedim",
        "Ağacın dalında öten bülbüller / Bahçemde açan gonca güller"
      ],
      correct: 1,
      explanation: "'gel-m-en-i' ve 'sen-i'. Kökler 'gelmek' ve 'sen'. 'gel-meni' ve 'sen-i' kelimelerinde 'en' sesleri iki ses benzerliğinden dolayı tam kafiyedir."
    },
    {
      id: "edeb_2",
      topic: "Halk Edebiyatı",
      year: 2022,
      text: "16. yüzyılda yaşamış, nefesleriyle tanınan, Alevi-Bektaşi halk edebiyatının en önemli temsilcisi olan şair aşağıdakilerden hangisidir?",
      options: ["Köroğlu", "Karacaoğlan", "Dadaloğlu", "Pir Sultan Abdal", "Aşık Veysel"],
      correct: 3,
      explanation: "16. yüzyılda Sivas ve çevresinde yaşamış, nefesleriyle tanınan ve coşkulu bir lirizme sahip şair Pir Sultan Abdal'dır."
    },
    {
      id: "edeb_3",
      topic: "Divan Edebiyatı",
      year: 2023,
      text: "Divan edebiyatında şairlerin takma adlarına ne ad verilir?",
      options: ["Tapşırma", "Mahlas", "Mazmun", "Beyit", "Gazel"],
      correct: 1,
      explanation: "Divan edebiyatında şairlerin kullandığı takma ada mahlas denir. Halk edebiyatında ise buna tapşırma denir."
    },
    {
      id: "edeb_4",
      topic: "Tanzimat Edebiyatı",
      year: 2021,
      text: "Türk edebiyatındaki ilk realist roman ve yazarı aşağıdakilerden hangisinde doğru verilmiştir?",
      options: [
        "İntibah - Namık Kemal",
        "Araba Sevdası - Recaizade Mahmut Ekrem",
        "Mai ve Siyah - Halit Ziya Uşaklıgil",
        "Eylül - Mehmet Rauf",
        "Taaşşuk-ı Talat ve Fitnat - Şemsettin Sami"
      ],
      correct: 1,
      explanation: "Edebiyatımızdaki ilk realist roman Recaizade Mahmut Ekrem'in yazdığı 'Araba Sevdası'dır. İntibah ilk edebi roman, Taaşşuk-ı Talat ve Fitnat ise ilk yerli romandır."
    },
    {
      id: "edeb_5",
      topic: "Cumhuriyet Dönemi",
      year: 2020,
      text: "'Çalıkuşu', 'Yaprak Dökümü' ve 'Dudaktan Kalbe' romanlarının yazarı olan sanatçı aşağıdakilerden hangisidir?",
      options: [
        "Halide Edip Adıvar",
        "Yakup Kadri Karaosmanoğlu",
        "Reşat Nuri Güntekin",
        "Peyami Safa",
        "Tarık Buğra"
      ],
      correct: 2,
      explanation: "Belirtilen ünlü romanlar Cumhuriyet dönemi Türk edebiyatının kurucu yazarlarından Reşat Nuri Güntekin'e aittir."
    },
    {
      id: "edeb_6",
      topic: "Servetifünun Edebiyatı",
      year: 2022,
      text: "Servetifünun şiirinin en önemli temsilcisi olan, 'Rübab-ı Şikeste' ve 'Sis' şiirlerinin yazarı kimdir?",
      options: ["Tevfik Fikret", "Cenap Şahabettin", "Halit Ziya Uşaklıgil", "Mehmet Rauf", "Ahmet Haşim"],
      correct: 0,
      explanation: "Servetifünun edebiyatının lider şairi Tevfik Fikret'tir. 'Rübab-ı Şikeste' (Kırık Saz) ve 'Sis' onun en ünlü şiir eserleridir."
    },
    {
      id: "edeb_7",
      topic: "Edebi Sanatlar",
      year: 2023,
      text: "'Karlar etrafı beyaz bir karanlığa gömdü' dizesinde hangi edebi sanat yapılmıştır?",
      options: ["Teşbih (Benzetme)", "Teşhis (Kişileştirme)", "Tezat (Karşıtlık)", "Kinaye", "Mecazımürsel"],
      correct: 2,
      explanation: "'Beyaz' ve 'karanlık' sözcükleri bir arada kullanılarak tezat (karşıtlık) sanatı yapılmıştır."
    },
    {
      id: "edeb_8",
      topic: "Divan Edebiyatı",
      year: 2021,
      text: "Aşağıdakilerden hangisi Divan edebiyatındaki düzyazı (nesir) yazarlarına verilen addır?",
      options: ["Münşi", "Nakkaş", "Hattat", "Şair", "Mücellit"],
      correct: 0,
      explanation: "Divan edebiyatında süslü düzyazı yazan kişilere münşi denir. Nesir yazıların toplandığı eserlere ise münşeat denir."
    },
    {
      id: "edeb_9",
      topic: "Fecriati Edebiyatı",
      year: 2019,
      text: "'Sanat şahsi ve muhteremdir' ilkesiyle yola çıkan ve topluluğun en sadık şairi olarak 'Piyale' ve 'Göl Saatleri'ni yazan sanatçı kimdir?",
      options: ["Ahmet Haşim", "Cenap Şahabettin", "Yahya Kemal Beyatlı", "Mehmet Akif Ersoy", "Faruk Nafiz Çamlıbel"],
      correct: 0,
      explanation: "Fecriati topluluğunun en önemli ismi olan, saf şiir anlayışının öncüsü Ahmet Haşim'dir. 'Piyale' ve 'Göl Saatleri' onun şiir kitaplarıdır."
    },
    {
      id: "edeb_10",
      topic: "Milli Edebiyat",
      year: 2020,
      text: "Ömer Seyfettin ve Ali Canip Yöntem ile birlikte 1911'de Selanik'te 'Genç Kalemler' dergisini çıkararak Yeni Lisan hareketini başlatan yazar kimdir?",
      options: ["Ziya Gökalp", "Mehmet Emin Yurdakul", "Halide Edip Adıvar", "Yakup Kadri Karaosmanoğlu", "Reşat Nuri Güntekin"],
      correct: 0,
      explanation: "Yeni Lisan makalesini ve hareketini başlatan öncüler Ömer Seyfettin, Ali Canip Yöntem ve Ziya Gökalp'tir."
    },
    {
      id: "edeb_11",
      topic: "Şiir Bilgisi",
      year: 2024,
      text: "Genellikle kahramanlık, savaş, yiğitlik gibi konuları işleyen şiir türüne ne ad verilir?",
      options: ["Lirik şiir", "Epik şiir", "Didaktik şiir", "Satirik şiir", "Pastoral şiir"],
      correct: 1,
      explanation: "Destansı, kahramanlık konularını işleyen şiir türüne epik şiir denir. Duygusal konular lirik, öğretici didaktik, eleştirel satirik, doğa konuları ise pastoral şiirdir."
    },
    {
      id: "edeb_12",
      topic: "Edebi Akımlar",
      year: 2023,
      text: "Sanatçının eserlerinde kendi duygularını, iç dünyasını ve hayallerini özgürce ifade etmesini savunan, klasisizme tepki olarak doğan edebi akım hangisidir?",
      options: ["Romantizm", "Realizm", "Naturalizm", "Parnasizm", "Sembolizm"],
      correct: 0,
      explanation: "Akıl yerine duygu ve coşkuyu ön plana çıkaran, klasisizme tepki olarak doğan akım Romantizm (Coşumculuk) akımıdır."
    },
    {
      id: "edeb_13",
      topic: "Destanlar",
      year: 2022,
      text: "İslamiyet öncesi Türk destanlarından hangisi Uygur Türklerine aittir?",
      options: ["Ergenekon Destanı", "Oğuz Kağan Destanı", "Göç Destanı", "Alp Er Tunga Destanı", "Manas Destanı"],
      correct: 2,
      explanation: "Göç ve Türeyiş destanları Uygur Türklerine aittir. Ergenekon Göktürklere, Oğuz Kağan Hunlara, Alp Er Tunga İskitlere aittir. Manas ise Kırgızlara ait İslamiyet sonrası destandır."
    },
    {
      id: "edeb_14",
      topic: "Geçiş Dönemi Eserleri",
      year: 2021,
      text: "11. yüzyılda Yusuf Has Hacib tarafından yazılan, ilk mesnevi ve ilk siyasetname özelliğini taşıyan eser aşağıdakilerden hangisidir?",
      options: [
        "Divanü Lügati't-Türk",
        "Kutadgu Bilig",
        "Atabetü'l-Hakayık",
        "Divan-ı Hikmet",
        "Dede Korkut Hikayeleri"
      ],
      correct: 1,
      explanation: "Yusuf Has Hacib'in yazdığı 'Kutadgu Bilig' (Mutluluk Veren Bilgi) edebiyatımızdaki ilk mesnevi ve ilk siyasetnamedir."
    },
    {
      id: "edeb_15",
      topic: "Divan Edebiyatı",
      year: 2020,
      text: "Hiciv (eleştiri) türündeki 'Siham-ı Kaza' (Kaza Okları) adlı eseriyle tanınan ve bu yolda canını veren 17. yüzyıl şairi kimdir?",
      options: ["Fuzuli", "Baki", "Nef'i", "Nedim", "Şeyhi"],
      correct: 2,
      explanation: "Divan edebiyatının en büyük övgü ve yergisi şairi Nef'i'dir. Ünlü hiciv eseri Siham-ı Kaza yüzünden boğularak öldürülmüştür."
    },
    {
      id: "edeb_16",
      topic: "Tanzimat Edebiyatı",
      year: 2018,
      text: "Sahnelenen ilk tiyatro eseri olan 'Vatan yahut Silistre'nin yazarı kimdir?",
      options: ["Şinasi", "Namık Kemal", "Ahmet Mithat Efendi", "Ziya Paşa", "Abdülhak Hamit Tarhan"],
      correct: 1,
      explanation: "Sahnelenen ilk tiyatro eseri Namık Kemal'in yazdığı 'Vatan yahut Silistre'dir. Yazılan ilk tiyatro ise Şinasi'nin 'Şair Evlenmesi'dir."
    },
    {
      id: "edeb_17",
      topic: "Servetifünun Edebiyatı",
      year: 2017,
      text: "Türk edebiyatında ilk psikolojik roman sayılan 'Eylül' adlı eserin yazarı kimdir?",
      options: ["Halit Ziya Uşaklıgil", "Mehmet Rauf", "Hüseyin Cahit Yalçın", "Cenap Şahabettin", "Süleyman Nazif"],
      correct: 1,
      explanation: "Eylül romanı Mehmet Rauf tarafından yazılmış olup ilk psikolojik romanımızdır."
    },
    {
      id: "edeb_18",
      topic: "Milli Edebiyat",
      year: 2016,
      text: "'Sodom ve Gomore', 'Yaban' ve 'Kiralık Konak' romanlarının yazarı kimdir?",
      options: [
        "Yakup Kadri Karaosmanoğlu",
        "Halide Edip Adıvar",
        "Reşat Nuri Güntekin",
        "Refik Halit Karay",
        "Aka Gündüz"
      ],
      correct: 0,
      explanation: "Türk toplumunun Tanzimat'tan Cumhuriyet'e geçirdiği değişimleri nehir roman tarzında yazan Yakup Kadri Karaosmanoğlu'dur."
    },
    {
      id: "edeb_19",
      topic: "Cumhuriyet Dönemi",
      year: 2024,
      text: "Orhan Veli Kanık, Melih Cevdet Anday ve Oktay Rifat Horozcu'nun başlattığı, şiirde her türlü kurala ve kalıba karşı çıkan akım hangisidir?",
      options: ["Yedi Meşaleciler", "İkinci Yeni", "Garip Akımı (Birinci Yeni)", "Maviciler", "Hisarcılar"],
      correct: 2,
      explanation: "Şiiri yalınlaştıran, vezin ve kafiyeyi reddeden bu akıma Garip Akımı (Birinci Yeni) denir."
    },
    {
      id: "edeb_20",
      topic: "Şiir Bilgisi",
      year: 2023,
      text: "Uyak şeması 'a b a b' şeklinde olan kafiye örgüsüne ne ad verilir?",
      options: ["Düz uyak", "Çapraz uyak", "Sarmal uyak", "Mani tipi uyak", "Örüşük uyak"],
      correct: 1,
      explanation: "a b a b şeklinde dizilen uyak düzenine çapraz uyak denir. a a a b veya a a b b düz, a b b a ise sarmal uyaktır."
    },
    {
      id: "edeb_21",
      topic: "Divan Edebiyatı",
      year: 2022,
      text: "Arap ve Fars edebiyatından alınmayıp Türklerin Divan edebiyatına kazandırdığı nazım şekilleri hangileridir?",
      options: ["Gazel - Kaside", "Mesnevi - Rubai", "Tuyuğ - Şarkı", "Murabba - Terkibibent", "Müstezat - Kıt'a"],
      correct: 2,
      explanation: "Tuyuğ ve Şarkı, Türklerin Divan şiirine kazandırdığı milli nazım şekilleridir."
    },
    {
      id: "edeb_22",
      topic: "Tanzimat Edebiyatı",
      year: 2021,
      text: "Edebiyatımızdaki ilk özel gazete olan 'Tercüman-ı Ahval'i çıkaran yazarlar kimlerdir?",
      options: [
        "Namık Kemal - Ziya Paşa",
        "Şinasi - Agah Efendi",
        "Ahmet Mithat Efendi - Muallim Naci",
        "Şemsettin Sami - Ali Suavi",
        "Recaizade Mahmut Ekrem - Samipaşazade Sezai"
      ],
      correct: 1,
      explanation: "1860 yılında Şinasi ve Agah Efendi tarafından çıkarılan Tercüman-ı Ahval, ilk özel Türk gazetesidir."
    },
    {
      id: "edeb_23",
      topic: "Halk Edebiyatı",
      year: 2020,
      text: "Âşık edebiyatında genellikle 8'li hece ölçüsüyle söylenen, içinde 'bre', 'hey', 'behe' gibi ünlemler barındıran yiğitçe şiirlere ne ad verilir?",
      options: ["Koşma", "Semai", "Varsağı", "Destan", "Mani"],
      correct: 2,
      explanation: "Varsaklar yöresine ait olan, yiğitçe bir edayla söylenen ve 'bre, hey' gibi ünlemler içeren nazım şekli Varsağı'dır."
    },
    {
      id: "edeb_24",
      topic: "Cumhuriyet Dönemi",
      year: 2019,
      text: "'Devlet Ana' ve 'Yorgun Savaşçı' romanlarının yazarı kimdir?",
      options: ["Kemal Tahir", "Orhan Kemal", "Yaşar Kemal", "Tarık Buğra", "Samim Kocagöz"],
      correct: 0,
      explanation: "Osmanlı Devleti'nin kuruluş dönemini ve Kurtuluş Savaşı'nı sosyolojik açıdan ele alan bu eserlerin yazarı Kemal Tahir'dir."
    },
    {
      id: "edeb_25",
      topic: "Edebi Akımlar",
      year: 2018,
      text: "İnsanı soyaçekim ve sosyal çevre çerçevesinde inceleyen, adeta bir bilim insanı gibi davranıp hayatı bir laboratuvar olarak gören edebi akım hangisidir?",
      options: ["Realizm", "Natüralizm", "Romantizm", "Parnasizm", "Klasisizm"],
      correct: 1,
      explanation: "Realizmin ileri aşaması olan ve soyaçekim (determinizm) fikrini edebiyata uyarlayan akım Natüralizm (Doğalcılık) akımıdır."
    },
    {
      id: "edeb_26",
      topic: "Divan Edebiyatı",
      year: 2017,
      text: "Tasavvuf felsefesini benimsemiş şairlerin yazdığı, insan ruhunun Allah'tan gelip tekrar Allah'a döneceğini anlatan şiirlere ne ad verilir?",
      options: ["İlahi", "Nutuk", "Devriye", "Şathiye", "Nefes"],
      correct: 2,
      explanation: "Yaradılışın ve ruhun evrendeki devrini (Allah'tan gelip yine O'na dönmeyi) konu alan şiirlere Devriye denir."
    },
    {
      id: "edeb_27",
      topic: "Halk Edebiyatı",
      year: 2016,
      text: "Halk edebiyatında şairlerin şiirlerini topladıkları deri kaplı defterlere ne ad verilir?",
      options: ["Divan", "Cönk", "Münşeat", "Tezkire", "Mesnevi"],
      correct: 1,
      explanation: "Âşıkların şiirlerini kaydettikleri, aşağıdan yukarıya doğru açılan defterlere cönk adı verilir."
    },
    {
      id: "edeb_28",
      topic: "Tanzimat Edebiyatı",
      year: 2024,
      text: "Tanzimat I. Dönem sanatçılarının tiyatro eserlerinde güttükleri temel amaç nedir?",
      options: [
        "Sadece saray çevresini eğlendirmek.",
        "Tiyatroyu halkı eğitmede faydalı bir okul (eğlenceli bir mektep) olarak görmek.",
        "Geleneksel Türk tiyatrosunu tamamen yok etmek.",
        "Eserleri sadece okunmak için yazmak.",
        "Batı tiyatrosunu birebir taklit etmek."
      ],
      correct: 1,
      explanation: "Tanzimat 1. Dönem şairleri (özellikle Namık Kemal) sanat toplum içindir ilkesini benimsemiş ve tiyatroyu halkı eğitmede bir araç olarak görmüşlerdir."
    },
    {
      id: "edeb_29",
      topic: "Şiir Bilgisi",
      year: 2023,
      text: "Dizelerin hece sayılarının eşitliğine dayanan milli Türk ölçüsü hangisidir?",
      options: ["Aruz ölçüsü", "Hece ölçüsü", "Serbest ölçü", "Latince vezin", "Yunan vezni"],
      correct: 1,
      explanation: "Türk şiirinin milli ölçüsü hece ölçüsüdür (parmak hesabı da denir)."
    },
    {
      id: "edeb_30",
      topic: "Cumhuriyet Dönemi",
      year: 2022,
      text: "'İnce Memed' roman serisiyle tüm dünyada tanınan Çukurova insanının yaşamını epik bir dille anlatan yazar kimdir?",
      options: ["Yaşar Kemal", "Orhan Kemal", "Kemal Tahir", "Fakir Baykurt", "Necati Cumalı"],
      correct: 0,
      explanation: "Çukurova, Toroslar ve Çeltik tarlalarındaki ağalık düzenine isyan eden İnce Memed destanının yazarı Yaşar Kemal'dir."
    }
  ,
    {
      "id": "edb_y1",
      "topic": "Şiir Bilgisi",
      "year": 2021,
      "text": "Bir dizenin sonundaki söz ya da ekin, sonraki dizede yinelenmesiyle oluşan ses benzerliğine ne ad verilir?",
      "options": [
            "Redif",
            "Kafiye",
            "Aliterasyon",
            "Ölçü",
            "Nazım birimi"
      ],
      "correct": 0,
      "explanation": "Kafiye, dize sonlarındaki ses benzerliği olan farklı sözcüklerdeki ortak seslerdir. Redif ise kafiyeden sonra gelen, görevi ve anlamı aynı olan yinelenmiş ek ya da sözcüklerdir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y2",
      "topic": "Edebi Sanatlar",
      "year": 2022,
      "text": "\"Ay, bulutların arasından bize gülümsüyordu.\" dizesinde hangi söz sanatı vardır?",
      "options": [
            "Teşbih (benzetme)",
            "Teşhis (kişileştirme)",
            "Tezat",
            "Mecazımürsel",
            "Tevriye"
      ],
      "correct": 1,
      "explanation": "İnsana özgü bir davranış olan \"gülümsemek\", insan dışı bir varlık olan aya yüklenmiştir. İnsan dışı varlıklara insan özelliği verilmesine teşhis (kişileştirme) denir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y3",
      "topic": "Halk Edebiyatı",
      "year": 2023,
      "text": "Âşık edebiyatında, genellikle 11'li hece ölçüsüyle yazılan ve aşk, doğa, ayrılık gibi konuları işleyen nazım biçimi aşağıdakilerden hangisidir?",
      "options": [
            "Koşma",
            "Mani",
            "Semai",
            "İlahi",
            "Destan"
      ],
      "correct": 0,
      "explanation": "Koşma, âşık edebiyatının en yaygın nazım biçimidir; dörtlüklerle ve 11'li hece ölçüsüyle söylenir. Semai 8'li, mani ise 7'li hece ölçüsüyle yazılır.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y4",
      "topic": "Halk Edebiyatı - Tekke",
      "year": 2021,
      "text": "Tekke (tasavvuf) edebiyatında Allah sevgisini işleyen, ezgiyle söylenen nazım türü aşağıdakilerden hangisidir?",
      "options": [
            "Koçaklama",
            "İlahi",
            "Güzelleme",
            "Taşlama",
            "Ağıt"
      ],
      "correct": 1,
      "explanation": "İlahi, tasavvuf edebiyatında Allah sevgisini ve dinî coşkuyu dile getiren, ezgiyle okunan şiirlerdir. Koçaklama, güzelleme, taşlama ve ağıt ise âşık edebiyatının konularına göre adlandırılan türleridir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y5",
      "topic": "Divan Edebiyatı",
      "year": 2022,
      "text": "Divan edebiyatında beyit birimiyle yazılan, ilk beyti kendi içinde uyaklı olan ve genellikle aşk, şarap, güzellik konularını işleyen nazım biçimi aşağıdakilerden hangisidir?",
      "options": [
            "Kaside",
            "Gazel",
            "Mesnevi",
            "Rubai",
            "Şarkı"
      ],
      "correct": 1,
      "explanation": "Gazel, ilk beyti kendi içinde uyaklı (musarra), diğer beyitlerin ikinci dizeleri ilk beyitle uyaklı, 5-15 beyitlik nazım biçimidir. Kaside övgü, mesnevi ise uzun anlatı amacıyla kullanılır.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y6",
      "topic": "Divan Edebiyatı - Nazım Biçimleri",
      "year": 2024,
      "text": "Divan edebiyatında her beyti kendi içinde uyaklı olan ve uzun hikâyelerin anlatımında kullanılan nazım biçimi aşağıdakilerden hangisidir?",
      "options": [
            "Gazel",
            "Kaside",
            "Mesnevi",
            "Murabba",
            "Terkibibent"
      ],
      "correct": 2,
      "explanation": "Mesnevide her beyit kendi içinde uyaklıdır (aa, bb, cc...). Bu serbestlik uzun anlatılara olanak tanıdığı için mesnevi, hikâye ve destan anlatımında tercih edilmiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y7",
      "topic": "Geçiş Dönemi Eserleri",
      "year": 2021,
      "text": "İslamiyet'in kabulünden sonra yazılan ilk Türkçe eser olarak kabul edilen ve \"mutluluk veren bilgi\" anlamına gelen yapıt aşağıdakilerden hangisidir?",
      "options": [
            "Divanü Lugati't-Türk",
            "Kutadgu Bilig",
            "Atabetü'l-Hakayık",
            "Divan-ı Hikmet",
            "Muhakemetü'l-Lugateyn"
      ],
      "correct": 1,
      "explanation": "Yusuf Has Hacib'in yazdığı Kutadgu Bilig, \"mutluluk veren bilgi\" anlamına gelir ve geçiş döneminin ilk eseridir. Mesnevi biçiminde yazılmış bir siyasetnamedir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y8",
      "topic": "Destanlar",
      "year": 2022,
      "text": "Aşağıdakilerden hangisi Türklerin doğal (İslamiyet öncesi) destanlarından biri değildir?",
      "options": [
            "Oğuz Kağan Destanı",
            "Ergenekon Destanı",
            "Manas Destanı",
            "Şu Destanı",
            "Üç Şehitler Destanı"
      ],
      "correct": 4,
      "explanation": "Üç Şehitler Destanı, Fazıl Hüsnü Dağlarca tarafından yazılmış yapay (suni) bir destandır. Diğerleri halk arasında kendiliğinden oluşup sözlü olarak aktarılan doğal destanlardır.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y9",
      "topic": "Tanzimat Edebiyatı",
      "year": 2023,
      "text": "Türk edebiyatındaki ilk yerli roman ve yazarı aşağıdakilerden hangisidir?",
      "options": [
            "Taaşşuk-ı Talat ve Fitnat - Şemsettin Sami",
            "İntibah - Namık Kemal",
            "Araba Sevdası - Recaizade Mahmut Ekrem",
            "Sergüzeşt - Samipaşazade Sezai",
            "Felatun Bey ile Rakım Efendi - Ahmet Mithat Efendi"
      ],
      "correct": 0,
      "explanation": "Şemsettin Sami'nin 1872'de yazdığı Taaşşuk-ı Talat ve Fitnat ilk yerli romanımızdır. İntibah ise ilk edebî roman olarak kabul edilir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y10",
      "topic": "Tanzimat Edebiyatı - II. Dönem",
      "year": 2021,
      "text": "\"Sanat sanat içindir\" görüşünü benimseyen Tanzimat II. dönem sanatçısı aşağıdakilerden hangisidir?",
      "options": [
            "Namık Kemal",
            "Ziya Paşa",
            "Şinasi",
            "Recaizade Mahmut Ekrem",
            "Ahmet Mithat Efendi"
      ],
      "correct": 3,
      "explanation": "Tanzimat I. dönem sanatçıları (Şinasi, Namık Kemal, Ziya Paşa) \"toplum için sanat\" anlayışını savunmuştur. II. dönemde Recaizade Mahmut Ekrem ve Abdülhak Hamit Tarhan \"sanat için sanat\" görüşünü benimsemiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y11",
      "topic": "Servetifünun Edebiyatı",
      "year": 2022,
      "text": "Servetifünun edebiyatının en önemli romancısı ve \"Aşk-ı Memnu\" adlı eserin yazarı kimdir?",
      "options": [
            "Tevfik Fikret",
            "Halit Ziya Uşaklıgil",
            "Cenap Şahabettin",
            "Mehmet Rauf",
            "Hüseyin Cahit Yalçın"
      ],
      "correct": 1,
      "explanation": "Halit Ziya Uşaklıgil, Batılı anlamda ilk başarılı Türk romanlarını yazan sanatçıdır. Aşk-ı Memnu ve Mai ve Siyah en tanınmış eserleridir. Mehmet Rauf'un Eylül'ü ise ilk psikolojik romandır.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y12",
      "topic": "Fecriati Edebiyatı",
      "year": 2023,
      "text": "Fecriati topluluğunun benimsediği ilke aşağıdakilerden hangisidir?",
      "options": [
            "Sanat, şahsi ve muhteremdir",
            "Sanat toplum içindir",
            "Dilde sadeleşme esastır",
            "Halk edebiyatına dönülmelidir",
            "Öz şiir anlayışı benimsenmelidir"
      ],
      "correct": 0,
      "explanation": "Fecriati topluluğu \"Sanat şahsi ve muhteremdir\" ilkesini benimsemiş, sanatı bireysel bir uğraş olarak görmüştür. Bu yönüyle Servetifünun'un devamı niteliğindedir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y13",
      "topic": "Milli Edebiyat",
      "year": 2021,
      "text": "Milli Edebiyat akımının dil anlayışı için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "Arapça ve Farsça tamlamalar özendirilmiştir",
            "Konuşma dili yazı dili hâline getirilmeye çalışılmıştır",
            "Fransızca sözcükler tercih edilmiştir",
            "Aruz ölçüsü zorunlu tutulmuştur",
            "Sadece divan şiiri örnek alınmıştır"
      ],
      "correct": 1,
      "explanation": "Milli Edebiyat sanatçıları \"Yeni Lisan\" hareketiyle İstanbul konuşma dilini yazı dili yapmayı, yabancı tamlamalardan arınmayı ve hece ölçüsünü kullanmayı savunmuştur.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y14",
      "topic": "Milli Edebiyat - Sanatçılar",
      "year": 2024,
      "text": "\"Çalıkuşu\" adlı romanın yazarı aşağıdakilerden hangisidir?",
      "options": [
            "Halide Edip Adıvar",
            "Reşat Nuri Güntekin",
            "Yakup Kadri Karaosmanoğlu",
            "Refik Halit Karay",
            "Ömer Seyfettin"
      ],
      "correct": 1,
      "explanation": "Çalıkuşu, Reşat Nuri Güntekin'in Anadolu'ya öğretmen olarak giden Feride'nin öyküsünü anlattığı ünlü romanıdır. Halide Edip'in Sinekli Bakkal'ı, Yakup Kadri'nin Yaban'ı öne çıkan eserleridir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y15",
      "topic": "Cumhuriyet Dönemi",
      "year": 2022,
      "text": "Garip (Birinci Yeni) akımı için aşağıdakilerden hangisi söylenemez?",
      "options": [
            "Ölçü ve uyak reddedilmiştir",
            "Şiirde söz sanatlarına yer verilmemiştir",
            "Günlük konuşma dili kullanılmıştır",
            "Sıradan insanın yaşamı konu edilmiştir",
            "Kapalı ve imgeli bir dil benimsenmiştir"
      ],
      "correct": 4,
      "explanation": "Kapalı, imgeli ve anlamca örtük dil İkinci Yeni'nin özelliğidir. Garip akımı (Orhan Veli, Melih Cevdet, Oktay Rifat) yalın, açık ve günlük dile dayanan bir şiiri savunmuştur.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y16",
      "topic": "Cumhuriyet Dönemi - Roman",
      "year": 2023,
      "text": "Toplumcu gerçekçi çizgide köy gerçeğini işleyen \"İnce Memed\" romanının yazarı kimdir?",
      "options": [
            "Orhan Kemal",
            "Yaşar Kemal",
            "Kemal Tahir",
            "Fakir Baykurt",
            "Sabahattin Ali"
      ],
      "correct": 1,
      "explanation": "Yaşar Kemal'in İnce Memed romanı, Çukurova'da ağalık düzenine başkaldıran Memed'in öyküsünü anlatır ve toplumcu gerçekçi romanın en tanınmış örneklerindendir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y17",
      "topic": "Edebi Akımlar",
      "year": 2021,
      "text": "Edebiyatta gözleme ve nesnelliğe dayanan, dış dünyayı olduğu gibi yansıtmayı amaçlayan akım aşağıdakilerden hangisidir?",
      "options": [
            "Romantizm",
            "Realizm",
            "Sürrealizm",
            "Sembolizm",
            "Klasisizm"
      ],
      "correct": 1,
      "explanation": "Realizm (gerçekçilik), duygu ve hayale değil gözleme dayanır; olay ve kişiler yaşamda olabileceği gibi yansıtılır. Romantizm duyguyu, sembolizm ise imgeyi öne çıkarır.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y18",
      "topic": "Edebi Türler",
      "year": 2024,
      "text": "Yazarın herhangi bir konudaki görüşlerini kesin kurallara varmadan, kanıtlama kaygısı gütmeden anlattığı düzyazı türü aşağıdakilerden hangisidir?",
      "options": [
            "Makale",
            "Deneme",
            "Fıkra",
            "Eleştiri",
            "Anı"
      ],
      "correct": 1,
      "explanation": "Denemede yazar konuyu kendi bakış açısıyla, samimi bir üslupla ele alır; okuyucuyu ikna etme veya kanıtlama zorunluluğu duymaz. Makale ise savunulan düşüncenin kanıtlanmasını gerektirir.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y19",
      "topic": "Şiir Bilgisi - Ölçü",
      "year": 2025,
      "text": "Hece ölçüsünde \"durak\" için aşağıdakilerden hangisi doğrudur?",
      "options": [
            "Dizenin sonundaki ses benzerliğidir",
            "Dize içindeki okuma molasıdır ve sözcüğü ortadan bölmez",
            "Ünlü sayısını belirler",
            "Yalnızca aruz ölçüsünde bulunur",
            "Şiirin nazım birimidir"
      ],
      "correct": 1,
      "explanation": "Durak, hece ölçüsüyle yazılan şiirlerde dizenin okunurken bölündüğü yerdir. Durak mutlaka sözcüğün bitiminde olur; bir sözcüğü ortasından bölmez.",
      "kaynak": "ozgun"
},
    {
      "id": "edb_y20",
      "topic": "Cumhuriyet Dönemi - Şiir",
      "year": 2025,
      "text": "\"Otuz Beş Yaş\" şiiriyle tanınan ve şiirlerinde ölüm, yaşama sevinci temalarını işleyen şair aşağıdakilerden hangisidir?",
      "options": [
            "Cahit Sıtkı Tarancı",
            "Necip Fazıl Kısakürek",
            "Ahmet Muhip Dıranas",
            "Ziya Osman Saba",
            "Faruk Nafiz Çamlıbel"
      ],
      "correct": 0,
      "explanation": "Cahit Sıtkı Tarancı'nın \"Otuz Beş Yaş\" şiiri, 1946'da CHP şiir yarışmasında birincilik kazanmıştır. Şair yaşama sevinci ve ölüm korkusu temalarını yalın bir dille işlemiştir.",
      "kaynak": "ozgun"
}
  ],
  Tarih: [
    {
      id: "tar_1",
      topic: "İslamiyet Öncesi Türk Tarihi",
      year: 2023,
      text: "Orhun Kitabeleri (Göktürk Yazıtları) aşağıdaki Türk devletlerinden hangisinin dönemine aittir?",
      options: ["Hun Devleti", "I. Göktürk Devleti", "II. Göktürk (Kutluk) Devleti", "Uygur Devleti", "Karahanlılar"],
      correct: 2,
      explanation: "Orhun Kitabeleri 8. yüzyılda İkinci Göktürk (Kutluk) Devleti döneminde Bilge Kağan, Kültigin ve Vezir Tonyukuk adına dikilmiştir."
    },
    {
      id: "tar_2",
      topic: "Osmanlı Tarihi - Kuruluş",
      year: 2022,
      text: "Osmanlı Devleti'nin Rumeli'ye geçişinde köprü vazifesi gören ve askeri üs olarak kullanılan ilk kale aşağıdakilerden hangisidir?",
      options: ["Çimpe Kalesi", "Gelibolu Kalesi", "Edirne Kalesi", "Bursa Kalesi", "İznik Kalesi"],
      correct: 0,
      explanation: "Orhan Bey döneminde Bizans'a yapılan askeri yardım karşılığında alınan Çimpe Kalesi, Osmanlı'nın Rumeli'deki ilk toprak parçası ve üssüdür."
    },
    {
      id: "tar_3",
      topic: "Kurtuluş Savaşı",
      year: 2023,
      text: "Mustafa Kemal Paşa'nın 'Siz orada yalnız düşmanı değil, milletin makûs talihini de yendiniz' telgrafını gönderdiği zafer aşağıdakilerden hangisidir?",
      options: ["I. İnönü Muharebesi", "II. İnönü Muharebesi", "Sakarya Meydan Muharebesi", "Büyük Taarruz", "Kütahya-Eskişehir Muharebeleri"],
      correct: 1,
      explanation: "Mustafa Kemal, II. İnönü Zaferi'nden sonra Batı Cephesi Komutanı İsmet Paşa'ya gönderdiği kutlama telgrafında bu tarihi sözü söylemiştir."
    },
    {
      id: "tar_4",
      topic: "Atatürk İlkeleri",
      year: 2021,
      text: "Devletin ekonomik hayata müdahale etmesini, kalkınmayı hızlandırmak amacıyla yatırımları bizzat yapmasını öngören Atatürk ilkesi hangisidir?",
      options: ["Cumhuriyetçilik", "Halkçılık", "Laiklik", "Devletçilik", "Milliyetçilik"],
      correct: 3,
      explanation: "Ekonomik kalkınmanın devlet eliyle yürütülmesini savunan ilke Devletçilik ilkesidir."
    },
    {
      id: "tar_5",
      topic: "İlk Türk İslam Devletleri",
      year: 2020,
      text: "Karahanlılar Devleti'nin tarihteki en önemli özelliklerinden biri aşağıdakilerden hangisidir?",
      options: [
        "Anadolu'yu fetheden ilk Türk devleti olmaları",
        "Orta Asya'da İslamiyet'i kabul eden ilk Türk devleti olmaları",
        "Bizans ile ilk savaşı yapmaları",
        "Mısır'da kurulan ilk Türk devleti olmaları",
        "İlk kez kağıt parayı kullanmaları"
      ],
      correct: 1,
      explanation: "Karahanlılar, Orta Asya'da kurulup İslamiyet'i resmi din olarak kabul eden ilk Türk devletidir."
    },
    {
      id: "tar_6",
      topic: "Tarih ve Zaman",
      year: 2024,
      text: "Tarih öncesi dönemlerin sınıflandırılmasında aşağıdakilerden hangisi esas alınmıştır?",
      options: [
        "Yazının kullanılması",
        "İnsanların kullandığı araç-gereçlerin niteliği (taş, toprak, maden)",
        "Devletlerin yönetim biçimleri",
        "Coğrafi keşifler",
        "Dini inançların değişmesi"
      ],
      correct: 1,
      explanation: "Tarih öncesi çağlar (Taş Çağı, Maden Çağı) insanların araç gereç yapımında kullandıkları malzemelere göre ayrılmıştır. Tarih çağları ise yazıyla başlar."
    },
    {
      id: "tar_7",
      topic: "Osmanlı Devleti - Yükselme",
      year: 2023,
      text: "Fatih Sultan Mehmet'in İstanbul'u fethettikten sonra yayınladığı ahitname ile Ortodokslara ibadet özgürlüğü tanıması hangi yönetim anlayışını gösterir?",
      options: ["Mutlakiyetçilik", "Hoşgörü ve İstimalet Politikası", "Asimilasyon", "Teokrasi", "Feodalizm"],
      correct: 1,
      explanation: "Osmanlı Devleti'nin fethettiği bölgelerdeki halka din, ibadet ve dil özgürlüğü tanıyarak onları kendine bağlama politikasına istimalet (hoşgörü) politikası denir."
    },
    {
      id: "tar_8",
      topic: "I. Dünya Savaşı",
      year: 2022,
      text: "Osmanlı Devleti'nin I. Dünya Savaşı'nda taarruz (saldırı) amacıyla açtığı cepheler hangileridir?",
      options: [
        "Çanakkale - Irak",
        "Kafkas - Kanal",
        "Suriye - Filistin",
        "Hicaz - Yemen",
        "Galiçya - Makedonya"
      ],
      correct: 1,
      explanation: "Osmanlı Devleti'nin I. Dünya Savaşı'ndaki iki taarruz cephesi Kafkas Cephesi ve Kanal (Süveyş) Cephesi'dir."
    },
    {
      id: "tar_9",
      topic: "Milli Mücadele Dönemi",
      year: 2021,
      text: "Aşağıdakilerden hangisiyle milli sınırların içinde vatanın bir bütün olduğu ve bölünemeyeceği ilk kez resmen açıklanmıştır?",
      options: [
        "Amasya Genelgesi",
        "Erzurum Kongresi",
        "Sivas Kongresi",
        "Amasya Görüşmeleri",
        "Misakımilli Kararları"
      ],
      correct: 1,
      explanation: "Vatan sınırları ve bütünlüğü ilk kez Erzurum Kongresi kararlarında 'Milli sınırlar içinde vatan bir bütündür, bölünemez' maddesiyle vurgulanmıştır."
    },
    {
      id: "tar_10",
      topic: "Atatürk Dönemi İnkılapları",
      year: 2020,
      text: "3 Mart 1924'te kabul edilen kanunla eğitim-öğretim birleştirilmiş ve tüm okullar Milli Eğitim Bakanlığına bağlanmıştır. Bahsedilen kanun hangisidir?",
      options: [
        "Teşkilat-ı Esasiye Kanunu",
        "Tevhid-i Tedrisat Kanunu",
        "Kabotaj Kanunu",
        "Takrir-i Sükun Kanunu",
        "Medeni Kanun"
      ],
      correct: 1,
      explanation: "Eğitim ve öğretimi birleştiren, medreseleri kapatıp modern eğitime geçişi sağlayan kanun Tevhid-i Tedrisat Kanunu'dur."
    },
    {
      id: "tar_11",
      topic: "Tarih Bilimi",
      year: 2019,
      text: "Tarih araştırmalarında olayların meydana geldiği döneme ait her türlü yazılı, sözlü veya arkeolojik bulguya ne ad verilir?",
      options: ["Birinci elden kaynak", "İkinci elden kaynak", "Sözlü kaynak", "Dönemsel kaynak", "Dolaylı bulgu"],
      correct: 0,
      explanation: "Olayın geçtiği dönemde oluşturulmuş doğrudan belgeler (para, kitabe, anlaşma metni) birinci elden kaynak olarak adlandırılır."
    },
    {
      id: "tar_12",
      topic: "İlk Çağ Uygarlıkları",
      year: 2018,
      text: "Tarihte ilk yazılı kanunları (Hammurabi Kanunları) hazırlayan Mezopotamya uygarlığı hangisidir?",
      options: ["Sümerler", "Babiller", "Asurlar", "Akadlar", "Elamlar"],
      correct: 1,
      explanation: "Sert kanunlarıyla (kısasa kısas) tanınan Kral Hammurabi, Babil uygarlığının hükümdarıdır."
    },
    {
      id: "tar_13",
      topic: "Osmanlı Tarihi - Duraklama",
      year: 2017,
      text: "Osmanlı Devleti'nde padişah çocuklarının tahta geçiş sistemini (ekber ve erşet - en yaşlı ve olgun olanın geçmesi) düzenleyen padişah kimdir?",
      options: ["I. Ahmet", "IV. Murat", "Genç Osman", "III. Selim", "II. Mahmut"],
      correct: 0,
      explanation: "Taht kavgalarını önlemek amacıyla 'Ekber ve Erşet' sistemini getiren 17. yüzyıl padişahı I. Ahmet'tir."
    },
    {
      id: "tar_14",
      topic: "Kurtuluş Savaşı",
      year: 2016,
      text: "Doğu Cephesi'nde Ermenilere karşı kazandığı zaferlerle tanınan, 'Yetimler Babası' lakaplı 15. Kolordu Komutanı kimdir?",
      options: ["Kazım Karabekir", "İsmet İnönü", "Ali Fuat Cebesoy", "Fevzi Çakmak", "Rauf Orbay"],
      correct: 0,
      explanation: "Doğu Cephesi komutanı ve Gümrü Anlaşması'nı imzalayan komutan Kazım Karabekir Paşa'dır."
    },
    {
      id: "tar_15",
      topic: "Atatürk İlkeleri",
      year: 2024,
      text: "Aşar vergisinin kaldırılması, kadınlara seçme ve seçilme hakkı verilmesi ve kanun önünde eşitlik ilkeleri öncelikle hangi Atatürk ilkesiyle ilişkilidir?",
      options: ["Halkçılık", "Milliyetçilik", "Laiklik", "İnkılapçılık", "Cumhuriyetçilik"],
      correct: 0,
      explanation: "Toplumsal eşitliği, halkın yararını ve sınıf ayrıcalıklarının kaldırılmasını gözeten ilke Halkçılık'tır."
    },
    {
      id: "tar_16",
      topic: "İslam Tarihi",
      year: 2023,
      text: "Hz. Muhammed'in vefatından sonra başlayan Dört Halife Dönemi'nde halifelerin seçimle iş başına gelmesi nedeniyle bu döneme ne ad verilmiştir?",
      options: ["Cumhuriyet Dönemi", "Demokrasi Çağı", "Hulefa-yi Raşidin", "Asr-ı Saadet", "Fetret Devri"],
      correct: 0,
      explanation: "Dört Halife Dönemi'nde halifeler şura (seçim) yöntemiyle belirlendiği için tarihçiler bu dönemi İslamiyet'in 'Cumhuriyet Dönemi' olarak da adlandırırlar."
    },
    {
      id: "tar_17",
      topic: "Anadolu Selçuklu Tarihi",
      year: 2022,
      text: "Anadolu'nun kesin olarak Türk yurdu olmasını sağlayan ve 'Yurttutan Savaşı' olarak bilinen gelişme hangisidir?",
      options: [
        "Pasinler Savaşı",
        "Malazgirt Savaşı",
        "Miryokefalon Savaşı",
        "Yassıçemen Savaşı",
        "Kösedağ Savaşı"
      ],
      correct: 2,
      explanation: "1176 Miryokefalon Savaşı ile Bizans'ın Anadolu'yu Türklerden geri alma ümitleri tamamen sona ermiş ve Anadolu kesin olarak Türk yurdu olmuştur."
    },
    {
      id: "tar_18",
      topic: "Osmanlı Devleti - Kültür ve Uygarlık",
      year: 2021,
      text: "Osmanlı Devleti'nde devşirme kökenli devlet adamlarının yetiştirildiği saray okulu aşağıdakilerden hangisidir?",
      options: ["Enderun", "Rüştiye", "Medrese", "Sahn-ı Seman", "Darülfünun"],
      correct: 0,
      explanation: "Saray bünyesinde yer alan ve nitelikli devlet yöneticisi (sadrazam, vezir vb.) yetiştiren okul Enderun Mektebi'dir."
    },
    {
      id: "tar_19",
      topic: "Osmanlı Devleti - Dağılma",
      year: 2020,
      text: "Osmanlı Devleti'nde anayasal düzene ve parlamenter yönetime geçişin ilk adımı olan gelişme hangisidir?",
      options: [
        "Sened-i İttifak",
        "Tanzimat Fermanı",
        "Islahat Fermanı",
        "I. Meşrutiyet'in İlanı (Kanun-ı Esasi)",
        "II. Meşrutiyet'in İlanı"
      ],
      correct: 3,
      explanation: "1876 yılında Kanun-ı Esasi'nin (ilk Türk anayasası) kabul edilmesi ve Meclis-i Mebusan'ın açılmasıyla I. Meşrutiyet dönemi başlamış ve parlamenter sisteme geçilmiştir."
    },
    {
      id: "tar_20",
      topic: "Kurtuluş Savaşına Hazırlık",
      year: 2019,
      text: "Milli Mücadele'nin gerekçesi, amacı ve yöntemi ilk kez hangi belgede açıklanmıştır?",
      options: [
        "Samsun Raporu",
        "Havza Genelgesi",
        "Amasya Genelgesi",
        "Erzurum Kongresi",
        "Sivas Kongresi"
      ],
      correct: 2,
      explanation: "Amasya Genelgesi'nin 'Vatarın bütünlüğü milletin bağımsızlığı tehlikededir' maddesi gerekçe, 'Milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır' maddesi ise amaç ve yöntemdir."
    },
    {
      id: "tar_21",
      topic: "Kurtuluş Savaşı - Cepheler",
      year: 2018,
      text: "Güney Cephesi'nde Fransız ve Ermenilere karşı yürütülen mücadelelerin genel karakteri aşağıdakilerden hangisidir?",
      options: [
        "Düzenli Ordu savunması",
        "Kuvayımilliye (halk) direnişi",
        "Osmanlı ordusunun taarruzu",
        "Rus ordusunun yardımı",
        "İngiliz mandası altında direniş"
      ],
      correct: 1,
      explanation: "Güney Cephesi'nde (Maraş, Antep, Urfa) düzenli ordu bulunmamaktadır. Direniş tamamen sivil halkın oluşturduğu Kuvayımilliye birlikleriyle yapılmıştır."
    },
    {
      id: "tar_22",
      topic: "Lozan Barış Antlaşması",
      year: 2017,
      text: "Lozan Antlaşmasında çözüme kavuşturulamayıp İngiltere ile ikili görüşmelere bırakılan ve daha sonra Musul Sorunu olarak karşımıza çıkan sınır hangisidir?",
      options: ["Batı Sınırı", "Suriye Sınırı", "Irak Sınırı", "Sovyet Sınırı", "İran Sınırı"],
      correct: 2,
      explanation: "Musul sorunu nedeniyle Türkiye-Irak sınırı Lozan'da çözülememiş, 9 ay içinde ikili görüşmelerle çözülmek üzere ertelenmiştir."
    },
    {
      id: "tar_23",
      topic: "Atatürk Dönemi Dış Politika",
      year: 2016,
      text: "Türkiye'nin Boğazlar üzerindeki tam egemenliğini sağlayan ve komisyonu kaldıran antlaşma hangisidir?",
      options: [
        "Lozan Antlaşması",
        "Mudanya Ateşkesi",
        "Montrö Boğazlar Sözleşmesi",
        "Sadabat Paktı",
        "Balkan Antantı"
      ],
      correct: 2,
      explanation: "1936 yılında imzalanan Montrö Boğazlar Sözleşmesi ile Boğazlar komisyonu kaldırılarak Boğazların yönetimi ve savunması tamamen Türkiye'ye verilmiştir."
    },
    {
      id: "tar_24",
      topic: "Atatürk İlkeleri",
      year: 2024,
      text: "Milli egemenliği ve halk iradesini esas alan, padişahlık ve saltanatın kaldırılmasını doğrudan destekleyen Atatürk ilkesi hangisidir?",
      options: ["Cumhuriyetçilik", "Milliyetçilik", "Halkçılık", "Laiklik", "Devletçilik"],
      correct: 0,
      explanation: "Ulus egemenliğini, demokrasiyi, seçimleri ve cumhuriyeti temel alan ilke Cumhuriyetçilik'tir."
    },
    {
      id: "tar_25",
      topic: "Osmanlı Devleti - Yükselme",
      year: 2023,
      text: "Baharat Yolu'nun kontrolünün Osmanlı Devleti'ne geçmesini sağlayan Mısır Seferleri hangi padişah döneminde yapılmıştır?",
      options: ["II. Mehmet", "I. Selim (Yavuz)", "I. Süleyman (Kanuni)", "II. Bayezid", "I. Murat"],
      correct: 1,
      explanation: "Mercidabık (1516) ve Ridaniye (1517) savaşlarıyla Memlük Devleti'ne son verip Mısır'ı fetheden padişah Yavuz Sultan Selim'dir."
    },
    {
      id: "tar_26",
      topic: "İlk Çağ Uygarlıkları",
      year: 2022,
      text: "Tarihte ilk kez parayı (madeni parayı) basarak takas usulüne son veren Anadolu uygarlığı hangisidir?",
      options: ["Frigler", "Urartular", "Lidyalılar", "Hititler", "İyonlar"],
      correct: 2,
      explanation: "Batı Anadolu'da (Sardes merkezli) kurulan ve parayı icat eden uygarlık Lidyalılar'dır."
    },
    {
      id: "tar_27",
      topic: "Tarih ve Zaman",
      year: 2021,
      text: "Türklerin kullandığı takvimlerden hangisi güneş yılı esasına dayanır?",
      options: ["Hicri Takvim", "Miladi Takvim", "Rumi Takvim", "12 Hayvanlı Türk Takvimi", "Celali Takvim"],
      correct: 1,
      explanation: "Hicri takvim ay yılı esasına dayanırken; Miladi, Rumi, Celali ve 12 Hayvanlı takvimler güneş yılı esasına dayanır. (Soru 'ay yılı' sorsaydı Hicri olurdu. Miladi doğru cevaptır)."
    },
    {
      id: "tar_28",
      topic: "Osmanlı Tarihi - Lale Devri",
      year: 2020,
      text: "Osmanlı Devleti'nde Batı kültürünün ve yeniliklerinin etkisinin başladığı, savaşsız geçen ilk ıslahat dönemi hangisidir?",
      options: ["Lale Devri", "Tanzimat Dönemi", "Nizam-ı Cedit Dönemi", "II. Mahmut Dönemi", "Meşrutiyet Dönemi"],
      correct: 0,
      explanation: "1718 Pasarofça Antlaşması ile başlayıp 1730 Patrona Halil İsyanı ile biten, Avrupa'daki elçiliklerin açıldığı lüks ve ıslahat dönemi Lale Devri'dir."
    },
    {
      id: "tar_29",
      topic: "Milli Mücadele Hazırlık",
      year: 2019,
      text: "Milli Kongreler döneminde alınan kararların uygulanması amacıyla kurulan ve adeta geçici bir hükümet gibi çalışan yürütme organı hangisidir?",
      options: [
        "Heyet-i Temsiliye (Temsil Heyeti)",
        "Felah-ı Vatan Grubu",
        "İrade-i Milliye",
        "Müdafaa-i Hukuk Cemiyeti",
        "Meclis-i Mebusan"
      ],
      correct: 0,
      explanation: "Erzurum Kongresi'nde kurulan, Sivas Kongresi'nde tüm yurdu temsil eder hale gelen ve TBMM açılana kadar hükümet gibi çalışan organ Temsil Heyeti'dir."
    },
    {
      id: "tar_30",
      topic: "Atatürk Dönemi Dış Politika",
      year: 2018,
      text: "Mustafa Kemal'in 'Şahsi meselemdir' dediği ve ölümünden sonra 1939 yılında anavatana katılan şehir hangisidir?",
      options: ["Musul", "Hatay", "Kerkük", "Batum", "Selanik"],
      correct: 1,
      explanation: "Mustafa Kemal'in özel önem atfettiği, yoğun diploması yürüttüğü ve 1939'da referandumla Türkiye'ye katılan bölge Hatay'dır."
    }
  ,
    {
      "id": "tar_y1",
      "topic": "Tarih Bilimi",
      "year": 2021,
      "text": "Tarih biliminin, geçmişteki olayları incelerken yer ve zaman belirtmesinin temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "Olayların tekrarlanmasını sağlamak",
            "Olaylar arasında neden-sonuç ilişkisi kurabilmek",
            "Deney yapabilmek",
            "Geleceği kesin olarak öngörmek",
            "Olayları genelleştirmek"
      ],
      "correct": 1,
      "explanation": "Tarihî bir olayın hangi koşullarda gerçekleştiğini anlamak için nerede ve ne zaman olduğu bilinmelidir. Yer ve zaman bilgisi, olaylar arasında doğru neden-sonuç bağı kurmayı sağlar. Tarihte deney ve gözlem yapılamaz.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y2",
      "topic": "İlk Çağ Uygarlıkları",
      "year": 2022,
      "text": "Tarihte bilinen ilk yazılı hukuk kurallarını oluşturan uygarlık aşağıdakilerden hangisidir?",
      "options": [
            "Sümerler",
            "Hititler",
            "Asurlular",
            "Fenikeliler",
            "Lidyalılar"
      ],
      "correct": 0,
      "explanation": "Sümerlerde Urgakina (Urukagina) tarafından hazırlanan yasalar, bilinen ilk yazılı hukuk kurallarıdır. Sümerler ayrıca çivi yazısını da bularak tarihî çağları başlatmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y3",
      "topic": "İslamiyet Öncesi Türk Tarihi",
      "year": 2021,
      "text": "Türk adının geçtiği ilk Türkçe yazılı belgeler aşağıdakilerden hangisidir?",
      "options": [
            "Orhun Kitabeleri",
            "Yenisey Yazıtları",
            "Kutadgu Bilig",
            "Divanü Lugati't-Türk",
            "Karabalgasun Yazıtı"
      ],
      "correct": 0,
      "explanation": "II. Göktürk Devleti döneminde dikilen Orhun Kitabeleri (Göktürk Yazıtları), Türk adının geçtiği ilk Türkçe yazılı belgelerdir. Türk edebiyatının ve tarih yazıcılığının ilk örnekleri sayılır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y4",
      "topic": "İslam Tarihi",
      "year": 2023,
      "text": "Hz. Muhammed'in Mekke'den Medine'ye göç etmesi olayına ne ad verilir?",
      "options": [
            "Hicret",
            "Hudeybiye",
            "Veda Haccı",
            "Bedir",
            "İsra"
      ],
      "correct": 0,
      "explanation": "622 yılında Mekke'den Medine'ye yapılan göçe Hicret denir. Bu olay Müslümanlar için dönüm noktası olmuş ve Hicri takvimin başlangıcı kabul edilmiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y5",
      "topic": "İlk Türk İslam Devletleri",
      "year": 2022,
      "text": "Anadolu'nun kapılarının Türklere açılmasını sağlayan 1071 Malazgirt Savaşı hangi devletler arasında yapılmıştır?",
      "options": [
            "Osmanlı - Bizans",
            "Büyük Selçuklu - Bizans",
            "Anadolu Selçuklu - Bizans",
            "Karahanlı - Gazneli",
            "Gazneli - Bizans"
      ],
      "correct": 1,
      "explanation": "1071'de Büyük Selçuklu Sultanı Alparslan ile Bizans İmparatoru Romen Diyojen arasında yapılan Malazgirt Savaşı Selçukluların zaferiyle sonuçlanmış ve Anadolu'nun kapıları Türklere açılmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y6",
      "topic": "Anadolu Selçuklu Tarihi",
      "year": 2021,
      "text": "1176 Miryokefalon Savaşı'nın Türk tarihi açısından önemi aşağıdakilerden hangisidir?",
      "options": [
            "Anadolu'nun kapıları Türklere açılmıştır",
            "Anadolu'nun kesin olarak Türk yurdu olduğu kabul edilmiştir",
            "İstanbul fethedilmiştir",
            "Haçlı Seferleri başlamıştır",
            "Osmanlı Devleti kurulmuştur"
      ],
      "correct": 1,
      "explanation": "II. Kılıç Arslan'ın Bizans'ı yendiği Miryokefalon Savaşı'ndan sonra Bizans, Anadolu'yu geri alma umudunu yitirmiştir. Bu nedenle Anadolu'nun kesin olarak Türk yurdu olduğunun kabul edildiği savaş sayılır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y7",
      "topic": "Osmanlı Tarihi - Kuruluş",
      "year": 2023,
      "text": "Osmanlı Devleti'nin kuruluş döneminde uygulanan ve fethedilen bölgelere Türkmenlerin yerleştirilmesi esasına dayanan politika aşağıdakilerden hangisidir?",
      "options": [
            "İskân politikası",
            "Devşirme sistemi",
            "Millet sistemi",
            "Tımar sistemi",
            "Kapitülasyon"
      ],
      "correct": 0,
      "explanation": "İskân (şenlendirme) politikasıyla fethedilen bölgelere Anadolu'dan Türkmen aileler yerleştirilmiş, böylece bölgenin Türkleşmesi ve fetihlerin kalıcı olması sağlanmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y8",
      "topic": "Osmanlı Devleti - Yükselme",
      "year": 2022,
      "text": "İstanbul'un fethiyle sona eren çağ ve başlayan çağ aşağıdakilerden hangisinde doğru verilmiştir?",
      "options": [
            "İlk Çağ - Orta Çağ",
            "Orta Çağ - Yeni Çağ",
            "Yeni Çağ - Yakın Çağ",
            "İlk Çağ - Yeni Çağ",
            "Orta Çağ - Yakın Çağ"
      ],
      "correct": 1,
      "explanation": "1453'te Fatih Sultan Mehmet'in İstanbul'u fethetmesiyle Orta Çağ kapanmış, Yeni Çağ başlamıştır. Yeni Çağ 1789 Fransız İhtilali ile sona erip Yakın Çağ başlar.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y9",
      "topic": "Osmanlı Devleti - Kültür ve Uygarlık",
      "year": 2024,
      "text": "Osmanlı Devleti'nde toprak gelirlerinin hizmet karşılığı askerlere verilmesi esasına dayanan sistem aşağıdakilerden hangisidir?",
      "options": [
            "Tımar sistemi",
            "Devşirme sistemi",
            "İltizam sistemi",
            "Millet sistemi",
            "Lonca sistemi"
      ],
      "correct": 0,
      "explanation": "Tımar sisteminde toprağın vergi geliri, karşılığında asker yetiştirmek koşuluyla sipahilere bırakılırdı. Bu sistem hem üretimin sürmesini hem de hazineden para çıkmadan ordu beslenmesini sağlıyordu.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y10",
      "topic": "Osmanlı Tarihi - Duraklama",
      "year": 2021,
      "text": "Osmanlı Devleti'nin Batı'da toprak kaybettiği ilk antlaşma olarak kabul edilen antlaşma aşağıdakilerden hangisidir?",
      "options": [
            "Karlofça Antlaşması",
            "Pasarofça Antlaşması",
            "Küçük Kaynarca Antlaşması",
            "Zitvatorok Antlaşması",
            "Belgrad Antlaşması"
      ],
      "correct": 0,
      "explanation": "1699 Karlofça Antlaşması ile Osmanlı Devleti Batı'da ilk kez büyük çapta toprak kaybetmiştir. Bu antlaşma Duraklama Dönemi'nin sonu, Gerileme Dönemi'nin başlangıcı sayılır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y11",
      "topic": "Osmanlı Tarihi - Lale Devri",
      "year": 2023,
      "text": "Lale Devri'nde gerçekleştirilen ve kültür hayatı açısından en önemli sayılan yenilik aşağıdakilerden hangisidir?",
      "options": [
            "İlk Türk matbaasının kurulması",
            "Nizam-ı Cedit ordusunun kurulması",
            "Tanzimat Fermanı'nın ilanı",
            "Kapitülasyonların kaldırılması",
            "Divan teşkilatının kurulması"
      ],
      "correct": 0,
      "explanation": "Lale Devri'nde (1718-1730) İbrahim Müteferrika ve Said Efendi tarafından ilk Türk matbaası kurulmuştur. Bu, bilginin yaygınlaşması açısından dönemin en kalıcı yeniliğidir.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y12",
      "topic": "Osmanlı Devleti - Dağılma",
      "year": 2022,
      "text": "Osmanlı Devleti'nde ilk kez anayasal düzene geçilen ve Meclis-i Mebusan'ın açıldığı dönem aşağıdakilerden hangisidir?",
      "options": [
            "Tanzimat Dönemi",
            "Islahat Dönemi",
            "I. Meşrutiyet",
            "II. Meşrutiyet",
            "Lale Devri"
      ],
      "correct": 2,
      "explanation": "1876'da II. Abdülhamit döneminde Kanun-i Esasi ilan edilerek I. Meşrutiyet başlamış, Meclis-i Mebusan açılmıştır. Böylece Osmanlı Devleti ilk kez anayasal düzene geçmiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y13",
      "topic": "I. Dünya Savaşı",
      "year": 2021,
      "text": "I. Dünya Savaşı'nda Osmanlı Devleti'nin savaştığı ve İtilaf Devletleri'nin İstanbul'a ulaşmasını engelleyen cephe aşağıdakilerden hangisidir?",
      "options": [
            "Kafkas Cephesi",
            "Çanakkale Cephesi",
            "Kanal Cephesi",
            "Irak Cephesi",
            "Suriye Cephesi"
      ],
      "correct": 1,
      "explanation": "Çanakkale Cephesi'nde kazanılan zafer, İtilaf Devletleri'nin boğazları geçip İstanbul'a ulaşmasını engellemiş ve Rusya'ya yardım götürülmesini önlemiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y14",
      "topic": "Kurtuluş Savaşına Hazırlık",
      "year": 2023,
      "text": "\"Milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır.\" kararının alındığı kongre aşağıdakilerden hangisidir?",
      "options": [
            "Erzurum Kongresi",
            "Sivas Kongresi",
            "Amasya Genelgesi",
            "Balıkesir Kongresi",
            "Alaşehir Kongresi"
      ],
      "correct": 2,
      "explanation": "22 Haziran 1919'da yayımlanan Amasya Genelgesi'nde Kurtuluş Savaşı'nın gerekçesi, amacı ve yöntemi ilk kez birlikte açıklanmış, milletin kendi kaderini belirleyeceği duyurulmuştur.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y15",
      "topic": "Kurtuluş Savaşı - Cepheler",
      "year": 2022,
      "text": "Kurtuluş Savaşı'nda \"Hattı müdafaa yoktur, sathı müdafaa vardır. O satıh bütün vatandır.\" emrinin verildiği savaş aşağıdakilerden hangisidir?",
      "options": [
            "I. İnönü",
            "II. İnönü",
            "Sakarya Meydan Muharebesi",
            "Büyük Taarruz",
            "Kütahya-Eskişehir"
      ],
      "correct": 2,
      "explanation": "Mustafa Kemal, 1921 Sakarya Meydan Muharebesi'nde bu emri vermiştir. Savaş, Türk ordusunun savunmadan taarruza geçtiği dönüm noktası olmuş ve 1683'ten beri süren geri çekiliş sona ermiştir.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y16",
      "topic": "Kurtuluş Savaşı",
      "year": 2024,
      "text": "Kurtuluş Savaşı'nın askerî safhasını sona erdiren ateşkes antlaşması aşağıdakilerden hangisidir?",
      "options": [
            "Mondros Ateşkes Antlaşması",
            "Mudanya Ateşkes Antlaşması",
            "Ankara Antlaşması",
            "Gümrü Antlaşması",
            "Moskova Antlaşması"
      ],
      "correct": 1,
      "explanation": "11 Ekim 1922'de imzalanan Mudanya Ateşkes Antlaşması ile silahlı mücadele sona ermiş; Doğu Trakya ve İstanbul savaş yapılmadan geri alınmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y17",
      "topic": "Lozan Barış Antlaşması",
      "year": 2021,
      "text": "Lozan Barış Antlaşması'nda çözüme kavuşturulamayan ve sonraya bırakılan sorun aşağıdakilerden hangisidir?",
      "options": [
            "Kapitülasyonlar",
            "Musul sorunu",
            "Savaş tazminatı",
            "Azınlıklar",
            "Borçlar"
      ],
      "correct": 1,
      "explanation": "Lozan'da kapitülasyonlar kaldırılmış, azınlık ve borç sorunları çözülmüştür. Ancak Musul konusunda İngiltere ile anlaşma sağlanamamış, sorun 1926 Ankara Antlaşması'na bırakılmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y18",
      "topic": "Atatürk Dönemi İnkılapları",
      "year": 2023,
      "text": "Türkiye'de kadınlara milletvekili seçme ve seçilme hakkı hangi yıl tanınmıştır?",
      "options": [
            "1926",
            "1930",
            "1934",
            "1937",
            "1924"
      ],
      "correct": 2,
      "explanation": "Kadınlara 1930'da belediye seçimlerine, 1933'te muhtarlık seçimlerine katılma hakkı verilmiş; 1934'te yapılan anayasa değişikliğiyle milletvekili seçme ve seçilme hakkı tanınmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y19",
      "topic": "Atatürk İlkeleri",
      "year": 2022,
      "text": "Devletin ekonomik hayata doğrudan girerek yatırım yapmasını öngören Atatürk ilkesi aşağıdakilerden hangisidir?",
      "options": [
            "Halkçılık",
            "Devletçilik",
            "Laiklik",
            "Milliyetçilik",
            "İnkılapçılık"
      ],
      "correct": 1,
      "explanation": "Devletçilik ilkesi, özel sektörün yetersiz kaldığı alanlarda devletin doğrudan yatırım yapmasını öngörür. 1929 Dünya Ekonomik Bunalımı'ndan sonra 1933 I. Beş Yıllık Sanayi Planı ile uygulanmıştır.",
      "kaynak": "ozgun"
},
    {
      "id": "tar_y20",
      "topic": "Atatürk Dönemi Dış Politika",
      "year": 2025,
      "text": "1936'da imzalanan ve Türkiye'ye Boğazlar üzerinde tam egemenlik hakkı tanıyan sözleşme aşağıdakilerden hangisidir?",
      "options": [
            "Montrö Boğazlar Sözleşmesi",
            "Balkan Antantı",
            "Sadabat Paktı",
            "Milletler Cemiyeti Sözleşmesi",
            "Ankara Antlaşması"
      ],
      "correct": 0,
      "explanation": "Lozan'da Boğazlar uluslararası bir komisyona bırakılmıştı. 1936 Montrö Sözleşmesi ile bu komisyon kaldırılmış, Boğazların yönetimi ve savunması tamamen Türkiye'ye geçmiştir.",
      "kaynak": "ozgun"
}
  ],
  Cografya: [
    {
      id: "cog_1",
      topic: "İklim Bilgisi",
      year: 2023,
      text: "Her mevsim yağışlı olan, sıcaklık farkı az olan ve kimyasal çözünmenin en fazla görüldüğü iklim tipi aşağıdakilerden hangisidir?",
      options: ["Akdeniz İklimi", "Karasal İklim", "Ekvatoral İklim", "Tundra İklimi", "Muson İklimi"],
      correct: 2,
      explanation: "Ekvatoral iklim yıl boyu sıcak ve bol yağışlıdır. Sıcaklık farkı çok düşüktür ve yüksek nemden dolayı kimyasal çözünme çok şiddetlidir."
    },
    {
      id: "cog_2",
      topic: "Nüfus ve Yerleşme",
      year: 2022,
      text: "Aşağıdakilerden hangisi bir ülkede nüfusun hızla artmasının yaratacağı olumsuz (demografik) sonuçlardan biridir?",
      options: [
        "Vergi gelirlerinin artması",
        "Yeni iş alanlarının açılması ihtiyacı ve kalkınma hızının yavaşlaması",
        "Genç nüfus oranının artması",
        "İş gücünün ucuzlaması",
        "İç pazarda tüketimin artması"
      ],
      correct: 1,
      explanation: "Nüfus artış hızı, kalkınma hızını aşarsa demografik yatırımlar (okul, hastane yapımı vb.) artar ve tasarruflar azalacağı için kalkınma hızı yavaşlar."
    },
    {
      id: "cog_3",
      topic: "Doğal Afetler",
      year: 2023,
      text: "Eğimin fazla, kar yağışının yoğun olduğu dağlık alanlarda ani sıcaklık artışı veya sarsıntılarla tetiklenen afet hangisidir?",
      options: ["Çığ", "Heyelan", "Erozyon", "Deprem", "Sel"],
      correct: 0,
      explanation: "Eğimin ve kar birikiminin fazla olduğu yerlerde kütlesel kar kaymasına çığ adı verilir."
    },
    {
      id: "cog_4",
      topic: "Harita Bilgisi",
      year: 2021,
      text: "Eş yükselti eğrileriyle (izohips) çizilmiş bir haritada eğrilerin birbirine çok yakın (sık) çizildiği yerler için hangisi söylenebilir?",
      options: [
        "Eğim azdır",
        "Eğim fazladır",
        "Akarsuyun akış hızı düşüktür",
        "Delta ovası oluşumu kolaydır",
        "Yol yapım maliyeti düşüktür"
      ],
      correct: 1,
      explanation: "İzohipslerin sıklaştığı yerlerde eğim artar. Eğim arttığı için akarsuların akış hızı, aşındırma gücü ve yol yapım maliyeti de artar."
    },
    {
      id: "cog_5",
      topic: "Coğrafi Konum",
      year: 2020,
      text: "Türkiye'nin matematiksel konumu (36° - 42° Kuzey enlemleri, 26° - 45° Doğu boylamları) göz önüne alındığında hangisi gerçekleşmez?",
      options: [
        "Kuzeye gidildikçe gece-gündüz süre farkı artar.",
        "Güneş ışınları hiçbir zaman dik açıyla (90°) gelmez.",
        "Dört mevsim belirgin olarak yaşanır.",
        "Gölge yönü yıl boyu kuzeyi gösterir.",
        "Güneş ışınları en dik açıyla Aralık ayında gelir."
      ],
      correct: 4,
      explanation: "Türkiye Kuzey Yarımküre'de orta kuşaktadır. Güneş ışınları en dik açıyla 21 Haziran'da (yaz başlangıcı), en eğik açıyla ise 21 Aralık'ta gelir."
    },
    {
      id: "cog_6",
      topic: "Doğa ve İnsan",
      year: 2024,
      text: "Aşağıdakilerden hangisi insanın doğaya müdahalesine ve onu değiştirmesine olumsuz bir örnektir?",
      options: [
        "Dağlık bölgelerde tünel ve viyadük yapılması",
        "Akarsular üzerine baraj kurulması",
        "Tarım arazilerinde aşırı gübreleme ve sulama sonucu çoraklaşma oluşması",
        "Bataklıkların kurutularak tarıma açılması (sulak alan kaybı)",
        "Denizin doldurularak havalimanı yapılması"
      ],
      correct: 2,
      explanation: "Aşırı sulama ve kimyasal gübreleme toprağın tuzlanmasına ve verimsizleşmesine (çoraklaşmaya) yol açan olumsuz bir beşeri etkidir."
    },
    {
      id: "cog_7",
      topic: "Yer kabuğu ve İç Kuvvetler",
      year: 2023,
      text: "Levha sınırlarında yer alan, depremlerin ve aktif volkanların yoğunlaştığı yeryüzü kuşağı hangisidir?",
      options: [
        "Pasifik Ateş Çemberi",
        "Sibirya Kalkanı",
        "Kuzey Kutup Kuşağı",
        "Sahra Çölü Kuşağı",
        "Avustralya Havzası"
      ],
      correct: 0,
      explanation: "Dünyadaki depremlerin %80'inin ve aktif volkanların çoğunluğunun bulunduğu Büyük Okyanus kıyılarına 'Pasifik Ateş Çemberi' denir."
    },
    {
      id: "cog_8",
      topic: "Dış Kuvvetler",
      year: 2022,
      text: "Rüzgarların aşındırma ve biriktirme faaliyetlerinin en etkili olduğu bölgelerin genel özelliği aşağıdakilerden hangisidir?",
      options: [
        "Bitki örtüsü gür, nemlidir.",
        "Bitki örtüsü cılız, kurak veya yarı kuraktır.",
        "Karasal iklim görülmez.",
        "Eğimi çok fazladır.",
        "Kimyasal çözünme etkindir."
      ],
      correct: 1,
      explanation: "Rüzgarlar, toprağın gevşek olduğu, bitki örtüsünün bulunmadığı kurak ve çöl bölgelerinde (fiziksel çözünmenin fazla olduğu yerlerde) en etkili dış kuvvettir."
    },
    {
      id: "cog_9",
      topic: "Türkiye'nin Yer şekilleri",
      year: 2021,
      text: "Akarsuların taşıdığı alüvyonları sığ kıyılarda biriktirmesiyle oluşan ovalara ne ad verilir?",
      options: ["Karstik Ova", "Tektonik Ova", "Delta Ovası", "Polye Ovası", "Lav Ovası"],
      correct: 2,
      explanation: "Akarsuların deniz kıyısında yaptığı biriktirme ovalarına Delta Ovası denir (Çukurova, Bafra, Çarşamba ovaları gibi)."
    },
    {
      id: "cog_10",
      topic: "Bölgeler ve Ülkeler",
      year: 2020,
      text: "Sınırları en kolay değişebilen bölge türü aşağıdakilerden hangisidir?",
      options: [
        "Dağlık Bölgeler",
        "İklim Bölgeleri",
        "Siyasi ve Ekonomik Bölgeler (Örn: Avrupa Birliği)",
        "Toprak Bölgeleri",
        "Doğal Afet Bölgeleri"
      ],
      correct: 2,
      explanation: "Beşeri, siyasi ve ekonomik bölge sınırları (örneğin askeri ittifaklar veya serbest ticaret bölgeleri) yeni ülkelerin katılması veya ayrılmasıyla çok hızlı değişebilir. Fiziki bölge sınırları (dağ, iklim) ise çok uzun zamanda değişir."
    },
    {
      id: "cog_11",
      topic: "Çevre ve Toplum",
      year: 2019,
      text: "Atmosferdeki sera gazlarının (özellikle CO2) artışı sonucu küresel sıcaklıkların yükselmesine ne ad verilir?",
      options: ["Asit Yağmuru", "Küresel İklim Değişikliği", "Ozon Tabakası İncelmesi", "Çölleşme", "Erozyon"],
      correct: 1,
      explanation: "Sera gazlarının birikmesiyle yeryüzünden yansıyan ışınların tutulması ve sıcaklıkların artması 'Küresel İklim Değişikliği' (küresel ısınma) sürecidir."
    },
    {
      id: "cog_12",
      topic: "Coğrafi Konum",
      year: 2018,
      text: "Aynı boylam üzerinde yer alan iki merkezde yıl boyunca aşağıdakilerden hangisi kesinlikle ortaktır?",
      options: [
        "Gündüz süreleri",
        "Yerel saatleri",
        "Güneşin doğuş saatleri",
        "Gölge boyları",
        "Sıcaklık değerleri"
      ],
      correct: 1,
      explanation: "Aynı meridyen (boylam) üzerindeki tüm noktalarda güneşin tepe noktasına ulaştığı an aynıdir, dolayısıyla yerel saatleri yıl boyu aynıdır."
    },
    {
      id: "cog_13",
      topic: "Türkiye'nin İklimi",
      year: 2017,
      text: "Yazları sıcak ve kurak, kışları ılık ve yağışlı geçen, karakteristik bitki örtüsü maki olan iklim tipi hangisidir?",
      options: ["Karadeniz İklimi", "Akdeniz İklimi", "Step (Bozkır) İklimi", "Sert Karasal İklim", "Çöl İklimi"],
      correct: 1,
      explanation: "Akdeniz ikliminin temel özellikleri yaz kuraklığı, kış ılıklığı ve maki (bodur çalı) bitki örtüsüdür."
    },
    {
      id: "cog_14",
      topic: "Su Kaynakları",
      year: 2016,
      text: "Sularını denize ulaştıramayıp karada kuruyan veya göle dökülen akarsu havzalarına ne ad verilir?",
      options: ["Açık Havza", "Kapalı Havza", "Akış Alanı", "Su Ayrım Çizgisi", "Akarsu Ağı"],
      correct: 1,
      explanation: "Sularını okyanus veya denizlere ulaştırabilen havzalar açık havza, ulaştıramayıp göl veya bataklıkta sonlanan havzalar kapalı havzadır (Örn: Tuz Gölü havzası)."
    },
    {
      id: "cog_15",
      topic: "Ekonomik Faaliyetler",
      year: 2024,
      text: "Sanayi, inşaat ve enerji üretimi gibi hammaddenin işlendiği faaliyetler hangi ekonomik sektör grubuna girer?",
      options: [
        "Birincil (Tarım, hayvancılık)",
        "İkincil (Sanayi)",
        "Üçüncül (Hizmet)",
        "Dördüncül (Bilişim, AR-GE)",
        "Beşincil (Karar vericiler, CEO'lar)"
      ],
      correct: 1,
      explanation: "Hammaddenin işlenerek mamul maddeye dönüştürüldüğü imalat, inşaat ve üretim faaliyetleri ikincil ekonomik faaliyettir."
    },
    {
      id: "cog_16",
      topic: "Türkiye'nin Nüfusu",
      year: 2023,
      text: "Türkiye'de nüfusun dağılışında aşağıdakilerden hangisinin etkisi diğerlerine göre daha azdır?",
      options: [
        "Sanayi tesislerinin varlığı",
        "İklim şartlarının elverişliliği",
        "Yeryüzü şekillerinin engebeli olması",
        "Gel-git (medcezir) genliği",
        "Ulaşım yollarının kavşak noktasında olması"
      ],
      correct: 3,
      explanation: "Türkiye iç denizlere kıyısı olduğu için gel-git genliği çok azdır ve yerleşme veya nüfus dağılışını etkileyen bir faktör değildir. Sanayi, iklim ve engebe ise birincil etkenlerdir."
    },
    {
      id: "cog_17",
      topic: "Harita Bilgisi",
      year: 2022,
      text: "Yeryüzü şekillerinin haritaya aktarılmasında bozulmaları en aza indirmek için kullanılan yöntem hangisidir?",
      options: ["Projeksiyon Yöntemi", "İzohips Yöntemi", "Renklendirme Yöntemi", "Tarama Yöntemi", "Kabartma Yöntemi"],
      correct: 0,
      explanation: "Dünya küresel olduğu için düzleme aktarılırken bozulmalar olur. Bu bozulmaları azaltmak amacıyla projeksiyon (silindirik, konik, düzlem) yöntemleri geliştirilmiştir."
    },
    {
      id: "cog_18",
      topic: "Atmosfer ve Sıcaklık",
      year: 2021,
      text: "Atmosferin en alt katmanı olan, gazların %75'ini barındıran ve hava olaylarının tamamının gerçekleştiği katman hangisidir?",
      options: ["Stratosfer", "Mezosfer", "Troposfer", "Termosfer", "Ekzosfer"],
      correct: 2,
      explanation: "Su buharının tamamına yakını bu katmanda olduğu için hava olayları yalnızca Troposfer'de yaşanır."
    },
    {
      id: "cog_19",
      topic: "Rüzgarlar",
      year: 2020,
      text: "Dağın yamacından aşağıya doğru inen ve sürtünmenin etkisiyle her 100 metrede 1 °C sıcaklığı artıran kuru, sıcak rüzgarlara ne ad verilir?",
      options: ["Meltem", "Fön (Föhn) Rüzgarı", "Alizeler", "Muson Rüzgarları", "Sirokko"],
      correct: 1,
      explanation: "Dağ yamacını aşarak alçalan hava kütlesinin ısınmasıyla oluşan sıcak ve kuru rüzgarlara Fön rüzgarları denir."
    },
    {
      id: "cog_20",
      topic: "Türkiye'nin Toprakları",
      year: 2019,
      text: "Killi ve kireçli depolar üzerinde oluşan, kurak dönemde çatlayıp içine toprak dökülen, yağışlı dönemde ise bu toprağı tekrar yukarı fırlatan ('dönen toprak' olarak da bilinen) toprak tipi hangisidir?",
      options: ["Laterit", "Vertisol", "Terra Rossa", "Podzol", "Çernozyum"],
      correct: 1,
      explanation: "Killi-kireçli anakara üzerinde oluşan, halk arasında dönen toprak veya taş doğuran toprak olarak bilinen kalsimorfik toprak çeşidi Vertisol'dür."
    },
    {
      id: "cog_21",
      topic: "Doğal Afetler",
      year: 2018,
      text: "Toprağın üst tabakasının su ve rüzgar etkisiyle aşınarak taşınması olayına ne ad verilir?",
      options: ["Heyelan", "Erozyon", "Deprem", "Tsunami", "Kaya Düşmesi"],
      correct: 1,
      explanation: "Verimli üst toprağın yavaş yavaş süpürülüp taşınması erozyondur. Kütlesel toprak kayması ise heyelandır. Karıştırmamak gerekir."
    },
    {
      id: "cog_22",
      topic: "Bölgeler",
      year: 2017,
      text: "Aşağıdakilerden hangisi bir fiziki (doğal) bölge sınırını belirlemede kıstas alınmaz?",
      options: ["İklim tipi", "Bitki örtüsü", "Nüfus yoğunluğu", "Yer şekilleri engebesi", "Toprak türü"],
      correct: 2,
      explanation: "Nüfus yoğunluğu beşeri bir özelliktir, dolayısıyla beşeri bölge sınıflandırmasına girer. İklim, bitki örtüsü, yer şekilleri ise fiziki unsurlardır."
    },
    {
      id: "cog_23",
      topic: "Çevre Sorunları",
      year: 2016,
      text: "Sulardaki aşırı besin maddesi (azot, fosfor) birikimi sonucu alglerin aşırı çoğalarak sudaki oksijeni tüketmesi ve canlı ölümlerine yol açması olayına ne ad verilir?",
      options: ["Ötrofikasyon", "Asitlenme", "Termal kirlilik", "Radyoaktif birikim", "Biyoçeşitlilik kaybı"],
      correct: 0,
      explanation: "Durgun sularda gübrelerin veya atık suların etkisiyle besin tuzlarının artıp alg patlaması yapmasına ve gölün bataklığa dönüşmesine ötrofikasyon denir."
    },
    {
      id: "cog_24",
      topic: "Türkiye'nin Gölleri",
      year: 2024,
      text: "Türkiye'nin en büyük gölü olan ve suları sodalı olduğu için inci kefali dışında balık türü barındırmayan göl hangisidir?",
      options: ["Tuz Gölü", "Beyşehir Gölü", "Eğirdir Gölü", "Van Gölü", "Sapanca Gölü"],
      correct: 3,
      explanation: "Van Gölü, volkanik set gölü olup suları sodalıdır ve Türkiye'nin en büyük gölüdür."
    },
    {
      id: "cog_25",
      topic: "Atmosfer ve Sıcaklık",
      year: 2023,
      text: "Yükselen hava kütlesinin soğuyarak içindeki su buharının sıvı hale geçmesi olayına ne ad verilir?",
      options: ["Buharlaşma", "Yoğunlaşma (Kondansasyon)", "Süblimleşme", "Terleme", "Kaynama"],
      correct: 1,
      explanation: "Gaz halindeki su buharının sıcaklığın düşmesiyle sıvı suya veya katı buza dönüşmesine yoğunlaşma (yoğuşma) denir."
    },
    {
      id: "cog_26",
      topic: "Türkiye'nin Bitki Örtüsü",
      year: 2022,
      text: "Karadeniz kıyı kuşağında nemli iklim şartlarına bağlı olarak gelişen geniş ve iğne yapraklı ağaçlardan oluşan topluluğa ne ad verilir?",
      options: ["Maki", "Bozkır (Step)", "Karışık Yapraklı Orman", "Garig", "Savanal"],
      correct: 2,
      explanation: "Karadeniz iklim bölgesinin doğal bitki örtüsü nemcil ve yüksek yağış alan karışık yapraklı ormanlardır."
    },
    {
      id: "cog_27",
      topic: "Yer kabuğu",
      year: 2021,
      text: "Tortul tabakaların yan basınçlara uğradığında kıvrılarak yükselen tepe kısmına (antiklinal) ve çöken çukur kısmına (senklinal) ne ad verilir?",
      options: [
        "Kıvrım Dağları",
        "Kırık Dağlar (Horst-Graben)",
        "Volkanik Dağlar",
        "Platolar",
        "Aşınım Ovaları"
      ],
      correct: 0,
      explanation: "Esnek tortul tabakaların kıvrılması sonucu yükselen kısımları antiklinal, alçalan kısımları senklinal olan dağlara Kıvrım Dağları (Örn: Kuzey Anadolu Dağları ve Toroslar) denir."
    },
    {
      id: "cog_28",
      topic: "İklim ve Yağış",
      year: 2020,
      text: "Havanın neme doyma oranı (bağıl nem) %100'ü aştığında aşağıdakilerden hangisi gerçekleşir?",
      options: ["Buharlaşma hızı artırır.", "Yağış başlar.", "Hava sıcaklığı aniden artar.", "Rüzgar durur.", "Bulutluluk azalır."],
      correct: 1,
      explanation: "Bağıl nem %100'e ulaştığında hava doyma noktasına gelmiştir. %100'ü aştığı anda nem açığı kalmaz ve yağış (yoğunlaşma ürünü) başlar."
    },
    {
      id: "cog_29",
      topic: "Doğal Afetler",
      year: 2019,
      text: "Depremler, volkanik patlamalar veya denizaltı heyelanları sonucu oluşan dev dalgalara ne ad verilir?",
      options: ["Tsunami", "Kasırga", "Gelgit dalgası", "Fırtına kabarması", "Heyelan"],
      correct: 0,
      explanation: "Deniz tabanındaki sismik sarsıntılarla tetiklenen dev dalgalara Japonca kökenli bir kelime olan Tsunami denir."
    },
    {
      id: "cog_30",
      topic: "Türkiye'nin Akarsuları",
      year: 2018,
      text: "Kaynağını Türkiye sınırları içerisinden alıp Basra Körfezi'ne dökülen sınır aşan en önemli akarsularımız hangileridir?",
      options: ["Fırat - Dicle", "Aras - Kura", "Kızılırmak - Yeşilırmak", "Çoruh - Sakarya", "Seyhan - Ceyhan"],
      correct: 0,
      explanation: "Fırat ve Dicle nehirleri Türkiye'den doğar, Suriye ve Irak'ı geçerek Şattülarap'ta birleşir ve Basra Körfezi'ne dökülür."
    }
  ,
    {
      "id": "cog_y1",
      "topic": "Coğrafi Konum",
      "year": 2021,
      "text": "Türkiye'nin matematik konumunun bir sonucu olarak aşağıdakilerden hangisi gösterilebilir?",
      "options": [
            "Üç tarafının denizlerle çevrili olması",
            "Dört mevsimin belirgin yaşanması",
            "Asya ile Avrupa arasında köprü olması",
            "Deprem kuşağında yer alması",
            "Boğazlara sahip olması"
      ],
      "correct": 1,
      "explanation": "Matematik konum, enlem ve boylamla ilgilidir. Türkiye orta kuşakta (36°-42° kuzey enlemleri) yer aldığı için dört mevsim belirgin yaşanır. Diğer seçenekler özel (coğrafi) konumun sonuçlarıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y2",
      "topic": "Harita Bilgisi",
      "year": 2022,
      "text": "Bir haritanın ölçeği küçüldükçe aşağıdakilerden hangisi artar?",
      "options": [
            "Ayrıntı miktarı",
            "Küçültme oranı",
            "Çizim alanı",
            "Gösterilen detay",
            "Kullanılan renk sayısı"
      ],
      "correct": 1,
      "explanation": "Ölçek küçüldükçe (paydası büyüdükçe) gerçek alan daha çok küçültülerek çizilir. Bu durumda küçültme oranı artar; buna karşılık ayrıntı, detay ve çizim alanı azalır.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y3",
      "topic": "Yer kabuğu ve İç Kuvvetler",
      "year": 2021,
      "text": "Aşağıdaki yeryüzü şekillerinden hangisi iç kuvvetlerin etkisiyle oluşmuştur?",
      "options": [
            "Falezler",
            "Kıvrım dağlar",
            "Peribacaları",
            "Delta ovası",
            "Mağara"
      ],
      "correct": 1,
      "explanation": "İç kuvvetler yerin iç enerjisiyle çalışır ve orojenez (dağ oluşumu), epirojenez, volkanizma, deprem şeklinde görülür. Kıvrım dağlar orojenezle oluşur. Diğerleri dış kuvvetlerin (akarsu, dalga, rüzgâr) eseridir.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y4",
      "topic": "Dış Kuvvetler",
      "year": 2023,
      "text": "Peribacalarının oluşumunda etkili olan temel dış kuvvet aşağıdakilerden hangisidir?",
      "options": [
            "Buzul",
            "Rüzgâr ve akarsu aşındırması",
            "Dalga",
            "Yer altı suları",
            "Heyelan"
      ],
      "correct": 1,
      "explanation": "Peribacaları, volkanik tüf gibi yumuşak tabakaların yağmur suları ve rüzgâr tarafından aşındırılması, üstteki sert kayanın ise koruyucu şapka görevi görmesiyle oluşur. Kapadokya bunun en bilinen örneğidir.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y5",
      "topic": "Atmosfer ve Sıcaklık",
      "year": 2022,
      "text": "Yükseltinin artmasıyla sıcaklığın azalmasının temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "Güneş'e yaklaşılması",
            "Atmosferin yoğunluğunun azalması ve ısının tutulamaması",
            "Nem oranının artması",
            "Basıncın artması",
            "Rüzgâr hızının azalması"
      ],
      "correct": 1,
      "explanation": "Atmosfer, esas olarak yerden yansıyan uzun dalgalı ışınlarla ısınır. Yükseklerde hava yoğunluğu ve nem azaldığından bu ısı tutulamaz; her 100 metrede sıcaklık yaklaşık 0,5 °C düşer.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y6",
      "topic": "Rüzgarlar",
      "year": 2021,
      "text": "Rüzgârın oluşmasının temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "İki bölge arasındaki basınç farkı",
            "Sıcaklığın sabit olması",
            "Nem oranının eşitlenmesi",
            "Yer çekiminin azalması",
            "Yükseltinin artması"
      ],
      "correct": 0,
      "explanation": "Rüzgâr, yüksek basınç alanından alçak basınç alanına doğru hareket eden hava kütlesidir. Basınç farkı arttıkça rüzgârın hızı da artar.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y7",
      "topic": "İklim Bilgisi",
      "year": 2023,
      "text": "Yazları sıcak ve kurak, kışları ılık ve yağışlı geçen; doğal bitki örtüsü maki olan iklim tipi aşağıdakilerden hangisidir?",
      "options": [
            "Karasal iklim",
            "Akdeniz iklimi",
            "Karadeniz iklimi",
            "Muson iklimi",
            "Çöl iklimi"
      ],
      "correct": 1,
      "explanation": "Akdeniz ikliminde yaz kuraklığı belirgindir, kışlar ılık ve yağışlı geçer. Kuraklığa dayanıklı, sert yapraklı çalılardan oluşan maki bu iklimin doğal bitki örtüsüdür.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y8",
      "topic": "Türkiye'nin İklimi",
      "year": 2022,
      "text": "Türkiye'de en fazla yağış alan bölge ve bu durumun temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "Doğu Karadeniz - dağların denize paralel uzanması ve nemli havayı yükseltmesi",
            "İç Anadolu - karasallık",
            "Güneydoğu Anadolu - alçak yükselti",
            "Ege - dağların denize dik uzanması",
            "Marmara - geçiş iklimi"
      ],
      "correct": 0,
      "explanation": "Doğu Karadeniz'de dağlar kıyıya paralel uzanır. Denizden gelen nemli hava kütleleri bu dağları aşmak için yükselir, soğur ve yoğunlaşarak bol yağış bırakır (yamaç yağışı).",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y9",
      "topic": "İklim ve Yağış",
      "year": 2024,
      "text": "Hava kütlesinin ısınıp yükselmesi, soğuyup yoğunlaşması sonucu oluşan ve genellikle yaz aylarında öğleden sonra görülen yağış türü aşağıdakilerden hangisidir?",
      "options": [
            "Yamaç yağışı",
            "Cephe yağışı",
            "Konveksiyonel (yükselim) yağış",
            "Çiy",
            "Kırağı"
      ],
      "correct": 2,
      "explanation": "Konveksiyonel yağış, yerin aşırı ısınmasıyla havanın yükselip soğuması sonucu oluşur. İç Anadolu'da yaz sonu görülen \"kırkikindi yağmurları\" bu türün tipik örneğidir.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y10",
      "topic": "Türkiye'nin Yer şekilleri",
      "year": 2021,
      "text": "Türkiye'nin ortalama yükseltisinin fazla olmasının bir sonucu olarak aşağıdakilerden hangisi gösterilebilir?",
      "options": [
            "Akarsuların hidroelektrik potansiyelinin yüksek olması",
            "Tarım alanlarının genişlemesi",
            "Ulaşımın kolaylaşması",
            "Nüfusun her yere eşit dağılması",
            "Deniz etkisinin iç kesimlere kolayca ulaşması"
      ],
      "correct": 0,
      "explanation": "Yükseltinin fazla ve engebenin çok olması akarsuların eğimini ve akış hızını artırır. Bu da hidroelektrik enerji potansiyelini yükseltir. Yükselti tarımı, ulaşımı ve yerleşmeyi ise olumsuz etkiler.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y11",
      "topic": "Türkiye'nin Akarsuları",
      "year": 2022,
      "text": "Türkiye'de akarsuların denge profiline ulaşamamış olmasının temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "Yağış rejiminin düzenli olması",
            "Arazinin genç ve engebeli olması",
            "Havzaların küçük olması",
            "Bitki örtüsünün gür olması",
            "İklimin nemli olması"
      ],
      "correct": 1,
      "explanation": "Türkiye arazisi jeolojik olarak gençtir ve yükselme hareketleri sürmektedir. Bu nedenle akarsular derine aşındırmayı sürdürür, denge profiline ulaşamaz; boğaz ve vadiler oluşur.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y12",
      "topic": "Türkiye'nin Gölleri",
      "year": 2023,
      "text": "Türkiye'nin en büyük gölü ve oluşum türü aşağıdakilerden hangisinde doğru verilmiştir?",
      "options": [
            "Van Gölü - volkanik set gölü",
            "Tuz Gölü - tektonik göl",
            "Beyşehir Gölü - karstik göl",
            "Eğirdir Gölü - buzul gölü",
            "İznik Gölü - heyelan set gölü"
      ],
      "correct": 0,
      "explanation": "Van Gölü, Türkiye'nin en büyük gölüdür. Nemrut Dağı'ndan çıkan lavların vadiyi kapatmasıyla oluşmuş bir volkanik set gölüdür; suyu sodalıdır.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y13",
      "topic": "Türkiye'nin Toprakları",
      "year": 2021,
      "text": "Kireç taşının çözünmesiyle oluşan, Akdeniz ikliminin görüldüğü alanlarda yaygın olan kırmızı renkli toprak türü aşağıdakilerden hangisidir?",
      "options": [
            "Terra rossa",
            "Çernozyom",
            "Podzol",
            "Laterit",
            "Alüvyal toprak"
      ],
      "correct": 0,
      "explanation": "Terra rossa (kırmızı Akdeniz toprağı), kireç taşlarının çözünmesi sonucu geride kalan demir oksitlerden dolayı kırmızı renklidir. Akdeniz ikliminin görüldüğü karstik alanlarda yaygındır.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y14",
      "topic": "Türkiye'nin Bitki Örtüsü",
      "year": 2024,
      "text": "İç Anadolu Bölgesi'nin doğal bitki örtüsü olan ve yaz kuraklığına uyum sağlamış ot topluluğu aşağıdakilerden hangisidir?",
      "options": [
            "Maki",
            "Bozkır (step)",
            "Orman",
            "Tundra",
            "Garig"
      ],
      "correct": 1,
      "explanation": "İç Anadolu'da yaz kuraklığı ve yıllık yağışın azlığı orman oluşumunu engeller. İlkbaharda yeşerip yaz sıcaklarıyla kuruyan otsu bitkilerden oluşan bozkır (step) doğal örtüdür.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y15",
      "topic": "Nüfus ve Yerleşme",
      "year": 2022,
      "text": "Bir ülkede nüfus piramidinin tabanının geniş olması aşağıdakilerden hangisini gösterir?",
      "options": [
            "Doğum oranının yüksek olduğunu",
            "Yaşlı nüfusun fazla olduğunu",
            "Ortalama yaşam süresinin uzun olduğunu",
            "Nüfus artış hızının düşük olduğunu",
            "Göç verildiğini"
      ],
      "correct": 0,
      "explanation": "Nüfus piramidinin tabanı 0-4 yaş grubunu gösterir. Tabanın geniş olması doğum oranının ve dolayısıyla genç nüfusun fazla olduğunu, ülkenin gelişmekte olduğunu ifade eder.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y16",
      "topic": "Türkiye'nin Nüfusu",
      "year": 2023,
      "text": "Türkiye'de nüfusun kıyı bölgelerde yoğunlaşmasının temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "Yükseltinin fazla olması",
            "İklim koşullarının elverişli ve ekonomik faaliyetlerin çeşitli olması",
            "Yer altı kaynaklarının azlığı",
            "Tarım alanlarının dar olması",
            "Ulaşımın zor olması"
      ],
      "correct": 1,
      "explanation": "Kıyı bölgelerde ılıman iklim, verimli tarım alanları, sanayi, turizm ve liman ulaşımı bir arada bulunur. Bu ekonomik çeşitlilik nüfusu çeker; iç kesimlerde yükselti ve karasallık nüfusu sınırlar.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y17",
      "topic": "Ekonomik Faaliyetler",
      "year": 2021,
      "text": "Bir ülkede çalışan nüfusun büyük bölümünün hizmet sektöründe yer alması aşağıdakilerden hangisini gösterir?",
      "options": [
            "Ülkenin geliştiğini",
            "Tarımın tek geçim kaynağı olduğunu",
            "Sanayinin hiç gelişmediğini",
            "Nüfusun kırsalda toplandığını",
            "Doğum oranının yüksek olduğunu"
      ],
      "correct": 0,
      "explanation": "Ekonomik gelişmeyle birlikte tarımda çalışan nüfus oranı azalır, sanayi ve özellikle hizmet sektöründe çalışanların oranı artar. Bu, gelişmişliğin temel göstergelerindendir.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y18",
      "topic": "Doğal Afetler",
      "year": 2022,
      "text": "Türkiye'de deprem riskinin yüksek olmasının temel nedeni aşağıdakilerden hangisidir?",
      "options": [
            "Yükseltinin fazla olması",
            "Alp-Himalaya deprem kuşağında yer alması",
            "Akarsuların hızlı akması",
            "Karstik arazilerin yaygın olması",
            "Volkanik dağların çok olması"
      ],
      "correct": 1,
      "explanation": "Türkiye, Avrasya, Afrika ve Arabistan levhalarının etkileşim alanında, genç kıvrım kuşağı olan Alp-Himalaya deprem kuşağı üzerindedir. Kuzey Anadolu Fay Hattı bu hareketliliğin sonucudur.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y19",
      "topic": "Çevre ve Toplum",
      "year": 2024,
      "text": "Atmosferdeki karbondioksit oranının artmasının doğrudan yol açtığı çevre sorunu aşağıdakilerden hangisidir?",
      "options": [
            "Ozon tabakasının incelmesi",
            "Küresel ısınma (sera etkisinin artması)",
            "Asit yağmurları",
            "Erozyon",
            "Çölleşmenin durması"
      ],
      "correct": 1,
      "explanation": "Karbondioksit bir sera gazıdır; yerden yansıyan uzun dalgalı ışınları tutarak atmosferin ısınmasına yol açar. Ozon incelmesinden kloroflorokarbonlar, asit yağmurlarından ise kükürt ve azot oksitler sorumludur.",
      "kaynak": "ozgun"
},
    {
      "id": "cog_y20",
      "topic": "Su Kaynakları",
      "year": 2025,
      "text": "Karstik arazilerde yer altı sularının mağara tavanından damlayarak oluşturduğu sarkıt ve dikitlerin temel oluşum süreci aşağıdakilerden hangisidir?",
      "options": [
            "Kimyasal çözünme ve yeniden birikim",
            "Rüzgâr aşındırması",
            "Buzul aşındırması",
            "Dalga biriktirmesi",
            "Volkanik püskürme"
      ],
      "correct": 0,
      "explanation": "Karbondioksitli sular kireç taşını kimyasal olarak çözer (erime). Çözünmüş kireç, mağara içinde damlayan suyun buharlaşmasıyla yeniden çökelerek sarkıt, dikit ve sütunları oluşturur.",
      "kaynak": "ozgun"
}
  ]
};

// Export to window object for browser access
if (typeof window !== 'undefined') {
  window.YKS_QUESTION_BANK = YKS_QUESTION_BANK;
}
