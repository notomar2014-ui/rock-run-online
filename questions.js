// Every question and fact comes from the "Rocks in Space" slides (Omar, Adil, Haniya, Ayesha, Bardia).
const QUESTIONS = [
  // --- Ceres & Vesta (Adil) ---
  { q: 'What is the biggest object in the asteroid belt?', opts: ['Ceres', 'Vesta', 'The Moon', 'Mars'], a: 0, fact: 'Ceres is the biggest object in the asteroid belt, and it is round enough to be a dwarf planet.' },
  { q: 'Why is Ceres called a dwarf planet?', opts: ['It is round', 'It is lumpy', 'It has rings', 'It is a star'], a: 0, fact: 'Ceres is round, so it counts as a dwarf planet, not just an asteroid.' },
  { q: 'The bright spots in Ceres’ Occator crater are…', opts: ['Salt deposits', 'Burning lava', 'Solid gold', 'Tiny stars'], a: 0, fact: 'Occator crater’s bright spots are salt deposits (mostly sodium carbonate), left when salty water rose and froze or evaporated.' },
  { q: 'Occator crater, with its famous bright salt spots, is on…', opts: ['Vesta', 'Ceres', 'The Moon', 'Earth'], a: 1, fact: 'Occator is a crater on Ceres. Its two brightest patches are called Cerealia Facula and Vinalia Faculae.' },
  { q: 'What is the largest TRUE asteroid (not a dwarf planet)?', opts: ['Ceres', 'Vesta', 'Jupiter', 'Halley'], a: 1, fact: 'Ceres is a dwarf planet, which makes 4 Vesta the largest true asteroid!' },
  { q: 'About how wide is Vesta?', opts: ['5 km', '52 km', '525 km', '5,250 km'], a: 2, fact: 'Vesta is about 525 km across.' },
  { q: 'Vesta is a lumpy “space potato” because it lacks enough…', opts: ['Water', 'Gravity', 'Air', 'Light'], a: 1, fact: 'Vesta does not have enough gravity to pull itself into a round shape.' },
  { q: 'Vesta’s giant south-pole basin is called…', opts: ['Occator', 'Rheasilvia', 'Chicxulub', 'Olympus'], a: 1, fact: 'Rheasilvia is a huge impact basin covering most of Vesta’s south pole.' },
  { q: 'The mountain in the centre of Rheasilvia is about…', opts: ['22 metres', '22 km high', '220 km wide', '2 km deep'], a: 1, fact: 'Rheasilvia’s central mountain is about 22 km high, one of the tallest peaks in the solar system.' },
  { q: 'Vesta’s giant crater covers almost its whole…', opts: ['North pole', 'Equator', 'South pole', 'Dark side'], a: 2, fact: 'A gigantic hit left the Rheasilvia basin covering almost all of Vesta’s south pole.' },
  { q: 'What happened to chunks blasted off Vesta by the giant crash?', opts: ['Some reached Earth as meteorites', 'They became moons of Mars', 'They turned into stars', 'They melted into gas'], a: 0, fact: 'The crash blasted chunks of Vesta all the way to Earth as meteorites, so scientists can study Vesta in labs.' },
  { q: 'Which is the brightest asteroid you can see from Earth?', opts: ['Ceres', 'Vesta', 'Pluto', 'Phobos'], a: 1, fact: 'Vesta is the brightest asteroid visible from Earth. You can even spot it with binoculars!' },
  { q: 'What can you use to spot Vesta from Earth?', opts: ['Binoculars', 'A microscope', 'Sunglasses', 'Nothing can see it'], a: 0, fact: 'On a dark night you can spot Vesta with binoculars, and sometimes even with sharp eyes.' },

  // --- Asteroids (Haniya) ---
  { q: 'Where is the main asteroid belt?', opts: ['Between Earth and Mars', 'Between Mars and Jupiter', 'Beyond Neptune', 'Around the Sun’s core'], a: 1, fact: 'The main asteroid belt lies between the orbits of Mars and Jupiter.' },
  { q: 'An asteroid is best described as a…', opts: ['Rocky body orbiting the Sun', 'Ball of burning gas', 'Star that went out', 'Cloud of only ice'], a: 0, fact: 'Asteroids are rocky (sometimes metal-rich) leftovers from the early solar system that orbit the Sun.' },
  { q: 'Most asteroids in our solar system are found in the…', opts: ['Asteroid belt', 'Rings of Saturn only', 'Atmosphere of the Sun', 'Kuiper belt only'], a: 0, fact: 'Most known asteroids live in the main belt between Mars and Jupiter, though some pass closer to Earth.' },
  { q: 'Asteroids are leftover building blocks from…', opts: ['The early solar system', 'A broken moon of Earth', 'Last year’s comet only', 'A supernova last week'], a: 0, fact: 'Asteroids are leftover material from when the planets formed about 4.6 billion years ago.' },

  // --- The smallest asteroid: 2015 TC25 (Ayesha) ---
  { q: 'One of the smallest asteroids ever studied up close is called…', opts: ['2015 TC25', 'Ceres', 'Hoba', 'Dimorphos'], a: 0, fact: '2015 TC25 is only about 2 metres across, roughly the size of a small car, and is one of the smallest asteroids ever observed in detail.' },
  { q: 'About how wide is the tiny asteroid 2015 TC25?', opts: ['About 2 metres', 'About 2 kilometres', 'About 200 kilometres', 'About the size of Earth'], a: 0, fact: '2015 TC25 is only about 2 metres (around 6 feet) wide. It was discovered by the Catalina Sky Survey in 2015.' },
  { q: '2015 TC25 spins all the way around in about…', opts: ['A few minutes', 'A few years', 'One month', 'One century'], a: 0, fact: '2015 TC25 is a very fast spinner: it rotates in only about 2.2 minutes.' },
  { q: '2015 TC25 is a…', opts: ['Near-Earth asteroid', 'Dwarf planet', 'Moon of Jupiter', 'Star'], a: 0, fact: '2015 TC25 is a near-Earth asteroid, meaning its path can bring it relatively close to our planet (it is still a tiny rock, not a threat).' },

  // --- Asteroids and Earth (Bardia): Chicxulub, Chelyabinsk, DART ---
  { q: 'The impact linked to the dinosaur extinction made which crater?', opts: ['Occator', 'Rheasilvia', 'Chicxulub', 'Hoba'], a: 2, fact: 'The Chicxulub crater, on Mexico’s Yucatán Peninsula, was made by an asteroid impact about 66 million years ago, at the time the non-bird dinosaurs died out.' },
  { q: 'Where is the Chicxulub crater?', opts: ['Mexico’s Yucatán Peninsula', 'Namibia', 'The south pole of Vesta', 'The Moon only'], a: 0, fact: 'Chicxulub lies on the Yucatán Peninsula in Mexico. Much of the crater is buried and partly offshore.' },
  { q: 'About how long ago did the Chicxulub impact happen?', opts: ['66 thousand years ago', '66 million years ago', '66 years ago', '6 billion years ago'], a: 1, fact: 'The Chicxulub impact happened about 66 million years ago, at the end of the Cretaceous period.' },
  { q: 'In 2013, a meteor exploded in the sky over…', opts: ['Chelyabinsk, Russia', 'Sylacauga, Alabama', 'Mexico City', 'Ceres'], a: 0, fact: 'On 15 February 2013 a meteor exploded over Chelyabinsk, Russia. About 1,500 people were injured, mostly by broken glass from the shock wave.' },
  { q: 'Most injuries from the 2013 Chelyabinsk meteor came from…', opts: ['Broken window glass', 'Lava on the streets', 'A giant crater in the city', 'Acid rain'], a: 0, fact: 'The blast wave blew out windows across the city. Flying glass caused most of the injuries; there was no city-destroying crater.' },
  { q: 'NASA’s DART mission in 2022 flew a spacecraft into…', opts: ['The Moon', 'Dimorphos (a small asteroid moon)', 'Ceres', 'The Sun'], a: 1, fact: 'DART (Double Asteroid Redirection Test) hit Dimorphos, the small moon of asteroid Didymos, on 26 September 2022.' },
  { q: 'What was the goal of NASA’s DART mission?', opts: ['To test changing an asteroid’s path', 'To mine gold in space', 'To land astronauts on Vesta', 'To blow up the Moon'], a: 0, fact: 'DART was a planetary-defence test: it successfully shortened Dimorphos’s orbit, proving we can nudge a small asteroid’s path.' },

  // --- Meteoroids, meteors, meteorites (Omar) ---
  { q: 'A small piece of rock or metal floating in space is a…', opts: ['Meteor', 'Meteoroid', 'Meteorite', 'Planet'], a: 1, fact: 'A meteoroid is a small piece of rock or metal floating in space, from a grain of sand up to boulder size.' },
  { q: 'Meteoroids usually break off an asteroid or a…', opts: ['Comet', 'Star', 'Cloud', 'Black hole'], a: 0, fact: 'Meteoroids are leftover chunks, usually broken off an asteroid or a comet.' },
  { q: 'How big can a meteoroid be?', opts: ['Only planet-sized', 'From a sand grain to a boulder', 'Always bigger than a city', 'Exactly 1 metre'], a: 1, fact: 'A meteoroid can be as small as a grain of sand or as big as a boulder. Bigger space rocks are usually called asteroids.' },
  { q: 'The bright streak of light you see in the sky is a…', opts: ['Meteorite', 'Meteoroid', 'Meteor', 'Comet tail'], a: 2, fact: 'A meteor is the bright streak of light made when a meteoroid races through Earth’s air and heats it up. People also call them shooting stars.' },
  { q: 'A space rock that survives the atmosphere and lands on the ground is a…', opts: ['Meteor', 'Meteorite', 'Meteoroid', 'Asteroid belt'], a: 1, fact: 'A meteorite is the piece that survives the trip through Earth’s atmosphere and lands.' },
  { q: 'Compared with when it entered the atmosphere, a meteorite is usually…', opts: ['Much bigger', 'Much smaller', 'Exactly the same', 'Made of gas'], a: 1, fact: 'Most of a meteorite’s mass burns away or breaks off in the atmosphere, so what lands is usually much smaller.' },
  { q: 'A meteorite is the remains of a…', opts: ['Meteoroid', 'Star', 'Planet', 'Black hole'], a: 0, fact: 'A meteorite is the physical remains of a meteoroid after it has landed on Earth.' },
  { q: 'In 1954, who was hit by a falling meteorite while napping on a sofa?', opts: ['Ann Hodges', 'Neil Armstrong', 'Galileo', 'Ada Lovelace'], a: 0, fact: 'On 30 November 1954, in Sylacauga, Alabama, a meteorite crashed through a roof and bruised Ann Hodges on the hip. She is the only person confirmed to have been injured by a meteorite.' },
  { q: 'The Ann Hodges meteorite fell in…', opts: ['Alabama, USA, in 1954', 'Russia in 2013', 'Namibia in 1920', 'Mexico 66 million years ago'], a: 0, fact: 'The Sylacauga meteorite fell in Alabama in 1954. Ann Hodges was resting on her sofa when it punched through the roof.' },
  { q: 'The largest known meteorite on Earth is called…', opts: ['Hoba', 'Chelyabinsk', '2015 TC25', 'Vesta'], a: 0, fact: 'The Hoba meteorite in Namibia is the largest ever found, at about 60 tonnes. It is so heavy it has never been moved from where it was discovered in 1920.' },
  { q: 'Where can you visit the giant Hoba meteorite?', opts: ['Namibia', 'The Moon', 'Ceres', 'The bottom of the ocean only'], a: 0, fact: 'Hoba still sits in Namibia, near Grootfontein. It is mostly iron-nickel metal, not ordinary rock.' },
  { q: 'About how heavy is the Hoba meteorite?', opts: ['About 60 tonnes', 'About 60 kilograms', 'About 6 grams', 'About as heavy as Earth'], a: 0, fact: 'Hoba weighs about 60 tonnes. Because it is so massive, people built a small park around it instead of trying to lift it.' },

  // --- extra variety (accurate, same topics) ---
  { q: 'About how wide is the dwarf planet Ceres?', opts: ['About 940 km', 'About 94 km', 'About 9 km', 'About as wide as Earth'], a: 0, fact: 'Ceres is about 940 km across, much smaller than our Moon but still the biggest object in the asteroid belt.' },
  { q: 'After Ceres, which is the next most massive body in the asteroid belt?', opts: ['Vesta', 'The Moon', 'Phobos', 'Hoba'], a: 0, fact: 'Vesta is the second most massive object in the main asteroid belt, after the dwarf planet Ceres.' },
  { q: 'NASA’s Dawn spacecraft studied which two worlds?', opts: ['Vesta and Ceres', 'Mars and Earth', 'The Sun and Pluto', 'Only the Moon'], a: 0, fact: 'Dawn orbited Vesta first (2011–2012) and then Ceres (2015–2018), giving us close-up maps of both.' },
  { q: 'A comet is different from a typical asteroid because a comet is mostly…', opts: ['Ice and dust', 'Solid gold', 'Burning gas like a star', 'Pure oxygen'], a: 0, fact: 'Comets are often called “dirty snowballs”: they are rich in ice and dust, while most asteroids are rockier.' },
  { q: 'Near-Earth asteroids are asteroids that…', opts: ['Can pass relatively close to Earth', 'Live inside the Sun', 'Are bigger than Jupiter', 'Never leave the Kuiper belt'], a: 0, fact: 'Near-Earth asteroids have orbits that can bring them closer to Earth than the main belt asteroids usually get.' },
  { q: 'The small moon that NASA’s DART spacecraft hit is called Dimorphos. What does it orbit?', opts: ['The asteroid Didymos', 'The Earth', 'Ceres', 'The Sun alone, with no partner'], a: 0, fact: 'Dimorphos is the little moon of asteroid Didymos. DART hit Dimorphos to test whether we could change its path.' },
  { q: 'DART changed Dimorphos’s orbit by about…', opts: ['33 minutes', '33 years', '33 seconds of a century', 'It missed completely'], a: 0, fact: 'After the 2022 impact, Dimorphos’s trip around Didymos was shorter by about 33 minutes, proving the nudge worked.' },
  { q: 'About how wide was the space rock that made the Chicxulub crater?', opts: ['About 10 to 15 km', 'About 10 metres', 'About the size of a car', 'As wide as the Sun'], a: 0, fact: 'The Chicxulub impactor was a huge asteroid, roughly 10 to 15 km across.' },
  { q: 'About how wide was the Chelyabinsk meteor in 2013?', opts: ['About 20 metres', 'About 20 km', 'About 20 centimetres', 'About the size of the Moon'], a: 0, fact: 'The Chelyabinsk meteor was a relatively small rock, around 18–20 metres across, but it still made a huge blast in the air.' },
  { q: 'Most meteors never become meteorites because they…', opts: ['Burn up or break up in the atmosphere', 'Turn into comets', 'Fall into the Sun first', 'Are eaten by black holes'], a: 0, fact: 'Earth’s atmosphere is a great shield: most meteors burn up or break apart long before they can land.' },
  { q: 'The glow of a meteor is caused by the meteoroid…', opts: ['Heating the air as it races through the atmosphere', 'Being on fire in space already', 'Reflecting city lights', 'Turning into a star'], a: 0, fact: 'A meteoroid slams into air so fast that the air in front of it gets extremely hot and glows. That streak is the meteor.' },
  { q: 'A “shooting star” is really…', opts: ['A meteor', 'A star falling out of the sky', 'A tiny planet', 'An aeroplane light'], a: 0, fact: 'Shooting stars are not stars at all. They are meteors: meteoroids heating up as they enter Earth’s air.' },
  { q: 'Iron meteorites are made mostly of iron and…', opts: ['Nickel', 'Wood', 'Helium', 'Plastic'], a: 0, fact: 'Many of the heaviest meteorites, including Hoba, are iron-nickel metal rather than ordinary stone.' },
  { q: 'The meteorite that hit Ann Hodges is also known as the…', opts: ['Sylacauga meteorite', 'Hoba meteorite', 'Chelyabinsk meteorite', 'Ceres meteorite'], a: 0, fact: 'It is called the Sylacauga meteorite, after the Alabama town where it fell in 1954.' },
  { q: 'In movies, spaceships often dodge a crowded asteroid “field”. In real life the main belt is…', opts: ['Mostly empty space, with lots of room between rocks', 'Packed solid like a gravel pile', 'A wall you cannot fly through', 'Made of only two asteroids'], a: 0, fact: 'Asteroids in the main belt are far apart. Spacecraft have flown through the belt safely; it is not a tight obstacle course.' },
  { q: 'Ceres is the only dwarf planet that lives in…', opts: ['The main asteroid belt', 'Saturn’s rings', 'Earth’s ocean', 'The Sun’s core'], a: 0, fact: 'The other official dwarf planets, like Pluto, are much farther out. Ceres is the one in the asteroid belt.' },
  { q: 'Vesta was the…', opts: ['Fourth asteroid ever discovered', 'First star ever named', 'Only moon of Mars', 'Largest planet'], a: 0, fact: 'Vesta is officially “4 Vesta” because it was the fourth asteroid found, in 1807.' },
  { q: 'Planetary defence means…', opts: ['Ways to protect Earth from asteroid impacts', 'Building a wall on the Moon', 'Turning off the Sun', 'Hiding underground forever'], a: 0, fact: 'Planetary defence is the science and planning used to find dangerous asteroids early and, if needed, nudge them aside, as DART tested.' },
  { q: 'Which comes first in the journey of a space rock that lands on Earth?', opts: ['Meteoroid, then meteor, then meteorite', 'Meteorite, then meteor, then meteoroid', 'Meteor, then planet, then comet', 'Asteroid belt, then star, then moon'], a: 0, fact: 'It starts as a meteoroid in space, becomes a meteor (the streak) in the air, and if a piece lands it is a meteorite.' },
  { q: 'Binoculars can help you see Vesta because Vesta is…', opts: ['The brightest asteroid in our night sky', 'Glowing as hot as the Sun', 'Only one metre from Earth', 'A man-made satellite'], a: 0, fact: 'Vesta reflects sunlight well and is the brightest asteroid. On a dark night, binoculars can pick it out.' },
];

