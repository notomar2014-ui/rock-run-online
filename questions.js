// Every question and fact comes from the "Rocks in Space" script and slides
// (Omar, Adil, Haniya, Ayesha, Bardia).
const QUESTIONS = [
  // --- Asteroids (Haniya) ---
  { q: "What are asteroids?", opts: ["Rocky leftovers", "Balls of burning gas", "Tiny stars", "Clouds of only ice"], a: 0, fact: "Asteroids are rocky leftovers from when the solar system formed, about 4.6 billion years ago." },
  { q: "About how long ago did the solar system form?", opts: ["4.6 million years", "4.6 billion years", "46 years ago", "460 years ago"], a: 1, fact: "The solar system formed about 4.6 billion years ago, and asteroids are rocky leftovers from that time." },
  { q: "Where do most asteroids live?", opts: ["The asteroid belt", "Saturn’s rings only", "The Sun’s core", "Earth’s oceans"], a: 0, fact: "Most asteroids live in the asteroid belt, a wide ring between Mars and Jupiter." },
  { q: "The asteroid belt is a wide ring between…", opts: ["Earth and Venus", "Mars and Jupiter", "Jupiter and Pluto", "The Sun and Mercury"], a: 1, fact: "The main asteroid belt is a wide ring between Mars and Jupiter." },
  { q: "About how wide is Ceres?", opts: ["About 94 km", "About 940 km", "About 9 km", "About 94,000 km"], a: 1, fact: "Ceres is about 940 kilometres across." },
  { q: "Asteroids come in many sizes, from Ceres all the way down to…", opts: ["Pebbles", "Stars", "Oceans", "Galaxies"], a: 0, fact: "They come in all sizes, from Ceres (about 940 km across) all the way down to pebbles." },
  { q: "Why is Ceres called a dwarf planet?", opts: ["It is big and round", "It is lumpy", "It has rings", "It is a star"], a: 0, fact: "Ceres is so big and round that it is called a dwarf planet." },
  // --- Ceres & Vesta (Adil) ---
  { q: "What is the biggest object in the asteroid belt?", opts: ["Ceres", "Vesta", "The Moon", "Mars"], a: 0, fact: "Ceres is the biggest object in the asteroid belt, but it is a dwarf planet because it is round." },
  { q: "Ceres is classified as a…", opts: ["Dwarf planet", "Star", "Comet", "Moon of Mars"], a: 0, fact: "Because Ceres is round, it is classified as a dwarf planet, not just an asteroid." },
  { q: "What is the largest TRUE asteroid?", opts: ["Ceres", "Vesta", "Jupiter", "The Moon"], a: 1, fact: "Ceres is a dwarf planet because it is round, which makes Vesta the largest true asteroid." },
  { q: "About how wide is Vesta?", opts: ["5 km", "52 km", "525 km", "5,250 km"], a: 2, fact: "Vesta is about 525 kilometres across." },
  { q: "Vesta is a lumpy “space potato” because it lacks enough…", opts: ["Water", "Gravity", "Air", "Light"], a: 1, fact: "Vesta is irregular and lumpy because it does not have enough gravity to pull itself into a round shape." },
  { q: "Vesta’s shape is best described as…", opts: ["Perfectly round", "Irregular and lumpy", "A perfect cube", "A thin ring"], a: 1, fact: "Vesta has an irregular, lumpy shape, like a giant “space potato”." },
  { q: "Like Ceres, Vesta orbits in the…", opts: ["Main asteroid belt", "Rings of Saturn", "Earth’s atmosphere", "Sun’s surface"], a: 0, fact: "Vesta hangs out in the main asteroid belt between Mars and Jupiter, just like Ceres." },
  { q: "The bright white spots in Occator Crater are…", opts: ["Salt deposits", "Burning lava", "Solid gold", "Tiny stars"], a: 0, fact: "Ceres has bright white spots inside Occator Crater. Scientists found they are salt deposits left behind by salty water." },
  { q: "Occator Crater, with its bright salt spots, is on…", opts: ["Vesta", "Ceres", "The Moon", "Earth"], a: 1, fact: "Occator Crater is on Ceres, and its bright white spots are salt deposits left by salty water." },
  { q: "Which is the brightest asteroid visible from Earth?", opts: ["Ceres", "Vesta", "Pluto", "Mars"], a: 1, fact: "Vesta is the brightest asteroid visible from Earth, and on a clear night it can sometimes be spotted with binoculars." },
  { q: "What can you use to spot Vesta from Earth?", opts: ["Binoculars", "A microscope", "Sunglasses", "An X-ray"], a: 0, fact: "On a clear night, Vesta can sometimes be spotted with binoculars." },
  { q: "Vesta’s giant crater covers almost its whole…", opts: ["North pole", "Equator", "South pole", "Dark side"], a: 2, fact: "A huge impact left a crater covering almost Vesta’s whole south pole." },
  { q: "Vesta’s giant south-pole crater is called…", opts: ["Occator", "Rheasilvia", "Chicxulub", "Hoba"], a: 1, fact: "The huge south-pole crater on Vesta is called Rheasilvia." },
  { q: "The mountain in the middle of Rheasilvia is about…", opts: ["22 metres", "22 km high", "220 km wide", "2 km deep"], a: 1, fact: "In the middle of Rheasilvia is a mountain about 22 kilometres high, more than twice the height of Mount Everest." },
  { q: "Vesta’s 22 km mountain is more than twice as high as…", opts: ["Mount Everest", "A classroom door", "Ceres", "The Moon"], a: 0, fact: "The mountain in the middle of Rheasilvia is about 22 km high, more than twice the height of Mount Everest." },
  { q: "Chunks blasted off Vesta by the giant crash…", opts: ["Landed as meteorites", "Became stars", "Turned into gas", "Made a new planet"], a: 0, fact: "That crash blasted chunks of Vesta all the way to Earth as meteorites, so scientists can study pieces of Vesta." },
  // --- The smallest asteroid: 2015 TC25 (Ayesha) ---
  { q: "One of the smallest asteroids ever studied is called…", opts: ["2015 TC25", "Ceres", "Hoba", "Dimorphos"], a: 0, fact: "2015 TC25 is one of the smallest asteroids ever studied." },
  { q: "About how wide is 2015 TC25?", opts: ["About 2 metres", "About 2 km", "About 200 km", "About 2 cm"], a: 0, fact: "2015 TC25 is only about two metres across, roughly as tall as a classroom door." },
  { q: "2015 TC25 is about as tall as…", opts: ["A classroom door", "Mount Everest", "The Moon", "Ceres"], a: 0, fact: "2015 TC25 is about two metres across — about as tall as a classroom door." },
  { q: "On the size comparison slide, the classroom door is about…", opts: ["About 2 m tall", "About 10 m tall", "About 2 km tall", "About 22 km tall"], a: 0, fact: "The slide compares 2015 TC25 (about 2 m across) with a classroom door about 2 m tall and a student about 1.65 m." },
  { q: "If a space rock is smaller than about one metre, scientists usually call it a…", opts: ["Planet", "Meteoroid", "Dwarf planet", "Star"], a: 1, fact: "If a space rock is smaller than about one metre, scientists usually call it a meteoroid, not an asteroid." },
  { q: "2015 TC25 is a…", opts: ["Near-Earth asteroid", "Dwarf planet", "Moon of Jupiter", "Star"], a: 0, fact: "2015 TC25 is a near-Earth asteroid, so its path brings it close to our planet." },
  { q: "Why are tiny asteroids usually hard to find?", opts: ["They are hard to see", "They are invisible", "They hide in the Sun", "They do not exist"], a: 0, fact: "Tiny asteroids are very hard to see, so we usually only find them when they pass close to Earth." },
  // --- Asteroids and Earth (Bardia) ---
  { q: "Asteroids whose orbits come close to Earth are called…", opts: ["Near-Earth asteroids", "Dwarf planets", "Shooting stars", "Comet tails"], a: 0, fact: "Some asteroids have orbits that come close to Earth. We call these near-Earth asteroids." },
  { q: "If a small piece hits our atmosphere and burns up, it is a…", opts: ["Meteor", "Meteorite", "Dwarf planet", "Star"], a: 0, fact: "If a small piece hits our atmosphere, it can burn up as a meteor. If it lands, it is called a meteorite." },
  { q: "If that space rock reaches the ground, it is called a…", opts: ["Meteor", "Meteorite", "Meteoroid", "Comet"], a: 1, fact: "If a small piece lands on the ground, it is called a meteorite." },
  { q: "About how long ago did a huge asteroid hit Earth at Chicxulub?", opts: ["66 thousand years", "66 million years", "66 years ago", "6 billion years"], a: 1, fact: "About 66 million years ago, a huge asteroid hit Earth at Chicxulub in Mexico and helped end the age of the dinosaurs." },
  { q: "The huge asteroid that helped end the age of the dinosaurs hit at…", opts: ["Chicxulub, Mexico", "Occator Crater", "Rheasilvia", "Namibia"], a: 0, fact: "About 66 million years ago, a huge asteroid hit Earth at Chicxulub in Mexico and helped end the age of the dinosaurs." },
  { q: "The Chicxulub impact helped end the age of the…", opts: ["Dinosaurs", "Asteroids", "Meteorites", "Comets"], a: 0, fact: "The huge asteroid that hit Chicxulub helped end the age of the dinosaurs." },
  { q: "In 2013, a smaller asteroid exploded over…", opts: ["Chelyabinsk, Russia", "Alabama, USA", "Namibia", "Ceres"], a: 0, fact: "In 2013, a smaller asteroid exploded over Chelyabinsk in Russia, and the shock wave broke windows across the city." },
  { q: "The 2013 Chelyabinsk shock wave…", opts: ["Broke windows", "Made a city crater", "Melted the ground", "Created a new moon"], a: 0, fact: "When the asteroid exploded over Chelyabinsk, the shock wave broke windows across the city." },
  { q: "In 2022, NASA’s DART mission hit which asteroid?", opts: ["Dimorphos", "Ceres", "Vesta", "Hoba"], a: 0, fact: "In 2022, NASA’s DART mission hit the asteroid Dimorphos and changed its orbit." },
  { q: "What did NASA’s DART mission do in 2022?", opts: ["Changed its orbit", "Mined gold", "Landed people", "Blew up the Moon"], a: 0, fact: "NASA’s DART spacecraft hit Dimorphos and changed its orbit — the first time humans moved an asteroid on purpose." },
  { q: "DART was the first time humans…", opts: ["Moved an asteroid", "Landed on Vesta", "Visited Ceres", "Built a space door"], a: 0, fact: "The DART mission was the first time humans moved an asteroid on purpose." },
  { q: "NASA used the DART mission to help…", opts: ["Protect Earth", "Heat the Sun", "Make a new planet", "Build a school"], a: 0, fact: "To protect Earth, NASA’s DART spacecraft hit Dimorphos in 2022 and changed its orbit." },
  // --- Meteoroids, meteors and meteorites (Omar) ---
  { q: "A small piece of rock or metal travelling through space is a…", opts: ["Meteor", "Meteoroid", "Meteorite", "Planet"], a: 1, fact: "A meteoroid is a small piece of rock or metal travelling through space." },
  { q: "Meteoroids usually break off an asteroid or a…", opts: ["Comet", "Star", "Cloud", "Black hole"], a: 0, fact: "A meteoroid is usually a leftover chunk broken off an asteroid or a comet." },
  { q: "A meteoroid can be as small as a grain of sand or as large as a…", opts: ["Boulder", "Planet", "Galaxy", "Star"], a: 0, fact: "A meteoroid can be as small as a grain of sand or as large as a boulder." },
  { q: "The bright streak of light you see in the sky is a…", opts: ["Meteorite", "Meteoroid", "Meteor", "Dwarf planet"], a: 2, fact: "A meteor is the bright streak of light we see when a meteoroid enters Earth’s atmosphere and burns up. People often call these shooting stars." },
  { q: "People often call meteors…", opts: ["Shooting stars", "Dwarf planets", "Space potatoes", "Salt spots"], a: 0, fact: "People often call meteors shooting stars, but they are not stars at all." },
  { q: "On the slides, a meteor is described as the meteoroid’s…", opts: ["Tail", "Core", "Ring", "Ocean"], a: 0, fact: "A meteor is the bright streak of light you see in the sky. It is basically the tail of the meteoroid." },
  { q: "A space rock that survives the atmosphere and lands is a…", opts: ["Meteor", "Meteorite", "Meteoroid", "Comet"], a: 1, fact: "A meteorite is a piece of space rock that survives the trip through the atmosphere and lands on the ground." },
  { q: "Meteorites are usually very small because most of their size is…", opts: ["Lost on the way down", "Added in space", "Hidden in water", "Turned into gold"], a: 0, fact: "Most meteorites are small, because much of the rock burns away on the way down." },
  { q: "A meteorite is the remains of a…", opts: ["Meteoroid", "Star", "Planet", "Black hole"], a: 0, fact: "A meteorite is the physical remains of the meteoroid after it has landed on Earth." },
  { q: "Which comes first if a space rock lands on Earth?", opts: ["Meteoroid first", "Meteorite first", "Meteor first", "Planet first"], a: 0, fact: "It starts as a meteoroid in space, becomes a meteor (the bright streak) in the air, and if a piece lands it is a meteorite." },
  { q: "In 1954, who was hit by a meteorite that crashed through her roof?", opts: ["Ann Hodges", "Neil Armstrong", "Ayesha", "Ada Lovelace"], a: 0, fact: "In 1954, in Alabama, USA, Ann Hodges was hit by a meteorite that crashed through her roof. She was bruised but okay." },
  { q: "Ann Hodges was hit by a meteorite in…", opts: ["Alabama, USA", "Russia", "Namibia", "Mexico"], a: 0, fact: "The meteorite that hit Ann Hodges fell in Alabama, USA, in 1954." },
  { q: "The meteorite that hit Ann Hodges crashed through her…", opts: ["Roof", "Window", "Car", "Garden fence"], a: 0, fact: "A meteorite crashed through Ann Hodges’s roof in 1954. She was bruised but okay." },
  { q: "What happened to Ann Hodges after the meteorite hit her?", opts: ["Bruised but okay", "She vanished", "She turned to gold", "Nothing at all"], a: 0, fact: "Ann Hodges was bruised but okay, and she is the only well-documented person ever hurt by a meteorite." },
  { q: "Ann Hodges is the only well-documented person ever…", opts: ["Hurt by a meteorite", "To visit Ceres", "To name Vesta", "To find Hoba"], a: 0, fact: "Ann Hodges is the only well-documented person ever hurt by a meteorite." },
  { q: "The largest meteorite ever found is called…", opts: ["Hoba", "Chelyabinsk", "2015 TC25", "Vesta"], a: 0, fact: "The largest meteorite ever found is the Hoba meteorite in Namibia." },
  { q: "Where was the Hoba meteorite found?", opts: ["Namibia", "Alabama", "Russia", "The Moon"], a: 0, fact: "The Hoba meteorite was found in Namibia and is the largest meteorite ever found." },
  { q: "About how heavy is the Hoba meteorite?", opts: ["About 60 tonnes", "About 60 kilograms", "About 6 grams", "About 60 milligrams"], a: 0, fact: "The Hoba meteorite in Namibia weighs about 60 tonnes." },
];

