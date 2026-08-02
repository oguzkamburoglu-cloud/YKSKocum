// 360 motivasyon sozu - her oturumda farkli bir tanesi gosterilir
const DAILY_QUOTES = [
 {
  "text": "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
  "author": "Robert Collier"
 },
 {
  "text": "Sınırları zorlamayanlar, nerede bittiklerini asla göremezler.",
  "author": "Kobe Bryant"
 },
 {
  "text": "Şimdi acı çek ki hayatının kalanını bir şampiyon olarak yaşayasın.",
  "author": "Muhammed Ali"
 },
 {
  "text": "Defalarca başarısız oldum. Ve işte bu yüzden başardım.",
  "author": "Michael Jordan"
 },
 {
  "text": "Eğer hayalin seni korkutmuyorsa, yeterince büyük değil demektir.",
  "author": "Ellen Johnson Sirleaf"
 },
 {
  "text": "Zorluklar, senin ne kadar güçlü olduğunu gösteren aynadır.",
  "author": "Seneca"
 },
 {
  "text": "Bugün yapmadığın çalışma, yarının pişmanlığıdır.",
  "author": "Anonim"
 },
 {
  "text": "Yolun uzunluğu değil, adımlarının istikrarı belirler varışını.",
  "author": "Konfüçyüs"
 },
 {
  "text": "Disiplin, hedefler ile başarı arasındaki köprüdür.",
  "author": "Jim Rohn"
 },
 {
  "text": "Yorulduğunda dur, ama asla pes etme.",
  "author": "Banksy"
 },
 {
  "text": "En karanlık an, şafağın hemen öncesidir.",
  "author": "Thomas Fuller"
 },
 {
  "text": "Kendine inanmak, yolun yarısını yürümektir.",
  "author": "Theodore Roosevelt"
 },
 {
  "text": "Bilgi güçtür, ama uygulanan bilgi zaferdir.",
  "author": "Francis Bacon"
 },
 {
  "text": "Her usta bir zamanlar acemiydi.",
  "author": "Robin Sharma"
 },
 {
  "text": "Zaman, en adil hakemdir; herkese eşit verir, farkı kullanan yaratır.",
  "author": "Anonim"
 },
 {
  "text": "Küçük ilerlemeler de ilerlemedir.",
  "author": "Anonim"
 },
 {
  "text": "Hedefi olmayan gemiye hiçbir rüzgâr yardım etmez.",
  "author": "Seneca"
 },
 {
  "text": "Bugünün işini yarına bırakma, yarının kendi işi olacak.",
  "author": "Benjamin Franklin"
 },
 {
  "text": "Mükemmellik bir eylem değil, bir alışkanlıktır.",
  "author": "Aristoteles"
 },
 {
  "text": "Zihin bir paraşüt gibidir; ancak açıldığında işe yarar.",
  "author": "Frank Zappa"
 },
 {
  "text": "Zorluk seni kırmaz, seni şekillendirir.",
  "author": "Marcus Aurelius"
 },
 {
  "text": "Kaybetmekten korkma; denememekten kork.",
  "author": "Michael Jordan"
 },
 {
  "text": "Bir yıl sonra bugün başlamış olmayı dileyeceksin.",
  "author": "Karen Lamb"
 },
 {
  "text": "Sabır acıdır ama meyvesi tatlıdır.",
  "author": "Jean-Jacques Rousseau"
 },
 {
  "text": "Çalışmayan bir yetenek, uyuyan bir devdir.",
  "author": "Anonim"
 },
 {
  "text": "Motivasyon başlatır, alışkanlık sürdürür.",
  "author": "Jim Ryun"
 },
 {
  "text": "Odaklanmak, hayır demeyi bilmektir.",
  "author": "Steve Jobs"
 },
 {
  "text": "Rakibin dünkü halin olsun.",
  "author": "Anonim"
 },
 {
  "text": "Düşmekten değil, kalkmamaktan kork.",
  "author": "Konfüçyüs"
 },
 {
  "text": "Bugün ekmediğin tohumun gölgesinde yarın oturamazsın.",
  "author": "Atasözü"
 },
 {
  "text": "Zafer, hazırlıkla fırsatın buluştuğu andır.",
  "author": "Seneca"
 },
 {
  "text": "Kolay olsaydı herkes yapardı.",
  "author": "Tom Hanks"
 },
 {
  "text": "Sen ne kadar çalışırsan, şans o kadar yanında olur.",
  "author": "Gary Player"
 },
 {
  "text": "Yavaş gitmekten korkma, durmaktan kork.",
  "author": "Çin Atasözü"
 },
 {
  "text": "Büyük işler, küçük başlangıçlarla olur.",
  "author": "Demosthenes"
 },
 {
  "text": "Beynin bir kas gibidir; kullandıkça güçlenir.",
  "author": "Anonim"
 },
 {
  "text": "Her hata, bir sonraki doğrunun haritasıdır.",
  "author": "Anonim"
 },
 {
  "text": "Konfor alanının dışında büyürsün.",
  "author": "Neale Donald Walsch"
 },
 {
  "text": "Hayaller emek ister, dilekler değil.",
  "author": "Anonim"
 },
 {
  "text": "Bugün bir sayfa oku, yarın bir bölüm bilirsin.",
  "author": "Anonim"
 },
 {
  "text": "Zor yol, genellikle doğru yoldur.",
  "author": "Anonim"
 },
 {
  "text": "Kararlılık, yeteneği yener.",
  "author": "Tim Notke"
 },
 {
  "text": "Az ama düzenli, çok ama düzensizden iyidir.",
  "author": "Anonim"
 },
 {
  "text": "Başlamak, bitirmenin yarısıdır.",
  "author": "Horace"
 },
 {
  "text": "Kendine yatırım yap; getirisi en yüksek olan budur.",
  "author": "Warren Buffett"
 },
 {
  "text": "Yarın, bugün yaptıklarının çocuğudur.",
  "author": "Anonim"
 },
 {
  "text": "Sınav bir gün, hazırlık bir ömürdür.",
  "author": "Anonim"
 },
 {
  "text": "Sabırla koyan derviş, muradına ermiş.",
  "author": "Türk Atasözü"
 },
 {
  "text": "Bir hedefe yürüyen, yolu da bulur.",
  "author": "Anonim"
 },
 {
  "text": "En büyük risk, hiç risk almamaktır.",
  "author": "Mark Zuckerberg"
 },
 {
  "text": "Bilgi biriktikçe değil, kullanıldıkça değer kazanır.",
  "author": "Anonim"
 },
 {
  "text": "Zorlandığın an, gelişmeye en yakın olduğun andır.",
  "author": "Anonim"
 },
 {
  "text": "Yolunda yürüyen bir kaplumbağa, duran bir tavşandan hızlıdır.",
  "author": "Anonim"
 },
 {
  "text": "Alışkanlıklarını değiştir, hayatını değiştirmiş olursun.",
  "author": "Anonim"
 },
 {
  "text": "Bugün zor, yarın daha zor, ama öbür gün harika.",
  "author": "Jack Ma"
 },
 {
  "text": "Umut, karanlıkta yanan mumdur; söndürme.",
  "author": "Anonim"
 },
 {
  "text": "Kendi hikâyeni yazmazsan, başkasının hikâyesinde figüran olursun.",
  "author": "Anonim"
 },
 {
  "text": "Ders çalışmak bir cezalandırma değil, bir özgürleşmedir.",
  "author": "Anonim"
 },
 {
  "text": "Konsantrasyon, zekânın en keskin hâlidir.",
  "author": "Bruce Lee"
 },
 {
  "text": "Kimse senin yerine senin hayalini kuramaz.",
  "author": "Anonim"
 },
 {
  "text": "Zirveye çıkanların hepsi, bir gün en alttaydı.",
  "author": "Anonim"
 },
 {
  "text": "Pes etmek, hedefe en yakın anda en cazip gelir.",
  "author": "Anonim"
 },
 {
  "text": "Emek, şansın en güvenilir kardeşidir.",
  "author": "Anonim"
 },
 {
  "text": "Bir şeyi yeterince istiyorsan, yolunu bulursun.",
  "author": "Anonim"
 },
 {
  "text": "Bugün üşendiğin şey, yarın hasret duyacağın fırsattır.",
  "author": "Anonim"
 },
 {
  "text": "Zaman geçer, ama emek kalır.",
  "author": "Anonim"
 },
 {
  "text": "Zihnini besle, gerisi gelir.",
  "author": "Anonim"
 },
 {
  "text": "İyi bir plan, mükemmel bir niyetten değerlidir.",
  "author": "Anonim"
 },
 {
  "text": "Tekrar, öğrenmenin annesidir.",
  "author": "Latin Atasözü"
 },
 {
  "text": "Karanlığa küfretmektense bir mum yak.",
  "author": "Konfüçyüs"
 },
 {
  "text": "Hedefin büyükse, mazeretin küçük olsun.",
  "author": "Anonim"
 },
 {
  "text": "En iyi zaman dündü; ikinci en iyisi bugün.",
  "author": "Çin Atasözü"
 },
 {
  "text": "Yorgunluk geçici, gurur kalıcıdır.",
  "author": "Anonim"
 },
 {
  "text": "Kendine acımak, ilerlemenin en pahalı lüksüdür.",
  "author": "Anonim"
 },
 {
  "text": "Bugünün disiplini, yarının özgürlüğüdür.",
  "author": "Anonim"
 },
 {
  "text": "Her soru, bir kapının anahtarıdır.",
  "author": "Anonim"
 },
 {
  "text": "Bilmediğini bilmek, öğrenmenin başlangıcıdır.",
  "author": "Sokrates"
 },
 {
  "text": "Hayat, hazırlananları ödüllendirir.",
  "author": "Anonim"
 },
 {
  "text": "Küçük adımlar, uzun yolları kısaltır.",
  "author": "Anonim"
 },
 {
  "text": "Rakibin değil, potansiyelin seni zorlasın.",
  "author": "Anonim"
 },
 {
  "text": "Yolun sonu görünmüyorsa, bir adım daha at.",
  "author": "Anonim"
 },
 {
  "text": "Başarı, doğru işi yeterince uzun süre yapmaktır.",
  "author": "Anonim"
 },
 {
  "text": "Kalem, kaderin en güçlü aletidir.",
  "author": "Anonim"
 },
 {
  "text": "Hiçbir çaba boşa gitmez; sadece geç meyve verir.",
  "author": "Anonim"
 },
 {
  "text": "Zoru başaran, sıradanı çoktan geçmiştir.",
  "author": "Anonim"
 },
 {
  "text": "Her sabah yeni bir sınav değil, yeni bir şanstır.",
  "author": "Anonim"
 },
 {
  "text": "Emek verdiğin şey, seni geri sever.",
  "author": "Anonim"
 },
 {
  "text": "Zihin, dinlendiğinde değil, doyduğunda güçlenir.",
  "author": "Anonim"
 },
 {
  "text": "Hedefe kilitlenen göz, engelleri görmez.",
  "author": "Anonim"
 },
 {
  "text": "Bugün biraz daha iyi ol, yeter.",
  "author": "Anonim"
 },
 {
  "text": "Sürekli ilerlemek, ara ara koşmaktan iyidir.",
  "author": "Anonim"
 },
 {
  "text": "Not tutmak, hafızayı ikiye katlar.",
  "author": "Anonim"
 },
 {
  "text": "Anlamadan ezberlemek, kumda ev yapmaktır.",
  "author": "Anonim"
 },
 {
  "text": "En iyi öğretmen, kendi hatandır.",
  "author": "Anonim"
 },
 {
  "text": "Sorunu çözmek için önce sorunu sev.",
  "author": "Anonim"
 },
 {
  "text": "Yorulmak, doğru yolda olduğunun kanıtıdır.",
  "author": "Anonim"
 },
 {
  "text": "Hedefsiz çalışmak, pusulasız yürümektir.",
  "author": "Anonim"
 },
 {
  "text": "Zaman yönetimi, hayat yönetimidir.",
  "author": "Anonim"
 },
 {
  "text": "Bugün bir adım, bir yılda üç yüz altmış adım eder.",
  "author": "Anonim"
 },
 {
  "text": "Kendine söz ver ve o sözü tut.",
  "author": "Anonim"
 },
 {
  "text": "Gelişim, konforun bittiği yerde başlar.",
  "author": "Anonim"
 },
 {
  "text": "İyi soru, iyi cevaptan değerlidir.",
  "author": "Anonim"
 },
 {
  "text": "Kararsızlık, en pahalı karardır.",
  "author": "Anonim"
 },
 {
  "text": "Az uyumak değil, iyi uyumak başarı getirir.",
  "author": "Anonim"
 },
 {
  "text": "Beyin, tekrar edilen şeyi gerçek sanır.",
  "author": "Anonim"
 },
 {
  "text": "Odaklanmadığın her dakika, birinin fırsatıdır.",
  "author": "Anonim"
 },
 {
  "text": "Hazırlık, korkunun panzehiridir.",
  "author": "Anonim"
 },
 {
  "text": "Zorluk, ayrıştırıcıdır; hazır olanı ödüllendirir.",
  "author": "Anonim"
 },
 {
  "text": "Bir konuyu anlatabildiğinde, gerçekten öğrenmişsindir.",
  "author": "Richard Feynman"
 },
 {
  "text": "Kalitesiz saatler değil, nitelikli dakikalar kazandırır.",
  "author": "Anonim"
 },
 {
  "text": "Yeniden başlamak, hiç başlamamaktan iyidir.",
  "author": "Anonim"
 },
 {
  "text": "Hedefini yaz; yazılan hedef gerçeğe yaklaşır.",
  "author": "Anonim"
 },
 {
  "text": "Kendine dur demeden, dünya sana duramaz.",
  "author": "Anonim"
 },
 {
  "text": "Öğrenmenin yaşı yoktur, ama zamanı vardır.",
  "author": "Anonim"
 },
 {
  "text": "Verimli çalışmak, çok çalışmaktan zekicedir.",
  "author": "Anonim"
 },
 {
  "text": "Bir sonraki soru, bir öncekinden bağımsızdır.",
  "author": "Anonim"
 },
 {
  "text": "Sınavda soğukkanlılık, en büyük nettir.",
  "author": "Anonim"
 },
 {
  "text": "Panik, bildiğini unutturur; nefes al.",
  "author": "Anonim"
 },
 {
  "text": "Deneme, gerçek sınavın provasıdır; ciddiye al.",
  "author": "Anonim"
 },
 {
  "text": "Yanlış analiz edilmeyen deneme, boşa çözülmüştür.",
  "author": "Anonim"
 },
 {
  "text": "Eksiğini bilen, yarısını tamamlamıştır.",
  "author": "Anonim"
 },
 {
  "text": "Bugünkü yorgunluğun, yarınki gururun olacak.",
  "author": "Anonim"
 },
 {
  "text": "Uzun vadeli düşün, kısa vadeli çalış.",
  "author": "Anonim"
 },
 {
  "text": "Sonuç değil, süreç kontrol edilebilir.",
  "author": "Anonim"
 },
 {
  "text": "Süreci sev, sonuç peşinden gelir.",
  "author": "Anonim"
 },
 {
  "text": "Kendinle yarış, başkasıyla değil.",
  "author": "Anonim"
 },
 {
  "text": "Sabah kazanılan bir saat, akşam iki saat eder.",
  "author": "Anonim"
 },
 {
  "text": "Molasız çalışma, verimsiz çalışmadır.",
  "author": "Anonim"
 },
 {
  "text": "Dinlenmek de programın parçasıdır.",
  "author": "Anonim"
 },
 {
  "text": "Telefonu bırak, hedefi al.",
  "author": "Anonim"
 },
 {
  "text": "Dikkat dağınıklığı, en sessiz hırsızdır.",
  "author": "Anonim"
 },
 {
  "text": "Bir konuyu bitirmek, on konuya göz atmaktan iyidir.",
  "author": "Anonim"
 },
 {
  "text": "Derinlik, genişlikten önce gelir.",
  "author": "Anonim"
 },
 {
  "text": "Zorlandığın konu, en çok puan getirendir.",
  "author": "Anonim"
 },
 {
  "text": "Kaçtığın konu, seni sınavda bulur.",
  "author": "Anonim"
 },
 {
  "text": "Kolaydan başla, ama kolayda kalma.",
  "author": "Anonim"
 },
 {
  "text": "Her gün aynı saatte başla; beynin hazırlansın.",
  "author": "Anonim"
 },
 {
  "text": "Rutin, iradenin yerini alır.",
  "author": "Anonim"
 },
 {
  "text": "İrade tükenir, sistem tükenmez.",
  "author": "Anonim"
 },
 {
  "text": "Programa uy, moduna değil.",
  "author": "Anonim"
 },
 {
  "text": "Hevesle başlanan iş, disiplinle bitirilir.",
  "author": "Anonim"
 },
 {
  "text": "Bugün 'yarın' dersen, yarın da 'yarın' dersin.",
  "author": "Anonim"
 },
 {
  "text": "Erteleme, hedefin en büyük düşmanıdır.",
  "author": "Anonim"
 },
 {
  "text": "Beş dakika başla; gerisi gelir.",
  "author": "Anonim"
 },
 {
  "text": "Zor olan başlamak, devam etmek değil.",
  "author": "Anonim"
 },
 {
  "text": "Her tamamlanan görev, özgüven biriktirir.",
  "author": "Anonim"
 },
 {
  "text": "Küçük zaferleri kutla, büyük zafer yolda.",
  "author": "Anonim"
 },
 {
  "text": "Kendini ödüllendirmeyi unutma.",
  "author": "Anonim"
 },
 {
  "text": "Hedefe giden yol, keyifli de olabilir.",
  "author": "Anonim"
 },
 {
  "text": "Öğrenmek bir yük değil, bir ayrıcalıktır.",
  "author": "Anonim"
 },
 {
  "text": "Merak, en iyi öğretmendir.",
  "author": "Anonim"
 },
 {
  "text": "Neden öğrendiğini bil, nasıl kolaylaşır.",
  "author": "Anonim"
 },
 {
  "text": "Amaç netse, yol kendini gösterir.",
  "author": "Anonim"
 },
 {
  "text": "Hedefini duvara as, gözünden kaçmasın.",
  "author": "Anonim"
 },
 {
  "text": "Sana inanmayanlara değil, kendine cevap ver.",
  "author": "Anonim"
 },
 {
  "text": "En sessiz cevap, başarıdır.",
  "author": "Anonim"
 },
 {
  "text": "Kimseye kanıtlamak zorunda değilsin, kendine hariç.",
  "author": "Anonim"
 },
 {
  "text": "Yarışın uzunluğu değil, ritmin belirler.",
  "author": "Anonim"
 },
 {
  "text": "Maraton koşuyorsun, sprint değil.",
  "author": "Anonim"
 },
 {
  "text": "Tükenmemek için, tempoyu doğru seç.",
  "author": "Anonim"
 },
 {
  "text": "Bir günü kaçırdıysan, ikinciyi kaçırma.",
  "author": "Anonim"
 },
 {
  "text": "Zincirin kopmasına izin verme.",
  "author": "Jerry Seinfeld"
 },
 {
  "text": "Süreklilik, yoğunluktan önemlidir.",
  "author": "Anonim"
 },
 {
  "text": "Her gün 1 daha iyi, yılda 37 kat eder.",
  "author": "James Clear"
 },
 {
  "text": "Sistemini kur, hedef kendini halleder.",
  "author": "James Clear"
 },
 {
  "text": "Kimliğini değiştir, davranışın peşinden gelsin.",
  "author": "James Clear"
 },
 {
  "text": "Sen 'çalışan biri' değil, 'öğrenen biri'sin.",
  "author": "Anonim"
 },
 {
  "text": "Zihin dağınıkken masayı topla.",
  "author": "Anonim"
 },
 {
  "text": "Düzenli masa, düzenli zihin.",
  "author": "Anonim"
 },
 {
  "text": "Uykunu koru; hafıza uykuda pekişir.",
  "author": "Anonim"
 },
 {
  "text": "Su iç, beynin susuz çalışmaz.",
  "author": "Anonim"
 },
 {
  "text": "Hareket et, kan beynine gitsin.",
  "author": "Anonim"
 },
 {
  "text": "Kısa yürüyüş, uzun odaklanma getirir.",
  "author": "Anonim"
 },
 {
  "text": "Bedenini ihmal etme, zihnini taşıyan o.",
  "author": "Anonim"
 },
 {
  "text": "Kaygı, hazırlıkla azalır.",
  "author": "Anonim"
 },
 {
  "text": "Yapabileceğine odaklan, yapamayacağına değil.",
  "author": "Anonim"
 },
 {
  "text": "Kontrol edemediğini bırak.",
  "author": "Epiktetos"
 },
 {
  "text": "Olaylar değil, onlara bakışın seni üzer.",
  "author": "Epiktetos"
 },
 {
  "text": "Zor bir gün, zor bir hayat değildir.",
  "author": "Anonim"
 },
 {
  "text": "Bugün kötü geçtiyse, yarın yeni bir sayfadır.",
  "author": "Anonim"
 },
 {
  "text": "Geriye bakma, oraya gitmiyorsun.",
  "author": "Anonim"
 },
 {
  "text": "Dünün hatası, bugünün dersi olsun.",
  "author": "Anonim"
 },
 {
  "text": "Kendini affet, sonra devam et.",
  "author": "Anonim"
 },
 {
  "text": "Mükemmeliyetçilik, tamamlanmanın düşmanıdır.",
  "author": "Anonim"
 },
 {
  "text": "Bitmiş iyi, bitmemiş mükemmelden iyidir.",
  "author": "Anonim"
 },
 {
  "text": "İlerleme, mükemmellikten değerlidir.",
  "author": "Anonim"
 },
 {
  "text": "Yeterince iyi, çoğu zaman yeterlidir.",
  "author": "Anonim"
 },
 {
  "text": "Karşılaştırma, sevincin hırsızıdır.",
  "author": "Theodore Roosevelt"
 },
 {
  "text": "Herkesin yolu farklı, hızın da öyle.",
  "author": "Anonim"
 },
 {
  "text": "Kendi hızında ilerle, ama ilerle.",
  "author": "Anonim"
 },
 {
  "text": "Yolda kalmak, en hızlı olmaktan iyidir.",
  "author": "Anonim"
 },
 {
  "text": "Sonuçlar gecikir, ama gelmez değil.",
  "author": "Anonim"
 },
 {
  "text": "Bambu gibi ol; yıllarca kök sal, sonra fırla.",
  "author": "Anonim"
 },
 {
  "text": "Görünmeyen emek, görünen başarıyı doğurur.",
  "author": "Anonim"
 },
 {
  "text": "Sahnedeki iki saat, kulisteki iki bin saattir.",
  "author": "Anonim"
 },
 {
  "text": "Buzdağının görünen kısmı, sonuçtur.",
  "author": "Anonim"
 },
 {
  "text": "Kimse senin gece çalışmalarını görmez, sonucu görür.",
  "author": "Anonim"
 },
 {
  "text": "Sessizce çalış, gürültüyü başarın yapsın.",
  "author": "Anonim"
 },
 {
  "text": "Söz verme, göster.",
  "author": "Anonim"
 },
 {
  "text": "Plan yapmak kolay, uygulamak seçkindir.",
  "author": "Anonim"
 },
 {
  "text": "Bugün bir soru bile çözsen, dünden ilerisin.",
  "author": "Anonim"
 },
 {
  "text": "Sıfır gün olmasın; küçük de olsa bir şey yap.",
  "author": "Anonim"
 },
 {
  "text": "Momentum, en değerli varlığındır.",
  "author": "Anonim"
 },
 {
  "text": "Başladıktan sonra durmak, baştan başlamaktan zordur.",
  "author": "Anonim"
 },
 {
  "text": "Akışa gir; saatler dakika olsun.",
  "author": "Mihaly Csikszentmihalyi"
 },
 {
  "text": "Zor ama yapılabilir olan, en çok geliştirir.",
  "author": "Anonim"
 },
 {
  "text": "Kolay gelen, kalıcı olmaz.",
  "author": "Anonim"
 },
 {
  "text": "Beynin zorlanmayı sever, alışması zaman alır.",
  "author": "Anonim"
 },
 {
  "text": "Öğrenmek rahatsız edicidir; bu iyi bir işarettir.",
  "author": "Anonim"
 },
 {
  "text": "Kafan karıştıysa, öğreniyorsun demektir.",
  "author": "Anonim"
 },
 {
  "text": "Soru sormaktan utanma, bilmemekten değil.",
  "author": "Anonim"
 },
 {
  "text": "Yardım istemek güçsüzlük değil, akıllılıktır.",
  "author": "Anonim"
 },
 {
  "text": "Bir öğretmenin bir saati, senin on saatini kurtarır.",
  "author": "Anonim"
 },
 {
  "text": "Doğru kaynak, yarım yolu tamamlar.",
  "author": "Anonim"
 },
 {
  "text": "Kaynak biriktirme, kaynak bitir.",
  "author": "Anonim"
 },
 {
  "text": "Bir kitabı bitir, on kitaba başlama.",
  "author": "Anonim"
 },
 {
  "text": "Tekrar planı olmayan çalışma, unutmaya davettir.",
  "author": "Anonim"
 },
 {
  "text": "Unutma eğrisini yen: tekrar et.",
  "author": "Hermann Ebbinghaus"
 },
 {
  "text": "Aralıklı tekrar, hafızanın en iyi dostudur.",
  "author": "Anonim"
 },
 {
  "text": "Aktif hatırlama, pasif okumadan on kat etkilidir.",
  "author": "Anonim"
 },
 {
  "text": "Okuma, kendini test et.",
  "author": "Anonim"
 },
 {
  "text": "Yanlışını görmeden doğruyu öğrenemezsin.",
  "author": "Anonim"
 },
 {
  "text": "Hata defterin, en değerli kaynağındır.",
  "author": "Anonim"
 },
 {
  "text": "Aynı hatayı iki kez yapma; bir kez yeter.",
  "author": "Anonim"
 },
 {
  "text": "Yanlışı analiz et, doğrusunu içselleştir.",
  "author": "Anonim"
 },
 {
  "text": "Neden yanlış yaptığını bilmiyorsan, öğrenmedin.",
  "author": "Anonim"
 },
 {
  "text": "Çözemediğin soru, en çok öğreteceğin sorudur.",
  "author": "Anonim"
 },
 {
  "text": "Zorlu soru, seni zorlu rakiplerden ayırır.",
  "author": "Anonim"
 },
 {
  "text": "Herkesin yaptığını yapıp farklı sonuç bekleme.",
  "author": "Anonim"
 },
 {
  "text": "Fark, herkesin bıraktığı yerde devam etmektir.",
  "author": "Anonim"
 },
 {
  "text": "Son 10 dakika, ilk 10 dakikadan değerlidir.",
  "author": "Anonim"
 },
 {
  "text": "Bitirme gücü, başlama gücünden nadirdir.",
  "author": "Anonim"
 },
 {
  "text": "Yarım bırakılan konu, tam bir yüktür.",
  "author": "Anonim"
 },
 {
  "text": "Bugün kapat, yarın yeni aç.",
  "author": "Anonim"
 },
 {
  "text": "Her günün sonunda bir şey öğrenmiş ol.",
  "author": "Anonim"
 },
 {
  "text": "Öğrendiğini yaz, kalıcı olsun.",
  "author": "Anonim"
 },
 {
  "text": "Anlattığın kadar bilirsin.",
  "author": "Anonim"
 },
 {
  "text": "Arkadaşına anlat, kendine öğret.",
  "author": "Anonim"
 },
 {
  "text": "Birlikte çalışmak, yalnız çalışmayı güçlendirir.",
  "author": "Anonim"
 },
 {
  "text": "Doğru çevre, yarı motivasyondur.",
  "author": "Anonim"
 },
 {
  "text": "Seni geriye çeken ortamdan uzaklaş.",
  "author": "Anonim"
 },
 {
  "text": "Hedefini paylaşacağın kişiyi iyi seç.",
  "author": "Anonim"
 },
 {
  "text": "Destek iste, ama sorumluluğu devretme.",
  "author": "Anonim"
 },
 {
  "text": "Sorumluluk almak, kontrolü almaktır.",
  "author": "Anonim"
 },
 {
  "text": "Mazeret ile sonuç aynı cümlede olmaz.",
  "author": "Anonim"
 },
 {
  "text": "Bahane üretmek de bir emektir; onu çalışmaya harca.",
  "author": "Anonim"
 },
 {
  "text": "Zamanın yok değil, önceliğin farklı.",
  "author": "Anonim"
 },
 {
  "text": "Önceliklerini yaz, zamanın kendini gösterir.",
  "author": "Anonim"
 },
 {
  "text": "En önemli işi en zinde saatine koy.",
  "author": "Anonim"
 },
 {
  "text": "Sabah beyni, akşam beyninden keskindir.",
  "author": "Anonim"
 },
 {
  "text": "Bir saatini koru, günün değişsin.",
  "author": "Anonim"
 },
 {
  "text": "Programına sadık kal, ruh hâline değil.",
  "author": "Anonim"
 },
 {
  "text": "Bugün istemesen de otur; istek çalışırken gelir.",
  "author": "Anonim"
 },
 {
  "text": "Motivasyon eylemi değil, eylem motivasyonu doğurur.",
  "author": "Anonim"
 },
 {
  "text": "Harekete geç, his peşinden gelsin.",
  "author": "Anonim"
 },
 {
  "text": "İki dakika kuralı: sadece başla.",
  "author": "Anonim"
 },
 {
  "text": "Küçük başla, büyük bitir.",
  "author": "Anonim"
 },
 {
  "text": "Hedefi böl; parçalar yenilebilir.",
  "author": "Anonim"
 },
 {
  "text": "Bir fili yemenin yolu, lokma lokma yemektir.",
  "author": "Anonim"
 },
 {
  "text": "Uzun yolculuk, tek bir adımla başlar.",
  "author": "Lao Tzu"
 },
 {
  "text": "Yolu bilmek ile yürümek farklıdır.",
  "author": "Morpheus"
 },
 {
  "text": "Bilmek yetmez, uygulamak gerek.",
  "author": "Goethe"
 },
 {
  "text": "İstemek yetmez, yapmak gerek.",
  "author": "Goethe"
 },
 {
  "text": "Cesaret, korkunun yokluğu değil, ona rağmen yürümektir.",
  "author": "Nelson Mandela"
 },
 {
  "text": "Bir şey imkânsız görünür, yapılana kadar.",
  "author": "Nelson Mandela"
 },
 {
  "text": "Eğitim, dünyayı değiştirmek için en güçlü silahtır.",
  "author": "Nelson Mandela"
 },
 {
  "text": "Hayatta en hakiki mürşit ilimdir.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "Bir millet, irfan ordusuna sahip olmadıkça savaş meydanlarında ne kadar parlak zaferler elde ederse etsin sonuç alamaz.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "Benim manevi mirasım ilim ve akıldır.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "Gençliğe güveniyorum; çünkü gelecek onlarındır.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "Çalışmadan, öğrenmeden, yorulmadan rahat yaşamanın yollarını alışkanlık hâline getiren milletler, evvela haysiyetlerini kaybederler.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "Beni görmek demek mutlaka yüzümü görmek değildir.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "İlim ve fen nerede ise oradan alacağız.",
  "author": "Mustafa Kemal Atatürk"
 },
 {
  "text": "Okuyan, düşünen, üreten bir gençlik her şeyi başarır.",
  "author": "Anonim"
 },
 {
  "text": "Bir insanın değeri, koyduğu hedefin büyüklüğüyle ölçülür.",
  "author": "Marcus Aurelius"
 },
 {
  "text": "Engel yolun kendisidir.",
  "author": "Marcus Aurelius"
 },
 {
  "text": "Kendine hükmedebilen, dünyaya hükmeder.",
  "author": "Marcus Aurelius"
 },
 {
  "text": "Yapman gereken şeyi yap, gerisini düşünme.",
  "author": "Marcus Aurelius"
 },
 {
  "text": "Zihnin gücü, düşüncelerinin kalitesindedir.",
  "author": "Marcus Aurelius"
 },
 {
  "text": "İnsan, en çok hayalinde acı çeker.",
  "author": "Seneca"
 },
 {
  "text": "Bilge kişi, sahip olduklarıyla zengindir.",
  "author": "Seneca"
 },
 {
  "text": "Hazırlıklı olan, korkuyu tanımaz.",
  "author": "Seneca"
 },
 {
  "text": "Her yeni başlangıç, bir bitişten doğar.",
  "author": "Seneca"
 },
 {
  "text": "Talih, cesurdan yanadır.",
  "author": "Vergilius"
 },
 {
  "text": "Yapabileceğine inanıyorsan, yarı yoldasın.",
  "author": "Theodore Roosevelt"
 },
 {
  "text": "En iyi yapabildiğini, bulunduğun yerde, elindekiyle yap.",
  "author": "Theodore Roosevelt"
 },
 {
  "text": "Kimse rızan olmadan seni aşağılık hissettiremez.",
  "author": "Eleanor Roosevelt"
 },
 {
  "text": "Gelecek, hayallerinin güzelliğine inananlarındır.",
  "author": "Eleanor Roosevelt"
 },
 {
  "text": "Hayat bisiklet sürmek gibidir; dengede kalmak için ilerlemelisin.",
  "author": "Albert Einstein"
 },
 {
  "text": "Zekânın ölçüsü değişime uyum sağlama yeteneğidir.",
  "author": "Albert Einstein"
 },
 {
  "text": "Hiç hata yapmamış biri, hiç yeni bir şey denememiştir.",
  "author": "Albert Einstein"
 },
 {
  "text": "Hayal gücü bilgiden daha önemlidir.",
  "author": "Albert Einstein"
 },
 {
  "text": "Basitçe anlatamıyorsan, yeterince anlamamışsındır.",
  "author": "Albert Einstein"
 },
 {
  "text": "Başarılı olmaya değil, değerli olmaya çalış.",
  "author": "Albert Einstein"
 },
 {
  "text": "Sorunlar, onları yaratan düşünceyle çözülemez.",
  "author": "Albert Einstein"
 },
 {
  "text": "Deha, yüzde bir ilham, yüzde doksan dokuz terdir.",
  "author": "Thomas Edison"
 },
 {
  "text": "Başarısız olmadım; işe yaramayan on bin yol buldum.",
  "author": "Thomas Edison"
 },
 {
  "text": "Fırsatların çoğu iş tulumu giydiği için kaçırılır.",
  "author": "Thomas Edison"
 },
 {
  "text": "Yapabileceğine de yapamayacağına da inansan, haklısın.",
  "author": "Henry Ford"
 },
 {
  "text": "Bir araya gelmek başlangıç, birlikte çalışmak başarıdır.",
  "author": "Henry Ford"
 },
 {
  "text": "Engeller, gözünü hedeften ayırdığında gördüğün korkunç şeylerdir.",
  "author": "Henry Ford"
 },
 {
  "text": "Kalite, kimse bakmazken doğru olanı yapmaktır.",
  "author": "Henry Ford"
 },
 {
  "text": "Yaptığın işi sev, o zaman çalışmış olmazsın.",
  "author": "Konfüçyüs"
 },
 {
  "text": "Öğrenmek düşünmeden boştur, düşünmek öğrenmeden tehlikelidir.",
  "author": "Konfüçyüs"
 },
 {
  "text": "Bilen konuşmaz, konuşan bilmez.",
  "author": "Lao Tzu"
 },
 {
  "text": "Başkalarını bilen bilgedir, kendini bilen aydınlanmıştır.",
  "author": "Lao Tzu"
 },
 {
  "text": "Suyun yumuşaklığı, taşın sertliğini yener.",
  "author": "Lao Tzu"
 },
 {
  "text": "Planı olan, geleceği tasarlar.",
  "author": "Anonim"
 },
 {
  "text": "Bugünün seçimleri, yarının koşullarıdır.",
  "author": "Anonim"
 },
 {
  "text": "Kaderini emeğin çizer.",
  "author": "Anonim"
 },
 {
  "text": "Sonuçlar yalan söylemez, ama süreç de affetmez.",
  "author": "Anonim"
 },
 {
  "text": "Alışkanlık, kaderin sessiz mimarıdır.",
  "author": "Anonim"
 },
 {
  "text": "Kendi standardını yükselt.",
  "author": "Tony Robbins"
 },
 {
  "text": "Nerede odaklanırsan, enerjin oraya akar.",
  "author": "Tony Robbins"
 },
 {
  "text": "Karar anı, kader anıdır.",
  "author": "Tony Robbins"
 },
 {
  "text": "Başarı, sürekli küçük iyileştirmelerdir.",
  "author": "Anonim"
 },
 {
  "text": "Bir yüzde bir de olsa, bugün ilerle.",
  "author": "Anonim"
 },
 {
  "text": "Yolun sonuna değil, bir sonraki adıma bak.",
  "author": "Anonim"
 },
 {
  "text": "Bugün için savaş, yarın için plan yap.",
  "author": "Anonim"
 },
 {
  "text": "Sabır, en hızlı kısayoldur.",
  "author": "Anonim"
 },
 {
  "text": "Acele etme, ama durma.",
  "author": "Goethe"
 },
 {
  "text": "Yavaş ve istikrarlı, yarışı kazanır.",
  "author": "Ezop"
 },
 {
  "text": "Kuvvet ile değil, sebat ile kazanılır.",
  "author": "Ezop"
 },
 {
  "text": "Bir kırlangıç bahar getirmez; her gün çalış.",
  "author": "Ezop"
 },
 {
  "text": "Zor zamanlar, güçlü insanlar yaratır.",
  "author": "G. Michael Hopf"
 },
 {
  "text": "Rahatlık, potansiyelin mezarıdır.",
  "author": "Anonim"
 },
 {
  "text": "Konforun bedeli, pişmanlıktır.",
  "author": "Anonim"
 },
 {
  "text": "Disiplinin acısı, pişmanlığın acısından hafiftir.",
  "author": "Jim Rohn"
 },
 {
  "text": "Ya disiplinin acısını ya pişmanlığın acısını çekersin.",
  "author": "Jim Rohn"
 },
 {
  "text": "Kendini geliştirmek, en iyi yatırımdır.",
  "author": "Jim Rohn"
 },
 {
  "text": "Kolay olmasını dileme, daha iyi olmayı dile.",
  "author": "Jim Rohn"
 },
 {
  "text": "Sen, en çok vakit geçirdiğin beş kişinin ortalamasısın.",
  "author": "Jim Rohn"
 },
 {
  "text": "Öğrenmeyi bırakan, büyümeyi bırakır.",
  "author": "Anonim"
 },
 {
  "text": "Bugün öğrendiğin, yarın kimseye kaptırmayacağın şeydir.",
  "author": "Anonim"
 },
 {
  "text": "Bilgi, taşıması en hafif servettir.",
  "author": "Anonim"
 },
 {
  "text": "Kitap, taşınabilir bir akıl hocasıdır.",
  "author": "Anonim"
 },
 {
  "text": "Bir sayfa bile okusan, gün boşa gitmedi.",
  "author": "Anonim"
 },
 {
  "text": "Not al; hafıza yalancıdır, kâğıt sadık.",
  "author": "Anonim"
 },
 {
  "text": "Özet çıkarmak, öğrenmeyi ikiye katlar.",
  "author": "Anonim"
 },
 {
  "text": "Kendi cümlelerinle yaz, o zaman senin olur.",
  "author": "Anonim"
 },
 {
  "text": "Öğrenmenin en hızlı yolu, öğretmektir.",
  "author": "Seneca"
 },
 {
  "text": "Anlatarak öğrenirsin, dinleyerek tanışırsın.",
  "author": "Anonim"
 },
 {
  "text": "Sınav bir yarış değil, bir yansımadır.",
  "author": "Anonim"
 },
 {
  "text": "Puanın seni değil, emeğin seni tanımlar.",
  "author": "Anonim"
 },
 {
  "text": "Bir sınav, bir hayat değildir.",
  "author": "Anonim"
 },
 {
  "text": "Sonuç ne olursa olsun, emeğin senindir.",
  "author": "Anonim"
 },
 {
  "text": "Kendine iyi davran; en uzun yolculuğun yol arkadaşı sensin.",
  "author": "Anonim"
 },
 {
  "text": "Yorulduğunda dinlen, vazgeçme.",
  "author": "Anonim"
 },
 {
  "text": "Bugün için elinden gelenin en iyisi yeterlidir.",
  "author": "Anonim"
 },
 {
  "text": "Her gün en iyi gün olmaz; her gün bir gündür.",
  "author": "Anonim"
 },
 {
  "text": "Kötü günler, iyi günleri anlamlı kılar.",
  "author": "Anonim"
 },
 {
  "text": "Devam et; en zor kısım genelde sondan hemen öncedir.",
  "author": "Anonim"
 },
 {
  "text": "Hedefine bir gün daha yaklaştın.",
  "author": "Anonim"
 },
 {
  "text": "Yarın bugünkü çabana teşekkür edecek.",
  "author": "Anonim"
 },
 {
  "text": "Geleceğin, bugün oturduğun masada şekilleniyor.",
  "author": "Anonim"
 },
 {
  "text": "O hayal, senin emeğinle gerçek olacak.",
  "author": "Anonim"
 },
 {
  "text": "Sen yapabilirsin; çünkü daha zorlarını yaptın.",
  "author": "Anonim"
 },
 {
  "text": "Bugün başladığın şey, bir gün hikâyen olacak.",
  "author": "Anonim"
 },
 {
  "text": "İnandığın kadar gidersin, çalıştığın kadar varırsın.",
  "author": "Anonim"
 },
 {
  "text": "Hedefin seni sabah kaldıracak kadar net olsun.",
  "author": "Anonim"
 }
];