const FACTS = {
  ceres: [
    '🪨 CERES: the biggest object in the asteroid belt. It’s round, so it’s a dwarf planet.',
    '✨ OCCATOR: Ceres’ bright spots are salt deposits, not ice or snow. Salty water once bubbled up there!',
  ],
  vesta: [
    '🥔 VESTA: about 525 km across, a lumpy “space potato” without enough gravity to be round.',
    '💥 RHEASILVIA: Vesta’s south-pole basin has a central mountain about 22 km high.',
    '✨ VESTA is the brightest asteroid seen from Earth: spot it with binoculars!',
  ],
  asteroid: [
    '🪨 Asteroids are rocky leftovers from the early solar system, and most orbit in the belt between Mars and Jupiter.',
    '📏 2015 TC25 is only about 2 metres wide and spins around in about 2.2 minutes!',
  ],
  earth: [
    '🦖 The Chicxulub impact in Mexico, about 66 million years ago, is linked to the end of the non-bird dinosaurs.',
    '🪟 The 2013 Chelyabinsk meteor exploded over Russia. Most injuries were from shattered windows, not a crater.',
    '🛰️ In 2022, NASA’s DART spacecraft hit Dimorphos and successfully changed the little asteroid’s orbit.',
  ],
  meteoroid: [
    '☄️ Meteoroids are small rock or metal pieces in space, from a sand grain to a boulder.',
    '☄️ Meteoroids usually break off an asteroid or a comet.',
  ],
  meteorite: [
    '🌍 A meteorite survives Earth’s atmosphere and lands. Most of its size burns away, so it ends up much smaller.',
    '🌠 On the way down it glows as a METEOR: the bright streak (its tail). What lands is the METEORITE.',
    '🛋️ In 1954, Ann Hodges of Alabama became the only confirmed person injured by a meteorite.',
    '🪨 Hoba, in Namibia, is the largest known meteorite: about 60 tonnes of iron-nickel, never moved from its find spot.',
  ],
  cannon: ['🔥 METEOR CANNON: a meteor is the bright streak of light: the meteoroid’s glowing tail!'],
  laser: ['💫 COMET TAIL LASER: meteoroids are often leftover chunks broken off comets.'],
  crater: ['💥 VESTA CRATER BLAST: Vesta’s giant Rheasilvia basin covers almost its whole south pole. Boom!'],
  gbomb: ['🌀 GRAVITY BOMB: Vesta lacks the gravity to pull itself round, which is why it’s a lumpy space potato.'],
  shield: ['🛡️ Earth’s atmosphere works like a shield too: most meteorites lose most of their size on the way down.'],
};