// Short facts shown at wells, chaos events, and after answers.
const FACTS = {
  ceres: [
    "🪨 CERES is the biggest object in the asteroid belt, and it is so big and round that it is called a dwarf planet.",
    "📏 Ceres is about 940 kilometres across.",
    "⚪ The bright white spots in Ceres’ Occator Crater are salt deposits left behind by salty water.",
  ],
  vesta: [
    "🥔 VESTA is the largest true asteroid. It is about 525 km across and lumpy, because it lacks the gravity to be round.",
    "✨ VESTA is the brightest asteroid visible from Earth: you can spot it with binoculars!",
    "☄️ A huge crash blasted chunks of Vesta all the way to Earth as meteorites.",
  ],
  asteroid: [
    "🪨 Asteroids are rocky leftovers from when the solar system formed, about 4.6 billion years ago. Most live in the belt between Mars and Jupiter.",
    "🚪 2015 TC25 is only about 2 metres across — about as tall as a classroom door.",
  ],
  earth: [
    "🦖 About 66 million years ago, a huge asteroid hit Earth at Chicxulub in Mexico and helped end the age of the dinosaurs.",
    "🪟 In 2013, a smaller asteroid exploded over Chelyabinsk in Russia, and the shock wave broke windows across the city.",
    "🛰️ In 2022, NASA’s DART mission hit Dimorphos and changed its orbit — the first time humans moved an asteroid on purpose.",
  ],
  meteoroid: [
    "☄️ A meteoroid is a small piece of rock or metal travelling through space, from a grain of sand to a boulder.",
    "☄️ Meteoroids are usually leftover chunks broken off an asteroid or a comet.",
  ],
  meteorite: [
    "🌍 A meteorite survives the trip through Earth’s atmosphere and lands. Most of its size burns away on the way down.",
    "🌠 On the way down it glows as a METEOR: the bright streak (the meteoroid’s tail). What lands is the METEORITE.",
    "🏠 In 1954, in Alabama, USA, Ann Hodges was hit by a meteorite that crashed through her roof. She was bruised but okay.",
    "🪨 The largest meteorite ever found, the Hoba meteorite in Namibia, weighs about 60 tonnes.",
  ],
  cannon: [
    "🔥 METEOR CANNON: a meteor is the bright streak of light — basically the meteoroid’s glowing tail! People often call these shooting stars.",
  ],
  laser: [
    "💫 COMET TAIL LASER: meteoroids are often leftover chunks broken off an asteroid or a comet.",
  ],
  crater: [
    "💥 VESTA CRATER BLAST: Vesta’s giant Rheasilvia crater covers almost its whole south pole. In the middle is a mountain about 22 km high!",
  ],
  gbomb: [
    "🌀 GRAVITY BOMB: Vesta lacks the gravity to pull itself round, which is why it’s a lumpy space potato.",
  ],
  shield: [
    "🛡️ Earth’s atmosphere works like a shield too: most meteorites lose most of their size on the way down.",
  ],
};

