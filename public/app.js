/* Tidewander shared script: placeholder data (mirrors the ERD), tiny state store, nav bar, helpers.
   No database and no real login. State lives in localStorage when available. */
(function () {
  'use strict';

  /* ---------------- ERD-shaped placeholder data ---------------- */
  const D = (s) => s; // marker: timestamps are plain strings in the prototype

  // USERS: id, created_at, full_name, email, role
  const USERS = [
    { id: 'u-nour',   created_at: D('2026-09-02T10:12:00Z'), full_name: 'Nour Adel',    email: 'nour.adel@example.com',    role: 'tourist' },
    { id: 'u-amira',  created_at: D('2026-06-18T08:00:00Z'), full_name: 'Amira Hassan', email: 'amira.hassan@example.com', role: 'tour guide' },
    { id: 'u-karim',  created_at: D('2026-07-04T09:30:00Z'), full_name: 'Karim Nasser', email: 'karim.nasser@example.com', role: 'tour guide' },
    { id: 'u-claire', created_at: D('2026-07-21T14:45:00Z'), full_name: 'Claire Dubois', email: 'claire.dubois@example.com', role: 'tour guide' },
    { id: 'u-omar',   created_at: D('2026-08-11T12:20:00Z'), full_name: 'Omar Fathy',   email: 'omar.fathy@example.com',   role: 'trip planner' }
  ];
  const ROLES = ['tourist', 'tour guide', 'trip planner'];

  // LOCATION: id, created_at, name, country, description
  const LOCATIONS = [
    { id: 'loc-cairo', created_at: D('2026-05-01T08:00:00Z'), name: 'Cairo', country: 'Egypt',
      description: 'A 5,000-year-old capital where the pyramids sit at the edge of a city of 20 million. Come for the Giza plateau and the Grand Egyptian Museum, stay for tea in Islamic Cairo and dinner on a Nile felucca.' },
    { id: 'loc-paris', created_at: D('2026-05-01T08:05:00Z'), name: 'Paris', country: 'France',
      description: 'Boulevards, bridges and 20 arrondissements best covered on foot. Pair the big monuments with quiet museums, covered passages and long lunches in the 6th and 9th.' },
    { id: 'loc-sharm', created_at: D('2026-05-01T08:10:00Z'), name: 'Sharm El-Sheikh', country: 'Egypt',
      description: 'Red Sea reefs, desert nights and warm water through November. Snorkel Ras Mohammed by day, walk Naama Bay at dusk and finish with dinner under the Sinai stars.' }
  ];

  // PLACES: id, created_at, location_id, guide_id, name, category, address, description, booking_url, is_hidden_gem
  const P = (id, location_id, guide_id, name, category, address, description, booking_url, is_hidden_gem) =>
    ({ id, created_at: D('2026-06-01T09:00:00Z'), location_id, guide_id, name, category, address, description, booking_url, is_hidden_gem });
  const PLACES = [
    P('c1', 'loc-cairo', 'u-amira', 'Giza Pyramids and Sphinx', 'attraction', 'Pyramids Road, Al Haram, Giza',
      'The last surviving wonder of the ancient world. Walk the plateau, step inside the Great Pyramid if tickets are open, then take the panoramic viewpoint for the classic three-pyramid photo. Arrive when the gates open at 8:00 to beat the heat and the tour buses.',
      'https://example.com/book/giza-pyramids-entry', false),
    P('c2', 'loc-cairo', 'u-amira', 'Grand Egyptian Museum', 'attraction', 'Cairo-Alexandria Desert Road, Giza',
      'The largest archaeological museum in the world, with the full Tutankhamun collection under one roof and a view of the pyramids from the grand staircase. Book a timed entry slot and allow three hours.',
      'https://example.com/book/grand-egyptian-museum', false),
    P('c3', 'loc-cairo', 'u-karim', 'Khan el-Khalili Bazaar', 'attraction', 'El-Gamaleya, Islamic Cairo',
      'A 14th-century market of copper lanterns, spices, perfume oils and silver. Go in the late afternoon when the lanes cool down and the lamps come on. Start at about 60% of the first price and keep it friendly.',
      'https://example.com/book/islamic-cairo-walking-tour', false),
    P('c4', 'loc-cairo', 'u-karim', 'Fishawy Cafe', 'restaurant', '6 Al-Badistan Lane, Khan el-Khalili',
      'Open around the clock since 1773, with mirrors, brass tables and mint tea poured from tall pots. A good place to sit for an hour after the bazaar.',
      'https://example.com/book/fishawy-cafe', false),
    P('c5', 'loc-cairo', 'u-amira', 'Zooba Street Food', 'restaurant', '26 July Street, Zamalek',
      'Modern takes on Egyptian street food: koshary, ta\'ameya and baladi bread sandwiches in a bright, casual room. Easy first dinner after a flight.',
      'https://example.com/book/zooba-zamalek', false),
    P('c6', 'loc-cairo', 'u-karim', 'Wekalet El-Ghouri Tanoura Show', 'entertainment', 'Al-Azhar Street, Al-Gamaleya',
      'A free whirling-dervish performance in a restored Mamluk caravanserai, usually on Wednesday and Saturday evenings. Locals fill the courtyard, so come 30 minutes early for a seat on the steps.',
      'https://example.com/book/wekalet-el-ghouri', true),
    P('c7', 'loc-cairo', 'u-amira', 'Manial Palace of Prince Mohamed Ali', 'attraction', 'El-Saray Street, Al-Manial, Roda Island',
      'A palace complex mixing Ottoman, Persian and Moorish rooms, set in quiet gardens on Roda Island. Most visitors never make it here, so you can usually have the throne hall to yourself.',
      'https://example.com/book/manial-palace', true),
    P('c8', 'loc-cairo', 'u-omar', 'Nile Rose Boutique Hotel', 'hotel', 'Corniche El Nil, Garden City',
      '42 rooms with Nile views, a rooftop breakfast terrace and a ten-minute walk to Tahrir Square. Quiet at night, close to the metro.',
      'https://example.com/book/nile-rose-hotel', false),
    P('c9', 'loc-cairo', 'u-karim', 'Al-Azhar Park Hilltop Cafe', 'restaurant', 'Salah Salem Street, Al-Darb Al-Ahmar',
      'A terrace cafe inside the park with views over the citadel and the minarets of Islamic Cairo. Go for tea at 4:00 pm and stay for the call to prayer.',
      'https://example.com/book/al-azhar-park-cafe', true),

    P('p1', 'loc-paris', 'u-claire', 'Eiffel Tower', 'attraction', 'Champ de Mars, 5 Avenue Anatole France, 75007',
      'Take the stairs to the second floor for shorter queues, then the lift to the top for sunset. Book the first slot of the day or the last one for the quietest visit.',
      'https://example.com/book/eiffel-tower', false),
    P('p2', 'loc-paris', 'u-claire', 'Louvre Museum', 'attraction', 'Rue de Rivoli, 75001',
      'Skip the pyramid queue by entering through the Carrousel gallery. Pick three wings and leave the rest, because the museum is bigger than any single visit.',
      'https://example.com/book/louvre-museum', false),
    P('p3', 'loc-paris', 'u-claire', 'Cafe de Flore', 'restaurant', '172 Boulevard Saint-Germain, 75006',
      'The Saint-Germain institution for a long breakfast or a hot chocolate. Sit on the terrace and watch the boulevard.',
      'https://example.com/book/cafe-de-flore', false),
    P('p4', 'loc-paris', 'u-claire', 'Musee de la Vie Romantique', 'attraction', '16 Rue Chaptal, 75009',
      'A small townhouse museum with a hidden tea garden. Entry to the permanent collection is free and the garden is empty on weekday mornings.',
      'https://example.com/book/musee-vie-romantique', true),
    P('p5', 'loc-paris', 'u-claire', 'Promenade Plantee', 'attraction', '1 Coulee verte Rene-Dumont, 75012',
      'A planted walkway built on an old railway viaduct, three metres above the street. Start at Bastille and walk east for about 4.7 km of roses, arches and craft studios.',
      'https://example.com/book/coulee-verte-walk', true),
    P('p6', 'loc-paris', 'u-omar', 'Maison Rose Montmartre', 'hotel', '9 Rue Lepic, 75018',
      'A 28-room hotel with a pink facade on a Montmartre side street. Breakfast is served in the courtyard from 7:30.',
      'https://example.com/book/maison-rose-montmartre', false),
    P('p7', 'loc-paris', 'u-claire', 'Seine Evening Cruise', 'entertainment', 'Port de la Bourdonnais, 75007',
      'A 70-minute cruise past Notre-Dame, the Louvre and the Eiffel Tower as the lights come on. Take the upper deck.',
      'https://example.com/book/seine-evening-cruise', false),

    P('s1', 'loc-sharm', 'u-karim', 'Ras Mohammed National Park', 'attraction', 'Ras Mohammed, South Sinai',
      'The reef-lined tip of the Sinai Peninsula with clear water and walls of coral. Join a boat day trip with two snorkel stops, and bring reef-safe sunscreen.',
      'https://example.com/book/ras-mohammed-trip', false),
    P('s2', 'loc-sharm', 'u-karim', 'Naama Bay Promenade', 'attraction', 'Naama Bay, Sharm El-Sheikh',
      'The main seafront strip with cafes, shisha terraces and shops. Busiest after 8:00 pm, so go at sunset for a calmer walk.',
      'https://example.com/book/naama-bay-evening', false),
    P('s3', 'loc-sharm', 'u-amira', 'Fares Seafood House', 'restaurant', 'Fares Cape, Naama Bay',
      'Pick your fish from the ice display and have it grilled with garlic and lemon. Tables on the beach side go first, so reserve for sunset.',
      'https://example.com/book/fares-seafood-house', false),
    P('s4', 'loc-sharm', 'u-karim', 'Shark\'s Bay Coral Garden', 'attraction', 'Shark\'s Bay, Sharm El-Sheikh',
      'A sheltered reef you can reach from the beach, with parrotfish and clownfish in shallow water. Quiet before 10:00 am.',
      'https://example.com/book/sharks-bay-snorkel', true),
    P('s5', 'loc-sharm', 'u-amira', 'Sinai Starlight Desert Dinner', 'entertainment', 'Bedouin camp, Nabq Protected Area',
      'A Bedouin-hosted dinner with lamb, flatbread baked on coals, tea and a sky with almost no light pollution. Pickup from your hotel is included.',
      'https://example.com/book/sinai-starlight-dinner', true),
    P('s6', 'loc-sharm', 'u-omar', 'Coral Rose Resort', 'hotel', 'Hadaba, Sharm El-Sheikh',
      'A low-rise resort with a private reef platform and a house reef you can snorkel from the pier. Free shuttle to Naama Bay.',
      'https://example.com/book/coral-rose-resort', false)
  ];

  /* ---- more cities (v3) ---- */
  USERS.push(
    { id: 'u-mehmet',  created_at: D('2026-07-30T09:00:00Z'), full_name: 'Mehmet Yilmaz',  email: 'mehmet.yilmaz@example.com',  role: 'tour guide' },
    { id: 'u-giulia',  created_at: D('2026-08-02T09:00:00Z'), full_name: 'Giulia Romano',  email: 'giulia.romano@example.com',  role: 'tour guide' },
    { id: 'u-eleni',   created_at: D('2026-08-05T09:00:00Z'), full_name: 'Eleni Papas',    email: 'eleni.papas@example.com',    role: 'tour guide' },
    { id: 'u-layla',   created_at: D('2026-08-09T09:00:00Z'), full_name: 'Layla Mansoor',  email: 'layla.mansoor@example.com',  role: 'tour guide' },
    { id: 'u-youssef', created_at: D('2026-08-14T09:00:00Z'), full_name: 'Youssef Benali', email: 'youssef.benali@example.com', role: 'tour guide' }
  );
  const NL = (id, name, country, description) => ({ id, created_at: D('2026-05-01T08:15:00Z'), name, country, description });
  LOCATIONS.push(
    NL('loc-istanbul', 'Istanbul', 'Turkey', 'A city across two continents, where ferries cross the Bosphorus every few minutes. Pair the big monuments of Sultanahmet with quiet Byzantine churches and meze dinners in Karakoy.'),
    NL('loc-rome', 'Rome', 'Italy', 'Two thousand years of history within walking distance of each other. Start early at the Colosseum, then slow down with hilltop gardens, trattorias and a sunset ride.'),
    NL('loc-santorini', 'Santorini', 'Greece', 'A crescent-shaped volcanic island with white villages on the caldera rim. Go for sunsets in Oia, then explore the quieter south for beaches, ruins and wine.'),
    NL('loc-dubai', 'Dubai', 'United Arab Emirates', 'Record-breaking towers, old creek-side souks and desert camps an hour away. Keep midday indoors in summer and spend the evenings outside.'),
    NL('loc-marrakech', 'Marrakech', 'Morocco', 'A walled medina of red-clay lanes, riad courtyards and market squares. Wander the souks in the morning and return to a rooftop for sunset.')
  );
  PLACES.push(
    P('t1', 'loc-istanbul', 'u-mehmet', 'Hagia Sophia', 'attraction', 'Sultan Ahmet, Ayasofya Meydani, Fatih',
      'A sixth-century domed landmark that has served as a church, a mosque and a museum. Go early in the morning and look up at the central dome.', 'https://example.com/book/hagia-sophia', false),
    P('t2', 'loc-istanbul', 'u-mehmet', 'Topkapi Palace', 'attraction', 'Cankurtaran, Fatih',
      'The sultans\' palace above the Bosphorus, with courtyards, the Harem and the treasury. Allow three hours and buy the Harem ticket separately.', 'https://example.com/book/topkapi-palace', false),
    P('t3', 'loc-istanbul', 'u-mehmet', 'Grand Bazaar', 'attraction', 'Beyazit, Kapalicarsi, Fatih',
      'One of the oldest covered markets in the world, with thousands of shops selling ceramics, lamps, leather and textiles. Go on a weekday morning and keep small notes for tea and bargaining.', 'https://example.com/book/grand-bazaar-walk', false),
    P('t4', 'loc-istanbul', 'u-mehmet', 'Karakoy Meze House', 'restaurant', 'Kemankes Caddesi, Karakoy',
      'Small plates of marinated fish, stuffed vine leaves and grilled octopus. Sit by the window and order several to share.', 'https://example.com/book/karakoy-meze-house', false),
    P('t5', 'loc-istanbul', 'u-mehmet', 'Chora Church', 'attraction', 'Kariye, Edirnekapi, Fatih',
      'A small Byzantine church covered in 14th-century mosaics and frescoes, away from the main tourist route. Quiet before 11:00.', 'https://example.com/book/chora-church', true),
    P('t6', 'loc-istanbul', 'u-mehmet', 'Kuzguncuk Neighbourhood Walk', 'attraction', 'Kuzguncuk, Uskudar',
      'A quiet Bosphorus-side neighbourhood of wooden houses and small bookshops, with a church, a synagogue and a mosque on the same street. Take the ferry from Besiktas and walk up from the pier.', 'https://example.com/book/kuzguncuk-walk', true),
    P('t7', 'loc-istanbul', 'u-mehmet', 'Whirling Dervish Ceremony', 'entertainment', 'Hocapasa Sokak, Sirkeci',
      'A 50-minute Sufi sema ceremony in a restored hammam. Arrive early for a seat near the front.', 'https://example.com/book/whirling-dervish-ceremony', false),
    P('t8', 'loc-istanbul', 'u-omar', 'Bosphorus Sand Hotel', 'hotel', 'Ortakoy, Besiktas',
      '36 rooms with strait views, a terrace breakfast and a short walk to the ferry pier.', 'https://example.com/book/bosphorus-sand-hotel', false),

    P('r1', 'loc-rome', 'u-giulia', 'Colosseum and Roman Forum', 'attraction', 'Piazza del Colosseo',
      'The amphitheatre and the ruins of the ancient city centre on one combined ticket. Book the first entry slot and bring water.', 'https://example.com/book/colosseum-forum', false),
    P('r2', 'loc-rome', 'u-giulia', 'Vatican Museums and St Peter\'s Basilica', 'attraction', 'Viale Vaticano',
      'Long galleries ending in the Sistine Chapel, with the basilica next door. Book a timed ticket and cover your shoulders and knees.', 'https://example.com/book/vatican-museums', false),
    P('r3', 'loc-rome', 'u-giulia', 'Pantheon', 'attraction', 'Piazza della Rotonda',
      'A 2,000-year-old temple with a concrete dome and an open oculus. Go early or after 6:00 pm for fewer people.', 'https://example.com/book/pantheon', false),
    P('r4', 'loc-rome', 'u-giulia', 'Trattoria Trastevere Lantern', 'restaurant', 'Via della Lungaretta, Trastevere',
      'Cacio e pepe, supplì and house wine in a lantern-lit room. Reserve for dinner, because walk-ins queue.', 'https://example.com/book/trattoria-trastevere-lantern', false),
    P('r5', 'loc-rome', 'u-giulia', 'Giardino degli Aranci', 'attraction', 'Via di Santa Sabina, Aventino',
      'A hilltop orange-tree garden on the Aventine with a view over the Tiber and the dome of St Peter\'s. Free, and calm at sunset.', 'https://example.com/book/giardino-degli-aranci', true),
    P('r6', 'loc-rome', 'u-giulia', 'Quartiere Coppede', 'attraction', 'Piazza Mincio, Trieste district',
      'A fairy-tale cluster of Art Nouveau buildings with towers, frescoes and a fountain. It takes twenty minutes and few visitors find it.', 'https://example.com/book/quartiere-coppede', true),
    P('r7', 'loc-rome', 'u-giulia', 'Sunset Vespa Ride', 'entertainment', 'Meeting point: Via dei Fori Imperiali',
      'A guided two-hour ride past the Aventine, the river and the Janiculum at golden hour. Helmets and a local rider are included.', 'https://example.com/book/sunset-vespa-ride', false),
    P('r8', 'loc-rome', 'u-omar', 'Casa Sabbia Rome', 'hotel', 'Via dei Cestari, Centro Storico',
      'A 22-room townhouse with a roof terrace, five minutes on foot from the Pantheon.', 'https://example.com/book/casa-sabbia-rome', false),

    P('u1', 'loc-santorini', 'u-eleni', 'Oia Sunset Viewpoint', 'attraction', 'Oia Castle, Oia',
      'The classic caldera view over blue domes and white walls. Arrive 90 minutes before sunset and walk on to the castle ruins for more space.', 'https://example.com/book/oia-sunset-walk', false),
    P('u2', 'loc-santorini', 'u-eleni', 'Fira Old Town', 'attraction', 'Fira',
      'Cliff-edge lanes, small museums and cafes above the caldera. Walk the rim path toward Firostefani for the quieter view.', 'https://example.com/book/fira-old-town-walk', false),
    P('u3', 'loc-santorini', 'u-eleni', 'Akrotiri Archaeological Site', 'attraction', 'Akrotiri',
      'A Bronze Age town preserved under volcanic ash and covered by a large roof, so it works in any weather. Allow 90 minutes.', 'https://example.com/book/akrotiri-site', false),
    P('u4', 'loc-santorini', 'u-eleni', 'Ammoudi Seafood Tavern', 'restaurant', 'Ammoudi Bay, Oia',
      'Grilled octopus and fresh fish at the water\'s edge below Oia. Reach it by the steps or by taxi, and book a sunset table.', 'https://example.com/book/ammoudi-seafood-tavern', false),
    P('u5', 'loc-santorini', 'u-eleni', 'Vlychada Beach', 'attraction', 'Vlychada',
      'A dark-sand beach backed by pale, wind-carved volcanic cliffs. Go in the morning and bring shoes for the hot sand.', 'https://example.com/book/vlychada-beach', true),
    P('u6', 'loc-santorini', 'u-eleni', 'Pyrgos Village', 'attraction', 'Pyrgos Kallistis',
      'A hilltop village of narrow lanes and a ruined Venetian castle, with a view across the whole island. Come for a late-afternoon walk.', 'https://example.com/book/pyrgos-village', true),
    P('u7', 'loc-santorini', 'u-eleni', 'Caldera Winery Sunset Tasting', 'entertainment', 'Megalochori road',
      'A tasting of Assyrtiko and Vinsanto on a terrace as the sun goes down. Reserve a day ahead.', 'https://example.com/book/caldera-winery-tasting', false),
    P('u8', 'loc-santorini', 'u-omar', 'Blue Dome Cave Suites', 'hotel', 'Firostefani',
      'Nine cave suites with plunge pools carved into the cliff. Ask for an east-facing room if you prefer a quiet morning.', 'https://example.com/book/blue-dome-cave-suites', false),

    P('d1', 'loc-dubai', 'u-layla', 'Burj Khalifa and Dubai Mall', 'attraction', 'Sheikh Mohammed bin Rashid Boulevard, Downtown Dubai',
      'The tallest building in the world, with an observation deck above the city, next to a huge mall and an evening fountain show. Book the sunset slot.', 'https://example.com/book/burj-khalifa', false),
    P('d2', 'loc-dubai', 'u-layla', 'Al Fahidi Historical District', 'attraction', 'Al Fahidi, Bur Dubai',
      'Wind-tower houses, small galleries and courtyard cafes in the old Bur Dubai quarter. Walk it in the morning before it heats up.', 'https://example.com/book/al-fahidi-walk', false),
    P('d3', 'loc-dubai', 'u-layla', 'Gold and Spice Souks', 'attraction', 'Deira, Old Dubai',
      'Covered lanes of gold jewellery and open sacks of saffron, frankincense and dried limes, reached by abra across the Creek. Go after 5:00 pm.', 'https://example.com/book/gold-spice-souks', false),
    P('d4', 'loc-dubai', 'u-layla', 'Majlis Emirati Kitchen', 'restaurant', 'Al Seef, Bur Dubai',
      'Machboos, harees and luqaimat in a majlis-style dining room. A gentle introduction to Emirati home cooking.', 'https://example.com/book/majlis-emirati-kitchen', false),
    P('d5', 'loc-dubai', 'u-layla', 'Alserkal Avenue', 'attraction', 'Al Quoz 1',
      'Warehouse galleries, a cinema and specialty cafes in an industrial district. Check opening days before you go.', 'https://example.com/book/alserkal-avenue', true),
    P('d6', 'loc-dubai', 'u-layla', 'Ras Al Khor Flamingo Hides', 'attraction', 'Ras Al Khor Wildlife Sanctuary',
      'Free viewing hides over a wetland where flamingos gather in the cooler months. Bring a zoom lens and visit at golden hour.', 'https://example.com/book/ras-al-khor-hides', true),
    P('d7', 'loc-dubai', 'u-layla', 'Desert Safari and Dinner', 'entertainment', 'Dubai Desert Conservation Reserve',
      'Dune driving, a camel ride and a barbecue dinner under the stars at a desert camp. Hotel pickup is included.', 'https://example.com/book/desert-safari-dinner', false),
    P('d8', 'loc-dubai', 'u-omar', 'Creekside Sand Hotel', 'hotel', 'Baniyas Road, Deira',
      'A 60-room hotel on the Creek with a rooftop pool and an abra stop at the door.', 'https://example.com/book/creekside-sand-hotel', false),

    P('m1', 'loc-marrakech', 'u-youssef', 'Jemaa el-Fnaa', 'attraction', 'Jemaa el-Fnaa, Medina',
      'The main square of the old city. Quiet by day, then filled with food stalls, storytellers and musicians after sunset. Keep your phone and bag close.', 'https://example.com/book/jemaa-el-fnaa-tour', false),
    P('m2', 'loc-marrakech', 'u-youssef', 'Bahia Palace', 'attraction', 'Rue Riad Zitoun el Jdid, Medina',
      'A 19th-century palace of painted cedar ceilings, zellige tiles and shaded courtyards. Go when it opens to avoid tour groups.', 'https://example.com/book/bahia-palace', false),
    P('m3', 'loc-marrakech', 'u-youssef', 'Jardin Majorelle', 'attraction', 'Rue Yves Saint Laurent, Gueliz',
      'A cobalt-blue garden and villa with cacti, bamboo and a small Berber museum. Buy your ticket online.', 'https://example.com/book/jardin-majorelle', false),
    P('m4', 'loc-marrakech', 'u-youssef', 'Souk Semmarine', 'attraction', 'Souk Semmarine, Medina',
      'The main covered market street, selling slippers, lanterns, spices and textiles. The side lanes are quieter and usually cheaper.', 'https://example.com/book/souk-semmarine', false),
    P('m5', 'loc-marrakech', 'u-youssef', 'Rooftop Tagine Kitchen', 'restaurant', 'Rue Mouassine, Medina',
      'Slow-cooked tagines and mint tea on a rooftop above the spice market. Book a sunset table.', 'https://example.com/book/rooftop-tagine-kitchen', false),
    P('m6', 'loc-marrakech', 'u-youssef', 'The Secret Garden', 'attraction', 'Rue Mouassine, Medina',
      'A restored Islamic garden hidden inside the medina, with a tower and a view over the rooftops. Calm in the morning.', 'https://example.com/book/secret-garden-medina', true),
    P('m7', 'loc-marrakech', 'u-youssef', 'Mellah Spice Market', 'attraction', 'Place des Ferblantiers, Mellah',
      'The old Jewish quarter\'s market, with fewer visitors than the main souks. A good place to buy saffron and ras el hanout at local prices.', 'https://example.com/book/mellah-spice-market', true),
    P('m8', 'loc-marrakech', 'u-omar', 'Riad Dune Blue', 'hotel', 'Derb Sidi Bouamar, Medina',
      'A 12-room riad with a courtyard pool and a rooftop terrace, on a quiet lane off the main square.', 'https://example.com/book/riad-dune-blue', false),
    P('m9', 'loc-marrakech', 'u-youssef', 'Palmeraie Sunset Camel Ride', 'entertainment', 'Palmeraie, Marrakech',
      'A one-hour ride through the palm grove at sunset, ending with mint tea.', 'https://example.com/book/palmeraie-camel-ride', false)
  );

  const CATS = {
    attraction:    { label: 'Attraction',    plural: 'Attractions',    icon: 'landmark' },
    restaurant:    { label: 'Restaurant',    plural: 'Restaurants',    icon: 'utensils' },
    hotel:         { label: 'Hotel',         plural: 'Hotels',         icon: 'bed' },
    entertainment: { label: 'Entertainment', plural: 'Entertainment',  icon: 'star' }
  };
  const INTERESTS = ['History', 'Food', 'Hidden gems', 'Nightlife', 'Nature', 'Shopping', 'Art'];

  // TRIPS: id, created_at, user_id, location_id, title, start_date, end_date, budget, interests, is_shared
  // TRIP_ITEMS: id, created_at, trip_id, place_id, planned_at, sort_order, notes
  // TRIP_SHARES: id, created_at, trip_id, share_token, is_active
  function demoState() {
    const trip = { id: 'trip-1', created_at: '2026-10-14T13:58:00Z', user_id: 'u-nour', location_id: 'loc-cairo',
      title: 'Cairo in three days', start_date: '2026-11-12', end_date: '2026-11-14', budget: 900,
      interests: 'History, Food, Hidden gems', is_shared: false };
    const it = (n, place_id, planned_at, notes) => ({ id: 'ti-' + n, created_at: '2026-10-14T14:02:00Z', trip_id: 'trip-1', place_id, planned_at, sort_order: n, notes });
    return {
      trip,
      items: [
        it(1, 'c8', '2026-11-12T15:00', 'Check in. Ask for a Nile-view room on a high floor.'),
        it(2, 'c3', '2026-11-12T17:30', 'Lamps come on around sunset. Bring small notes for bargaining.'),
        it(3, 'c4', '2026-11-12T20:00', 'Mint tea at a table in the alley.'),
        it(4, 'c1', '2026-11-13T09:00', 'Gates open at 8:00. Bring water and a hat.'),
        it(5, 'c2', '2026-11-13T13:30', 'Timed entry booked for 13:30. Allow three hours.'),
        it(6, 'c5', '2026-11-13T19:30', 'Try the koshary and the sweet potato falafel.'),
        it(7, 'c7', '2026-11-14T10:00', 'Closes at 4:00 pm. Ask for the hunting museum wing.'),
        it(8, 'c9', '2026-11-14T15:30', 'Take a taxi up. The view is best before sunset.'),
        it(9, 'c6', '2026-11-14T19:00', 'Saturday show. Arrive 30 minutes early for a step seat.')
      ],
      share: { id: 'ts-1', created_at: '2026-10-14T14:10:00Z', trip_id: 'trip-1', share_token: '', is_active: false }
    };
  }

  /* ---------------- tiny store ---------------- */
  const mem = {};
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); if (v) return JSON.parse(v); } catch (e) { /* storage blocked */ }
    return key in mem ? mem[key] : fallback;
  }
  function save(key, value) {
    mem[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  const getState = () => load('rw_state_v1', null) || demoState();
  const setState = (s) => save('rw_state_v1', s);
  const getUser = () => load('rw_user_v1', null);
  const setUser = (u) => save('rw_user_v1', u);
  function resetAll() {
    mem.rw_state_v1 = null; mem.rw_user_v1 = null;
    try { localStorage.removeItem('rw_state_v1'); localStorage.removeItem('rw_user_v1'); } catch (e) { /* ignore */ }
  }

  /* ---------------- helpers ---------------- */
  const byId = (list, id) => list.find((x) => x.id === id);
  const loc = (id) => byId(LOCATIONS, id);
  const place = (id) => byId(PLACES, id);
  const user = (id) => byId(USERS, id);
  const placesIn = (locId) => PLACES.filter((p) => p.location_id === locId);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function hashParam(fallbackKey, validate) {
    const h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (h && validate(h)) { save(fallbackKey, h); return h; }
    const last = load(fallbackKey, null);
    return last && validate(last) ? last : null;
  }
  const currentLocation = () => loc(hashParam('rw_last_loc', (v) => !!loc(v)) || LOCATIONS[0].id);
  const currentPlace = () => place(hashParam('rw_last_place', (v) => !!place(v)) || PLACES[0].id);

  const PATHS = {
    home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    plus: 'M12 5v14M5 12h14',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    landmark: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6z',
    utensils: 'M6 3v8a2 2 0 0 0 2 2v8M10 3v8a2 2 0 0 1-2 2M18 21V3c-2.5 1-4 4-4 8h4',
    bed: 'M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 12.5h.01',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    gem: 'M6 3h12l4 6-10 12L2 9zM2 9h20M9 9l3 12 3-12M9 9l3-6 3 6',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    check: 'M5 12l5 5 9-10',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14'
  };
  function icon(name) {
    const p = PATHS[name] || '';
    const inner = p.charAt(0) === '<' ? p : '<path d="' + p + '"/>';
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>';
  }
  const locClass = (id) => 'loc-' + String(id).replace('loc-', '');
  function tile(p, extra) {
    return '<div class="tile ' + locClass(p.location_id) + (extra ? ' ' + extra : '') + '" aria-hidden="true">' +
      icon(p.is_hidden_gem ? 'gem' : CATS[p.category].icon) + '</div>';
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function parseDate(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDay(s) { const d = parseDate(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function fmtRange(a, b) { const x = parseDate(a), y = parseDate(b); return x.getDate() + ' ' + MONTHS[x.getMonth()] + ' to ' + y.getDate() + ' ' + MONTHS[y.getMonth()] + ' ' + y.getFullYear(); }
  const fmtTime = (s) => String(s).slice(11, 16);
  const nightsDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000) + 1;
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

  /* Fake "AI planner": picks places that match the interests, 3 per day, no repeats until the list runs out. */
  function generateTrip(form) {
    const days = Math.min(Math.max(nightsDays(form.start_date, form.end_date), 1), 7);
    const wanted = form.interests.toLowerCase();
    const score = (p) => {
      let s = 0;
      if (/history|art/.test(wanted) && p.category === 'attraction') s += 2;
      if (/food/.test(wanted) && p.category === 'restaurant') s += 2;
      if (/hidden/.test(wanted) && p.is_hidden_gem) s += 3;
      if (/night/.test(wanted) && p.category === 'entertainment') s += 2;
      if (/nature/.test(wanted) && /reef|park|garden|desert|promenade|beach|wetland|flamingo/i.test(p.name + p.description)) s += 2;
      if (/shopping/.test(wanted) && /bazaar|shop|market|souk/i.test(p.name + p.description)) s += 2;
      return s;
    };
    const pool = placesIn(form.location_id).filter((p) => p.category !== 'hotel').map((p, i) => ({ p, s: score(p), i }))
      .sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.p);
    const hotel = placesIn(form.location_id).find((p) => p.category === 'hotel');
    const slots = ['09:30', '13:00', '17:30'];
    const id = 'trip-' + Date.now().toString(36);
    const items = [];
    let n = 1;
    const start = parseDate(form.start_date);
    if (hotel) { items.push({ id: 'ti-' + n, created_at: new Date().toISOString(), trip_id: id, place_id: hotel.id, planned_at: iso(start) + 'T15:00', sort_order: n++, notes: 'Check in and drop your bags.' }); }
    for (let d = 0; d < days; d++) {
      const date = new Date(start); date.setDate(start.getDate() + d);
      const dayPlaces = [];
      for (let k = 0; k < 3; k++) { if (d * 3 + k < pool.length) dayPlaces.push(pool[d * 3 + k]); }
      dayPlaces.sort((a, b) => ['restaurant', 'attraction', 'entertainment', 'hotel'].indexOf(a.category) - ['restaurant', 'attraction', 'entertainment', 'hotel'].indexOf(b.category));
      // attractions in the morning, food at lunch, entertainment in the evening
      const order = dayPlaces.slice().sort((a, b) => rank(a) - rank(b));
      order.forEach((p, k) => {
        items.push({ id: 'ti-' + n, created_at: new Date().toISOString(), trip_id: id, place_id: p.id, planned_at: iso(date) + 'T' + slots[k], sort_order: n++, notes: '' });
      });
    }
    function rank(p) { return p.category === 'attraction' ? 0 : p.category === 'restaurant' ? 1 : 2; }
    const trip = { id, created_at: new Date().toISOString(), user_id: (getUser() || {}).id || 'u-nour', location_id: form.location_id,
      title: form.title, start_date: form.start_date, end_date: form.end_date, budget: form.budget === '' ? null : Number(form.budget),
      interests: form.interests, is_shared: form.is_shared };
    return { trip, items, share: { id: 'ts-' + id, created_at: new Date().toISOString(), trip_id: id, share_token: '', is_active: false } };
  }

  /* ---------------- nav bar + header ---------------- */
  const NAV = [
    { href: 'index.html', label: 'Explore', icon: 'compass', key: 'index' },
    { href: 'destination.html', label: 'Destination', icon: 'pin', key: 'destination' },
    { href: 'create-trip.html', label: 'New trip', icon: 'plus', key: 'create-trip' },
    { href: 'itinerary.html', label: 'Itinerary', icon: 'list', key: 'itinerary' },
    { href: 'place.html', label: 'Place', icon: 'landmark', key: 'place' },
    { href: 'login.html', label: 'Sign in', icon: 'user', key: 'login' }
  ];
  function pageKey() {
    const f = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    return f || 'index';
  }
  function renderChrome() {
    const host = document.getElementById('chrome');
    if (!host) return;
    const key = pageKey();
    const u = getUser();
    const links = NAV.map((n) => {
      const label = n.key === 'login' && u ? 'Account' : n.label;
      return '<a href="' + n.href + '"' + (n.key === key ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + label + '</span></a>';
    }).join('');
    const me = u ? '<a class="me" href="login.html" aria-label="Account"><b>' + esc(u.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()) + '</b><span>' + esc(u.full_name) + '</span></a>' : '';
    host.innerHTML =
      '<header class="app-header"><div class="bar">' +
      '<a class="brand" href="index.html"><span class="mark">' + icon('compass') + '</span>Tidewander</a><span class="spacer"></span>' +
      '<nav class="nav" aria-label="Main">' + links + '</nav>' + me + '</div></header>';
  }

  let toastTimer;
  function toast(html) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = html; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3600);
  }

  function placeRow(p, withLocation) {
    const l = loc(p.location_id);
    return '<a class="place" href="place.html#' + p.id + '">' + tile(p) +
      '<div class="info"><h3>' + esc(p.name) + '</h3>' +
      '<div class="tags"><span class="pill">' + esc(CATS[p.category].label) + '</span>' +
      (p.is_hidden_gem ? '<span class="pill gem">' + icon('gem') + 'Hidden gem</span>' : '') +
      (withLocation ? '<span class="pill">' + esc(l.name) + '</span>' : '') + '</div>' +
      '<p class="addr">' + esc(p.address) + '</p></div></a>';
  }

  /* ================= v2 additions: map, prompt parser, cards ================= */
  const dayColor = (i) => 'var(--day' + ((((i % 6) + 6) % 6) + 1) + ')';

  // Schematic positions (0-100 grid) for the prototype map. Display only, not ERD columns.
  const POS = { c1: [20, 74], c2: [12, 86], c3: [80, 30], c4: [84, 26], c5: [51, 28], c6: [74, 40], c7: [54, 63], c8: [62, 54], c9: [88, 46],
    p1: [22, 57], p2: [48, 48], p3: [44, 67], p4: [46, 24], p5: [82, 64], p6: [52, 9], p7: [30, 46],
    s1: [28, 86], s2: [56, 40], s3: [60, 47], s4: [62, 22], s5: [16, 34], s6: [48, 58],
    t1: [30, 40], t2: [38, 24], t3: [24, 48], t4: [44, 38], t5: [14, 22], t6: [78, 52], t7: [32, 46], t8: [52, 14],
    r1: [66, 66], r2: [16, 38], r3: [46, 30], r4: [34, 58], r5: [56, 80], r6: [74, 18], r7: [58, 42], r8: [48, 14],
    u1: [62, 10], u2: [40, 50], u3: [52, 88], u4: [58, 22], u5: [72, 84], u6: [64, 58], u7: [76, 68], u8: [46, 34],
    d1: [48, 36], d2: [74, 30], d3: [86, 34], d4: [38, 48], d5: [24, 54], d6: [60, 62], d7: [18, 86], d8: [66, 24],
    m1: [50, 50], m2: [58, 62], m3: [42, 20], m4: [48, 42], m5: [56, 46], m6: [40, 34], m7: [68, 72], m8: [34, 46], m9: [86, 14] };

  function mapBase(id) {
    const river = (d) => '<path class="m-river" d="' + d + '"/>', sea = (d) => '<path class="m-sea" d="' + d + '"/>';
    const W = {
      'loc-cairo': river('M54,-40 L52,-2 C40,25 62,45 50,65 S56,92 52,102 L51,140'),
      'loc-paris': river('M-40,58 L-2,52 C22,40 40,68 64,52 S92,40 102,46 L140,42'),
      'loc-sharm': sea('M140,-40 L76,-40 L76,-2 C68,30 82,58 66,102 L66,140 L140,140Z'),
      'loc-istanbul': river('M72,-40 L66,-2 C62,22 50,34 46,58 S30,90 24,102 L20,140'),
      'loc-rome': river('M-40,30 L-2,34 C20,20 38,52 56,46 S86,70 102,64 L140,70'),
      'loc-santorini': sea('M-40,-40 L26,-40 L26,-2 C36,24 22,52 34,72 C42,86 30,94 34,102 L34,140 L-40,140Z'),
      'loc-dubai': sea('M-40,-40 L140,-40 L140,12 C104,22 82,6 52,14 S12,20 -2,12 L-40,16Z'),
      'loc-marrakech': '<path class="m-road" style="stroke-width:1.1" d="M8,50 A42,36 0 1 1 92,50 A42,36 0 1 1 8,50"/>'
    };
    return '<rect width="100" height="100" class="m-land"/><path class="m-road" d="M-40,15 L140,45 M-40,88 L140,52 M28,-40 L42,140"/>' + (W[id] || '');
  }
  function mapSVG(locId, pins, routes, label) {
    let s = '<svg class="map" viewBox="0 0 100 100" role="group" aria-label="' + esc(label || 'Schematic map') + '">' + mapBase(locId);
    routes.forEach((r) => { if (r.pts.length > 1) s += '<polyline class="m-route" points="' + r.pts.map((p) => p.join(',')).join(' ') + '" style="stroke:' + r.color + '"/>'; });
    pins.slice().sort((a, b) => (a.active ? 1 : 0) - (b.active ? 1 : 0)).forEach((p) => {
      const r = p.active ? 5.6 : p.small ? 2.8 : 4.4;
      s += '<g class="pin' + (p.active ? ' on' : '') + '" data-id="' + esc(p.id) + '" tabindex="0" role="button" aria-label="' + esc(p.aria || p.label || '') + '">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" style="fill:' + p.color + '"/>';
      if (p.n != null) s += '<text x="' + p.x + '" y="' + p.y + '" class="m-n">' + p.n + '</text>';
      if (p.active && p.label) {
        const left = p.x > 50, t = p.label.length > 24 ? p.label.slice(0, 23) + '...' : p.label;
        s += '<text x="' + (p.x + (left ? -7.5 : 7.5)) + '" y="' + p.y + '" class="m-l" text-anchor="' + (left ? 'end' : 'start') + '">' + esc(t) + '</text>';
      }
      s += '</g>';
    });
    return s + '</svg>';
  }
  function tripMap(S, o) {
    o = o || {};
    const items = S.items.slice().sort((a, b) => a.sort_order - b.sort_order), start = parseDate(S.trip.start_date), byDay = {}, pins = [], routes = [];
    items.forEach((it) => { const k = it.planned_at.slice(0, 10); (byDay[k] = byDay[k] || []).push(it); });
    Object.keys(byDay).sort().forEach((k) => {
      if (o.day && o.day !== k) return;
      const color = dayColor(Math.round((parseDate(k) - start) / 86400000)), pts = [];
      byDay[k].forEach((it, i) => {
        const pos = POS[it.place_id]; if (!pos) return;
        const p = place(it.place_id); pts.push(pos);
        pins.push({ id: it.id, x: pos[0], y: pos[1], n: i + 1, color, label: p.name, aria: (i + 1) + '. ' + p.name, active: o.active === it.id });
      });
      routes.push({ color, pts });
    });
    return mapSVG(S.trip.location_id, pins, routes, 'Map of ' + S.trip.title);
  }
  function hop(a, b) {
    const x = POS[a], y = POS[b]; if (!x || !y) return '';
    const km = Math.hypot(x[0] - y[0], x[1] - y[1]) * 0.22, min = Math.max(3, Math.round(km * 3.5 + 3));
    return '<div class="hop">About ' + km.toFixed(1) + ' km, ' + min + ' min by taxi</div>';
  }
  function matches(p, interests) {
    const w = String(interests || '').toLowerCase(), m = [];
    if (/history/.test(w) && p.category === 'attraction') m.push('History');
    if (/\bart\b/.test(w) && p.category === 'attraction') m.push('Art');
    if (/food/.test(w) && p.category === 'restaurant') m.push('Food');
    if (/hidden/.test(w) && p.is_hidden_gem) m.push('Hidden gems');
    if (/night/.test(w) && p.category === 'entertainment') m.push('Nightlife');
    if (/nature/.test(w) && /reef|park|garden|desert|promenade|beach|wetland|flamingo/i.test(p.name + p.description)) m.push('Nature');
    if (/shopping/.test(w) && /bazaar|shop|market|souk/i.test(p.name + p.description)) m.push('Shopping');
    return m;
  }
  function nextSlot(S) {
    const t = S.trip, n = Math.min(nightsDays(t.start_date, t.end_date), 14), d0 = parseDate(t.start_date);
    let best = null, bc = 1e9;
    for (let i = 0; i < n; i++) {
      const d = new Date(d0); d.setDate(d0.getDate() + i);
      const k = iso(d), c = S.items.filter((x) => x.planned_at.slice(0, 10) === k).length;
      if (c < bc) { bc = c; best = { key: k, day: i + 1 }; }
    }
    return { planned_at: best.key + 'T' + (bc < 1 ? '10:00' : bc < 2 ? '13:00' : bc < 3 ? '17:30' : '20:00'), day: best.day };
  }
  function addToTrip(placeId, plannedAt, notes) {
    const S = getState(), p = place(placeId);
    if (p.location_id !== S.trip.location_id) return { ok: false, msg: 'Your trip is in ' + loc(S.trip.location_id).name + '. Create a new trip to add ' + p.name + '.' };
    const slot = plannedAt ? { planned_at: plannedAt, day: null } : nextSlot(S);
    S.items.push({ id: 'ti-' + Date.now().toString(36) + Math.floor(Math.random() * 99), created_at: new Date().toISOString(), trip_id: S.trip.id,
      place_id: placeId, planned_at: slot.planned_at, sort_order: S.items.reduce((m, x) => Math.max(m, x.sort_order), 0) + 1, notes: notes || '' });
    setState(S);
    return { ok: true, planned_at: slot.planned_at, day: slot.day, title: S.trip.title };
  }
  function parsePrompt(text) {
    const t = String(text || '').toLowerCase(), out = {};
    const L = LOCATIONS.find((l) => t.indexOf(l.name.toLowerCase().split(' ')[0]) > -1); if (L) out.location_id = L.id;
    const m = t.match(/(\d+)\s*-?\s*(day|night)/);
    if (m) out.days = Math.min(Math.max(+m[1], 1), 7); else if (/weekend/.test(t)) out.days = 2; else if (/week/.test(t)) out.days = 7;
    const b = t.match(/\$\s?(\d[\d,]*)/) || t.match(/(?:under|budget(?: of)?|below)\s*\$?\s?(\d[\d,]*)/);
    if (b) out.budget = +b[1].replace(/,/g, '');
    const ints = [];
    [['Food', /food|eat|restaurant|dinner|lunch|cafe/], ['History', /history|museum|pyramid|ancient|historic/], ['Hidden gems', /hidden|local|secret|gem|off the beaten/],
      ['Nightlife', /night|show|music|evening|entertain/], ['Nature', /reef|snorkel|nature|desert|park|garden|beach/], ['Shopping', /shop|market|bazaar|souk/], ['Art', /\bart\b|gallery/]]
      .forEach((p) => { if (p[1].test(t)) ints.push(p[0]); });
    if (ints.length) out.interests = ints.join(', ');
    return out;
  }
  const PROMPTS = ['3 days in Cairo for food and history, under $900', 'Weekend in Istanbul for food and hidden gems, $600', '4 days in Sharm for reefs and a desert dinner, $1,200'];
  const IDEAS = [
    { loc: 'loc-cairo', title: 'Cairo for first-timers', guide: 'u-amira', days: 3, tags: 'History, Food, Hidden gems', text: '3 days in Cairo for history, food and hidden gems, under $900' },
    { loc: 'loc-paris', title: 'A slow Paris weekend', guide: 'u-claire', days: 2, tags: 'Hidden gems, Food, Art', text: 'Paris weekend with hidden gems, food and art, $700' },
    { loc: 'loc-istanbul', title: 'Istanbul between two continents', guide: 'u-mehmet', days: 4, tags: 'History, Food, Shopping', text: '4 days in Istanbul for history, food and shopping, $1,100' },
    { loc: 'loc-rome', title: 'Rome without the queues', guide: 'u-giulia', days: 3, tags: 'History, Hidden gems, Food', text: '3 days in Rome for history, hidden gems and food, $1,000' },
    { loc: 'loc-santorini', title: 'Caldera sunsets and beaches', guide: 'u-eleni', days: 3, tags: 'Nature, Food', text: '3 days in Santorini for beaches, nature and food, $1,300' },
    { loc: 'loc-sharm', title: 'Reef and stars in Sinai', guide: 'u-karim', days: 4, tags: 'Nature, Nightlife', text: '4 days in Sharm for reef, nature and a desert dinner, $1,200' }
  ];

  function placeCard(p, interests) {
    const g = user(p.guide_id), m = matches(p, interests);
    return '<article class="pcard"><a href="place.html#' + p.id + '" aria-label="' + esc(p.name) + '">' + tile(p) + '</a>' +
      '<div class="pb"><div class="tags"><span class="pill">' + esc(CATS[p.category].label) + '</span>' +
      (p.is_hidden_gem ? '<span class="pill gem">' + icon('gem') + 'Hidden gem</span>' : '') +
      (m.length ? '<span class="pill ok">' + icon('check') + 'Fits: ' + esc(m[0]) + '</span>' : '') + '</div>' +
      '<h3><a href="place.html#' + p.id + '">' + esc(p.name) + '</a></h3><p class="addr">' + esc(p.address) + '</p><p class="d">' + esc(p.description) + '</p></div>' +
      '<div class="foot"><span class="by">Guide: ' + esc(g.full_name) + '</span><button class="btn sm" type="button" data-add="' + p.id + '">' + icon('plus') + 'Add</button></div></article>';
  }

  window.RW = { USERS, ROLES, LOCATIONS, PLACES, CATS, INTERESTS, PROMPTS, IDEAS, POS, getState, setState, getUser, setUser, resetAll, load, save,
    loc, place, user, placesIn, esc, icon, tile, placeRow, placeCard, currentLocation, currentPlace, hashParam,
    fmtDay, fmtRange, fmtTime, nightsDays, money, parseDate, iso, generateTrip, toast, renderChrome, locClass,
    dayColor, mapSVG, tripMap, hop, matches, addToTrip, parsePrompt };

  renderChrome();
})();