// Short “Did you know?” lines shown after question waves and on collectible stars.
const DYK = [
  'Did you know? Ceres is so round it counts as a dwarf planet, not “just” an asteroid.',
  'Did you know? The bright spots in Ceres’ Occator crater are salts left by ancient briny water.',
  'Did you know? Vesta’s Rheasilvia mountain is about 22 km high, taller than any mountain on Earth.',
  'Did you know? You can sometimes spot Vesta from your backyard with binoculars.',
  'Did you know? 2015 TC25 is only about 2 metres across and spins in about 2.2 minutes.',
  'Did you know? The Chicxulub crater in Mexico is linked to the extinction of the non-bird dinosaurs 66 million years ago.',
  'Did you know? The 2013 Chelyabinsk meteor’s shock wave broke thousands of windows in Russia.',
  'Did you know? NASA’s DART mission in 2022 proved we can nudge a small asteroid off its path.',
  'Did you know? A meteoroid is in space, a meteor is the streak in the sky, and a meteorite is what lands.',
  'Did you know? In 1954, Ann Hodges was napping on her sofa in Alabama when a meteorite broke through the roof.',
  'Did you know? The Hoba meteorite in Namibia weighs about 60 tonnes and has never been moved.',
  'Did you know? Most asteroids hang out in the belt between Mars and Jupiter.',
];

const STAR_FACTS = DYK.map(s => s.replace(/^Did you know\?\s*/, '⭐ '));

module.exports = { QUESTIONS, FACTS, DYK, STAR_FACTS };