// Short “Did you know?” lines shown after question waves and on collectible stars.
const DYK = [
  "Did you know? Ceres is so big and round it counts as a dwarf planet, not “just” an asteroid.",
  "Did you know? The bright white spots in Ceres’ Occator Crater are salt deposits left by salty water.",
  "Did you know? Vesta’s Rheasilvia mountain is about 22 km high, more than twice the height of Mount Everest.",
  "Did you know? You can sometimes spot Vesta from Earth with binoculars.",
  "Did you know? 2015 TC25 is only about 2 metres across, about as tall as a classroom door.",
  "Did you know? About 66 million years ago, a huge asteroid hit Earth at Chicxulub in Mexico and helped end the age of the dinosaurs.",
  "Did you know? In 2013, an asteroid exploded over Chelyabinsk in Russia, and the shock wave broke windows across the city.",
  "Did you know? In 2022, NASA’s DART mission hit Dimorphos and changed its orbit — the first time humans moved an asteroid on purpose.",
  "Did you know? A meteoroid is in space, a meteor is the bright streak in the sky, and a meteorite is what lands.",
  "Did you know? In 1954, in Alabama, USA, Ann Hodges was hit by a meteorite that crashed through her roof. She was bruised but okay.",
  "Did you know? The Hoba meteorite in Namibia is the largest ever found, and it weighs about 60 tonnes.",
  "Did you know? Most asteroids hang out in the belt between Mars and Jupiter.",
];

const STAR_FACTS = DYK.map(s => s.replace(/^Did you know\?\s*/, '⭐ '));

module.exports = { QUESTIONS, FACTS, DYK, STAR_FACTS };
