const samplePackages = [
  {
    title: 'Majestic Swiss Alps & Lakes Tour',
    destination: 'Interlaken & Lucerne, Switzerland',
    description: 'Experience breathtaking alpine views, scenic mountain train journeys, pristine glacier lakes, and traditional Swiss chocolate tastings across the scenic Bernese Oberland.',
    price: 1850,
    startDate: new Date('2026-10-15'),
    endDate: new Date('2026-10-22'),
    capacity: 15,
    availableSeats: 15,
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    itinerary: [
      { day: 1, activity: 'Arrival in Zurich, scenic train transfer to Lucerne and hotel check-in.' },
      { day: 2, activity: 'Mount Pilatus cogwheel railway ascent and panoramic lake cruise.' },
      { day: 3, activity: 'Transfer to Interlaken, stroll along Lake Brienz and Lake Thun.' },
      { day: 4, activity: 'Jungfraujoch – Top of Europe glacier expedition.' },
      { day: 5, activity: 'Grindelwald First cliff walk and hiking adventure.' },
      { day: 6, activity: 'Swiss artisanal cheese & chocolate tasting workshop in Bern.' },
      { day: 7, activity: 'Departure transfer to Zurich International Airport.' }
    ]
  },
  {
    title: 'Tropical Bali Paradise & Cultural Escape',
    destination: 'Ubud & Seminyak, Bali, Indonesia',
    description: 'Immerse yourself in lush emerald rice terraces, sacred Hindu water temples, golden sunset beaches, and world-class Balinese spa treatments.',
    price: 920,
    startDate: new Date('2026-11-05'),
    endDate: new Date('2026-11-12'),
    capacity: 20,
    availableSeats: 20,
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    itinerary: [
      { day: 1, activity: 'Arrival in Denpasar, private villa transfer to Ubud cultural center.' },
      { day: 2, activity: 'Tegalalang Rice Terraces and Sacred Monkey Forest sanctuary visit.' },
      { day: 3, activity: 'Mount Batur sunrise trek and natural hot spring soak.' },
      { day: 4, activity: 'Transfer to Seminyak beachfront, beach club relaxation.' },
      { day: 5, activity: 'Speedboat excursion to Nusa Penida (Kelingking Beach & Broken Beach).' },
      { day: 6, activity: 'Tanah Lot Sunset Temple photography and traditional seafood dinner.' },
      { day: 7, activity: 'Souvenir shopping at local art markets and departure.' }
    ]
  },
  {
    title: 'Historic Kyoto & Tokyo Neon Odyssey',
    destination: 'Tokyo & Kyoto, Japan',
    description: 'Discover the contrast between futuristic Tokyo metropolises and timeless Kyoto bamboo groves, shrines, and traditional tea ceremonies.',
    price: 2400,
    startDate: new Date('2026-12-01'),
    endDate: new Date('2026-12-10'),
    capacity: 12,
    availableSeats: 12,
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    itinerary: [
      { day: 1, activity: 'Arrival in Tokyo Haneda, Shinjuku night walking tour.' },
      { day: 2, activity: 'Asakusa Senso-ji temple, Akihabara tech hub, Shibuya Crossing.' },
      { day: 3, activity: 'Day trip to Mount Fuji and Lake Kawaguchiko.' },
      { day: 4, activity: 'Shinkansen bullet train to Kyoto, Gion geisha district walk.' },
      { day: 5, activity: 'Fushimi Inari thousand torii gates and Kinkaku-ji Golden Pavilion.' },
      { day: 6, activity: 'Arashiyama Bamboo Forest & Tenryu-ji zen gardens.' },
      { day: 7, activity: 'Nara deer park excursion & Todai-ji giant Buddha.' },
      { day: 8, activity: 'Return to Tokyo, modern art exhibits at teamLab Borderless.' },
      { day: 9, activity: 'Farewell authentic kaiseki dinner in Ginza.' },
      { day: 10, activity: 'Departure from Tokyo.' }
    ]
  },
  {
    title: 'Santorini Sunset & Aegean Island Odyssey',
    destination: 'Santorini & Mykonos, Greece',
    description: 'Sail through cobalt Aegean waters, wander whitewashed villages perched on caldera cliffs, and savor authentic Mediterranean culinary delights.',
    price: 1650,
    startDate: new Date('2026-10-20'),
    endDate: new Date('2026-10-27'),
    capacity: 18,
    availableSeats: 18,
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    itinerary: [
      { day: 1, activity: 'Arrival in Santorini, transfer to cliffside hotel in Oia.' },
      { day: 2, activity: 'Caldera catamaran cruise, volcanic hot springs swim, and BBQ dinner on boat.' },
      { day: 3, activity: 'Wine tasting tour visiting volcanic vineyards and Red Beach.' },
      { day: 4, activity: 'Ferry to vibrant Mykonos, explore Little Venice and iconic windmills.' },
      { day: 5, activity: 'Day trip to ancient sacred archaeological ruins of Delos.' },
      { day: 6, activity: 'Relaxation at Psarou and Super Paradise beaches.' },
      { day: 7, activity: 'Departure from Mykonos International Airport.' }
    ]
  }
];

module.exports = { samplePackages };
