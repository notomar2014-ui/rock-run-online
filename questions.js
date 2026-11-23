// Questions and facts taken only from the final "Rocks in Space" PPT sent to Miss
// and a bit from the presentation script (Omar, Adil, Haniya, Ayesha, Bardia).
// Wrong options are near-miss facts from the same lessons, not joke answers.
// The server shuffles option order each round.
const QUESTIONS = [
  { q: "What is a meteoroid?",
    opts: [
      "A small piece of rock or metal floating in space",
      "The bright streak of light you see in the sky",
      "A space rock that has already landed on the ground",
      "A giant round object in the asteroid belt"
    ], a: 0,
    fact: "A meteoroid is a small piece of rock or metal floating in space, usually a leftover chunk broken off an asteroid or a comet." },

  { q: "What is a meteor?",
    opts: [
      "A small piece of rock or metal still travelling in space",
      "The bright streak of light you see in the sky",
      "A space rock that survives and lands on the ground",
      "A rocky leftover still orbiting between Mars and Jupiter"
    ], a: 1,
    fact: "A meteor is the bright streak of light you see in the sky — basically the tail of a meteoroid as it burns in the atmosphere. People often call these shooting stars." },

  { q: "What is a meteorite?",
    opts: [
      "A small piece of rock or metal still floating in space",
      "The bright streak of light made as a rock burns up",
      "A space rock that survives the atmosphere and lands on the ground",
      "A near-Earth asteroid about two metres across"
    ], a: 2,
    fact: "A meteorite is a piece of rock or metal from space that survives the trip through Earth’s atmosphere and lands on the ground. It is the remains of the meteoroid after landing." },

  { q: "Meteoroids are usually leftover chunks broken off…",
    opts: [
      "An asteroid or a comet",
      "A dwarf planet or a moon of Mars",
      "Earth’s atmosphere or the ground",
      "The rings of Saturn only"
    ], a: 0,
    fact: "A meteoroid is usually a tiny leftover chunk broken off an asteroid or a comet." },

  { q: "A meteoroid can be as small as a grain of sand or as big as…",
    opts: [
      "A boulder",
      "Ceres (about 940 km across)",
      "Vesta (about 525 km across)",
      "The mountain in Rheasilvia"
    ], a: 0,
    fact: "A meteoroid can be as small as a grain of sand or as big as a boulder." },

  { q: "If a space rock is smaller than about 1 metre, scientists usually call it a…",
    opts: [
      "Asteroid",
      "Meteoroid",
      "Meteorite",
      "Dwarf planet"
    ], a: 1,
    fact: "If a space rock is smaller than about 1 metre, scientists usually call it a meteoroid, not an asteroid." },

  { q: "What are asteroids?",
    opts: [
      "Rocky leftovers from when the solar system formed",
      "Icy leftovers that grow long glowing tails",
      "Bright streaks made when rocks burn in the air",
      "Space rocks that have already landed on Earth"
    ], a: 0,
    fact: "Asteroids are rocky leftovers from when the solar system formed, about 4.6 billion years ago." },

  { q: "About how long ago did the solar system form?",
    opts: [
      "66 million years ago",
      "4.6 million years ago",
      "4.6 billion years ago",
      "66 billion years ago"
    ], a: 2,
    fact: "The solar system formed about 4.6 billion years ago, and asteroids are rocky leftovers from that time." },

  { q: "Where do most asteroids live?",
    opts: [
      "A wide ring between Earth and Mars",
      "The asteroid belt between Mars and Jupiter",
      "A wide ring between Jupiter and Saturn",
      "Near-Earth orbits around the Moon"
    ], a: 1,
    fact: "Most asteroids live in the asteroid belt, a wide ring between Mars and Jupiter." },

  { q: "About how wide is Ceres?",
    opts: [
      "About 525 km across",
      "About 940 km across",
      "About 22 km across",
      "About 2 metres across"
    ], a: 1,
    fact: "Ceres is about 940 kilometres across." },

  { q: "Why is Ceres called a dwarf planet?",
    opts: [
      "It is big and round enough",
      "It is lumpy, like a space potato",
      "Its path brings it close to Earth",
      "It is the brightest asteroid from Earth"
    ], a: 0,
    fact: "Ceres is so big and round that it is called a dwarf planet." },

  { q: "What is the biggest object in the asteroid belt?",
    opts: [
      "Vesta",
      "2015 TC25",
      "Ceres",
      "Dimorphos"
    ], a: 2,
    fact: "Ceres is the biggest object in the asteroid belt, but it is a dwarf planet because it is round." },

  { q: "What is the largest true asteroid?",
    opts: [
      "Ceres",
      "Vesta",
      "2015 TC25",
      "Dimorphos"
    ], a: 1,
    fact: "Ceres is a dwarf planet because it is round, which makes Vesta the largest true asteroid." },

  { q: "About how wide is Vesta?",
    opts: [
      "About 940 km across",
      "About 22 km across",
      "About 2 metres across",
      "About 525 km across"
    ], a: 3,
    fact: "Vesta is about 525 kilometres across." },

  { q: "Vesta is a lumpy “space potato” because it lacks enough…",
    opts: [
      "Gravity to pull itself round",
      "Light to be seen from Earth",
      "Salt to fill Occator Crater",
      "Speed to leave the asteroid belt"
    ], a: 0,
    fact: "Vesta has a lumpy “space potato” shape because it lacks the gravity to pull itself into a round shape." },

  { q: "Which is the brightest asteroid visible from Earth?",
    opts: [
      "Ceres",
      "Vesta",
      "2015 TC25",
      "Dimorphos"
    ], a: 1,
    fact: "Vesta is the brightest asteroid visible from Earth, and you can sometimes spot it with binoculars." },

  { q: "A gigantic hit left a crater covering almost all of Vesta’s…",
    opts: [
      "North pole",
      "South pole",
      "Equator",
      "Path around Earth"
    ], a: 1,
    fact: "A gigantic hit in the past left a crater that covers almost Vesta’s whole south pole." },

  { q: "What is the name of the huge crater covering almost all of Vesta’s south pole?",
    opts: [
      "Occator",
      "Chicxulub",
      "Rheasilvia",
      "Chelyabinsk"
    ], a: 2,
    fact: "The huge crater covering almost all of Vesta’s south pole is called Rheasilvia." },

  { q: "The mountain in the middle of Rheasilvia is about…",
    opts: [
      "22 km high, more than twice the height of Mount Everest",
      "2 metres high, about as tall as a classroom door",
      "525 km high, the same as Vesta’s width",
      "940 km high, the same as Ceres’s width"
    ], a: 0,
    fact: "In the middle of Rheasilvia is a mountain about 22 kilometres high, more than twice the height of Mount Everest." },

  { q: "Chunks blasted off Vesta by that giant crash…",
    opts: [
      "Became the dwarf planet Ceres",
      "Landed on Earth as meteorites",
      "Burned up as meteors and never landed",
      "Were later used as the DART spacecraft"
    ], a: 1,
    fact: "That crash blasted chunks of Vesta all the way to Earth as meteorites, so scientists can study pieces of Vesta." },

  { q: "The bright white spots in Occator Crater are…",
    opts: [
      "Salt deposits left behind by salty water",
      "Ice left behind by a comet’s tail",
      "Pieces of Vesta that landed as meteorites",
      "Metal from the Hoba meteorite"
    ], a: 0,
    fact: "Ceres has bright white spots inside Occator Crater. Scientists found they are salt deposits left behind by salty water." },

  { q: "Occator Crater, with its bright salt spots, is on…",
    opts: [
      "Vesta",
      "Earth, at Chicxulub",
      "Ceres",
      "The Moon"
    ], a: 2,
    fact: "Occator Crater is on Ceres, and its bright white spots are salt deposits left by salty water." },

  { q: "One of the smallest asteroids ever studied, 2015 TC25, is about…",
    opts: [
      "2 kilometres across, as wide as a city",
      "22 kilometres across, as high as Rheasilvia’s mountain",
      "1 metre across, so it is called a meteoroid",
      "2 metres across, about as tall as a classroom door"
    ], a: 3,
    fact: "2015 TC25 is only about 2 metres across — about as tall as a classroom door." },

  { q: "Asteroids whose orbits come close to Earth are called…",
    opts: [
      "Dwarf planets",
      "Meteoroids",
      "Near-Earth asteroids",
      "Shooting stars"
    ], a: 2,
    fact: "Some asteroids have orbits that come close to Earth. We call these near-Earth asteroids." },

  { q: "About 66 million years ago, a huge asteroid hit Earth at…",
    opts: [
      "Chelyabinsk, Russia",
      "Chicxulub, Mexico",
      "Occator Crater on Ceres",
      "The Hoba site in Namibia"
    ], a: 1,
    fact: "About 66 million years ago, a huge asteroid hit Earth at Chicxulub in Mexico and helped end the age of the dinosaurs." },

  { q: "In 2013, a smaller asteroid exploded over…",
    opts: [
      "Chicxulub, Mexico",
      "Alabama, USA",
      "Chelyabinsk, Russia",
      "Namibia"
    ], a: 2,
    fact: "In 2013, a smaller asteroid exploded over Chelyabinsk in Russia, and the shock wave broke windows across the city." },

  { q: "In 2022, NASA’s DART mission…",
    opts: [
      "Hit Dimorphos and changed its orbit",
      "Hit Chicxulub and ended the dinosaurs",
      "Hit Chelyabinsk and broke windows",
      "Landed on Ceres to study salt spots"
    ], a: 0,
    fact: "In 2022, NASA’s DART mission hit Dimorphos and changed its orbit — the first time humans moved an asteroid on purpose." },

  { q: "In 1954, in Alabama, USA, Ann Hodges was…",
    opts: [
      "The first person to move an asteroid on purpose",
      "Hit by a meteorite that came through her roof, and was bruised but okay",
      "Hit by the Hoba meteorite in Namibia",
      "The first person to spot Vesta with binoculars"
    ], a: 1,
    fact: "In 1954, in Alabama, USA, Ann Hodges was hit by a meteorite that crashed through her roof. She was bruised but okay, and she is the only well-documented person ever hurt by one." },

  { q: "The largest meteorite ever found, the Hoba meteorite in Namibia, weighs about…",
    opts: [
      "22 tonnes",
      "525 tonnes",
      "940 tonnes",
      "60 tonnes"
    ], a: 3,
    fact: "The largest meteorite ever found, the Hoba meteorite in Namibia, weighs about 60 tonnes." },

  { q: "Most meteorites are small because…",
    opts: [
      "Much of the rock burns away on the way down",
      "They start as grains of salt in Occator Crater",
      "They only come from 2015 TC25",
      "Earth’s gravity pulls them into a round shape"
    ], a: 0,
    fact: "Meteorites are usually very small, because most of their size is lost while entering Earth’s atmosphere." },
];

const FACTS = {
  ceres: [
    "🪨 CERES is the biggest object in the asteroid belt, and it is so big and round that it is called a dwarf planet.",
    "📏 Ceres is about 940 kilometres across.",
    "⚪ The bright white spots in Ceres’ Occator Crater are salt deposits left behind by salty water.",
  ],
  vesta: [
    "🥔 VESTA is the largest true asteroid. It is about 525 km across and lumpy, because it lacks the gravity to be round.",
    "✨ VESTA is the brightest asteroid visible from Earth: you can sometimes spot it with binoculars!",
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
    "🌠 A METEOR is the bright streak in the sky (the meteoroid’s tail). What lands is the METEORITE.",
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
