// Every question and fact comes from the "Rocks in Space" slides (Omar, Adil, Haniya, Ayesha, Bardia).
const QUESTIONS = [
  { q: 'What is the biggest object in the asteroid belt?', opts: ['Ceres', 'Vesta', 'The Moon', 'Mars'], a: 0, fact: 'Ceres is the biggest object in the asteroid belt.' },
  { q: 'Why is Ceres called a dwarf planet?', opts: ['It is round', 'It is lumpy', 'It has rings', 'It is made of ice cream'], a: 0, fact: 'Ceres is round, so it counts as a dwarf planet, not an asteroid.' },
  { q: 'What is the largest TRUE asteroid?', opts: ['Ceres', 'Vesta', 'Jupiter', 'Halley'], a: 1, fact: 'Ceres is a dwarf planet, which makes 4 Vesta the largest true asteroid!' },
  { q: 'About how wide is Vesta?', opts: ['5 km', '52 km', '525 km', '5,250 km'], a: 2, fact: 'Vesta is about 525 km across.' },
  { q: 'Vesta is a lumpy "space potato" because it lacks enough…', opts: ['Water', 'Gravity', 'Air', 'Light'], a: 1, fact: 'Vesta does not have enough gravity to pull itself round.' },
  { q: 'Where is the main asteroid belt?', opts: ['Between Earth and Mars', 'Between Mars and Jupiter', 'Beyond Neptune', 'Around the Sun\'s core'], a: 1, fact: 'Vesta hangs out in the main asteroid belt between Mars and Jupiter.' },
  { q: 'Which is the brightest asteroid you can see from Earth?', opts: ['Ceres', 'Vesta', 'Pluto', 'Phobos'], a: 1, fact: 'Vesta is the brightest asteroid visible from Earth.' },
  { q: 'What can you use to spot Vesta from Earth?', opts: ['Binoculars', 'A microscope', 'Sunglasses', 'Nothing can see it'], a: 0, fact: 'You can spot Vesta with binoculars!' },
  { q: 'Vesta\'s giant crater covers almost its whole…', opts: ['North pole', 'Equator', 'South pole', 'Middle'], a: 2, fact: 'A gigantic hit left a crater covering almost all of Vesta\'s south pole.' },
  { q: 'What happened to chunks blasted off Vesta by the giant crash?', opts: ['Some reached Earth as meteorites', 'They became moons', 'They turned into stars', 'They melted into gas'], a: 0, fact: 'The crash blasted chunks of Vesta all the way to Earth as meteorites.' },
  { q: 'A small piece of rock or metal floating in space is a…', opts: ['Meteor', 'Meteoroid', 'Meteorite', 'Planet'], a: 1, fact: 'A meteoroid is a small piece of rock or metal floating in space.' },
  { q: 'Meteoroids usually break off an asteroid or a…', opts: ['Comet', 'Star', 'Moon', 'Cloud'], a: 0, fact: 'Meteoroids are leftover chunks, usually broken off an asteroid or a comet.' },
  { q: 'How big can a meteoroid be?', opts: ['Only planet-sized', 'From a sand grain to a boulder', 'Always bigger than a city', 'Exactly 1 metre'], a: 1, fact: 'A meteoroid can be as small as a grain of sand or as big as a boulder.' },
  { q: 'The bright streak of light you see in the sky is a…', opts: ['Meteorite', 'Meteoroid', 'Meteor', 'Comet tail'], a: 2, fact: 'A meteor is the bright streak of light: basically the tail of the meteoroid.' },
  { q: 'A space rock that survives the atmosphere and lands on the ground is a…', opts: ['Meteor', 'Meteorite', 'Meteoroid', 'Asteroid belt'], a: 1, fact: 'A meteorite survives the trip through Earth\'s atmosphere and lands.' },
  { q: 'Compared with when it entered the atmosphere, a meteorite is usually…', opts: ['Much bigger', 'Much smaller', 'Exactly the same', 'Made of gas'], a: 1, fact: 'Most of a meteorite\'s size is lost while entering Earth\'s atmosphere.' },
  { q: 'A meteorite is the remains of a…', opts: ['Meteoroid', 'Star', 'Planet', 'Black hole'], a: 0, fact: 'A meteorite is the physical remains of the meteoroid after landing on Earth.' },
];
const FACTS = {
  ceres: ['🪨 CERES: the biggest object in the asteroid belt. It\'s round, so it\'s a dwarf planet. Feel its strong pull!'],
  vesta: ['🥔 VESTA: about 525 km across, a lumpy "space potato" without enough gravity to be round.', '💥 VESTA took a gigantic hit: its crater covers almost its whole south pole.', '✨ VESTA is the brightest asteroid seen from Earth: spot it with binoculars!'],
  meteoroid: ['☄️ Meteoroids are small rock or metal pieces in space, from a sand grain to a boulder.', '☄️ Meteoroids usually break off an asteroid or a comet.'],
  meteorite: ['🌍 A meteorite survives Earth\'s atmosphere and lands. Most of its size burns away, so it ends up much smaller.', '🌠 On the way down it glows as a METEOR: the bright streak (its tail). What lands is the METEORITE.'],
  cannon: ['🔥 METEOR CANNON: a meteor is the bright streak of light: the meteoroid\'s glowing tail!'],
  laser: ['💫 COMET TAIL LASER: meteoroids are often leftover chunks broken off comets.'],
  crater: ['💥 VESTA CRATER BLAST: Vesta\'s giant crater covers almost its whole south pole. Boom!'],
  gbomb: ['🌀 GRAVITY BOMB: Vesta lacks the gravity to pull itself round, which is why it\'s a lumpy space potato.'],
  shield: ['🛡️ Earth\'s atmosphere works like a shield too: most meteorites lose most of their size on the way down.'],
};
module.exports = { QUESTIONS, FACTS };
