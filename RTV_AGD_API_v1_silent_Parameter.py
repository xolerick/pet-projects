/*
# How to run it:
# 1. Update the 'productId' variable at the top of this code.
# 2. Open the RTV EURO AGD Product Page.
# 3. Press F12 (or right-click -> Inspect) to open Developer Tools.
# 4. Click on the Console tab.
# 5. Paste the code below and press Enter.
*/

(async () => {
    // --- SET YOUR PRODUCT ID HERE ---
    const productId = "1313903"; 
    // --------------------------------

    const cities = [
        "Andrychów", "Augustów", "Bartoszyce", "Bełchatów", "Biała Podlaska", "Białki", "Białogard", "Białystok",
        "Bielsk Podlaski", "Bielsko-Biała", "Biłgoraj", "Bochnia", "Bogatynia", "Bolesławiec", "Braniewo", "Brodnica",
        "Brzeg", "Brzesko", "Bydgoszcz", "Bytom", "Bytów", "Chełm", "Chojnice", "Chorzów", "Choszczno", "Chrzanów",
        "Ciechanów", "Cieszyn", "Czeladź", "Częstochowa", "Dąbrowa Górnicza", "Dębica", "Dęblin", "Działdowo", "Elbląg",
        "Ełk", "Garwolin", "Gdańsk", "Gdynia", "Giżycko", "Gliwice", "Głogów", "Gniezno", "Gorlice", "Gorzów Wielkopolski",
        "Gostyń", "Grodzisk Mazowiecki", "Grójec", "Grudziądz", "Gryfice", "Hrubieszów", "Iława", "Inowrocław", "Janki",
        "Jarocin", "Jarosław", "Jasło", "Jastrzębie Zdrój", "Jaworzno", "Jelenia Góra", "Kalisz", "Katowice", "Kędzierzyn-Koźle",
        "Kępno", "Kętrzyn", "Kęty", "Kielce", "Kłodzko", "Kluczbork", "Knurów", "Kobierzyce", "Koło", "Kołobrzeg", "Konin",
        "Końskie", "Kościan", "Kościerzyna", "Kostrzyn Nad Odrą", "Koszalin", "Kozienice", "Kraków", "Krasnystaw", "Krosno",
        "Krotoszyn", "Kutno", "Kwidzyn", "Lębork", "Łęczna", "Legionowo", "Legnica", "Leszno", "Limanowa", "Łódź", "Łomża",
        "Łowicz", "Lubań", "Lubartów", "Lubin", "Lublin", "Lubliniec", "Łuków", "Malbork", "Mielec", "Mikołów", "Mińsk Mazowiecki",
        "Mława", "Mrągowo", "Myślenice", "Mysłowice", "Myszków", "Namysłów", "Nowa Sól", "Nowy Dwór Mazowiecki", "Nowy Sącz",
        "Nowy Targ", "Nowy Tomyśl", "Nysa", "Oława", "Olecko", "Oleśnica", "Olkusz", "Olsztyn", "Opoczno", "Opole", "Ostróda",
        "Ostrołęka", "Ostrów Mazowiecka", "Ostrów Wielkopolski", "Ostrowiec Świętokrzyski", "Oświęcim", "Otwock", "Pabianice",
        "Piaseczno", "Piekary Śląskie", "Piła", "Piotrków Trybunalski", "Pisz", "Pleszew", "Płock", "Płońsk", "Police", "Polkowice",
        "Poznań", "Prudnik", "Pruszcz Gdański", "Pruszków", "Przasnysz", "Przemyśl", "Pszczyna", "Puck", "Puławy", "Pyskowice",
        "Racibórz", "Radom", "Radomsko", "Rawa Mazowiecka", "Rawicz", "Ruda Śląska", "Rumia", "Rybnik", "Rzeszów", "Sandomierz",
        "Sanok", "Siedlce", "Siemianowice Śląskie", "Sieradz", "Sierpc", "Skarżysko-Kamienna", "Skierniewice", "Skoczów", "Słupsk",
        "Sochaczew", "Sokołów Podlaski", "Solec Kujawski", "Sosnowiec", "Śrem", "Środa Wielkopolska", "Stalowa Wola", "Starachowice",
        "Stargard", "Starogard Gdański", "Stojadła", "Strzegom", "Strzelce Opolskie", "Suwałki", "Swarzędz", "Świdnica", "Świdnik",
        "Świdwin", "Świebodzin", "Świecie", "Świętochłowice", "Świnoujście", "Szamotuły", "Szczawno Zdrój", "Szczecin", "Szczecinek",
        "Szczytno", "Tarnobrzeg", "Tarnów", "Tarnowo Podgórne", "Tarnowskie Góry", "Tczew", "Tomaszów Lubelski", "Tomaszów Mazowiecki",
        "Toruń", "Trzcianka", "Turek", "Tychy", "Wadowice", "Warszawa", "Warszawa Białołęka", "Warszawa Mokotów", "Warszawa Ochota",
        "Warszawa Praga", "Warszawa Śródmieście", "Warszawa Wola/Żoliborz", "Wejherowo", "Wieluń", "Włocławek", "Wodzisław Śląski",
        "Wołomin", "Wolsztyn", "Wrocław", "Września", "Wyszków", "Zabrze", "Żagań", "Zakopane", "Zambrów", "Zamość", "Żary",
        "Zawiercie", "Zduńska Wola", "Zębowice", "Zgierz", "Zgorzelec", "Zielona Góra", "Żory", "Żyrardów", "Żywiec"
    ];

    const positiveStatuses = ["AVAILABLE", "RESERVE_AND_COLLECT", "RESERVATION_FOR_TOMORROW", "AVAILABLE_LOCALLY_IN_SHOP"];
    let totalShopsChecked = 0;
    let foundMatches = [];
    let statusCounts = {};

    console.log(`%c🚀 SCANNING FOR PRODUCT ID: ${productId}`, "color: white; background: #333; padding: 5px; font-weight: bold;");

    for (const city of cities) {
        try {
            const url = `https://www.euro.com.pl/rest/api/products/${productId}/shops?areaName=${encodeURIComponent(city)}`;
            const response = await fetch(url);
            if (response.status === 200) {
                const data = await response.json();
                console.log(`%c🏙️ City: ${city} (Shops: ${data.length})`, "font-weight: bold; text-decoration: underline; margin-top: 8px;");
                totalShopsChecked += data.length;
                data.forEach((shop, index) => {
                    const status = shop.productAvailability;
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                    const isPositive = positiveStatuses.includes(status);
                    let color = isPositive ? "green" : (status.includes("DISABLED") ? "red" : "#888");
                    if (isPositive) foundMatches.push({ City: city, ShopCode: shop.shopCode, Status: status });
                    console.log(`   ${index + 1}. "shopCode": "${shop.shopCode}", "productAvailability": "%c${status}%c"`, `color: ${color}; font-weight: bold;`, "color: inherit; font-weight: normal;");
                });
            }
        } catch (err) { console.error(`🔥 ${city}: Fetch Error`); }
        await new Promise(r => setTimeout(r, 400));
    }

    console.log("\n" + "=".repeat(60));
    console.log(`%c📊 FINAL SUMMARY FOR PRODUCT ID: ${productId}`, "color: white; background: blue; padding: 5px; font-weight: bold;");
    console.log(`Total Shops Scanned: ${totalShopsChecked}`);
    console.log("\n%cBREAKDOWN BY STATUS:", "font-weight: bold;");
    console.table(statusCounts);
    if (foundMatches.length > 0) {
        console.log(`\n%c✅ AVAILABLE IN FOLLOWING LOCATIONS (ID: ${productId}):`, "color: green; font-weight: bold; text-decoration: underline;");
        console.table(foundMatches);
    } else {
        console.log(`\n%c❌ No actionable stock found for ID ${productId} in any city.`, "color: red; font-weight: bold;");
    }
    console.log("=".repeat(60));
})();
