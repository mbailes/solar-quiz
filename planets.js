// Planet data and one question per planet.
// Physical data: NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/).
// Moon counts change as new moons are confirmed; values here are as of 2025.
// Texture maps: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0.
// rotationHours < 0 means retrograde (spins "backwards").

export const PLANETS = [
  {
    name: "Mercury", texture: "textures/2k_mercury.jpg",
    diameterKm: 4879, massEarth: 0.055, distanceAU: 0.39, rotationHours: 1407.6,
    yearDays: 88, moons: 0, meanTempC: 167, gravity: 3.7, tiltDeg: 0.03,
    fact: "A day on Mercury (sunrise to sunrise) lasts 176 Earth days — two of its years.",
    question: {
      q: "How long does Mercury take to go once around the Sun?",
      options: ["88 Earth days", "1 Earth year", "176 Earth days", "12 Earth years"],
      answer: 0,
      why: "Mercury is closest to the Sun, so it has the shortest path and moves fastest: one orbit takes just 88 days."
    }
  },
  {
    name: "Venus", texture: "textures/2k_venus_atmosphere.jpg",
    diameterKm: 12104, massEarth: 0.815, distanceAU: 0.72, rotationHours: -5832.5,
    yearDays: 224.7, moons: 0, meanTempC: 464, gravity: 8.9, tiltDeg: 177.4,
    fact: "Venus spins backwards, and so slowly that its day is longer than its year.",
    question: {
      q: "Venus is further from the Sun than Mercury. Which planet is hotter?",
      options: ["Mercury", "Venus", "They are the same", "Neither — both are frozen"],
      answer: 1,
      why: "Venus's thick carbon-dioxide atmosphere traps heat (a runaway greenhouse effect), so its surface is about 464 °C — hot enough to melt lead."
    }
  },
  {
    name: "Earth", texture: "textures/2k_earth_daymap.jpg",
    diameterKm: 12756, massEarth: 1, distanceAU: 1.0, rotationHours: 23.93,
    yearDays: 365.25, moons: 1, meanTempC: 15, gravity: 9.8, tiltDeg: 23.4,
    fact: "Earth is the only planet known to have liquid water on its surface — and life.",
    question: {
      q: "What causes Earth's seasons?",
      options: ["Earth getting closer to the Sun in summer", "The tilt of Earth's axis", "The Moon blocking sunlight", "The Sun getting hotter and cooler"],
      answer: 1,
      why: "Earth's axis is tilted 23.4°. For half the year your hemisphere leans towards the Sun (summer), and for the other half it leans away (winter)."
    }
  },
  {
    name: "Mars", texture: "textures/2k_mars.jpg",
    diameterKm: 6792, massEarth: 0.107, distanceAU: 1.52, rotationHours: 24.62,
    yearDays: 687, moons: 2, meanTempC: -65, gravity: 3.7, tiltDeg: 25.2,
    fact: "Olympus Mons on Mars is the tallest volcano in the Solar System — about 22 km high.",
    question: {
      q: "Why is Mars red?",
      options: ["It is very hot", "Its rocks and dust contain rusty iron", "It reflects light from the Sun's red side", "It is covered in red plants"],
      answer: 1,
      why: "Mars's surface dust is rich in iron oxide — rust — which gives the planet its red-orange colour."
    }
  },
  {
    name: "Jupiter", texture: "textures/2k_jupiter.jpg",
    diameterKm: 142984, massEarth: 317.8, distanceAU: 5.20, rotationHours: 9.93,
    yearDays: 4331, moons: 97, meanTempC: -110, gravity: 24.8, tiltDeg: 3.1,
    fact: "Jupiter's Great Red Spot is a storm wider than Earth that has raged for centuries.",
    question: {
      q: "Jupiter spins faster than any other planet. How long is its day?",
      options: ["About 10 hours", "About 24 hours", "About 3 days", "About 12 years"],
      answer: 0,
      why: "Jupiter rotates once every 9.9 hours. Watch the bands — the fast spin stretches its clouds into stripes and flattens the planet slightly."
    }
  },
  {
    name: "Saturn", texture: "textures/2k_saturn.jpg", rings: true,
    diameterKm: 120536, massEarth: 95.2, distanceAU: 9.58, rotationHours: 10.7,
    yearDays: 10747, moons: 274, meanTempC: -140, gravity: 10.4, tiltDeg: 26.7,
    fact: "Saturn's rings are made of countless chunks of ice and rock, some as small as sand, some as big as a house.",
    question: {
      q: "Saturn is huge, but it has a surprising property. What is it?",
      options: ["It is hollow", "It is less dense than water", "It has no gravity", "It is made of solid ice"],
      answer: 1,
      why: "Saturn's average density is about 0.69 g/cm³ — less than water's 1 g/cm³. In a big enough bathtub, it would float!"
    }
  },
  {
    name: "Uranus", texture: "textures/2k_uranus.jpg",
    diameterKm: 51118, massEarth: 14.5, distanceAU: 19.2, rotationHours: -17.24,
    yearDays: 30589, moons: 29, meanTempC: -195, gravity: 8.9, tiltDeg: 97.8,
    fact: "Each pole of Uranus gets about 42 years of continuous sunlight, then 42 years of darkness.",
    question: {
      q: "What is strange about the way Uranus spins?",
      options: ["It doesn't spin at all", "It spins on its side", "It spins once a minute", "It changes direction every year"],
      answer: 1,
      why: "Uranus's axis is tilted about 98°, so it rolls around the Sun on its side — probably knocked over by a giant collision long ago."
    }
  },
  {
    name: "Neptune", texture: "textures/2k_neptune.jpg",
    diameterKm: 49528, massEarth: 17.1, distanceAU: 30.1, rotationHours: 16.1,
    yearDays: 59800, moons: 16, meanTempC: -200, gravity: 11.2, tiltDeg: 28.3,
    fact: "Neptune has the fastest winds in the Solar System — over 2,000 km/h.",
    question: {
      q: "How was Neptune discovered in 1846?",
      options: ["By spotting it with the naked eye", "By predicting its position with mathematics", "By a space probe", "By radio telescopes"],
      answer: 1,
      why: "Astronomers noticed Uranus wasn't moving quite as expected. Urbain Le Verrier calculated where an unseen planet must be — and Neptune was found within 1° of his prediction."
    }
  }
];

export const MOON = { name: "Moon", texture: "textures/2k_moon.jpg", diameterKm: 3474, rotationHours: 655.7, tiltDeg: 6.7 };
